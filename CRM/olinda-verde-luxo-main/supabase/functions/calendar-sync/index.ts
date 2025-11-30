import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calendar Sync - Sincroniza calendários externos (Google Calendar, Outlook)
 * 
 * Endpoints:
 * - GET /google/auth - Inicia autenticação Google OAuth
 * - GET /google/callback - Callback OAuth Google
 * - GET /outlook/auth - Inicia autenticação Microsoft OAuth
 * - GET /outlook/callback - Callback OAuth Microsoft
 * - POST /sync - Força sincronização manual
 * - GET /events - Lista eventos sincronizados
 */

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface OutlookTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/calendar-sync', '');
    const authHeader = req.headers.get('Authorization');

    // Verificar autenticação
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GOOGLE CALENDAR AUTH
    if (path === '/google/auth') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const redirectUri = `${url.origin}/calendar-sync/google/callback`;
      
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        access_type: 'offline',
        state: user.id, // Pass user ID to callback
        prompt: 'consent'
      });

      return new Response(
        JSON.stringify({ authUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GOOGLE CALENDAR CALLBACK
    if (path === '/google/callback') {
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');
      
      if (!code || !userId) {
        throw new Error('Código ou user_id ausente');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          redirect_uri: `${url.origin}/calendar-sync/google/callback`,
          grant_type: 'authorization_code'
        })
      });

      const tokens: GoogleTokenResponse = await tokenResponse.json();

      // Save integration
      const { error: insertError } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: userId,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
          sync_enabled: true
        }, { onConflict: 'user_id,provider' });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, message: 'Google Calendar conectado com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OUTLOOK AUTH
    if (path === '/outlook/auth') {
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const redirectUri = `${url.origin}/calendar-sync/outlook/callback`;
      
      const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' + new URLSearchParams({
        client_id: clientId || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'Calendars.Read offline_access',
        state: user.id,
        response_mode: 'query'
      });

      return new Response(
        JSON.stringify({ authUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OUTLOOK CALLBACK
    if (path === '/outlook/callback') {
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');
      
      if (!code || !userId) {
        throw new Error('Código ou user_id ausente');
      }

      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID') || '',
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') || '',
          redirect_uri: `${url.origin}/calendar-sync/outlook/callback`,
          grant_type: 'authorization_code'
        })
      });

      const tokens: OutlookTokenResponse = await tokenResponse.json();

      const { error: insertError } = await supabase
        .from('calendar_integrations')
        .upsert({
          user_id: userId,
          provider: 'outlook',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
          sync_enabled: true
        }, { onConflict: 'user_id,provider' });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, message: 'Outlook Calendar conectado com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SYNC EVENTS
    if (path === '/sync' && req.method === 'POST') {
      const { data: integrations } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('sync_enabled', true);

      if (!integrations || integrations.length === 0) {
        return new Response(
          JSON.stringify({ message: 'Nenhuma integração de calendário encontrada' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const syncResults = [];

      for (const integration of integrations) {
        try {
          if (integration.provider === 'google') {
            const eventsResponse = await fetch(
              'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100',
              {
                headers: {
                  'Authorization': `Bearer ${integration.access_token}`
                }
              }
            );

            if (!eventsResponse.ok) {
              throw new Error(`Google API error: ${eventsResponse.status}`);
            }

            const eventsData = await eventsResponse.json();
            
            // Sync events to database
            for (const event of eventsData.items || []) {
              await supabase.from('synced_calendar_events').upsert({
                integration_id: integration.id,
                external_event_id: event.id,
                event_type: 'google',
                title: event.summary || 'Sem título',
                description: event.description,
                start_time: event.start.dateTime || event.start.date,
                end_time: event.end.dateTime || event.end.date,
                location: event.location,
                attendees: event.attendees || [],
                sync_status: 'synced'
              }, { onConflict: 'integration_id,external_event_id' });
            }

            syncResults.push({ provider: 'google', synced: eventsData.items?.length || 0 });
          } else if (integration.provider === 'outlook') {
            const eventsResponse = await fetch(
              'https://graph.microsoft.com/v1.0/me/calendar/events?$top=100',
              {
                headers: {
                  'Authorization': `Bearer ${integration.access_token}`
                }
              }
            );

            if (!eventsResponse.ok) {
              throw new Error(`Microsoft Graph API error: ${eventsResponse.status}`);
            }

            const eventsData = await eventsResponse.json();

            for (const event of eventsData.value || []) {
              await supabase.from('synced_calendar_events').upsert({
                integration_id: integration.id,
                external_event_id: event.id,
                event_type: 'outlook',
                title: event.subject || 'Sem título',
                description: event.body?.content,
                start_time: event.start.dateTime,
                end_time: event.end.dateTime,
                location: event.location?.displayName,
                attendees: event.attendees || [],
                sync_status: 'synced'
              }, { onConflict: 'integration_id,external_event_id' });
            }

            syncResults.push({ provider: 'outlook', synced: eventsData.value?.length || 0 });
          }

          // Update last sync time
          await supabase
            .from('calendar_integrations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', integration.id);

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Erro ao sincronizar ${integration.provider}:`, errorMessage);
          syncResults.push({ provider: integration.provider, error: errorMessage });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results: syncResults }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET EVENTS
    if (path === '/events' && req.method === 'GET') {
      const { data: events, error } = await supabase
        .from('synced_calendar_events')
        .select(`
          *,
          calendar_integrations!inner(user_id, provider)
        `)
        .eq('calendar_integrations.user_id', user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ events }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in calendar-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
