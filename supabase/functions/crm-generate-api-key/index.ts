// supabase/functions/crm-generate-api-key/index.ts
// Edge Function para gerar chaves de API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTenantContext } from "../_shared/tenant-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tenant, user } = await getTenantContext(req);
    if (!tenant || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, description } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar chave aleatória
    const apiKey = crypto.randomUUID() + "-" + crypto.randomUUID();
    const keyPrefix = apiKey.substring(0, 8);
    
    // Hash da chave (SHA256)
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Inserir chave no banco
    const { data: apiKeyData, error } = await supabaseAdmin
      .from("api_keys")
      .insert({
        tenant_id: tenant.id,
        name,
        description: description || null,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Retornar chave (apenas uma vez!)
    return new Response(
      JSON.stringify({
        success: true,
        key: apiKey, // ⚠️ IMPORTANTE: Retornar apenas uma vez
        api_key: {
          id: apiKeyData.id,
          name: apiKeyData.name,
          key_prefix: apiKeyData.key_prefix,
          created_at: apiKeyData.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating API key:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

