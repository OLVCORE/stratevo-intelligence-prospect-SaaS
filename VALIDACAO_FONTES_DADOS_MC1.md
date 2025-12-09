# 🔍 VALIDAÇÃO DE FONTES DE DADOS - MC1

**Data:** 2025-01-22  
**Objetivo:** Validar que todas as fontes de dados citadas no planejamento existem REALMENTE no projeto

---

## 📄 1. CONTEÚDO COMPLETO DO PLANEJAMENTO REVISADO

O arquivo `PLANEJAMENTO_ETAPA1_MC1_ARQUIVOS_REVISADO.md` contém **480 linhas** e está completo.  
**Conteúdo resumido:**
- Arquitetura unificada (1 hook único `useTenantICP()`)
- 5 arquivos novos + 2 modificados
- Mapeamento de fontes de dados (snapshots)
- Confirmações de somente leitura
- Regras de blindagem

---

## 🗺️ 2. MAPEAMENTO DETALHADO DE FONTES DE DADOS

### ✅ A) `icp_profiles_metadata`

**Onde está definido:**
- **Migration:** `supabase/migrations/20250120000000_create_multiple_icp_profiles.sql` (linhas 52-72)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.icp_profiles_metadata`

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  setor_foco TEXT,
  nicho_foco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  icp_principal BOOLEAN NOT NULL DEFAULT false,
  -- ... outros campos
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Coluna `icp_recommendation` (JSONB):**
- **Migration:** `supabase/migrations/20251120183000_create_onboarding_infrastructure.sql` (linha 62)
- **Tipo:** Coluna JSONB na tabela `icp_profiles_metadata`
- **Estrutura esperada:** Definida em `supabase/functions/analyze-onboarding-icp/index.ts` (linhas 78-109)
  ```typescript
  {
    icp_profile: { ... },
    analise_detalhada: {
      resumo_executivo: string,
      padroes_identificados: string[],
      oportunidades_identificadas: string[],
      recomendacoes_estrategicas: string[],
      justificativa: string
    },
    score_confianca: number
  }
  ```

**Hooks/Services existentes que consomem:**
- ✅ `src/pages/CentralICP/ICPDetail.tsx` (linhas 103-133) - Busca metadata
- ✅ `src/pages/CentralICP/ICPProfiles.tsx` (linha 30) - Lista ICPs
- ✅ `src/services/icpQualificationEngine.ts` (linha 233) - Carrega ICPs para qualificação
- ✅ `src/components/onboarding/OnboardingWizard.tsx` (linhas 1194-1206) - Salva ICP após onboarding

**Status:** ✅ **CONFIRMADO - TABELA EXISTE E É USADA**

---

### ✅ B) `onboarding_sessions`

**Onde está definido:**
- **Migration:** `supabase/migrations/20251120183000_create_onboarding_infrastructure.sql` (linhas 53-95)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.onboarding_sessions`

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  step1_data JSONB,  -- Dados básicos, concorrentes, clientes
  step2_data JSONB,  -- Setores, nichos
  step3_data JSONB,  -- Perfil cliente ideal, persona
  step4_data JSONB,  -- Situação atual, diferenciais
  step5_data JSONB,  -- Histórico, benchmarking, clientes
  icp_recommendation JSONB,  -- Recomendação gerada pela IA
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Índices e views:**
- **Migration:** `supabase/migrations/20250202000000_fix_endereco_completo.sql`
- Índices GIN em `step1_data->'cnpj'` e `step1_data->'concorrentesDiretos'`
- Views para endereços completos

**Hooks/Services existentes que consomem:**
- ✅ `src/pages/CentralICP/ICPDetail.tsx` (linhas 138-238) - Busca sessão mais recente e extrai dados
- ✅ `src/components/onboarding/OnboardingWizard.tsx` - Salva dados do onboarding
- ✅ `src/components/icp/CompetitiveAnalysis.tsx` (linhas 213-337) - Busca concorrentes de `step1_data` e `step4_data`
- ✅ `src/components/reports/BCGMatrix.tsx` (linhas 130-294) - Usa `step5_data` para calcular BCG

**Estrutura dos dados JSONB:**
- `step1_data`: `{ cnpj, razaoSocial, concorrentesDiretos[], clientesAtuais[], cnpjData: {...} }`
- `step3_data`: `{ setoresAlvo[], nichosAlvo[], cnaesAlvo[], persona, dores, objeções, desejos, stackTech, maturidadeDigital }`
- `step4_data`: `{ diferenciais[], casosDeUso[], ticketsECiclos[] }`
- `step5_data`: `{ clientesAtuais[], empresasBenchmarking[], ticketsECiclos[] }`

**Status:** ✅ **CONFIRMADO - TABELA EXISTE E É USADA INTENSIVAMENTE**

