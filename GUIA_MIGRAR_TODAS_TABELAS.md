# 🚀 GUIA COMPLETO: Migrar TODAS as Tabelas do Projeto Anterior

## 📊 Resumo da Migração

- **Total de Migrations**: 148 arquivos
- **Tabelas**: ~198 tabelas
- **Funções**: ~104 funções
- **Triggers**: ~113 triggers
- **Policies**: ~406 policies
- **Tamanho do Script**: ~0.56 MB

## ⚠️ ATENÇÃO CRÍTICA

Este script contém **TODAS** as migrations do projeto anterior. Isso significa:

1. **Duplicatas**: Algumas tabelas podem ser criadas múltiplas vezes
2. **Conflitos**: Algumas migrations podem tentar alterar tabelas que já existem
3. **Dependências**: A ordem de execução pode causar erros de foreign keys
4. **RLS Policies**: Muitas policies podem ser duplicadas

## 🎯 Estratégias de Migração

### Opção 1: Execução Direta (Rápida, mas arriscada)

**Quando usar**: Ambiente de desenvolvimento/teste

**Passos**:
1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
2. Abra o arquivo: `MIGRACOES_COMPLETAS_CONSOLIDADAS.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor do Supabase
5. Execute (Ctrl+Enter)
6. **Aguarde 3-5 minutos**
7. Verifique erros no console

**Vantagens**:
- ✅ Rápido (uma única execução)
- ✅ Todas as tabelas de uma vez

**Desvantagens**:
- ❌ Pode gerar muitos erros de duplicatas
- ❌ Difícil identificar problemas específicos
- ❌ Pode precisar limpar e tentar novamente

### Opção 2: Execução por Lotes (Recomendada)

**Quando usar**: Produção ou quando quiser controle total

**Passos**:

#### Lote 1: Tabelas Core (já aplicadas)
- ✅ `companies`
- ✅ `decision_makers`
- ✅ `icp_analysis_results`
- ✅ `sdr_deals`
- ✅ `sdr_pipeline_stages`
- ✅ `buying_signals`
- ✅ `digital_maturity`
- ✅ `search_history`
- ✅ `discarded_companies`
- ✅ `similar_companies`
- ✅ `digital_presence`

#### Lote 2: Tabelas de Enriquecimento
Execute migrations relacionadas a:
- `people` (Apollo.io)
- `company_technologies`
- `company_news`
- `company_jobs`
- `company_insights`
- `company_updates`

#### Lote 3: Tabelas SDR/Pipeline
Execute migrations relacionadas a:
- `sdr_deal_activities`
- `sdr_notifications`
- `sdr_workflows`
- `sdr_sequences`
- `sdr_sequence_steps`
- `sdr_sequence_runs`

#### Lote 4: Tabelas de Account Strategy
Execute migrations relacionadas a:
- `account_strategies`
- `account_strategy_modules`
- `account_touchpoints`
- `competitors`
- `battle_cards`
- `win_loss_analysis`

#### Lote 5: Tabelas de Canvas/Propostas
Execute migrations relacionadas a:
- `canvas`
- `canvas_blocks`
- `canvas_comments`
- `canvas_versions`
- `visual_proposals`
- `product_catalog`
- `pricing_rules`

#### Lote 6: Tabelas de Relatórios
Execute migrations relacionadas a:
- `executive_reports`
- `executive_reports_versions`
- `analysis_runs`
- `analysis_artifacts`
- `company_snapshots`

#### Lote 7: Tabelas de Integrações
Execute migrations relacionadas a:
- `bitrix_sync_config`
- `bitrix_sync_log`
- `google_sheets_sync_config`
- `sdr_integrations`
- `sdr_api_keys`
- `sdr_webhooks`

#### Lote 8: Tabelas de Monitoramento
Execute migrations relacionadas a:
- `intent_signals`
- `company_monitoring`
- `intelligence_monitoring_config`
- `job_postings_detected`
- `financial_docs_detected`

#### Lote 9: Tabelas de ICP/STC
Execute migrations relacionadas a:
- `icp_evidence`
- `icp_scraping_log`
- `icp_criteria_scores`
- `icp_mapping_templates`
- `stc_agent_conversations`
- `stc_verification_history`
- `competitor_stc_matches`

#### Lote 10: Tabelas de Chamadas (Plaud)
Execute migrations relacionadas a:
- `call_recordings`
- `call_analytics`
- `plaud_webhook_logs`
- `sales_coaching_recommendations`

#### Lote 11: Tabelas de Leads/Quarantine
Execute migrations relacionadas a:
- `leads_pool`
- `leads_quarantine`
- `leads_sources`
- `suggested_companies`
- `discovery_batches`

#### Lote 12: Tabelas de Enriquecimento/Usage
Execute migrations relacionadas a:
- `enrichment_usage`
- `enrichment_field_mapping`
- `apollo_credit_config`
- `apollo_credit_usage`

#### Lote 13: Tabelas de TOTVS
Execute migrations relacionadas a:
- `totvs_usage_detection`
- `totvs_detection_reports`
- `simple_totvs_checks`

#### Lote 14: Tabelas de Email Sequences
Execute migrations relacionadas a:
- `email_sequences`
- `email_sequence_steps`
- `email_sequence_enrollments`
- `email_sequence_messages`

#### Lote 15: Tabelas de Conversas/Mensagens
Execute migrations relacionadas a:
- `conversations`
- `messages`
- `conversation_analysis`

#### Lote 16: Tabelas de Playbooks/Tasks
Execute migrations relacionadas a:
- `playbooks`
- `smart_tasks`
- `meeting_links`
- `meeting_bookings`

#### Lote 17: Tabelas de Deal Health
Execute migrations relacionadas a:
- `deal_health_scores`
- `health_view` (VIEW)

#### Lote 18: Tabelas de Geografia
Execute migrations relacionadas a:
- `br_states`
- `br_mesoregions`
- `br_microregions`
- `br_municipalities`

#### Lote 19: Tabelas de Setores/Nichos
Execute migrations relacionadas a:
- `sectors`
- `niches`
- `icp_batch_jobs`
- `icp_batch_companies`

#### Lote 20: Tabelas de Usuários/Auth
Execute migrations relacionadas a:
- `profiles`
- `user_roles`
- `user_sessions`
- `app_features`

#### Lote 21: Tabelas de Configurações
Execute migrations relacionadas a:
- `settings`
- `step_registry`
- `preview_cache`
- `job_queue`

#### Lote 22: Views e Relatórios
Execute migrations relacionadas a:
- `call_performance_summary` (VIEW)
- `source_performance` (VIEW)
- `report_dashboard` (VIEW)
- `insights` (VIEW)

#### Lote 23: Tabelas de Auditoria/Logs
Execute migrations relacionadas a:
- `api_calls_log`
- `api_usage_logs`
- `report_events`
- `report_state`
- `icp_audit_log`

### Opção 3: Script Adaptado (Mais Seguro)

Criar um script que:
1. Verifica se tabela existe antes de criar (`CREATE TABLE IF NOT EXISTS`)
2. Remove duplicatas de policies
3. Trata erros de foreign keys
4. Executa em ordem de dependências

## 🔍 Como Identificar Problemas

### 1. Verificar Tabelas Criadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar Erros Comuns

**Erro: "relation already exists"**
- Solução: Usar `CREATE TABLE IF NOT EXISTS` ou `DROP TABLE IF EXISTS` antes

**Erro: "foreign key constraint fails"**
- Solução: Criar tabelas na ordem correta (tabelas referenciadas primeiro)

**Erro: "policy already exists"**
- Solução: Usar `DROP POLICY IF EXISTS` antes de criar

**Erro: "function already exists"**
- Solução: Usar `CREATE OR REPLACE FUNCTION`

### 3. Verificar Dependências

```sql
-- Ver foreign keys de uma tabela
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## 📋 Checklist Pós-Migração

