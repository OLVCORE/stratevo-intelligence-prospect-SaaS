# 🔴 DIAGNÓSTICO: Dados Viciados de Outros Tenants no Onboarding

## 📋 PROBLEMA IDENTIFICADO

**Sintoma:** Ao iniciar um novo tenant, as etapas a partir da aba 2 (Step2, Step3, Step4, Step5) estão carregando dados viciados de outros tenants que já foram cadastrados.

**Expectativa:** Todas as etapas devem estar **VAZIAS** para que o usuário preencha todos os dados sem nenhum registro de outros tenants ou informações com campos preenchidos e salvos já viciados.

---

## 🔍 CAUSAS RAIZ IDENTIFICADAS

### **CAUSA 1: `loadSessionFromDatabase` Busca Dados de Outros Tenants**

**Localização:** `src/components/onboarding/OnboardingWizard.tsx` linha ~799

**Problema:**
```typescript
// Linha 798-799
if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId) {
  const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);
```

**Análise:**
- A função `loadSessionFromDatabase` busca por `tenant_id` E `user_id`
- Quando é um **novo tenant**, o `tenantId` pode ser um ID local temporário (`local-tenant-xxx`)
- Se o `user_id` for o mesmo de outro tenant, a query pode retornar dados de outro tenant
- **CRÍTICO:** Mesmo quando `isNewTenant === true`, o código ainda chama `loadSessionFromDatabase` se não estiver em SAFE MODE

**Query Problemática:**
```typescript
// Linha 426-431
const { data, error } = await (supabase as any)
  .from('onboarding_sessions')
  .select('*')
  .eq('tenant_id', tenantId)  // ⚠️ Se tenantId for local-tenant-xxx, pode não encontrar nada
  .eq('user_id', userId)       // ⚠️ Mas se userId for o mesmo, pode retornar dados de outro tenant
  .maybeSingle();
```

**Cenário de Bug:**
1. Usuário cria novo tenant (tenantId = `local-tenant-123456`)
2. `loadSessionFromDatabase` é chamado com `tenantId = local-tenant-123456` e `userId = user-abc`
3. Query não encontra sessão com `tenant_id = local-tenant-123456`
4. **MAS:** Se houver uma sessão com `user_id = user-abc` e `tenant_id = outro-tenant-real`, pode retornar esses dados
5. Dados de outro tenant são carregados no `formData`
6. Steps recebem `initialData` com dados viciados

---

### **CAUSA 2: `initialize` useEffect Não Verifica `isNewTenant` Antes de Buscar Banco**

**Localização:** `src/components/onboarding/OnboardingWizard.tsx` linha ~706-885

**Problema:**
```typescript
// Linha 706-885
useEffect(() => {
  const initialize = async () => {
    // 🔥 CRÍTICO: Se for novo tenant, limpar tudo e começar do zero
    if (isNewTenant) {
      // ... limpa localStorage e estado ...
      return; // ✅ CORRETO: Retorna aqui
    }
    
    // ... código continua ...
    
    // 2) Em paralelo, tenta buscar do banco (best effort) - apenas se não estiver em SAFE MODE
    if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId) {
      const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);
      // ⚠️ PROBLEMA: Se isNewTenant for false mas tenantId for local-tenant-xxx, ainda busca do banco
```

**Análise:**
- O código verifica `isNewTenant` e retorna se for true ✅
- **MAS:** Se `isNewTenant` for `false` mas o `tenantId` for um ID local temporário, ainda tenta buscar do banco
- Isso pode acontecer se o `tenantId` for determinado antes de `isNewTenant` ser processado

---

### **CAUSA 3: Steps Recebem `initialData` com Dados Viciados**

**Localização:** Todas as Steps (Step2, Step3, Step4, Step5)

**Problema:**
```typescript
// Exemplo: Step2SetoresNichos.tsx linha ~63-143
export function Step2SetoresNichos({ initialData, ... }: Props) {
  const [selectedSectors, setSelectedSectors] = useState(() => {
    if (initialData?.setoresAlvoCodes && initialData.setoresAlvoCodes.length > 0) {
      return initialData.setoresAlvoCodes; // ⚠️ Usa dados viciados
    }
    // ...
  });
  
  // useEffect que atualiza quando initialData muda
  useEffect(() => {
    if (initialData) {
      // ⚠️ Atualiza estado com dados viciados
      setSelectedSectors(initialData.setoresAlvoCodes || []);
    }
  }, [initialData]);
```

