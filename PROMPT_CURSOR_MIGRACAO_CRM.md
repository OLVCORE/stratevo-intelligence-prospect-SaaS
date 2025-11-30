# 🤖 PROMPT COMPLETO PARA CURSOR - MIGRAÇÃO CRM STRATEVO

**IMPORTANTE**: Antes de executar este prompt, certifique-se de que o arquivo `MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md` está na raiz do projeto.

---

## 📋 CONTEXTO

Sou o desenvolvedor do projeto **STRATEVO Intelligence 360°** e preciso migrar um **CRM completo e funcional** do projeto "Espaço Linda" para dentro do STRATEVO, implementando uma arquitetura **multi-tenant** onde cada empresa cadastrada terá seu próprio CRM customizado baseado no modelo de negócio.

⚠️ **CRÍTICO - ABSTRAÇÃO OBRIGATÓRIA**: O CRM original é específico para EVENTOS. Você DEVE abstrair TODOS os campos, terminologias e conceitos event-specific para torná-lo 100% GENÉRICO e aplicável a qualquer indústria. Consulte o arquivo `MIGRACAO_ESTRATEGIA_ABSTRAÇÃO.md` para o mapeamento completo.

### Projetos Envolvidos

**Projeto de Origem (Espaço Linda - CRM)**
- GitHub: `https://github.com/[seu-usuario]/espaco-linda-crm` (se aplicável)
- Supabase: Projeto Lovable Cloud com CRM completo funcionando
- Tecnologias: React + TypeScript + Supabase + shadcn/ui

**Projeto de Destino (STRATEVO)**
- GitHub: `https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS`
- Supabase: `https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk`
- Vercel: `https://vercel.com/olv-core444/stratevo-intelligence-prospect-saa-s`

---

## 🎯 OBJETIVO

Implementar o CRM completo do Espaço Linda dentro do STRATEVO com as seguintes características:

1. **Multi-Tenancy**: Cada empresa cadastrada é um tenant isolado
2. **Customização Dinâmica**: CRM se adapta ao modelo de negócio (eventos, comércio exterior, software, logística, etc.)
3. **100% GENÉRICO**: Sem referências específicas a eventos - aplicável a qualquer indústria
4. **100% Funcional**: Manter todas as funcionalidades do CRM original (abstraídas)
5. **Integração Perfeita**: Navegar entre STRATEVO Intelligence e CRM na mesma aplicação

---

## 🔄 ESTRATÉGIA DE ABSTRAÇÃO

**ANTES DE COMEÇAR A MIGRAÇÃO**, leia o arquivo `MIGRACAO_ESTRATEGIA_ABSTRAÇÃO.md` que contém:

- ✅ Mapeamento completo de campos event-specific → genéricos
- ✅ Tabelas a renomear: `confirmed_events` → `confirmed_opportunities`
- ✅ Campos a substituir: `event_type` → `opportunity_type`, `event_date` → `target_date`
- ✅ Componentes a remover (específicos de eventos)
- ✅ Terminologia UI: "Evento" → "Oportunidade"
- ✅ Estrutura de customização por tenant

**REGRA DE OURO**: Se contém "event" no nome, precisa ser abstraído ou removido.

---

## 📂 ARQUIVOS NECESSÁRIOS

### Arquivo de Referência Principal
- `MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md` (já está na raiz do projeto)

### Arquivos do Projeto Origem (Espaço Linda)

**COMPONENTES A COPIAR DO PROJETO OLINDA:**

```
src/components/admin/
├── LeadsTable.tsx
├── LeadsPipeline.tsx
├── LeadDetails.tsx
├── CreateLeadDialog.tsx
├── ProposalsTable.tsx
├── ProposalBuilder.tsx
├── ProposalTemplate.tsx
├── ActivitiesTimeline.tsx
├── CreateActivityDialog.tsx
├── DealsPipeline.tsx
├── EmailTemplatesList.tsx
├── AutomationRulesManager.tsx
├── AILeadInsights.tsx
└── ... (outros componentes relacionados ao CRM)

src/hooks/
├── useLeads.ts
├── useProposals.ts
├── useDeals.ts
└── useActivities.ts

src/services/
├── leadsService.ts
├── proposalsService.ts
└── dealsService.ts
```

