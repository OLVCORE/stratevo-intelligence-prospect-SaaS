#!/usr/bin/env tsx
/**
 * Script de verificação de variáveis de ambiente
 * Roda antes de dev/build para garantir que todos os segredos estão presentes
 */
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const envSchema = z.object({
  // Supabase (obrigatórios)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('URL do Supabase inválida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'ANON_KEY muito curta'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SERVICE_ROLE_KEY muito curta'),

  // APIs Externas (opcionais mas recomendados)
  GOOGLE_CSE_API_KEY: z.string().optional(),
  GOOGLE_CSE_CX: z.string().optional(),
  SERPER_API_KEY: z.string().optional(),
  APOLLO_API_KEY: z.string().optional(),
  HUNTER_API_KEY: z.string().optional(),
  PHANTOMBUSTER_API_KEY: z.string().optional(),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

function main() {
  console.log('🔍 Verificando variáveis de ambiente...\n');

  // Verificar se .env.local existe
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado!');
    console.error('   Copie .env.example para .env.local e preencha os valores.\n');
    process.exit(1);
  }

  // Validar com Zod
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Variáveis de ambiente inválidas:\n');
    const errors = result.error.format();
    
    Object.entries(errors).forEach(([key, value]) => {
      if (key !== '_errors' && value) {
        const err = value as { _errors?: string[] };
        if (err._errors && err._errors.length > 0) {
          console.error(`   ${key}: ${err._errors.join(', ')}`);
        }
      }
    });

    console.error('\n💡 Verifique seu arquivo .env.local\n');
    process.exit(1);
  }

  // Avisos para APIs opcionais
  const optionalApis = [
    'GOOGLE_CSE_API_KEY',
    'SERPER_API_KEY',
    'APOLLO_API_KEY',
    'HUNTER_API_KEY',
    'PHANTOMBUSTER_API_KEY',
  ];

  const missingOptional = optionalApis.filter((key) => !process.env[key]);
  
  if (missingOptional.length > 0) {
    console.warn('⚠️  APIs opcionais não configuradas:');
    missingOptional.forEach((key) => console.warn(`   - ${key}`));
    console.warn('   (Funcionalidades relacionadas falharão)\n');
  }

  console.log('✅ Todas as variáveis obrigatórias estão configuradas!\n');
  process.exit(0);
}

main();

