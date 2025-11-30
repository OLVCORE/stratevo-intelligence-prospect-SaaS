import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pixel transparente 1x1
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const emailId = url.searchParams.get('id')
    const action = url.searchParams.get('action') || 'open' // 'open' ou 'click'

    console.log(`[track-email] Tracking ${action} for email:`, emailId)

    if (!emailId) {
      return new Response('Missing email ID', { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Atualizar email_history
    const updateData: any = {}
    if (action === 'open') {
      updateData.opened_at = new Date().toISOString()
    } else if (action === 'click') {
      updateData.clicked_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('email_history')
      .update(updateData)
      .eq('id', emailId)
      .is(action === 'open' ? 'opened_at' : 'clicked_at', null) // Só atualiza se ainda não foi registrado

    if (error) {
      console.error('[track-email] Error updating:', error)
    } else {
      console.log(`[track-email] Successfully tracked ${action}`)
    }

    // Retornar pixel transparente para tracking de abertura
    if (action === 'open') {
      return new Response(PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Para cliques, redirecionar para URL original
    const redirectUrl = url.searchParams.get('url')
    if (redirectUrl) {
      return Response.redirect(redirectUrl, 302)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[track-email] Error:', error)
    return new Response('Error', { status: 500 })
  }
})