Após executar as migrations, verifique:

- [ ] Todas as tabelas principais foram criadas
- [ ] Índices foram criados corretamente
- [ ] Foreign keys estão funcionando
- [ ] RLS Policies estão ativas
- [ ] Funções foram criadas sem erros
- [ ] Triggers estão funcionando
- [ ] Views foram criadas corretamente

## 🛠️ Scripts Úteis

### Limpar Tudo (CUIDADO!)

```sql
-- NUNCA execute em produção sem backup!
-- Remove TODAS as tabelas do schema public (exceto tenants/users)

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
              AND tablename NOT IN ('tenants', 'users', 'subscriptions', 'audit_logs')) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
```

### Verificar Tabelas Faltantes

Compare com a lista de tabelas do projeto anterior:

```sql
-- Listar todas as tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## 🎯 Recomendação Final

**Para o novo projeto SaaS**, recomendo:

1. **Primeiro**: Execute o script consolidado em um ambiente de teste
2. **Segundo**: Identifique e corrija erros
3. **Terceiro**: Crie um script limpo apenas com as migrations necessárias
4. **Quarto**: Execute o script limpo no ambiente de produção

## 📞 Próximos Passos

1. ✅ Script consolidado criado: `MIGRACOES_COMPLETAS_CONSOLIDADAS.sql`
2. ⏳ Revisar e identificar duplicatas
3. ⏳ Criar script limpo (opcional)
4. ⏳ Executar no Supabase
5. ⏳ Validar criação de todas as tabelas
6. ⏳ Testar aplicação

---

**Última atualização**: 2025-01-19
**Status**: Script consolidado criado ✅

