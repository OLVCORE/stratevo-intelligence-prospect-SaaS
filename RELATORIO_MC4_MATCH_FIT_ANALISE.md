# 📋 RELATÓRIO MC4 – ANÁLISE DE ESTRUTURAS (Match & Fit Engine)

**Data:** $(date)  
**Microciclo:** MC4 - Análise prévia (Tarefa 1)  
**Status:** ✅ **CONCLUÍDO**

---

## 🎯 OBJETIVO

Mapear estruturas existentes para entender onde encaixar o Match & Fit Engine do STRATEVO One.

---

## 📊 ESTRUTURAS MAPEADAS

### 1. **Lead B2B Consolidado**

**Localização:** `src/utils/stratevoLeadExtractor.ts`

**Interface:** `LeadB2B`

```typescript
export interface LeadB2B {
  // Dados da Empresa
  companyName: string | null;
  companyLegalName: string | null;
  cnpj: string | null;
  cnae: string | null;
  companySize: string | null;
  capitalSocial: number | null;
  companyWebsite: string | null;
  companyRegion: string | null;
  companySector: string | null;

  // Dados do Contato
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactLinkedIn: string | null;

  // Contexto de Interesse
  totvsProducts: string[];
  olvSolutions: string[];
  interestArea: string | null;
  urgency: string | null;
  budget: string | null;
  timeline: string | null;

  // Metadados
  conversationSummary?: string;
  source?: string;
}
```

**Uso atual:**
- Extraído por `extractLeadDataB2B()` (local) e merge com dados da IA
- Armazenado em `leads.business_data` (JSONB) na tabela `leads`
- Usado em hooks `useVoiceLeadCapture` e `useTextLeadCapture`

**Campos relevantes para Match & Fit:**
- `companySector`, `cnae`, `companySize`, `capitalSocial` → Fit com ICP
- `interestArea`, `urgency`, `budget`, `timeline` → Fit com produtos
- `totvsProducts`, `olvSolutions` → Menções a soluções (MC3: baseado no portfólio do tenant)

---

### 2. **ICP (Ideal Customer Profile)**

**Localização:** `src/hooks/useTenantICP.ts`

**Interface:** `TenantICPModel`

```typescript
export interface TenantICPModel {
  profile: {
    id: string;
    nome: string;
    descricao: string | null;
    tipo: string;
    setor_foco: string | null;
    nicho_foco: string | null;
    ativo: boolean;
    icp_principal: boolean;
  } | null;
  
  persona: {
    decisor: string | null;
    dor_principal: string | null;
    objeções: string[];
    desejos: string[];
    stack_tech: string | null;
    maturidade_digital: string | null;
    canal_preferido: string | null;
    pitch: string | null;
    playbooks: string[];
  } | null;
  
  criteria: {
    setores_alvo: string[];
    cnaes_alvo: string[];
    porte: string[];
    regioes_alvo: string[];
    faturamento_min: number | null;
    faturamento_max: number | null;
    funcionarios_min: number | null;
    funcionarios_max: number | null;
  } | null;
  
  // ... outros campos (competitiveMatrix, bcgMatrix, etc.)
}
```

**Fonte de dados:**
- Tabela `icp_profiles_metadata` (pública, multi-tenant)
- Tabela `onboarding_sessions` (dados de persona e critérios)
- Tabelas de snapshot (competitive_analysis, strategic_action_plans)

**Campos relevantes para Match & Fit:**
- `criteria` → Critérios de qualificação (setores, CNAEs, porte, região, faturamento, funcionários)
- `persona.dor_principal` → Dores que produtos podem resolver
- `persona.desejos` → Oportunidades de produtos

---

### 3. **Portfólio do Tenant**

**Localização:** `src/components/products/TenantProductsCatalog.tsx`

**Interface:** `TenantProduct`

```typescript
interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  subcategoria?: string;
  codigo_interno?: string;
  preco_minimo?: number;
  preco_maximo?: number;
  ticket_medio?: number;
  
  // Critérios de qualificação (para matching)
  cnaes_alvo?: string[];
  setores_alvo?: string[];
  portes_alvo?: string[];
  capital_social_minimo?: number;
  capital_social_maximo?: number;
  regioes_alvo?: string[];
  
  // Diferenciais e argumentos de venda
  diferenciais?: string[];
  casos_uso?: string[];
  dores_resolvidas?: string[];
  beneficios?: string[];
  concorrentes_diretos?: string[];
  vantagens_competitivas?: string[];
  
  ativo: boolean;
  destaque: boolean;
}
```

**Fonte de dados:**
- Tabela `tenant_products` (pública, multi-tenant, isolada por `tenant_id`)