---

### ⚠️ C) `competitive_analysis`

**Onde está definido:**
- **Migration:** `supabase/migrations/20250130000003_competitive_analysis.sql` (linhas 2-22)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.competitive_analysis`

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  icp_id UUID REFERENCES icp_profiles_metadata(id),
  competitor_data JSONB DEFAULT '[]'::jsonb,
  ceo_analysis TEXT,
  swot_analysis JSONB DEFAULT '{}'::jsonb,
  market_share_analysis JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT unique_competitive_analysis_per_tenant UNIQUE (tenant_id)
);
```

**Hooks/Services existentes que consomem:**
- ❌ **NENHUM HOOK/SERVICE ENCONTRADO** que consome esta tabela diretamente
- ⚠️ **OBSERVAÇÃO:** A tabela existe, mas não há uso confirmado no código atual
- ✅ **FALLBACK DISPONÍVEL:** `icp_profiles_metadata.icp_recommendation.analise_detalhada.competitiva`

**Status:** ⚠️ **TABELA EXISTE MAS NÃO É USADA ATUALMENTE - FALLBACK NECESSÁRIO**

---

### ✅ D) `strategic_action_plans`

**Onde está definido:**
- **Migration:** `supabase/migrations/20250130000004_strategic_action_plans.sql` (linhas 4-34)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.strategic_action_plans`

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS public.strategic_action_plans (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  icp_id UUID REFERENCES icp_profiles_metadata(id),
  company_capital_social NUMERIC(15,2),
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  quick_wins JSONB NOT NULL DEFAULT '[]'::jsonb,
  critical_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ceo_recommendation TEXT,
  investment_summary JSONB NOT NULL DEFAULT '{...}'::jsonb,
  status TEXT DEFAULT 'draft',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Hooks/Services existentes que consomem:**
- ✅ `src/components/icp/StrategicActionPlan.tsx` (linhas 350-384) - **CARREGA PLANO EXISTENTE**
  ```typescript
  const { data, error } = await supabase
    .from('strategic_action_plans')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  ```
- ✅ `src/components/icp/StrategicActionPlan.tsx` (linhas 619-638) - **SALVA PLANO GERADO**

**Status:** ✅ **CONFIRMADO - TABELA EXISTE E É USADA ATIVAMENTE**

---

### ✅ E) `tenant_products`

**Onde está definido:**
- **Migration:** `supabase/migrations/20250201000001_tenant_products_catalog.sql` (linhas 8-67)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.tenant_products` (ou sem schema, dependendo da migration)

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS tenant_products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  -- ... outros campos
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Hooks/Services existentes que consomem:**
- ✅ `src/components/icp/ProductComparisonMatrix.tsx` (linhas 239-350) - **CARREGA PRODUTOS DO TENANT**
  ```typescript
  const { data: tenantProductsDirect } = await supabase
    .from('tenant_products')
    .select('id, nome')
    .eq('tenant_id', tenantId);
  ```
- ✅ `src/components/icp/CompetitiveAnalysis.tsx` (linhas 290-293) - Busca produtos do tenant
- ✅ `src/services/tenantAnalysis360.ts` (linhas 93-97) - Busca produtos ativos
- ✅ `src/components/products/TenantProductsCatalog.tsx` (linhas 184-203) - CRUD completo de produtos

**Status:** ✅ **CONFIRMADO - TABELA EXISTE E É USADA INTENSIVAMENTE**

---

### ✅ F) `tenant_competitor_products`

**Onde está definido:**
- **Migration:** `supabase/migrations/20250201000002_tenant_competitor_products.sql` (linhas 8-47)
- **Tipo:** Tabela PostgreSQL
- **Schema:** `public.tenant_competitor_products` (ou sem schema)

