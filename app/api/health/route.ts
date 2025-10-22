/**
 * Health Check Endpoint
 * Valida: ENV vars, conexão Supabase, APIs externas
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { HealthCheckResult } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: HealthCheckResult = {
    healthy: true,
    checks: {
      supabase: { ok: true },
      env: { ok: true },
      apis: {},
    },
    timestamp: new Date().toISOString(),
  };

  // 1. Verificar ENV obrigatórias
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
  
  if (missingEnvs.length > 0) {
    result.healthy = false;
    result.checks.env = {
      ok: false,
      missing: missingEnvs,
    };
  }

  // 2. Verificar conexão Supabase
  try {
    const { error } = await supabaseAdmin.from('companies').select('id').limit(1);
    
    if (error) {
      result.healthy = false;
      result.checks.supabase = {
        ok: false,
        error: error.message,
      };
    }
  } catch (error) {
    result.healthy = false;
    result.checks.supabase = {
      ok: false,
      error: (error as Error).message,
    };
  }

  // 3. Verificar APIs externas (CICLO 1)
  const apiChecks = [
    { name: 'receitaws', key: 'RECEITAWS_API_TOKEN' },
    { name: 'google-cse', key: 'GOOGLE_API_KEY' },
    { name: 'serper', key: 'SERPER_API_KEY' },
  ];

  for (const api of apiChecks) {
    if (process.env[api.key]) {
      result.checks.apis[api.name] = { ok: true };
    } else {
      result.checks.apis[api.name] = {
        ok: false,
        error: 'API key não configurada',
      };
    }
  }

  const status = result.healthy ? 200 : 503;
  
  return NextResponse.json(result, { status });
}

