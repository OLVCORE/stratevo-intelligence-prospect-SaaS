// supabase/functions/linkedin-connect/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectRequest {
  li_at_cookie: string;
  jsessionid_cookie?: string;
}

interface LinkedInProfile {
  profileId: string;
  publicIdentifier: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture?: string;
  profileUrl: string;
}

async function validateLinkedInCookies(liAt: string, jsessionid?: string): Promise<LinkedInProfile | null> {
  try {
    const headers: Record<string, string> = {
      'Cookie': `li_at=${liAt}${jsessionid ? `; JSESSIONID=${jsessionid}` : ''}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/vnd.linkedin.normalized+json+2.1',
      'X-Li-Lang': 'pt_BR',
      'X-RestLi-Protocol-Version': '2.0.0',
    };

    const response = await fetch(
      'https://www.linkedin.com/voyager/api/me',
      { headers }
    );

    if (!response.ok) {
      console.error('LinkedIn API error:', response.status);
      return null;
    }

    const data = await response.json();
    const miniProfile = data?.included?.find((item: any) => 
      item.$type === 'com.linkedin.voyager.identity.shared.MiniProfile'
    );

    if (!miniProfile) {
      console.error('Could not find MiniProfile in response');
      return null;
    }

    return {
      profileId: miniProfile.entityUrn?.split(':').pop() || '',
      publicIdentifier: miniProfile.publicIdentifier || '',
      firstName: miniProfile.firstName || '',
      lastName: miniProfile.lastName || '',
      headline: miniProfile.occupation || '',
      profilePicture: miniProfile.picture?.rootUrl 
        ? `${miniProfile.picture.rootUrl}${miniProfile.picture.artifacts?.[0]?.fileIdentifyingUrlPathSegment || ''}`
        : undefined,
      profileUrl: `https://www.linkedin.com/in/${miniProfile.publicIdentifier}`,
    };
  } catch (error) {
    console.error('Error validating LinkedIn cookies:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: tenantUser } = await supabaseClient
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!tenantUser) {
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ConnectRequest = await req.json();
    const { li_at_cookie, jsessionid_cookie } = body;

    if (!li_at_cookie) {
      return new Response(
        JSON.stringify({ error: 'Cookie li_at é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = await validateLinkedInCookies(li_at_cookie, jsessionid_cookie);

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Cookies LinkedIn inválidos ou expirados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingAccount } = await supabaseClient
      .from('linkedin_accounts')
      .select('id')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('linkedin_profile_id', profile.profileId)
      .single();

    let accountId: string;

    if (existingAccount) {
      const { data, error } = await supabaseClient
        .from('linkedin_accounts')
        .update({
          li_at_cookie: li_at_cookie,
          jsessionid_cookie: jsessionid_cookie,
          linkedin_name: `${profile.firstName} ${profile.lastName}`,
          linkedin_headline: profile.headline,
          linkedin_avatar_url: profile.profilePicture,
          status: 'active',
          cookies_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select('id')
        .single();

      if (error) throw error;
      accountId = data.id;
    } else {
      const { data, error } = await supabaseClient
        .from('linkedin_accounts')
        .insert({
          tenant_id: tenantUser.tenant_id,
          user_id: user.id,
          linkedin_profile_id: profile.profileId,
          linkedin_profile_url: profile.profileUrl,
          linkedin_name: `${profile.firstName} ${profile.lastName}`,
          linkedin_headline: profile.headline,
          linkedin_avatar_url: profile.profilePicture,
          li_at_cookie: li_at_cookie,
          jsessionid_cookie: jsessionid_cookie,
          status: 'active',
          cookies_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      accountId = data.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        account_id: accountId,
        profile: {
          name: `${profile.firstName} ${profile.lastName}`,
          headline: profile.headline,
          avatar: profile.profilePicture,
          url: profile.profileUrl,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in linkedin-connect:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

