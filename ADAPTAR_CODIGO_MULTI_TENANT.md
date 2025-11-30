# 🔧 ADAPTAR CÓDIGO PARA MULTI-TENANT

## ⚠️ IMPORTANTE
- **SQL Editor**: Use apenas para queries SQL
- **Código TypeScript**: Adapte nos arquivos `.ts` e `.tsx` da aplicação

---

## 📋 PARTE 1: VALIDAÇÕES SQL (Execute no Supabase SQL Editor)

### ✅ 1. Verificar Função get_user_tenant()
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_tenant';
```
**✅ Resultado esperado:** `get_user_tenant`

### ✅ 2. Verificar tenant_id em companies
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies' 
AND column_name = 'tenant_id';
```
**✅ Resultado esperado:** `tenant_id | uuid`

### ✅ 3. Verificar Empresas sem tenant_id
```sql
SELECT COUNT(*) as empresas_sem_tenant
FROM public.companies 
WHERE tenant_id IS NULL;
```
**⚠️ Se retornar > 0:** Você precisa fazer backfill (veja PARTE 3)

---

## 💻 PARTE 2: ADAPTAR CÓDIGO TYPESCRIPT

### 🔍 2.1 Encontrar Todos os INSERTs de Empresas

Execute no terminal do projeto:
```bash
# Windows PowerShell
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "\.from\(['\`"]companies['\`"]\)\.insert"

# Ou use grep se tiver
grep -r "from('companies').insert" src/
grep -r 'from("companies").insert' src/
```

### 📝 2.2 Padrão de Adaptação

#### ❌ ANTES (sem tenant_id):
```typescript
// src/hooks/useTenantData.ts ou qualquer arquivo
await supabase
  .from('companies')
  .insert({
    name: 'Empresa',
    cnpj: '12345678000190',
    industry: 'Tecnologia'
  });
```

#### ✅ DEPOIS (com tenant_id):
```typescript
// Importar hook de tenant
import { useTenant } from '@/contexts/TenantContext';

// Dentro do componente/hook
const { tenant } = useTenant();

await supabase
  .from('companies')
  .insert({
    name: 'Empresa',
    cnpj: '12345678000190',
    industry: 'Tecnologia',
    tenant_id: tenant.id // ✅ OBRIGATÓRIO
  });
```

### 📁 2.3 Arquivos que Precisam Adaptação

#### Arquivo: `src/hooks/useTenantData.ts`
```typescript
// Localizar função useCreateTenantCompany ou similar
// Adicionar tenant_id no insert

export const useCreateTenantCompany = () => {
  const { tenant } = useTenant();
  
  return useMutation({
    mutationFn: async (companyData: any) => {
      return await supabase
        .from('companies')
        .insert({
          ...companyData,
          tenant_id: tenant.id // ✅ ADICIONAR
        });
    }
  });
};
```

#### Arquivo: `src/pages/CompaniesManagementPage.tsx`
```typescript
// Localizar função de criar empresa
// Adicionar tenant_id

const handleCreateCompany = async (data: any) => {
  const { tenant } = useTenant();
  
  const { error } = await supabase
    .from('companies')
    .insert({
      ...data,
      tenant_id: tenant.id // ✅ ADICIONAR
    });
};
```

#### Arquivo: `src/components/companies/BulkUploadDialog.tsx`
```typescript
// Localizar função de upload em massa
// Adicionar tenant_id em cada empresa

const handleBulkUpload = async (companies: any[]) => {
  const { tenant } = useTenant();
  
  const companiesWithTenant = companies.map(company => ({
    ...company,
    tenant_id: tenant.id // ✅ ADICIONAR
  }));
  
  await supabase
    .from('companies')
    .insert(companiesWithTenant);
};
```

### 🔍 2.4 Buscar Todos os Locais que Precisam Adaptação

Execute no terminal:
```bash
# Buscar todos os INSERTs
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "\.insert\(" | Select-String -Pattern "companies"

# Buscar todos os UPSERTs
Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "\.upsert\(" | Select-String -Pattern "companies"
```

---

## 🔄 PARTE 3: BACKFILL DE tenant_id (Se Necessário)

### ⚠️ ATENÇÃO: Execute apenas se houver empresas sem tenant_id

### 3.1 Verificar Situação Atual
```sql
-- Ver quantas empresas sem tenant_id
SELECT COUNT(*) as total_sem_tenant
FROM public.companies 
WHERE tenant_id IS NULL;

-- Ver quantos tenants existem
SELECT COUNT(*) as total_tenants
FROM public.tenants;
```

### 3.2 Opção A: Atribuir ao Primeiro Tenant (Desenvolvimento)
```sql
-- ⚠️ CUIDADO: Atribui TODAS as empresas ao primeiro tenant criado
-- Use apenas em desenvolvimento/teste

UPDATE public.companies
SET tenant_id = (
  SELECT id FROM public.tenants 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE tenant_id IS NULL;

-- Verificar resultado
SELECT COUNT(*) as empresas_com_tenant
FROM public.companies 
WHERE tenant_id IS NOT NULL;
```

