# 🚀 SOLUÇÃO CRON EXTERNO - FUNCIONA AGORA

**Problema:** Supabase não tem cron jobs habilitado no projeto  
**Solução:** Usar serviço externo de cron que chama as Edge Functions via HTTP

---

## ✅ OPÇÃO 1: CRON-JOB.ORG (GRATUITO)

### Passo 1: Criar conta
1. Acesse: https://cron-job.org/
2. Crie conta gratuita
3. Confirme email

### Passo 2: Criar Cron Jobs

#### Cron Job 1: Automation Runner
- **URL:** `https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/crm-automation-runner`
- **Schedule:** `*/5 * * * *` (a cada 5 minutos)
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMTM4MywiZXhwIjoyMDc5MDk3MzgzfQ.plfX40wrNkl0JkLxNVxNUu-lzM9cufpugHYk_XcRy6A`
  - `Content-Type: application/json`
- **Body:** `{}`

#### Cron Job 2: Reminder Processor
- **URL:** `https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/crm-reminder-processor`
- **Schedule:** `0 * * * *` (a cada hora)
- **Method:** POST
- **Headers:** (mesmos acima)
- **Body:** `{}`

---

## ✅ OPÇÃO 2: SCRIPT POWERSHELL COM TASK SCHEDULER (LOCAL)

Criar tarefas agendadas no Windows que chamam as funções:

```powershell
# Script: C:\tools\supabase\run-automation-runner.ps1
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMTM4MywiZXhwIjoyMDc5MDk3MzgzfQ.plfX40wrNkl0JkLxNVxNUu-lzM9cufpugHYk_XcRy6A"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Method Post -Uri "https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/crm-automation-runner" -Headers $headers -Body "{}"
```

```powershell
# Script: C:\tools\supabase\run-reminder-processor.ps1
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZHZlenVpdmxvdnpxeG1ub2hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUyMTM4MywiZXhwIjoyMDc5MDk3MzgzfQ.plfX40wrNkl0JkLxNVxNUu-lzM9cufpugHYk_XcRy6A"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Method Post -Uri "https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/crm-reminder-processor" -Headers $headers -Body "{}"
```

Depois criar tarefas no Task Scheduler do Windows para rodar esses scripts.

---

## ✅ OPÇÃO 3: POLLING INTERNO (MAIS SIMPLES)

Criar um componente React que roda na aplicação e verifica eventos pendentes periodicamente.