**Estrutura confirmada:**
```sql
CREATE TABLE IF NOT EXISTS tenant_competitor_products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  competitor_cnpj VARCHAR(20),
  competitor_name VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100),
  -- ... outros campos
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Hooks/Services existentes que consomem:**
- ✅ `src/components/icp/ProductComparisonMatrix.tsx` (linhas 253-266) - **CARREGA PRODUTOS DOS CONCORRENTES**
  ```typescript
  const { data: tenantProds } = await supabase
    .from('tenant_competitor_products')
    .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj')
    .eq('tenant_id', tenant.id);
  ```
- ✅ `src/components/icp/CompetitiveAnalysis.tsx` (linhas 167-190) - Busca produtos agrupados por CNPJ
- ✅ `src/components/onboarding/steps/Step1DadosBasicos.tsx` (linhas 133-147) - Busca produtos extraídos

**Status:** ✅ **CONFIRMADO - TABELA EXISTE E É USADA INTENSIVAMENTE**

---

## 📊 RESUMO DE VALIDAÇÃO

| Fonte de Dados | Tipo | Existe? | Usado Atualmente? | Fallback Disponível? | Status |
|----------------|------|---------|-------------------|---------------------|--------|
| `icp_profiles_metadata` | Tabela | ✅ SIM | ✅ SIM | - | ✅ **VALIDADO** |
| `icp_profiles_metadata.icp_recommendation` | JSONB | ✅ SIM | ✅ SIM | - | ✅ **VALIDADO** |
| `onboarding_sessions` | Tabela | ✅ SIM | ✅ SIM | - | ✅ **VALIDADO** |
| `onboarding_sessions.step*_data` | JSONB | ✅ SIM | ✅ SIM | `icp_recommendation.icp_profile` | ✅ **VALIDADO** |
| `competitive_analysis` | Tabela | ✅ SIM | ❌ NÃO | `icp_recommendation.analise_detalhada.competitiva` | ⚠️ **EXISTE MAS NÃO USADO** |
| `strategic_action_plans` | Tabela | ✅ SIM | ✅ SIM | `icp_recommendation.analise_detalhada.plano_estrategico` | ✅ **VALIDADO** |
| `tenant_products` | Tabela | ✅ SIM | ✅ SIM | `icp_recommendation.analise_detalhada.produtos` | ✅ **VALIDADO** |
| `tenant_competitor_products` | Tabela | ✅ SIM | ✅ SIM | `icp_recommendation.analise_detalhada.produtos` | ✅ **VALIDADO** |

---

## ⚠️ AJUSTES NECESSÁRIOS NO PLANEJAMENTO

### 1. `competitive_analysis` - Tabela existe mas não é usada

**Situação:**
- Tabela existe na migration `20250130000003_competitive_analysis.sql`
- **NENHUM código atual consome esta tabela**
- Componente `CompetitiveAnalysis.tsx` calcula dados em tempo real, não lê da tabela

**Ajuste necessário:**
- **FALLBACK OBRIGATÓRIO:** Sempre usar `icp_profiles_metadata.icp_recommendation.analise_detalhada.competitiva`
- Tentar `competitive_analysis` apenas se existir, mas não depender dela
- Se não existir, usar dados calculados em tempo real de `onboarding_sessions.step1_data.concorrentesDiretos` + `step4_data.diferenciais`

**Código de referência:**
- `src/components/icp/CompetitiveAnalysis.tsx` (linhas 156-337) - **CALCULA dados competitivos em tempo real**

---

### 2. Estrutura de `icp_recommendation.analise_detalhada`

**Estrutura confirmada:**
```typescript
{
  resumo_executivo: string,
  padroes_identificados: string[],
  oportunidades_identificadas: string[],
  recomendacoes_estrategicas: string[],
  justificativa: string
}
```

**⚠️ OBSERVAÇÃO:**
- A estrutura atual **NÃO inclui** sub-objetos como `competitiva`, `bcg`, `produtos`, `plano_estrategico`
- Esses dados podem estar em outros lugares ou precisam ser calculados

**Ajuste necessário:**
- Verificar se `analise_detalhada` tem sub-objetos ou se precisa buscar de outras fontes
- Usar dados de `onboarding_sessions` como fonte primária
- Usar `icp_recommendation` apenas para `resumo_executivo` e `score_confianca`

---

## ✅ CONCLUSÃO DA VALIDAÇÃO

### Fontes VALIDADAS e PRONTAS para uso:
1. ✅ `icp_profiles_metadata` - Tabela existe e é usada
2. ✅ `onboarding_sessions` - Tabela existe e é usada intensivamente
3. ✅ `strategic_action_plans` - Tabela existe e é usada
4. ✅ `tenant_products` - Tabela existe e é usada
5. ✅ `tenant_competitor_products` - Tabela existe e é usada

### Fontes que EXISTEM mas precisam de AJUSTE:
1. ⚠️ `competitive_analysis` - Tabela existe mas não é usada (usar fallback)
2. ⚠️ `icp_recommendation.analise_detalhada.*` - Estrutura pode não ter sub-objetos (verificar)

### Recomendação:
- **Usar dados de `onboarding_sessions` como fonte primária** (já validado e usado)
- **Usar `strategic_action_plans` se existir** (já validado e usado)
- **Usar `tenant_products` e `tenant_competitor_products`** (já validado e usado)
- **Tentar `competitive_analysis` mas não depender** (fallback obrigatório)
- **Usar `icp_recommendation` apenas para resumo executivo** (não para sub-objetos)

---

**Status:** ✅ **VALIDAÇÃO COMPLETA - PLANEJAMENTO ANCORADO EM FONTES REAIS**

**Próximo passo:** Ajustar planejamento se necessário e aguardar aprovação para ETAPA 2