**EDGE FUNCTIONS A REPLICAR:**

```
supabase/functions/
├── ai-lead-scoring/index.ts
├── chatbot/index.ts
├── send-proposal-email/index.ts
├── generate-proposal-pdf/index.ts
├── notify-new-lead/index.ts
└── process-reminders/index.ts
```

---

## 🚀 INSTRUÇÕES DE EXECUÇÃO

### FASE 1: Preparação Inicial

```bash
# 1. Certifique-se de estar na branch correta
git checkout -b feature/crm-multi-tenant

# 2. Verifique o arquivo de migração
ls -la MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md

# 3. Instale dependências adicionais necessárias
npm install @tanstack/react-query date-fns recharts react-hook-form @hookform/resolvers zod @hello-pangea/dnd
```

### FASE 2: Migração do Banco de Dados

**Execute no Supabase do STRATEVO (`vkdvezuivlovzqxmnohk`):**

1. Abra o SQL Editor do Supabase
2. Execute cada migration SQL do arquivo `MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md` na ordem:
   - `20250101_multi_tenant_base.sql`
   - `20250101_crm_multi_tenant_tables.sql`
   - `20250101_business_model_configs.sql`

3. Verifique se todas as tabelas foram criadas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'tenant_users', 'leads', 'proposals', 'deals', 'activities', 'business_model_templates');
```

### FASE 3: Criar Edge Functions

**Para cada Edge Function listada no MD, crie o arquivo correspondente:**

```typescript
// Exemplo: supabase/functions/crm-leads/index.ts
// Copie o código completo do arquivo MD
```

**IMPORTANTE:** 
- Não esqueça de atualizar `supabase/config.toml` com as novas functions
- Adicione secrets necessários via Supabase Dashboard → Project Settings → Edge Functions → Secrets

### FASE 4: Criar Componentes Multi-Tenant

**Criar estrutura de pastas:**

```bash
mkdir -p src/components/crm/multi-tenant
mkdir -p src/components/crm/leads
mkdir -p src/components/crm/proposals
mkdir -p src/components/crm/activities
mkdir -p src/components/crm/shared
mkdir -p src/pages/crm
```

**Criar cada componente listado na FASE 4 do MD:**

1. `TenantProvider.tsx`
2. `BusinessModelAdapter.tsx`
3. `DynamicForm.tsx`
4. `LeadPipeline.tsx`
5. `OnboardingTenant.tsx`
6. Etc.

### FASE 5: Integrar com STRATEVO

**Atualizar `src/App.tsx`:**

```typescript
// Adicionar imports
import { TenantProvider } from './components/crm/multi-tenant/TenantProvider';
import { BusinessModelAdapter } from './components/crm/multi-tenant/BusinessModelAdapter';

// Envolver rotas com providers
<TenantProvider>
  <BusinessModelAdapter>
    {/* Rotas existentes + novas rotas do CRM */}
  </BusinessModelAdapter>
</TenantProvider>
```

**Atualizar `src/components/admin/AdminSidebar.tsx`:**
- Adicionar seção "CRM" no menu
- Usar `useTenant()` para mostrar/ocultar menu CRM

### FASE 6: Migrar Componentes do Olinda

**ESTRATÉGIA DE MIGRAÇÃO DOS COMPONENTES EXISTENTES:**

Para cada componente listado em "COMPONENTES A COPIAR DO PROJETO OLINDA":

1. **Copie o arquivo do projeto Olinda para o STRATEVO**
2. **Adapte para Multi-Tenancy:**

```typescript
// ANTES (Olinda - Single Tenant)
const { data: leads } = await supabase
  .from('leads')
  .select('*');

// DEPOIS (STRATEVO - Multi-Tenant)
import { useTenant } from '@/components/crm/multi-tenant/TenantProvider';

const { tenant } = useTenant();
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .eq('tenant_id', tenant.id);
```

3. **Adapte campos dinâmicos:**

```typescript
// ANTES (Campos fixos de eventos)
<Input name="event_type" />
<Input name="event_date" />

// DEPOIS (Campos dinâmicos por modelo)
import { useBusinessModel } from '@/components/crm/multi-tenant/BusinessModelAdapter';

