# ============================================================================
# SCRIPT DE SETUP AUTOMATIZADO - INTELLIGENT PROSPECTING SAAS
# ============================================================================
# Execute este script na pasta PAI do projeto atual
# ============================================================================

Write-Host "Iniciando setup do novo projeto SaaS..." -ForegroundColor Green

# ============================================================================
# FASE 1: Criar Diretório e Git
# ============================================================================

Write-Host "`nFASE 1: Criando diretório e inicializando Git..." -ForegroundColor Cyan

$projectName = "intelligent-prospecting-saas"
$currentDir = Get-Location

# Verificar se já existe
if (Test-Path "..\$projectName") {
    Write-Host "AVISO: Diretório já existe! Deseja continuar? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "Cancelado pelo usuário" -ForegroundColor Red
        exit
    }
} else {
    # Criar diretório
    New-Item -ItemType Directory -Force -Path "..\$projectName" | Out-Null
    Write-Host "Diretório criado: ..\$projectName" -ForegroundColor Green
}

# Navegar para o novo diretório
Set-Location "..\$projectName"

# Inicializar Git
if (-not (Test-Path ".git")) {
    git init | Out-Null
    git branch -M main | Out-Null
    Write-Host "Git inicializado" -ForegroundColor Green
} else {
    Write-Host "AVISO: Git já inicializado" -ForegroundColor Yellow
}

# ============================================================================
# FASE 2: Criar .gitignore
# ============================================================================

Write-Host "`nFASE 2: Criando .gitignore..." -ForegroundColor Cyan

$gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env*.local

# Prisma
prisma/migrations/

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8
Write-Host ".gitignore criado" -ForegroundColor Green

# ============================================================================
# FASE 3: Criar Estrutura de Pastas
# ============================================================================

Write-Host "`nFASE 3: Criando estrutura de pastas..." -ForegroundColor Cyan

$folders = @(
    "src/app/(auth)/login",
    "src/app/(auth)/register",
    "src/app/(auth)/onboarding",
    "src/app/(dashboard)/empresas",
    "src/app/(dashboard)/decisores",
    "src/app/(dashboard)/settings",
    "src/app/api/auth",
    "src/app/api/onboarding",
    "src/app/api/tenants",
    "src/components/ui",
    "src/components/onboarding",
    "src/components/dashboard",
    "src/lib",
    "src/services",
    "src/middleware",
    "src/types",
    "src/config"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Write-Host "Estrutura de pastas criada" -ForegroundColor Green

# ============================================================================
# FASE 4: Criar .env.example
# ============================================================================

Write-Host "`nFASE 4: Criando .env.example..." -ForegroundColor Cyan

$envExampleContent = @"
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres"

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Stripe (Payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# OpenAI (ICP Analysis)
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

Set-Content -Path ".env.example" -Value $envExampleContent -Encoding UTF8
Write-Host ".env.example criado" -ForegroundColor Green

# ============================================================================
# FASE 5: Instruções Finais
# ============================================================================

Write-Host "`nSETUP CONCLUÍDO!" -ForegroundColor Green
Write-Host "`nPROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Configure o projeto no Supabase: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Configure o projeto no Clerk: https://dashboard.clerk.com" -ForegroundColor White
Write-Host "3. Execute: npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --yes" -ForegroundColor White
Write-Host "4. Instale dependências: npm install @prisma/client prisma @clerk/nextjs stripe zod react-hook-form @hookform/resolvers axios date-fns lucide-react @tanstack/react-query" -ForegroundColor White
Write-Host "5. Configure o .env com as credenciais do Supabase e Clerk" -ForegroundColor White
Write-Host "6. Execute: npx prisma init" -ForegroundColor White
Write-Host "7. Copie o schema.prisma do projeto atual para o novo projeto" -ForegroundColor White
Write-Host "8. Execute: npx prisma migrate dev --name init_multi_tenant" -ForegroundColor White
Write-Host "`nVeja o arquivo SETUP_NOVO_PROJETO_SAAS.md para instruções detalhadas" -ForegroundColor Cyan

Write-Host "`nDiretório criado em: $(Get-Location)" -ForegroundColor Green

