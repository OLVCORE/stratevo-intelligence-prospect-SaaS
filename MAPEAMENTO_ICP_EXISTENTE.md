# 🗺️ MAPEAMENTO DO ICP EXISTENTE

**Data:** 2025-01-22  
**Objetivo:** Identificar onde e como o ICP é criado, armazenado e utilizado no sistema atual

---

## 📍 1. FLUXO DE CRIAÇÃO DO ICP

### 1.1 Onboarding do Tenant

**Rota:** `/tenant-onboarding`  
**Componente:** `src/pages/TenantOnboarding.tsx`  
**Wizard:** `src/components/onboarding/OnboardingWizard.tsx`

**Fluxo:**
1. Usuário acessa `/tenant-onboarding?tenant_id=XXX` ou `/tenant-onboarding?new=true`
2. Wizard de 6 etapas:
   - **Step 1:** Dados Básicos (CNPJ, Razão Social, Email, etc.)
   - **Step 2:** Setores e Nichos
   - **Step 3:** Perfil Cliente Ideal (ICP)
   - **Step 4:** Situação Atual
   - **Step 5:** Histórico e Enriquecimento
   - **Step 6:** Finalização

3. Ao finalizar, o sistema:
   - Cria o tenant em `public.tenants`
   - Cria vínculo usuário-tenant em `public.users`
   - Salva dados em `public.onboarding_sessions` (status: 'PENDING')
   - Opcionalmente: Gera ICP com IA via Edge Function `analyze-onboarding-icp`

**URLs de Produção:**
- Onboarding: `https://stratevo-intelligence-prospect-saa.vercel.app/tenant-onboarding?tenant_id=7677686a-b98a-4a7f-aa95-7fd633ce50c9`

---

### 1.2 Perfil do ICP

**Rota:** `/central-icp/profile/:id`  
**Componente:** `src/pages/CentralICP/ICPDetail.tsx`

**Fluxo:**
1. Usuário acessa `/central-icp/profile/:id`
2. Sistema busca ICP de `icp_profiles_metadata` pelo `id`
3. Exibe todos os dados do ICP em múltiplas abas

**URLs de Produção:**
- Perfil ICP: `https://stratevo-intelligence-prospect-saa.vercel.app/central-icp/profile/391276d2-8a59-4664-bd03-fd54a32bb701`

---

## 💾 2. ARMAZENAMENTO DE DADOS

### 2.1 Tabela Principal: `icp_profiles_metadata`

**Schema:** `public.icp_profiles_metadata`

**Campos Identificados:**
```sql
- id (UUID, PK)
- tenant_id (UUID, FK para tenants)
- nome (TEXT) - Nome do ICP
- descricao (TEXT)
- tipo (TEXT) - Tipo do ICP
- setor_foco (TEXT)
- nicho_foco (TEXT)
- icp_principal (BOOLEAN) - Indica se é o ICP principal
- ativo (BOOLEAN) - Indica se está ativo
- metadata (JSONB) - Dados completos do ICP
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Localização no Código:**
- Busca: `src/pages/CentralICP/ICPDetail.tsx` (linha 104)
- Criação: `src/components/onboarding/OnboardingWizard.tsx` (linha 1194)
- Listagem: `src/pages/CentralICP/ICPProfiles.tsx` (linha 30)
- Settings: `src/pages/SettingsPage.tsx` (linha 155)

---

### 2.2 Tabela de Sessões: `onboarding_sessions`

**Schema:** `public.onboarding_sessions`

**Campos Identificados:**
```sql
- id (UUID, PK)
- tenant_id (UUID, FK)
- step1_data (JSONB) - Dados do Step 1
- step2_data (JSONB) - Dados do Step 2
- step3_data (JSONB) - Dados do Step 3 (ICP)
- step4_data (JSONB) - Dados do Step 4
- step5_data (JSONB) - Dados do Step 5
- icp_recommendation (JSONB) - Recomendações de IA
- status (TEXT) - 'PENDING', 'COMPLETED', 'ANALYZED'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Localização no Código:**
- Salvamento: `src/components/onboarding/OnboardingWizard.tsx`
- Leitura: `src/pages/CentralICP/ICPDetail.tsx` (linha 53)

---

## 🔍 3. IDENTIFICAÇÃO DO ICP ATIVO

### 3.1 Como Identificar ICP Ativo

**Método 1: Campo `ativo`**
```typescript
const { data } = await supabase
  .from('icp_profiles_metadata')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('ativo', true)
  .maybeSingle();
```

**Método 2: Campo `icp_principal`**
```typescript
const { data } = await supabase
  .from('icp_profiles_metadata')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('icp_principal', true)
  .maybeSingle();
```

