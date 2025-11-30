# ============================================================================
# SCRIPT: Consolidar TODAS as Migrations do Projeto Anterior
# ============================================================================
# Este script lê TODAS as migrations e cria um arquivo SQL consolidado
# para aplicar no novo projeto SaaS
# ============================================================================

Write-Host "`nAnalisando migrations..." -ForegroundColor Cyan

$migrationsPath = "supabase\migrations"
$outputFile = "MIGRACOES_COMPLETAS_CONSOLIDADAS.sql"

# Listar todas as migrations em ordem cronológica
$migrationFiles = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name

Write-Host "`nEncontradas $($migrationFiles.Count) migrations" -ForegroundColor Yellow

# Criar arquivo de saída com cabeçalho
$header = @"
-- ============================================================================
-- MIGRATIONS COMPLETAS DO PROJETO ANTERIOR - CONSOLIDADAS
-- ============================================================================
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Projeto Origem: olv-intelligent-prospecting
-- Projeto Destino: stratevo-intelligence-prospect-SaaS
-- Supabase: vkdvezuivlovzqxmnohk
-- Schema: public
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" ou pressione Ctrl+Enter
-- 4. Aguarde a execução (pode levar 3-5 minutos devido ao volume)
-- ============================================================================
-- ATENÇÃO: Este script contém TODAS as tabelas, funções, triggers e policies
-- do projeto anterior. Execute com cuidado em ambiente de produção.
-- ============================================================================

SET search_path = public;

"@

$header | Out-File -FilePath $outputFile -Encoding UTF8

# Contadores
$tablesFound = 0
$functionsFound = 0
$triggersFound = 0
$policiesFound = 0
$processedFiles = 0

# Processar cada migration
foreach ($file in $migrationFiles) {
    $processedFiles++
    $fileName = $file.Name
    
    Write-Host "  [$processedFiles/$($migrationFiles.Count)] Processando: $fileName" -ForegroundColor Gray
    
    # Ler conteúdo do arquivo
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Adicionar comentário com nome do arquivo
    $fileComment = "`n-- ============================================================================"
    $fileComment += "`n-- MIGRATION: $fileName"
    $fileComment += "`n-- ============================================================================"
    $fileComment += "`n"
    
    $fileComment | Out-File -FilePath $outputFile -Append -Encoding UTF8
    
    # Adicionar conteúdo (remover comentários de instruções duplicadas)
    $content | Out-File -FilePath $outputFile -Append -Encoding UTF8
    
    # Contar objetos criados
    $tablesFound += ([regex]::Matches($content, "CREATE TABLE", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $functionsFound += ([regex]::Matches($content, "CREATE.*FUNCTION", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $triggersFound += ([regex]::Matches($content, "CREATE TRIGGER", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
    $policiesFound += ([regex]::Matches($content, "CREATE POLICY", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
}

# Adicionar rodapé com estatísticas
$footer = @"

-- ============================================================================
-- RESUMO DA MIGRAÇÃO
-- ============================================================================
-- Migrations processadas: $processedFiles
-- Tabelas criadas: ~$tablesFound
-- Funções criadas: ~$functionsFound
-- Triggers criados: ~$triggersFound
-- Policies criadas: ~$policiesFound
-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
"@

$footer | Out-File -FilePath $outputFile -Append -Encoding UTF8

Write-Host "`nScript consolidado criado: $outputFile" -ForegroundColor Green
Write-Host "`nEstatisticas:" -ForegroundColor Yellow
Write-Host "  - Migrations processadas: $processedFiles" -ForegroundColor White
Write-Host "  - Tabelas encontradas: ~$tablesFound" -ForegroundColor White
Write-Host "  - Funcoes encontradas: ~$functionsFound" -ForegroundColor White
Write-Host "  - Triggers encontrados: ~$triggersFound" -ForegroundColor White
Write-Host "  - Policies encontradas: ~$policiesFound" -ForegroundColor White

$fileSize = (Get-Item $outputFile).Length / 1MB
Write-Host "`nTamanho do arquivo: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra o arquivo: $outputFile" -ForegroundColor White
Write-Host "2. Revise o conteúdo (pode ser grande!)" -ForegroundColor White
Write-Host "3. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new" -ForegroundColor Cyan
Write-Host "4. Cole o script e execute" -ForegroundColor White
Write-Host "`nATENCAO: Este script pode conter duplicatas e conflitos." -ForegroundColor Red
Write-Host "   Recomenda-se revisar antes de executar em producao!" -ForegroundColor Red

