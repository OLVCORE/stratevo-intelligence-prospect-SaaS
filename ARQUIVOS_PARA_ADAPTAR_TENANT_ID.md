# 📝 ARQUIVOS QUE PRECISAM ADICIONAR tenant_id

## ✅ STATUS: Arquivos Encontrados e Linhas Específicas

---

## 🔴 PRIORIDADE ALTA (INSERTs Diretos)

### 1. `src/lib/db/companies.ts`
**Linha:** 93-109  
**Função:** `upsert()`  
**Status:** ❌ Falta `tenant_id`

```typescript
// ATUAL (linha 93-109)
async upsert(company: Inserts<'companies'>): Promise<Company | null> {
  dbLogger.log('upsert', 'companies', { name: company.name });

  const { data, error } = await supabase
    .from('companies')
    .upsert(company, { onConflict: 'cnpj' })
    .select()
    .single();

  if (error) {
    dbLogger.error('upsert', 'companies', error);
    return null;
  }

  dbLogger.log('upsert SUCCESS', 'companies', { id: data.id });
  return data;
}
```

**✅ ADAPTAR PARA:**
```typescript
async upsert(company: Inserts<'companies'>): Promise<Company | null> {
  dbLogger.log('upsert', 'companies', { name: company.name });

  // ✅ OBTER tenant_id do contexto ou parâmetro
  // Opção 1: Se company já vem com tenant_id, usar
  // Opção 2: Obter do contexto (requer refatoração)
  const companyWithTenant = {
    ...company,
    tenant_id: company.tenant_id || await getCurrentTenantId(), // ✅ ADICIONAR
  };

  const { data, error } = await supabase
    .from('companies')
    .upsert(companyWithTenant, { onConflict: 'cnpj' })
    .select()
    .single();

  if (error) {
    dbLogger.error('upsert', 'companies', error);
    return null;
  }

  dbLogger.log('upsert SUCCESS', 'companies', { id: data.id });
  return data;
}
```

---

### 2. `src/hooks/useCompanies.ts`
**Linha:** 99-117  
**Função:** `useCreateCompany()`  
**Status:** ❌ Falta `tenant_id`

```typescript
// ATUAL (linha 99-117)
export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (company: Inserts<'companies'>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([company])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
    },
  });
}
```

**✅ ADAPTAR PARA:**
```typescript
import { useTenant } from '@/contexts/TenantContext'; // ✅ ADICIONAR IMPORT

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant(); // ✅ ADICIONAR
  
  return useMutation({
    mutationFn: async (company: Inserts<'companies'>) => {
      if (!tenant) {
        throw new Error('Tenant não disponível');
      }

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...company,
          tenant_id: tenant.id, // ✅ ADICIONAR
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
    },
  });
}
```

---

### 3. `src/components/sdr/DealFormDialog.tsx`
**Linha:** 318-322  
**Função:** `handleEnrichCompany()`  
**Status:** ❌ Falta `tenant_id`

```typescript
// ATUAL (linha 318-322)
const { data: created, error: insertErr } = await supabase
  .from('companies')
  .insert(companyData)
  .select('id, company_name, cnpj, employees, industry, revenue, lead_score, location')
  .single();
```

**✅ ADAPTAR PARA:**
```typescript
// ✅ ADICIONAR NO INÍCIO DO COMPONENTE:
import { useTenant } from '@/contexts/TenantContext';

// Dentro do componente:
const { tenant } = useTenant();

// ✅ ADAPTAR INSERT (linha 318):
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

### 4. `src/hooks/useCompanyDiscovery.ts`
**Linha:** 139-153  
**Função:** `useAddCompaniesToBank()`  
**Status:** ❌ Falta `tenant_id`

```typescript
// ATUAL (linha 139-153)
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
  }])
  .select()
  .single();
```

**✅ ADAPTAR PARA:**
```typescript
// ✅ ADICIONAR NO INÍCIO DO HOOK:
import { useTenant } from '@/contexts/TenantContext';