const { leadFields } = useBusinessModel();
<DynamicForm fields={Object.values(leadFields)} />
```

### FASE 7: Configurar Variáveis de Ambiente

**No Vercel (STRATEVO):**

```bash
# Adicionar as mesmas env vars do Supabase
VITE_SUPABASE_URL=https://vkdvezuivlovzqxmnohk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[sua_anon_key]
VITE_SUPABASE_PROJECT_ID=vkdvezuivlovzqxmnohk

# Se houver keys adicionais do CRM
OPENAI_API_KEY=[sua_key]
RESEND_API_KEY=[sua_key]
# etc.
```

### FASE 8: Testes

**Checklist de Testes:**

```bash
# 1. Teste de Onboarding
- [ ] Criar tenant "Teste Eventos" com modelo "eventos"
- [ ] Criar tenant "Teste Comércio" com modelo "comercio_exterior"
- [ ] Verificar que cada tenant vê apenas seus próprios dados

# 2. Teste de Leads
- [ ] Criar lead no Tenant 1 com campos específicos de eventos
- [ ] Criar lead no Tenant 2 com campos específicos de comércio exterior
- [ ] Verificar isolamento: Tenant 1 não vê leads do Tenant 2

# 3. Teste de Pipeline
- [ ] Arrastar lead entre estágios
- [ ] Verificar que estágios são diferentes entre modelos de negócio

# 4. Teste de Propostas
- [ ] Criar proposta com seções específicas do modelo
- [ ] Verificar cálculos de preço

# 5. Teste de Automações
- [ ] Criar regra de automação
- [ ] Verificar disparo correto

# 6. Teste de Integração STRATEVO
- [ ] Navegar de STRATEVO Intelligence para CRM
- [ ] Navegar de CRM para STRATEVO Intelligence
- [ ] Verificar que menu lateral mostra ambas as seções
```

---

## 🔧 COMANDOS ÚTEIS

### Verificar Status do Banco

```sql
-- Contar tenants
SELECT COUNT(*) FROM tenants;

-- Listar leads por tenant
SELECT t.name, COUNT(l.id) as leads_count
FROM tenants t
LEFT JOIN leads l ON l.tenant_id = t.id
GROUP BY t.id, t.name;

-- Verificar RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'proposals', 'deals')
ORDER BY tablename, policyname;
```

### Deploy

```bash
# Commit changes
git add .
git commit -m "feat: Implementar CRM Multi-Tenant completo"
git push origin feature/crm-multi-tenant

# Deploy automático via Vercel (conectado ao GitHub)
# Ou deploy manual via Vercel CLI
vercel --prod
```

---

## 📊 ESTRUTURA FINAL ESPERADA

```
stratevo-intelligence-prospect-SaaS/
├── src/
│   ├── components/
│   │   ├── crm/                    ← NOVO
│   │   │   ├── multi-tenant/
│   │   │   ├── leads/
│   │   │   ├── proposals/
│   │   │   ├── activities/
│   │   │   └── shared/
│   │   └── admin/                  ← EXISTENTE DO STRATEVO
│   ├── pages/
│   │   ├── crm/                    ← NOVO
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Proposals.tsx
│   │   │   └── ...
│   │   └── ...                     ← EXISTENTE DO STRATEVO
│   └── hooks/
│       ├── useTenant.ts            ← NOVO
│       ├── useBusinessModel.ts     ← NOVO
│       └── ...
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   └── tenant-context.ts  ← NOVO
│   │   ├── crm-leads/             ← NOVO
│   │   ├── ai-lead-scoring/       ← ADAPTADO
│   │   └── ...
│   └── migrations/
│       ├── [timestamp]_multi_tenant_base.sql          ← NOVO
│       ├── [timestamp]_crm_multi_tenant_tables.sql    ← NOVO
│       └── [timestamp]_business_model_configs.sql     ← NOVO
└── MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md             ← REFERÊNCIA
```

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. Row Level Security (RLS)
**CRÍTICO**: Todas as tabelas do CRM DEVEM ter RLS habilitado e políticas corretas:

```sql
-- Verificar RLS ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%lead%' OR tablename LIKE '%proposal%';

-- Deve retornar rowsecurity = true para todas
```

### 2. Tenant ID em Todas as Queries
**SEMPRE** filtrar por `tenant_id`:

```typescript
// ❌ ERRADO (vaza dados entre tenants)
const { data } = await supabase.from('leads').select('*');