**Campos relevantes para Match & Fit:**
- `cnaes_alvo`, `setores_alvo`, `portes_alvo` → Fit com empresa do lead
- `dores_resolvidas` → Match com dores do ICP/persona
- `casos_uso` → Match com contexto do lead
- `beneficios` → Argumentos para business case

---

## 🔄 FLUXO ATUAL DE GERAÇÃO DE RELATÓRIOS

### Edge Function: `generate-icp-report`

**Localização:** `supabase/functions/generate-icp-report/index.ts`

**Fluxo:**
1. Recebe `tenant_id` e `report_type`
2. Busca dados do tenant (onboarding, ICP, produtos)
3. Monta prompt com dados do tenant
4. Chama OpenAI com system prompt STRATEVO One (MC3: neutro)
5. Retorna relatório estruturado

**Ponto de integração MC4:**
- Após buscar dados do tenant e antes de chamar OpenAI
- Pode passar resultado do Match & Fit para enriquecer o prompt

### Edge Function: `generate-company-report`

**Localização:** `supabase/functions/generate-company-report/index.ts`

**Fluxo:**
1. Recebe `company_id` e `run_id`
2. Busca dados da empresa (enrichments, metrics, maturity)
3. Gera insights com IA
4. Compila relatório completo

**Ponto de integração MC4:**
- Quando há lead associado à empresa
- Pode calcular Match & Fit do lead com ICP + portfólio
- Incorporar recomendações no relatório

---

## 🎯 PONTO DE ENCAIXE DO ENGINE MC4

### Opção 1: Edge Function (Recomendado)

**Vantagens:**
- ✅ Acesso direto ao banco (tenant_products, icp_profiles_metadata)
- ✅ Pode ser chamado tanto de `generate-icp-report` quanto de `generate-company-report`
- ✅ Isolamento por tenant garantido
- ✅ Não impacta frontend

**Implementação:**
- Criar `src/services/matchFitEngine.ts` (lógica pura)
- Importar nas edge functions quando necessário
- Montar `MatchFitInput` com dados do banco
- Incorporar `MatchFitResult` no relatório

### Opção 2: Service no Frontend

**Desvantagens:**
- ❌ Requer múltiplas queries ao Supabase
- ❌ Lógica de negócio no frontend
- ❌ Pode impactar performance

**Não recomendado para MC4.**

---

## 📝 TIPOS/INTERFACES RELEVANTES

### Lead B2B
- **Fonte:** `LeadB2B` de `stratevoLeadExtractor.ts`
- **Uso:** Dados consolidados do lead (empresa + contato + interesse)

### ICP
- **Fonte:** `TenantICPModel` de `useTenantICP.ts`
- **Uso:** Critérios de qualificação e persona (dores, desejos)

### Portfólio
- **Fonte:** `TenantProduct` de `TenantProductsCatalog.tsx`
- **Uso:** Produtos/soluções do tenant com critérios de fit

---

## 🔌 INTEGRAÇÃO COM RELATÓRIOS

### Como incorporar Match & Fit no relatório STRATEVO One:

1. **Na edge function:**
   ```typescript
   // Buscar lead (se houver)
   const lead = await getLeadFromCompany(company_id);
   
   // Buscar ICP e portfólio
   const icp = await getTenantICP(tenant_id);
   const portfolio = await getTenantProducts(tenant_id);
   
   // Calcular Match & Fit
   const matchFitResult = runMatchFitEngine({
     lead: lead?.business_data,
     icp: icp,
     portfolio: portfolio
   });
   
   // Incorporar no prompt ou no relatório
   ```

2. **No relatório:**
   - Seção "Match & Fit STRATEVO One"
   - Scores de fit por ICP / produto
   - Recomendações priorizadas
   - Narrativa consultiva
   - Business case simplificado

---

## ✅ CONCLUSÃO

**Estruturas mapeadas:**
- ✅ Lead B2B: `LeadB2B` de `stratevoLeadExtractor.ts`
- ✅ ICP: `TenantICPModel` de `useTenantICP.ts`
- ✅ Portfólio: `TenantProduct` de `TenantProductsCatalog.tsx`

**Ponto de encaixe:**
- ✅ Edge functions (`generate-icp-report`, `generate-company-report`)
- ✅ Service `src/services/matchFitEngine.ts` (lógica pura)

**Próximos passos:**
- Criar `matchFitEngine.ts` com tipos e funções
- Integrar nas edge functions
- Testar com dados reais

---

**Status:** ✅ **ANÁLISE CONCLUÍDA - PRONTO PARA IMPLEMENTAÇÃO**