**Análise:**
- As Steps recebem `initialData` que vem do `formData` do OnboardingWizard
- Se `formData` contém dados de outro tenant, as Steps vão usar esses dados
- **CRÍTICO:** As Steps não verificam se é um novo tenant antes de usar `initialData`

---

### **CAUSA 4: `formData` Inicializado com Dados do localStorage de Outro Tenant**

**Localização:** `src/components/onboarding/OnboardingWizard.tsx` linha ~312-344

**Problema:**
```typescript
// Linha 312-331
const savedDataInitial = (() => {
  try {
    const storageKey = getStorageKey(tenantId);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed; // ⚠️ Pode retornar dados de outro tenant se tenantId estiver errado
    }
  } catch (error) {
    return {};
  }
  return {};
})();

const [formData, setFormData] = useState<Partial<OnboardingData>>(savedDataInitial);
```

**Análise:**
- `formData` é inicializado com dados do localStorage usando `getStorageKey(tenantId)`
- Se `tenantId` for `null` ou incorreto, `getStorageKey` retorna chave genérica `'onboarding_form_data'`
- Essa chave genérica pode conter dados de outro tenant
- **CRÍTICO:** Não verifica `isNewTenant` antes de carregar do localStorage

---

### **CAUSA 5: `loadSavedData` Usa Chave Genérica Quando `tenantId` é Null**

**Localização:** `src/components/onboarding/OnboardingWizard.tsx` linha ~19-27, 461-490

**Problema:**
```typescript
// Linha 19-27
const getStorageKey = (tenantId: string | null) => {
  if (!tenantId) {
    // Se não há tenant_id, usar chave genérica (apenas durante criação inicial)
    return 'onboarding_form_data'; // ⚠️ CHAVE GENÉRICA - pode conter dados de outro tenant
  }
  return `onboarding_form_data_${tenantId}`;
};

// Linha 461-490
const loadSavedData = (targetTenantId?: string | null): { step: number; data: Partial<OnboardingData> } => {
  try {
    const effectiveTenantId = targetTenantId ?? tenantId;
    const storageKey = getStorageKey(effectiveTenantId);
    // ⚠️ Se effectiveTenantId for null, usa chave genérica
    const savedData = localStorage.getItem(storageKey);
    // ⚠️ Pode retornar dados de outro tenant
```

**Análise:**
- Quando `tenantId` é `null`, `getStorageKey` retorna chave genérica `'onboarding_form_data'`
- Essa chave genérica é compartilhada entre todos os tenants que não têm `tenantId`
- Dados de um tenant podem vazar para outro tenant

---

## 🎯 SOLUÇÕES PROPOSTAS

### **SOLUÇÃO 1: Não Buscar Banco Quando `isNewTenant === true`**

**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

**Mudança:**
```typescript
// Linha ~798
// ANTES:
if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId) {
  const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);

// DEPOIS:
if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId && !isNewTenant) {
  // 🔥 CRÍTICO: NUNCA buscar banco se for novo tenant
  const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);
```

---

### **SOLUÇÃO 2: Verificar `isNewTenant` Antes de Carregar localStorage**

**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

**Mudança:**
```typescript
// Linha ~312-331
// ANTES:
const savedDataInitial = (() => {
  try {
    const storageKey = getStorageKey(tenantId);
    const saved = localStorage.getItem(storageKey);
    // ...

// DEPOIS:
const savedDataInitial = (() => {
  // 🔥 CRÍTICO: Se for novo tenant, SEMPRE retornar objeto vazio
  if (isNewTenant) {
    return {};
  }
  try {
    const storageKey = getStorageKey(tenantId);
    const saved = localStorage.getItem(storageKey);
    // ...
```

---

### **SOLUÇÃO 3: Verificar `isNewTenant` em `loadSavedData`**

**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

**Mudança:**
```typescript
// Linha ~461-490
const loadSavedData = (targetTenantId?: string | null): { step: number; data: Partial<OnboardingData> } => {
  try {
    // 🔥 CRÍTICO: Se for novo tenant, SEMPRE retornar dados vazios
    if (isNewTenant) {
      return { step: 1, data: {} };
    }
    
    const effectiveTenantId = targetTenantId ?? tenantId;
    // ...
```

---

### **SOLUÇÃO 4: Passar `isNewTenant` para Todas as Steps**

**Arquivo:** Todas as Steps (Step2, Step3, Step4, Step5)

