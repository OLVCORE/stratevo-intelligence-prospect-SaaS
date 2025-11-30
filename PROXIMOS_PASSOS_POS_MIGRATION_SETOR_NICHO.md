# 🎯 PRÓXIMOS PASSOS - Após Migration Setor/Nicho

## ✅ Migration Executada com Sucesso!

A migration `20250119000001_add_sector_niche_classification.sql` foi aplicada com sucesso.

---

## 📋 CHECKLIST DE VALIDAÇÃO

### 1. ✅ Validar Migration
Execute o script de validação:
```sql
-- Execute: VALIDAR_MIGRATION_SETOR_NICHO.sql
```

**Resultados esperados:**
- ✅ 7 colunas em `companies` (sector_code, sector_name, niche_code, niche_name, icp_match_score, icp_match_tier, icp_match_reasons)
- ✅ 17 colunas em `tenants` (icp_sectors, icp_niches, icp_cnaes, + dados administrativos)
- ✅ 2 constraints CHECK
- ✅ 10+ índices
- ✅ 3 funções SQL
- ✅ 1 trigger

---

## 🚀 PRÓXIMOS PASSOS

### 2. Verificar Tabelas `sectors` e `niches`
**CRÍTICO:** As funções SQL dependem dessas tabelas existirem!

```sql
-- Verificar se existem
SELECT COUNT(*) FROM public.sectors;
SELECT COUNT(*) FROM public.niches;

-- Se não existirem, criar estrutura básica
CREATE TABLE IF NOT EXISTS public.sectors (
  sector_code VARCHAR(50) PRIMARY KEY,
  sector_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.niches (
  niche_code VARCHAR(50) PRIMARY KEY,
  niche_name VARCHAR(100) NOT NULL,
  sector_code VARCHAR(50) REFERENCES public.sectors(sector_code),
  cnaes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. Integrar Badges na Listagem de Empresas

**Arquivo:** `src/pages/CompaniesManagementPage.tsx` (ou similar)

```typescript
import { CompanySectorNicheBadges } from '@/components/companies/CompanySectorNicheBadges';

// No componente de listagem, adicionar:
<CompanySectorNicheBadges
  sectorCode={company.sector_code}
  sectorName={company.sector_name}
  nicheCode={company.niche_code}
  nicheName={company.niche_name}
  icpMatchScore={company.icp_match_score}
  icpMatchTier={company.icp_match_tier}
/>
```

---

### 4. Classificar Empresas Automaticamente ao Criar

**Arquivo:** `src/hooks/useCompanies.ts`

```typescript
import { useClassifyCompany } from '@/hooks/useCompanyICPClassification';

// No hook useCreateCompany, após inserir:
const classifyMutation = useClassifyCompany();
await classifyMutation.mutateAsync(newCompany.id);
```

**OU** usar o trigger SQL que já classifica automaticamente (já implementado).

---

### 5. Calcular ICP Match ao Adicionar Empresa

**Arquivo:** `src/lib/db/companies.ts` ou `src/hooks/useCompanies.ts`

```typescript
// Após criar empresa, calcular match com ICP do tenant
const { data: tenant } = await supabase
  .from('tenants')
  .select('id, icp_sectors, icp_niches, icp_cnaes')
  .eq('id', tenantId)
  .single();

if (tenant && (tenant.icp_sectors?.length > 0 || tenant.icp_niches?.length > 0)) {
  const { data: matchScore } = await supabase.rpc('calculate_icp_match_score', {
    p_company_id: companyId,
    p_tenant_id: tenant.id,
  });

  // Atualizar empresa com score
  await supabase
    .from('companies')
    .update({
      icp_match_score: matchScore,
      icp_match_tier: matchScore >= 80 ? 'excellent' : 
                      matchScore >= 60 ? 'premium' :
                      matchScore >= 40 ? 'qualified' :
                      matchScore >= 20 ? 'potential' : 'low',
    })
    .eq('id', companyId);
}
```

---

### 6. Testar Fluxo Completo

#### 6.1. Testar Onboarding
1. Criar novo tenant via onboarding
2. Preencher CNPJ e buscar dados automaticamente
3. Selecionar setores/nichos no Step 2
4. Verificar se ICP foi salvo no tenant

#### 6.2. Testar Classificação de Empresa
1. Adicionar empresa com CNPJ
2. Verificar se foi classificada automaticamente (trigger)
3. Verificar se `sector_code`, `niche_code` foram preenchidos

#### 6.3. Testar ICP Match
1. Adicionar empresa que corresponde ao ICP do tenant
2. Verificar se `icp_match_score` foi calculado
3. Verificar se `icp_match_tier` foi definido

#### 6.4. Testar Badges
1. Visualizar listagem de empresas
2. Verificar se badges aparecem corretamente
3. Verificar cores e ícones

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### Verificar se Trigger Está Funcionando
```sql
-- Inserir empresa de teste
INSERT INTO public.companies (cnpj, company_name, raw_data, tenant_id)
VALUES (
  '12345678000190',
  'Empresa Teste',
  '{"receita": {"atividade_principal": [{"code": "6201-5", "text": "Desenvolvimento de programas de computador"}]}}'::jsonb,
  '00000000-0000-0000-0000-000000000000'::uuid
);

-- Verificar se foi classificada
SELECT sector_code, sector_name, niche_code, niche_name
FROM public.companies
WHERE cnpj = '12345678000190';
```

### Verificar Função de Match
```sql
-- Calcular match de uma empresa com um tenant
SELECT public.calculate_icp_match_score(
  'ID_DA_EMPRESA'::uuid,
  'ID_DO_TENANT'::uuid
);
```

---

## 📝 NOTAS IMPORTANTES

1. **Tabelas `sectors` e `niches`:** Se não existirem, criar estrutura básica antes de usar as funções SQL.

2. **Trigger Automático:** O trigger `trigger_auto_classify_company` já classifica empresas automaticamente ao criar/atualizar. Verifique se está funcionando.

3. **ICP Match:** O cálculo de match só funciona se o tenant tiver ICP configurado (setores/nichos que busca).

4. **Performance:** Os índices foram criados para otimizar consultas por setor/nicho e ICP match.

---

## ✅ STATUS ATUAL

- ✅ Migration aplicada
- ⏳ Aguardando validação
- ⏳ Aguardando integração de badges
- ⏳ Aguardando testes

---

**Última atualização:** 2025-01-19