export function useAddCompaniesToBank() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant(); // ✅ ADICIONAR

  return useMutation({
    mutationFn: async (suggestedCompanyIds: string[]) => {
      if (!tenant) {
        throw new Error('Tenant não disponível');
      }

      const promises = suggestedCompanyIds.map(async (id) => {
        // ... código existente ...

        // ✅ ADAPTAR INSERT (linha 139):
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
            tenant_id: tenant.id, // ✅ ADICIONAR
          }])
          .select()
          .single();

        // ... resto do código ...
      });
    },
  });
}
```

---

## 🟡 PRIORIDADE MÉDIA (Verificar Outros Arquivos)

### 5. `src/components/companies/BulkUploadDialog.tsx`
**Status:** ⚠️ Verificar se tem INSERTs

**Buscar por:** `.insert(` ou `.upsert(`

---

### 6. `src/components/companies/ApolloReviewDialog.tsx`
**Status:** ⚠️ Verificar se tem INSERTs

**Buscar por:** `.insert(` ou `.upsert(`

---

### 7. `src/components/leads/CSVUploadWithMapping.tsx`
**Status:** ⚠️ Verificar se tem INSERTs

**Buscar por:** `.insert(` ou `.upsert(`

---

### 8. `src/pages/SearchPage.tsx`
**Status:** ⚠️ Verificar se tem INSERTs

**Buscar por:** `.insert(` ou `.upsert(`

---

## ✅ JÁ ADAPTADO (Verificar se está correto)

### 9. `src/hooks/useTenantData.ts`
**Linha:** 55  
**Status:** ✅ Já tem `tenant_id`  
**Verificar:** Se está funcionando corretamente

```typescript
// ✅ JÁ TEM (linha 55)
tenant_id: tenant.id, // Garantir isolamento
```

---

## 🔧 FUNÇÃO AUXILIAR NECESSÁRIA

### Criar função para obter tenant_id do contexto

**Arquivo:** `src/lib/utils/tenant.ts` (criar se não existir)

```typescript
import { supabase } from '@/integrations/supabase/client';

/**
 * Obtém o tenant_id do usuário autenticado atual
 * Usa a função SQL get_user_tenant() via RPC
 */
export async function getCurrentTenantId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_tenant');
    
    if (error) {
      console.error('Erro ao obter tenant_id:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter tenant_id:', error);
    return null;
  }
}
```

**OU usar diretamente do contexto:**

```typescript
// Se você tem TenantContext disponível
import { useTenant } from '@/contexts/TenantContext';

// Dentro do componente/hook
const { tenant } = useTenant();
const tenantId = tenant?.id;
```

---

## 📋 CHECKLIST DE ADAPTAÇÃO

### Arquivos para Adaptar:
- [ ] `src/lib/db/companies.ts` - função `upsert()`
- [ ] `src/hooks/useCompanies.ts` - função `useCreateCompany()`
- [ ] `src/components/sdr/DealFormDialog.tsx` - linha 318
- [ ] `src/hooks/useCompanyDiscovery.ts` - linha 139
- [ ] `src/components/companies/BulkUploadDialog.tsx` - verificar INSERTs
- [ ] `src/components/companies/ApolloReviewDialog.tsx` - verificar INSERTs
- [ ] `src/components/leads/CSVUploadWithMapping.tsx` - verificar INSERTs
- [ ] `src/pages/SearchPage.tsx` - verificar INSERTs

### Verificações:
- [ ] Todos os INSERTs incluem `tenant_id`
- [ ] Todos os UPSERTs incluem `tenant_id`
- [ ] Testei criação de empresa após adaptação
- [ ] Testei upload em massa após adaptação
- [ ] Não há erros no console

---

## 🚀 PRÓXIMO PASSO

**Comece pelo arquivo mais crítico:** `src/hooks/useCompanies.ts`

Este é usado em vários lugares da aplicação, então adaptá-lo primeiro resolve muitos problemas de uma vez.

