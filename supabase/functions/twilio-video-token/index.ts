/**
 * TWILIO VIDEO TOKEN GENERATOR
 * 
 * Generates secure access tokens for Twilio Video calls
 * 
 * Security: Never expose API keys to frontend!
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Twilio imports
const jwt = await import('https://esm.sh/jsonwebtoken@9.0.2');

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
    // Get credentials from environment
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioApiKeySid = Deno.env.get('TWILIO_API_KEY_SID');
    const twilioApiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET');
    
    if (!twilioAccountSid || !twilioApiKeySid || !twilioApiKeySecret) {
      throw new Error('Twilio credentials not configured in Supabase Secrets');
    }
    
    // Parse request
    const { identity, roomName } = await req.json();
    
    if (!identity || !roomName) {
      throw new Error('Identity and roomName are required');
    }
    
    console.log(`🎥 Generating video token for ${identity} in room ${roomName}`);
    
    // Generate token
    const token = generateVideoToken({
      accountSid: twilioAccountSid,
      apiKeySid: twilioApiKeySid,
      apiKeySecret: twilioApiKeySecret,
      identity: identity,
      roomName: roomName
    });
    
    return new Response(
      JSON.stringify({ token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('❌ Error generating token:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Generate Twilio Video Access Token
 */
function generateVideoToken(params: {
  accountSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  identity: string;
  roomName: string;
}): string {
  const { accountSid, apiKeySid, apiKeySecret, identity, roomName } = params;
  
  // Token payload
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (60 * 60); // 1 hour expiration
  
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    sub: accountSid,
    exp: exp,
    grants: {
      identity: identity,
      video: {
        room: roomName
      }
    }
  };
  
  // Sign JWT
  const token = jwt.sign(payload, apiKeySecret, { algorithm: 'HS256' });
  
  return token;
}