**Mudança:**
```typescript
// Exemplo: Step2SetoresNichos.tsx
interface Props {
  // ... props existentes ...
  isNewTenant?: boolean; // 🔥 NOVO
}

export function Step2SetoresNichos({ initialData, isNewTenant = false, ... }: Props) {
  const [selectedSectors, setSelectedSectors] = useState(() => {
    // 🔥 CRÍTICO: Se for novo tenant, SEMPRE começar vazio
    if (isNewTenant) {
      return [];
    }
    
    if (initialData?.setoresAlvoCodes && initialData.setoresAlvoCodes.length > 0) {
      return initialData.setoresAlvoCodes;
    }
    // ...
  });
  
  // useEffect também deve verificar isNewTenant
  useEffect(() => {
    // 🔥 CRÍTICO: Se for novo tenant, NÃO atualizar com initialData
    if (isNewTenant) {
      return;
    }
    
    if (initialData) {
      // ... atualizar estado ...
    }
  }, [initialData, isNewTenant]);
```

---

### **SOLUÇÃO 5: Verificar `tenantId` Local Antes de Buscar Banco**

**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

**Mudança:**
```typescript
// Linha ~798
// ANTES:
if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId) {
  const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);

// DEPOIS:
// 🔥 CRÍTICO: Verificar se tenantId é local (não buscar banco para IDs locais)
const isLocalTenantId = tenantId && tenantId.startsWith('local-tenant-');
if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId && !isNewTenant && !isLocalTenantId) {
  const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);
```

---

## 📊 RESUMO DAS CAUSAS

| # | Causa | Severidade | Arquivo | Linha |
|---|-------|------------|---------|-------|
| 1 | `loadSessionFromDatabase` busca dados de outros tenants | 🔴 CRÍTICA | OnboardingWizard.tsx | ~799 |
| 2 | `initialize` não verifica `isNewTenant` antes de buscar banco | 🔴 CRÍTICA | OnboardingWizard.tsx | ~798 |
| 3 | Steps recebem `initialData` com dados viciados | 🔴 CRÍTICA | Step2/3/4/5.tsx | ~63-143 |
| 4 | `formData` inicializado com dados do localStorage de outro tenant | 🟡 ALTA | OnboardingWizard.tsx | ~312-344 |
| 5 | `loadSavedData` usa chave genérica quando `tenantId` é null | 🟡 ALTA | OnboardingWizard.tsx | ~19-27, 461-490 |

---

## ✅ PRÓXIMOS PASSOS

1. **Implementar Solução 1** - Não buscar banco quando `isNewTenant === true`
2. **Implementar Solução 2** - Verificar `isNewTenant` antes de carregar localStorage
3. **Implementar Solução 3** - Verificar `isNewTenant` em `loadSavedData`
4. **Implementar Solução 4** - Passar `isNewTenant` para todas as Steps
5. **Implementar Solução 5** - Verificar `tenantId` local antes de buscar banco
6. **Testar** - Criar novo tenant e verificar se todas as etapas estão vazias

---

## 🔧 ARQUIVOS A MODIFICAR

1. `src/components/onboarding/OnboardingWizard.tsx`
   - Linha ~312-331: `savedDataInitial` - verificar `isNewTenant`
   - Linha ~461-490: `loadSavedData` - verificar `isNewTenant`
   - Linha ~798: `initialize` - não buscar banco se `isNewTenant`
   - Linha ~1600-1700: Passar `isNewTenant` para todas as Steps

2. `src/components/onboarding/steps/Step2SetoresNichos.tsx`
   - Adicionar prop `isNewTenant`
   - Verificar `isNewTenant` antes de usar `initialData`

3. `src/components/onboarding/steps/Step3PerfilClienteIdeal.tsx`
   - Adicionar prop `isNewTenant`
   - Verificar `isNewTenant` antes de usar `initialData`

4. `src/components/onboarding/steps/Step4SituacaoAtual.tsx`
   - Adicionar prop `isNewTenant`
   - Verificar `isNewTenant` antes de usar `initialData`

5. `src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx`
   - Adicionar prop `isNewTenant`
   - Verificar `isNewTenant` antes de usar `initialData`

---

## ⚠️ CONSIDERAÇÕES

- **Isolamento de Dados:** Garantir que dados de um tenant nunca vazem para outro tenant
- **Novo Tenant:** Sempre começar com dados vazios, sem buscar banco ou localStorage
- **Tenant Existente:** Buscar dados do banco e localStorage apenas se `tenantId` for válido e não for local
- **Chaves Genéricas:** Evitar usar chaves genéricas no localStorage que podem ser compartilhadas entre tenants

