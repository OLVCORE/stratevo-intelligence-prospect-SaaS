# TWILIO SETUP - Script Automatizado
# Execute este script apos obter as credenciais Twilio

Write-Host "=== TWILIO SETUP SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar credenciais
Write-Host "Cole suas credenciais Twilio:" -ForegroundColor Yellow
Write-Host ""

$accountSid = Read-Host "ACCOUNT_SID (ACxxx...)"
$authToken = Read-Host "AUTH_TOKEN"
$apiKeySid = Read-Host "API_KEY_SID (SKxxx...)"
$apiKeySecret = Read-Host "API_KEY_SECRET"
$whatsappNumber = Read-Host "WHATSAPP_NUMBER (whatsapp:+xxx...)"

Write-Host ""
Write-Host "Configurando..." -ForegroundColor Yellow

# 1. Atualizar .env.local
$envContent = Get-Content .env.local -Raw

# Adicionar variaveis Twilio
$twilioVars = @"


# TWILIO (VideoCall + WhatsApp)
VITE_TWILIO_ACCOUNT_SID=$accountSid
VITE_TWILIO_AUTH_TOKEN=$authToken
VITE_TWILIO_API_KEY_SID=$apiKeySid
VITE_TWILIO_API_KEY_SECRET=$apiKeySecret
VITE_TWILIO_WHATSAPP_NUMBER=$whatsappNumber
"@

$envContent += $twilioVars
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -Force

Write-Host "OK - .env.local atualizado" -ForegroundColor Green

# 2. Configurar secrets no Supabase
Write-Host ""
Write-Host "Configurando secrets no Supabase..." -ForegroundColor Yellow

supabase secrets set TWILIO_ACCOUNT_SID=$accountSid
supabase secrets set TWILIO_AUTH_TOKEN=$authToken
supabase secrets set TWILIO_API_KEY_SID=$apiKeySid
supabase secrets set TWILIO_API_KEY_SECRET=$apiKeySecret
supabase secrets set TWILIO_WHATSAPP_NUMBER=$whatsappNumber

Write-Host "OK - Secrets configurados" -ForegroundColor Green

# 3. Deploy Edge Functions
Write-Host ""
Write-Host "Deployando Edge Functions..." -ForegroundColor Yellow

supabase functions deploy twilio-video-token
supabase functions deploy twilio-send-whatsapp

Write-Host "OK - Edge Functions deployadas" -ForegroundColor Green

# 4. Instrucoes finais
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Reinicie o servidor:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Teste VideoCall:" -ForegroundColor White
Write-Host "   SDR Pipeline > Deal > Comunicacao > Twilio Video" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Teste WhatsApp:" -ForegroundColor White
Write-Host "   Deal > Comunicacao > WhatsApp Twilio" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Cyan
pause

