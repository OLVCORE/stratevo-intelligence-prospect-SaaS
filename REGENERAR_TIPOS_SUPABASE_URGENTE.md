# ⚠️ REGENERAR TIPOS SUPABASE - URGENTE

## 🔴 PROBLEMA CRÍTICO

Os tipos TypeScript do Supabase estão desatualizados. Após aplicar todas as migrations do CRM, é necessário regenerar os tipos.

## ✅ SOLUÇÃO

Execute o comando abaixo no terminal:

```powershell
npx supabase gen types typescript --project-id vkdvezuivlovzqxmnohk > src/integrations/supabase/database.types.ts
```

**OU** se você tem o Supabase CLI instalado localmente:

```powershell
supabase gen types typescript --project-id vkdvezuivlovzqxmnohk --schema public > src/integrations/supabase/database.types.ts
```

## 📋 TABELAS QUE FALTAM NOS TIPOS

As seguintes tabelas foram criadas mas não estão nos tipos:

1. `deals` - Tabela principal de deals do CRM
2. `leads` - Tabela de leads do CRM
3. `email_tracking` - Rastreamento de emails
4. `whatsapp_quick_replies` - Templates WhatsApp
5. `whatsapp_message_status` - Status de mensagens WhatsApp
6. `whatsapp_approved_templates` - Templates aprovados WhatsApp
7. `call_recordings` - Gravações de chamadas
8. `proposals` - Propostas comerciais
9. `proposal_versions` - Versões de propostas
10. `proposal_templates` - Templates de propostas
11. `proposal_signatures` - Assinaturas digitais
12. `workflows` - Workflows visuais
13. `workflow_executions` - Execuções de workflows
14. `automation_rules` - Regras de automação
15. `reminders` - Lembretes
16. `activities` - Atividades do CRM
17. `appointments` - Agendamentos
18. `confirmed_opportunities` - Oportunidades confirmadas
19. `ai_lead_analysis` - Análise de IA de leads
20. `gamification` - Gamificação
21. `payment_transactions` - Transações de pagamento

## 🎯 APÓS REGENERAR

Após regenerar os tipos, todos os erros TypeScript devem desaparecer automaticamente.

---

**Status:** ⚠️ AGUARDANDO REGENERAÇÃO DE TIPOS

