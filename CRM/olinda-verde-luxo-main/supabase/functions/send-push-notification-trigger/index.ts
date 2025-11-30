import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  message: string;
  data?: Record<string, any>;
  users?: string[]; // Specific user IDs, or empty for all admins
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();
    console.log('Sending push notification:', payload);

    // Get target users (specific users or all admins)
    let targetUserIds: string[] = [];
    if (payload.users && payload.users.length > 0) {
      targetUserIds = payload.users;
    } else {
      // Get all admin users
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      targetUserIds = admins?.map((a) => a.user_id) || [];
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No target users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Get push tokens for target users
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token, platform, user_id')
      .in('user_id', targetUserIds)
      .eq('active', true);

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No devices registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to each token via Supabase edge function
    const results = await Promise.allSettled(
      tokens.map(async (tokenData) => {
        const notificationData = {
          to: tokenData.token,
          title: payload.title,
          body: payload.message,
          data: payload.data || {},
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        });

        if (!response.ok) {
          throw new Error(`Failed to send to ${tokenData.platform}: ${response.statusText}`);
        }

        return tokenData;
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed, 
        total: tokens.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
