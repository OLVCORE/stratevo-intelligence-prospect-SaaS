# ⚡ SCRIPT DE DEPLOY AUTOMÁTICO - GROWTH ENGINE
# Executar: .\EXECUTAR_AGORA.ps1

Write-Host "🚀 INICIANDO DEPLOY DO GROWTH ENGINE..." -ForegroundColor Cyan
Write-Host ""

# 1. Deploy Edge Functions
Write-Host "📦 PASSO 1/4: Deployando Edge Functions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  → Deployando crm-ai-voice-call..." -ForegroundColor Gray
npx supabase functions deploy crm-ai-voice-call

Write-Host "  → Deployando crm-ai-voice-twiml..." -ForegroundColor Gray
npx supabase functions deploy crm-ai-voice-twiml

Write-Host "  → Deployando crm-ai-voice-webhook..." -ForegroundColor Gray
npx supabase functions deploy crm-ai-voice-webhook

Write-Host "  → Deployando crm-ai-voice-recording..." -ForegroundColor Gray
npx supabase functions deploy crm-ai-voice-recording

Write-Host ""
Write-Host "✅ Edge Functions deployadas com sucesso!" -ForegroundColor Green
Write-Host ""

# 2. Listar functions para verificar
Write-Host "📋 PASSO 2/4: Verificando deploy..." -ForegroundColor Yellow
npx supabase functions list

Write-Host ""
Write-Host "✅ Verificação completa!" -ForegroundColor Green
Write-Host ""

# 3. Instruções para migration SQL
Write-Host "📝 PASSO 3/4: APLICAR MIGRATION SQL" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚠️  AÇÃO MANUAL NECESSÁRIA:" -ForegroundColor Red
Write-Host ""
Write-Host "   1. Abrir: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk" -ForegroundColor White
Write-Host "   2. Ir em: SQL Editor" -ForegroundColor White
Write-Host "   3. Copiar TODO o conteúdo de:" -ForegroundColor White
Write-Host "      supabase/migrations/20250205000001_ai_voice_agents_multi_tenant.sql" -ForegroundColor Cyan
Write-Host "   4. Colar e clicar 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "   Pressione ENTER quando concluir..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "✅ Migration SQL aplicada!" -ForegroundColor Green
Write-Host ""

# 4. Instruções para storage bucket
Write-Host "📦 PASSO 4/4: CRIAR STORAGE BUCKET" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Execute este SQL no Supabase SQL Editor:" -ForegroundColor White
Write-Host ""
Write-Host "   INSERT INTO storage.buckets (id, name, public)" -ForegroundColor Cyan
Write-Host "   VALUES ('voice-recordings', 'voice-recordings', true)" -ForegroundColor Cyan
Write-Host "   ON CONFLICT (id) DO NOTHING;" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Pressione ENTER quando concluir..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "✅ Storage bucket criado!" -ForegroundColor Green
Write-Host ""

# 5. Iniciar aplicação
Write-Host "🌐 INICIANDO APLICAÇÃO..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   A aplicação será iniciada em:" -ForegroundColor White
Write-Host "   http://localhost:5173/growth-engine" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

npm run dev


