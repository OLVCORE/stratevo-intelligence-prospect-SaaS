# ✅ RESUMO: PRÓXIMOS PASSOS PÓS-MIGRAÇÃO

## 🎯 STATUS ATUAL

✅ **Banco de Dados:**
- 36 tabelas criadas
- Função `get_user_tenant()` existe
- Coluna `tenant_id` existe em `companies`
- RLS policies ativas

✅ **Código:**
- `TenantContext` existe e funciona
- Hook `useTenant()` disponível
- Alguns hooks já adaptados (`useTenantData.ts`)

❌ **Pendente:**
- Adaptar INSERTs de empresas para incluir `tenant_id`

---

## 🚀 AÇÃO IMEDIATA: Adaptar 4 Arquivos Críticos

### 1️⃣ `src/hooks/useCompanies.ts` (PRIORIDADE MÁXIMA)

**Arquivo:** `src/hooks/useCompanies.ts`  
**Linha:** 99-117  
**Função:** `useCreateCompany()`

**Mudança necessária:**
```typescript
// ADICIONAR import no topo:
import { useTenant } from '@/contexts/TenantContext';

// DENTRO da função useCreateCompany(), ADICIONAR:
const { tenant } = useTenant();

// ADAPTAR o insert (linha 104-108):
const { data, error } = await supabase
  .from('companies')
  .insert([{
    ...company,
    tenant_id: tenant?.id, // ✅ ADICIONAR ESTA LINHA
  }])
  .select()
  .single();
```

---

### 2️⃣ `src/lib/db/companies.ts`

**Arquivo:** `src/lib/db/companies.ts`  
**Linha:** 93-109  
**Função:** `upsert()`

**Problema:** Esta função não tem acesso ao contexto React (é uma função pura).

**Solução:** Adicionar `tenant_id` como parâmetro obrigatório OU obter via RPC.

**Opção A (Recomendada):** Exigir `tenant_id` no parâmetro
```typescript
async upsert(company: Inserts<'companies'> & { tenant_id: string }): Promise<Company | null> {
  // ... código existente ...
  // tenant_id já vem no company
}
```

**Opção B:** Obter via RPC (mais lento)
```typescript
async upsert(company: Inserts<'companies'>): Promise<Company | null> {
  // Obter tenant_id via RPC
  const { data: tenantId } = await supabase.rpc('get_user_tenant');
  
  const companyWithTenant = {
    ...company,
    tenant_id: company.tenant_id || tenantId,
  };

  const { data, error } = await supabase
    .from('companies')
    .upsert(companyWithTenant, { onConflict: 'cnpj' })
    // ... resto do código
}
```

---

### 3️⃣ `src/components/sdr/DealFormDialog.tsx`

**Arquivo:** `src/components/sdr/DealFormDialog.tsx`  
**Linha:** 318-322

**Mudança necessária:**
```typescript
// ADICIONAR no topo do componente (junto com outros imports):
import { useTenant } from '@/contexts/TenantContext';

// DENTRO do componente, ADICIONAR:
const { tenant } = useTenant();

// ADAPTAR o insert (linha 318-322):
const { data: created, error: insertErr } = await supabase
  .from('companies')
  .insert({
    ...companyData,
    tenant_id: tenant?.id, // ✅ ADICIONAR
  })
  .select('id, company_name, cnpj, employees, industry, revenue, lead_score, location')
  .single();
```

---

### 4️⃣ `src/hooks/useCompanyDiscovery.ts`

**Arquivo:** `src/hooks/useCompanyDiscovery.ts`  
**Linha:** 139-153  
**Função:** `useAddCompaniesToBank()`

**Mudança necessária:**
```typescript
// ADICIONAR import no topo:
import { useTenant } from '@/contexts/TenantContext';

// DENTRO da função useAddCompaniesToBank(), ADICIONAR:
const { tenant } = useTenant();

// ADAPTAR o insert (linha 139-153):
const { data: newCompany, error: insertError } = await supabase
  .from('companies')
  .insert([{
    name: suggested.company_name,
    cnpj: suggested.cnpj,
    domain: suggested.domain,
    state: suggested.state,
    city: suggested.city,
    sector_code: suggested.sector_code,
    niche_code: suggested.niche_code,
    apollo_data: suggested.apollo_data,
    raw_data: suggested.receita_ws_data,
    tenant_id: tenant?.id, // ✅ ADICIONAR
  }])
  .select()
  .single();
```

---

## 📋 CHECKLIST RÁPIDO

### Antes de Testar:
- [ ] Adaptei `src/hooks/useCompanies.ts`
- [ ] Adaptei `src/lib/db/companies.ts`
- [ ] Adaptei `src/components/sdr/DealFormDialog.tsx`
- [ ] Adaptei `src/hooks/useCompanyDiscovery.ts`
- [ ] Verifiquei outros arquivos com INSERTs (BulkUploadDialog, ApolloReviewDialog, etc.)

### Testes:
- [ ] Testei criação de empresa via formulário
- [ ] Testei criação de empresa via DealFormDialog
- [ ] Testei adicionar empresas sugeridas ao banco
- [ ] Verifiquei que empresas são criadas com `tenant_id` correto
- [ ] Verifiquei isolamento (Tenant A não vê empresas do Tenant B)

### Validação SQL:
```sql
-- Verificar empresas criadas com tenant_id
SELECT id, name, tenant_id, created_at
FROM public.companies
ORDER BY created_at DESC
LIMIT 5;

-- Verificar se há empresas sem tenant_id
SELECT COUNT(*) as empresas_sem_tenant
FROM public.companies
WHERE tenant_id IS NULL;
```

---

## 🆘 SE DER ERRO

### Erro: "tenant is undefined"
**Causa:** Componente não está dentro de `<TenantProvider>`

**Solução:** Verificar se `App.tsx` tem:
```typescript
<TenantProvider>
  {/* seus componentes */}
</TenantProvider>
```

### Erro: "null value in column 'tenant_id' violates not-null constraint"
**Causa:** INSERT sem `tenant_id`

**Solução:** Adicionar `tenant_id` no INSERT (veja exemplos acima)

### Erro: "permission denied for table companies"
**Causa:** RLS bloqueando acesso

**Solução:** Verificar:
1. Usuário está autenticado?
2. `get_user_tenant()` retorna valor?
3. Empresa tem `tenant_id` correto?

**Debug SQL:**
```sql
SELECT get_user_tenant();
SELECT * FROM public.users WHERE auth_user_id = auth.uid();
```

---

## 📚 DOCUMENTAÇÃO CRIADA

1. ✅ `PROXIMOS_PASSOS_POS_MIGRACAO.md` - Guia completo
2. ✅ `ADAPTAR_CODIGO_MULTI_TENANT.md` - Guia de adaptação
3. ✅ `ARQUIVOS_PARA_ADAPTAR_TENANT_ID.md` - Lista detalhada de arquivos
4. ✅ `RESUMO_PROXIMOS_PASSOS.md` - Este arquivo (resumo rápido)

---

## 🎯 PRÓXIMO PASSO AGORA

**Comece adaptando:** `src/hooks/useCompanies.ts`

Este é o arquivo mais usado e resolverá a maioria dos problemas de uma vez.

**Depois:** Teste criar uma empresa e verifique no Supabase SQL Editor se `tenant_id` foi preenchido corretamente.

---

**Última atualização:** 2025-01-19  
**Status:** ✅ Banco migrado | ⚠️ Código precisa adaptação