**Método 3: Último ICP Criado**
```typescript
const { data } = await supabase
  .from('icp_profiles_metadata')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

**Localização no Código:**
- `src/services/icpQualificationEngine.ts` (linha 233) - Busca ICPs do tenant
- `src/hooks/useTenantData.ts` (linha 117) - Hook `useTenantICPProfile()`

---

## ⚙️ 4. INTEGRAÇÃO COM MOTOR DE QUALIFICAÇÃO

### 4.1 ICP Qualification Engine

**Arquivo:** `src/services/icpQualificationEngine.ts`

**Como Funciona:**
1. Engine carrega ICPs de `icp_profiles_metadata` (linha 229-251)
2. Mapeia dados para interface `ICPProfile` (linha 31-156)
3. Usa ICPs para qualificar empresas (método `qualifyCompany`)
4. Calcula scores e match com cada ICP (método `calculateICPMatch`)

**Interface ICPProfile:**
```typescript
export interface ICPProfile {
  id: string;
  nome: string;
  tenant_id: string;
  target_cnaes?: string[];
  excluded_cnaes?: string[];
  target_capital_min?: number;
  target_capital_max?: number;
  target_porte?: string[];
  target_ufs?: string[];
  target_cidades?: string[];
  target_setores?: string[];
  target_nichos?: string[];
  // ... mais campos
}
```

**Problema Identificado:**
- ❌ Engine carrega TODOS os ICPs do tenant, não apenas o ativo
- ❌ Não há seleção explícita de qual ICP usar
- ❌ Não há indicação visual de qual ICP está sendo usado

---

## 📊 5. ESTRUTURA DE DADOS DO ICP

### 5.1 Campos do ICP (metadata JSONB)

Baseado no código existente, o ICP contém:

**Dados Básicos:**
- `nome` - Nome do ICP
- `descricao` - Descrição
- `setor_foco` - Setor principal
- `nicho_foco` - Nicho específico

**Dados de Qualificação:**
- `target_cnaes` - CNAEs alvo
- `excluded_cnaes` - CNAEs excluídos
- `target_capital_min/max` - Faixa de capital social
- `target_porte` - Portes aceitos
- `target_ufs` - Estados alvo
- `target_cidades` - Cidades alvo
- `target_setores` - Setores alvo
- `target_nichos` - Nichos alvo

**Dados de Persona:**
- `persona_decisor` - Perfil do decisor
- `dor_principal` - Dor principal
- `objeções` - Objeções comuns
- `desejos` - Desejos do cliente

**Dados de Stack e Maturidade:**
- `stack_tech` - Stack tecnológica
- `maturidade_digital` - Nível de maturidade
- `canal_preferido` - Canal de comunicação preferido

**Dados de Playbooks:**
- `playbooks_recomendados` - Playbooks sugeridos

---

## 🔗 6. CONEXÕES IDENTIFICADAS

### 6.1 Onboarding → ICP Profile
- ✅ Onboarding salva dados em `onboarding_sessions`
- ✅ Edge Function `analyze-onboarding-icp` processa dados
- ✅ ICP é criado em `icp_profiles_metadata`
- ⚠️ **GAP:** Não há indicação clara de qual ICP é o "ativo"

### 6.2 ICP Profile → Motor de Qualificação
- ✅ Engine lê de `icp_profiles_metadata`
- ✅ Usa todos os ICPs do tenant para qualificar
- ⚠️ **GAP:** Não há seleção explícita de qual ICP usar

### 6.3 Motor de Qualificação → Quarentena
- ✅ Empresas qualificadas vão para `icp_analysis_results`
- ✅ Quarentena exibe empresas com status 'quarantine'
- ⚠️ **GAP:** Não mostra qual ICP foi usado na qualificação

---

## ⚠️ 7. GAPS IDENTIFICADOS

### Gap 1: ICP Ativo Não É Explícito
- ❌ Não há campo único que identifique o ICP ativo
- ❌ Sistema pode usar múltiplos ICPs simultaneamente
- ❌ Usuário não sabe qual ICP está sendo usado

### Gap 2: ICP Não É Visível Antes do Upload
- ❌ Upload não mostra qual ICP será usado
- ❌ Usuário não vê o perfil do ICP antes de analisar

### Gap 3: ICP Não É Selecionável
- ❌ Upload não permite selecionar qual ICP usar
- ❌ Sistema usa todos os ICPs ou o último criado

### Gap 4: Motor Não Mostra Qual ICP Foi Usado
- ❌ Resultados de qualificação não indicam qual ICP gerou o score
- ❌ Usuário não sabe qual ICP foi usado para aprovar/descartar

---

## ✅ 8. CONCLUSÕES

### Entidade que Representa o ICP
- **Tabela:** `icp_profiles_metadata`
- **Campo de Identificação:** `id` (UUID)
- **Campo de Ativação:** `ativo` (BOOLEAN) ou `icp_principal` (BOOLEAN)

### Como Identificar ICP Ativo
- Buscar por `ativo = true` OU `icp_principal = true`
- Se múltiplos, usar o mais recente (`ORDER BY created_at DESC LIMIT 1`)

### Como ICP é Lido pelo Motor
- Motor lê TODOS os ICPs do tenant
- Calcula match com cada ICP
- Retorna o melhor match (maior score)

### O Que Precisa Ser Feito
1. ✅ **MC1:** Criar painel que EXIBA o ICP ativo (sem criar novo)
2. ✅ **MC2:** Permitir seleção de ICP antes do upload
3. ✅ **MC3:** Mostrar qual ICP foi usado nos resultados
4. ✅ **MC4:** Conectar visualmente ICP → Upload → Análise → Resultados

---

**Status:** ✅ **MAPEAMENTO COMPLETO - PRONTO PARA AJUSTE DO MC1**