// ✅ CORRETO
const { tenant } = useTenant();
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('tenant_id', tenant.id);
```

### 3. Secrets do Supabase
Certifique-se de configurar todos os secrets necessários:

```bash
# Via Supabase Dashboard → Edge Functions → Secrets
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
# etc.
```

### 4. Tipos TypeScript
Após criar as tabelas, regenere os tipos:

```bash
# No projeto local
npx supabase gen types typescript --project-id vkdvezuivlovzqxmnohk > src/integrations/supabase/types.ts
```

### 5. Performance
Para muitos tenants, considere índices adicionais:

```sql
-- Índices importantes
CREATE INDEX IF NOT EXISTS idx_leads_tenant_created 
  ON leads(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_tenant_status 
  ON proposals(tenant_id, status);
```

---

## 🆘 TROUBLESHOOTING

### Problema: "Tenant not found"
```typescript
// Verificar se usuário está vinculado ao tenant
SELECT * FROM tenant_users WHERE user_id = '[user_uuid]';

// Se não existir, criar vínculo
INSERT INTO tenant_users (tenant_id, user_id, role, status)
VALUES ('[tenant_uuid]', '[user_uuid]', 'admin', 'active');
```

### Problema: RLS bloqueando acesso
```sql
-- Desabilitar RLS temporariamente para debug (APENAS DEV!)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Verificar dados
SELECT * FROM leads;

-- Reabilitar
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

### Problema: Edge Function timeout
- Aumentar timeout em `supabase/config.toml`:
```toml
[functions.crm-leads]
verify_jwt = true
timeout = 30  # Aumentar se necessário
```

---

## 📚 REFERÊNCIAS

- Arquivo Principal: `MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md`
- Supabase Docs: https://supabase.com/docs
- STRATEVO GitHub: https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS
- Lovable Docs: https://docs.lovable.dev/

---

## ✅ CHECKLIST FINAL

Antes de considerar a migração completa, verifique:

```
BANCO DE DADOS:
- [ ] Todas as 3 migrations executadas
- [ ] Tabelas criadas: tenants, tenant_users, leads, proposals, deals, activities
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies testadas e funcionando
- [ ] Functions SQL criadas: get_current_tenant_id(), has_tenant_role()

EDGE FUNCTIONS:
- [ ] _shared/tenant-context.ts criado
- [ ] crm-leads/index.ts criado e testado
- [ ] ai-lead-scoring/index.ts adaptado para multi-tenant
- [ ] Secrets configurados no Supabase
- [ ] config.toml atualizado

COMPONENTES REACT:
- [ ] TenantProvider implementado
- [ ] BusinessModelAdapter implementado
- [ ] DynamicForm implementado
- [ ] LeadPipeline adaptado e funcionando
- [ ] OnboardingTenant criado
- [ ] Componentes do Olinda migrados e adaptados

INTEGRAÇÃO:
- [ ] App.tsx atualizado com providers
- [ ] AdminSidebar atualizado com menu CRM
- [ ] Rotas /crm/* criadas
- [ ] Navegação entre STRATEVO e CRM funcionando

TESTES:
- [ ] 2 tenants de teste criados (modelos diferentes)
- [ ] Isolamento de dados verificado
- [ ] CRUD de leads testado em ambos os tenants
- [ ] Pipeline drag-and-drop funcionando
- [ ] Propostas sendo criadas corretamente
- [ ] Automações disparando

DEPLOY:
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Build passando sem erros
- [ ] Deploy em produção realizado
- [ ] Testes em produção realizados
```

---

## 🎯 RESULTADO ESPERADO

Ao final desta migração, você terá:

1. **STRATEVO Intelligence** (existente) + **CRM Multi-Tenant** (novo) funcionando na mesma aplicação
2. Cada empresa cadastrada terá seu CRM customizado baseado no modelo de negócio
3. Isolamento total de dados entre tenants
4. Navegação fluida entre as funcionalidades do STRATEVO e do CRM
5. Sistema escalável pronto para centenas/milhares de tenants

---

**BOA SORTE! 🚀**

Se encontrar dificuldades, consulte o arquivo `MIGRACAO_CRM_MULTI_TENANT_STRATEVO.md` para mais detalhes técnicos.
