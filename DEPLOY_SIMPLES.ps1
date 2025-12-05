# Deploy simples da Edge Function
Write-Host "Iniciando deploy..." -ForegroundColor Cyan
Write-Host ""

supabase functions deploy bulk-upload-companies --project-ref vkdvezuivlovzqxmnohk

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCESSO!" -ForegroundColor Green
} else {
    Write-Host "ERRO - Verifique se esta logado: supabase login" -ForegroundColor Red
}

