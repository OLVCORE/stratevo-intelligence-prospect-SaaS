# Teste da API de Nichos
$url = "https://vkdvezuivlovzqxmnohk.supabase.co/rest/v1/niches?select=*"
$apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjEzODMsImV4cCI6MjA3OTA5NzM4M30.jPCAye46kuwyO7_JWZV8e-XxxynixbqbUJSYdK9thek"

$headers = @{
    "apikey" = $apikey
    "Authorization" = "Bearer $apikey"
}

Write-Host "Testando API de Nichos..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -UseBasicParsing
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Total de nichos retornados: $($data.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Primeiros 5 nichos:" -ForegroundColor Yellow
    $data | Select-Object -First 5 | Format-Table niche_code, niche_name, sector_code -AutoSize
    
    Write-Host ""
    Write-Host "API FUNCIONANDO! Os nichos estao acessiveis via PostgREST." -ForegroundColor Green
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta do servidor:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Teste de Setores:" -ForegroundColor Yellow

$urlSectors = "https://vkdvezuivlovzqxmnohk.supabase.co/rest/v1/sectors?select=*"
try {
    $responseSectors = Invoke-WebRequest -Uri $urlSectors -Method GET -Headers $headers -UseBasicParsing
    $dataSectors = $responseSectors.Content | ConvertFrom-Json
    Write-Host "Status: $($responseSectors.StatusCode)" -ForegroundColor Green
    Write-Host "Total de setores retornados: $($dataSectors.Count)" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao buscar setores: $($_.Exception.Message)" -ForegroundColor Red
}
