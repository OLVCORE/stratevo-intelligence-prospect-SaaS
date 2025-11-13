/**
 * TWILIO WHATSAPP SENDER
 * 
 * Sends WhatsApp messages via Twilio API
 * 
 * Security: API credentials stay in Supabase Secrets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error('Twilio WhatsApp credentials not configured');
    }
    
    // Parse request
    const { to, body, mediaUrl } = await req.json();
    
    if (!to || !body) {
      throw new Error('Missing required fields: to, body');
    }
    
    console.log(`📱 Sending WhatsApp to ${to}`);
    
    // Prepare Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams({
      From: twilioWhatsAppNumber,
      To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      Body: body,
      ...(mediaUrl && { MediaUrl: mediaUrl })
    });
    
    // Call Twilio API
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ WhatsApp sent:', result.sid);
    
    return new Response(
      JSON.stringify({
        success: true,
        messageSid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