### 3.3 Opção B: Atribuir por Usuário (Produção)
```sql
-- ⚠️ Mais seguro: Atribui empresas ao tenant do usuário que as criou
-- Requer que você tenha uma forma de identificar o criador

-- Exemplo: Se você tem uma coluna created_by ou user_id
UPDATE public.companies c
SET tenant_id = (
  SELECT u.tenant_id 
  FROM public.users u
  WHERE u.id = c.created_by -- Ajuste conforme sua estrutura
)
WHERE c.tenant_id IS NULL
AND EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = c.created_by
);
```

### 3.4 Opção C: Deletar Empresas sem Tenant (Apenas se seguro)
```sql
-- ⚠️ EXTREMO: Deleta empresas sem tenant_id
-- Use APENAS se você tem certeza que são dados de teste

-- PRIMEIRO: Verifique o que será deletado
SELECT * FROM public.companies WHERE tenant_id IS NULL;

-- DEPOIS: Se confirmar, execute:
-- DELETE FROM public.companies WHERE tenant_id IS NULL;
```

---

## 🧪 PARTE 4: TESTES APÓS ADAPTAÇÃO

### 4.1 Teste de Inserção de Empresa

**No código TypeScript:**
```typescript
// Teste simples
const { tenant } = useTenant();
console.log('Tenant atual:', tenant);

const { data, error } = await supabase
  .from('companies')
  .insert({
    name: 'Empresa Teste',
    cnpj: '12345678000190',
    tenant_id: tenant.id
  });

if (error) {
  console.error('Erro ao inserir:', error);
} else {
  console.log('Empresa criada:', data);
}
```

**Validação SQL:**
```sql
-- Verificar se empresa foi criada com tenant_id correto
SELECT id, name, tenant_id, created_at
FROM public.companies
ORDER BY created_at DESC
LIMIT 1;
```

### 4.2 Teste de Isolamento

**Cenário:**
1. Criar Tenant A → Criar Empresa A
2. Criar Tenant B → Criar Empresa B
3. Login como Tenant A
4. Listar empresas → Deve ver apenas Empresa A

**Validação:**
```sql
-- Como Tenant A (substitua pelo tenant_id real)
SELECT COUNT(*) as empresas_visiveis
FROM public.companies
WHERE tenant_id = '[tenant_a_id]';

-- Deve retornar apenas empresas do Tenant A
```

---

## 📊 PARTE 5: CHECKLIST DE ADAPTAÇÃO

### Código TypeScript
- [ ] Encontrei todos os `.insert()` em `companies`
- [ ] Encontrei todos os `.upsert()` em `companies`
- [ ] Adicionei `tenant_id` em todos os INSERTs
- [ ] Adicionei `tenant_id` em todos os UPSERTs
- [ ] Testei criação de empresa
- [ ] Testei upload em massa
- [ ] Verifiquei que não há erros no console

### Banco de Dados
- [ ] Função `get_user_tenant()` existe ✅
- [ ] Coluna `tenant_id` existe em `companies` ✅
- [ ] Empresas sem `tenant_id` foram corrigidas (se houver)
- [ ] RLS está ativo em todas as tabelas ✅

### Funcionalidades
- [ ] Criação de tenant funciona
- [ ] Inserção de empresa funciona
- [ ] Listagem de empresas funciona
- [ ] Isolamento de dados funciona (Tenant A não vê dados do Tenant B)

---

## 🆘 PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "null value in column 'tenant_id' violates not-null constraint"

**Causa:** Código tentando inserir sem `tenant_id`

**Solução:** Adicionar `tenant_id` no INSERT:
```typescript
const { tenant } = useTenant();
// ... código ...
tenant_id: tenant.id // ✅ ADICIONAR
```

### Erro: "permission denied for table companies"

**Causa:** RLS bloqueando acesso

**Solução:** Verificar:
1. Usuário está autenticado?
2. `get_user_tenant()` retorna valor?
3. Empresa tem `tenant_id` correto?

**Debug:**
```sql
-- Verificar tenant do usuário
SELECT get_user_tenant();

-- Verificar usuário existe
SELECT * FROM public.users WHERE auth_user_id = auth.uid();
```

### Erro: "tenant is undefined"

**Causa:** Hook `useTenant()` não está disponível no contexto

**Solução:** Verificar se componente está dentro de `<TenantProvider>`

```typescript
// App.tsx ou layout
<TenantProvider>
  {/* Seus componentes aqui */}
</TenantProvider>
```

---

## 📝 RESUMO RÁPIDO

1. **SQL Editor**: Use apenas para queries SQL de validação
2. **Código TypeScript**: Adapte nos arquivos `.ts` e `.tsx`
3. **Sempre inclua `tenant_id`** ao inserir empresas
4. **Teste isolamento** entre tenants
5. **Corrija empresas existentes** sem `tenant_id` se necessário

---

**Próximo passo:** Comece adaptando o código TypeScript nos arquivos que inserem empresas!

