# ==========================================
# Script PowerShell: Aplicar Migration de Endereços
# ==========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION: Endereços Completos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se Supabase CLI está instalado
Write-Host "🔍 Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "ou: scoop install supabase" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase CLI encontrado!" -ForegroundColor Green
Write-Host ""

# 2. Verificar se está em um projeto Supabase
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Não é um projeto Supabase!" -ForegroundColor Red
    Write-Host "Execute 'supabase init' primeiro" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Projeto Supabase detectado!" -ForegroundColor Green
Write-Host ""

# 3. Verificar se está linkado ao projeto remoto
Write-Host "🔍 Verificando link com projeto remoto..." -ForegroundColor Yellow
$linkStatus = supabase status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Projeto não está linkado ao Supabase remoto" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para linkar, execute:" -ForegroundColor Cyan
    Write-Host "  supabase link --project-ref SEU_PROJECT_REF" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Deseja aplicar a migration localmente? (S/N)"
    if ($response -ne "S" -and $response -ne "s") {
        exit 0
    }
}

Write-Host ""

# 4. Mostrar conteúdo da migration
Write-Host "📄 Migration a ser aplicada:" -ForegroundColor Cyan
Write-Host "   supabase/migrations/20250202000000_fix_endereco_completo.sql" -ForegroundColor White
Write-Host ""

$response = Read-Host "Deseja aplicar a migration? (S/N)"
if ($response -ne "S" -and $response -ne "s") {
    Write-Host "❌ Operação cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Aplicando migration..." -ForegroundColor Yellow
Write-Host ""

# 5. Aplicar migration
try {
    # Se estiver linkado, aplica no remoto
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📡 Aplicando no Supabase REMOTO..." -ForegroundColor Cyan
        supabase db push
    } else {
        # Senão, aplica localmente
        Write-Host "💻 Aplicando LOCALMENTE..." -ForegroundColor Cyan
        supabase db reset
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ MIGRATION APLICADA COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Endereços completos agora estão configurados!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 O que foi criado:" -ForegroundColor Cyan
        Write-Host "   ✅ Índices JSONB para performance" -ForegroundColor White
        Write-Host "   ✅ Funções para consultar endereços" -ForegroundColor White
        Write-Host "   ✅ View materializada (mv_enderecos_completos)" -ForegroundColor White
        Write-Host "   ✅ Trigger para atualização automática" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Comandos úteis:" -ForegroundColor Cyan
        Write-Host "   # Ver endereços de um tenant:" -ForegroundColor Yellow
        Write-Host "   SELECT * FROM get_tenant_endereco('TENANT_ID');" -ForegroundColor White
        Write-Host ""
        Write-Host "   # Ver concorrentes com endereço:" -ForegroundColor Yellow
        Write-Host "   SELECT * FROM get_concorrentes_com_endereco('TENANT_ID');" -ForegroundColor White
        Write-Host ""
        Write-Host "   # Ver view materializada:" -ForegroundColor Yellow
        Write-Host "   SELECT * FROM mv_enderecos_completos;" -ForegroundColor White
        Write-Host ""
    } else {
        throw "Erro ao aplicar migration"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ ERRO AO APLICAR MIGRATION" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Tente aplicar manualmente:" -ForegroundColor Yellow
    Write-Host "   1. Abra o Supabase Dashboard" -ForegroundColor White
    Write-Host "   2. Vá em SQL Editor" -ForegroundColor White
    Write-Host "   3. Cole o conteúdo de:" -ForegroundColor White
    Write-Host "      supabase/migrations/20250202000000_fix_endereco_completo.sql" -ForegroundColor Cyan
    Write-Host "   4. Execute (Run)" -ForegroundColor White
    Write-Host ""
    exit 1
}

