# ============================================================================
# SCRIPT: Regenerar Tipos TypeScript do Supabase
# ============================================================================
# Descrição: Gera tipos TypeScript atualizados após migrations
# ============================================================================

$projectRef = "vkdvezuivlovzqxmnohk"

Write-Host "`n🔄 REGENERANDO TIPOS DO SUPABASE" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Verificar se está na raiz do projeto
if (-Not (Test-Path "src/integrations/supabase")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Gerando tipos TypeScript..." -ForegroundColor Cyan

try {
    # Gerar tipos e salvar em arquivo
    npx supabase gen types typescript `
        --project-id $projectRef `
        --schema public `
        > src/integrations/supabase/database.types.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tipos gerados com sucesso!" -ForegroundColor Green
        Write-Host "`nArquivo atualizado: src/integrations/supabase/database.types.ts" -ForegroundColor White
    } else {
        Write-Host "❌ Erro ao gerar tipos" -ForegroundColor Red
        Write-Host "`nTente manualmente:" -ForegroundColor Yellow
        Write-Host "1. Acesse: https://supabase.com/dashboard/project/$projectRef/settings/api" -ForegroundColor White
        Write-Host "2. Role até 'TypeScript Types'" -ForegroundColor White
        Write-Host "3. Copie os tipos gerados" -ForegroundColor White
        Write-Host "4. Cole em src/integrations/supabase/database.types.ts" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host "`nTente manualmente:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/$projectRef/settings/api" -ForegroundColor White
    Write-Host "2. Role até 'TypeScript Types'" -ForegroundColor White
    Write-Host "3. Copie os tipos gerados" -ForegroundColor White
    Write-Host "4. Cole em src/integrations/supabase/database.types.ts" -ForegroundColor White
}

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green

