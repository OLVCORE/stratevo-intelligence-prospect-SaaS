# =====================================================
# SCRIPT POWERSHELL - TESTAR EDGE FUNCTION
# =====================================================
# Execute este script no PowerShell
# =====================================================

# CONFIGURAÇÕES - SUBSTITUA PELOS VALORES REAIS
$tenantId = "8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71"
$icpMetadataId = "391276d2-8a59-4664-bd03-fd54a32bb701"
$supabaseUrl = "https://seu-projeto.supabase.co"  # ⚠️ SUBSTITUIR
$supabaseAnonKey = "sua-anon-key"  # ⚠️ SUBSTITUIR

Write-Host "🚀 TESTE DA EDGE FUNCTION generate-icp-report" -ForegroundColor Cyan
Write-Host ""

# Preparar body da requisição
$body = @{
    tenant_id = $tenantId
    icp_metadata_id = $icpMetadataId
    report_type = "completo"
} | ConvertTo-Json

Write-Host "📋 Parâmetros:" -ForegroundColor Yellow
Write-Host "  Tenant ID: $tenantId"
Write-Host "  ICP Metadata ID: $icpMetadataId"
Write-Host "  Report Type: completo"
Write-Host ""

# Chamar Edge Function
Write-Host "📡 Chamando Edge Function..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/generate-icp-report" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $supabaseAnonKey"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Resposta recebida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.reportId) {
        Write-Host ""
        Write-Host "✅ Relatório gerado com sucesso!" -ForegroundColor Green
        Write-Host "  Report ID: $($response.reportId)" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Próximos passos:" -ForegroundColor Yellow
        Write-Host "  1. Verifique os logs da Edge Function no Supabase Dashboard"
        Write-Host "  2. Procure por: [COMPETITIVE-ANALYSIS], [PRODUCT-HEATMAP], [CLIENT-BCG]"
        Write-Host "  3. Verifique se os dados reais foram encontrados"
    }
} catch {
    Write-Host "❌ Erro ao chamar Edge Function:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta do servidor:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔍 Para verificar os logs:" -ForegroundColor Cyan
Write-Host "  1. Acesse: https://supabase.com/dashboard"
Write-Host "  2. Selecione seu projeto"
Write-Host "  3. Vá em: Edge Functions > generate-icp-report > Logs"
Write-Host ""

