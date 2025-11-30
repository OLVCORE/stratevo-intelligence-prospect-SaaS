# 🔧 Correções: Persistência de Dados no Onboarding

## ✅ Problemas Corrigidos

### 1. **Dados não persistem na tela ao voltar** ✅
- **Problema**: Componentes usavam `useState` apenas na inicialização
- **Solução**: Adicionado `useEffect` que sincroniza estado quando `initialData` muda
- **Arquivo**: `src/components/onboarding/steps/Step1DadosBasicos.tsx`

### 2. **Botão "Próximo" ficava desabilitado após salvar** ✅
- **Problema**: Botão era desabilitado por `saveLoading` mesmo após salvamento manual
- **Solução**: Removido `saveLoading` da condição de desabilitar do botão "Próximo"
- **Arquivo**: `src/components/onboarding/StepNavigation.tsx`

### 3. **Dados não recarregavam do banco ao navegar** ✅
- **Problema**: `reloadSessionFromDatabase` não estava sendo chamado corretamente
- **Solução**: 
  - Adicionado delay para garantir que estado foi atualizado
  - Melhorado logging para debug
  - Adicionado `useEffect` que recarrega ao mudar de etapa
- **Arquivo**: `src/components/onboarding/OnboardingWizard.tsx`

## 🔄 Fluxo Corrigido

### Ao Voltar para Etapa Anterior:
```
1. Usuário clica em "Voltar" ou clica em etapa na barra de progresso
2. setCurrentStep(step) - muda etapa
3. Aguarda 100ms para garantir que estado foi atualizado
4. reloadSessionFromDatabase() - recarrega dados do banco
5. setFormData() - atualiza formData com dados do banco
6. Componente recebe initialData atualizado
7. useEffect no componente sincroniza estado interno
8. Campos são preenchidos com dados do banco ✅
```

### Ao Clicar em "Próximo":
```
1. Usuário clica em "Próximo"
2. handleNext() é chamado
3. setIsSaving(true) - mostra loading
4. Salva no banco
5. Se sucesso: avança etapa + recarrega dados
6. setIsSaving(false) - remove loading
7. Botão "Próximo" fica habilitado novamente ✅
```

## 📝 Mudanças Implementadas

### Step1DadosBasicos.tsx:
```typescript
// ✅ Adicionado useEffect para sincronizar estado
useEffect(() => {
  if (initialData) {
    setFormData({
      cnpj: initialData.cnpj || '',
      email: initialData.email || '',
      website: initialData.website || '',
      telefone: initialData.telefone || '',
    });
    
    // Restaurar cnpjData se disponível
    if (initialData.razaoSocial || initialData.nomeFantasia) {
      setCnpjData({ /* ... dados do CNPJ ... */ });
    }
  }
}, [initialData]);
```

### StepNavigation.tsx:
```typescript
// ✅ Removido saveLoading da condição de desabilitar
disabled={nextDisabled || nextLoading} // Antes: || saveLoading
```

### OnboardingWizard.tsx:
```typescript
// ✅ Melhorado reloadSessionFromDatabase
const reloadSessionFromDatabase = async () => {
  // ... busca dados do banco ...
  setFormData(prev => ({ ...prev, ...loadedData }));
};

// ✅ Adicionado useEffect para recarregar ao mudar etapa
useEffect(() => {
  if (tenantId && currentStep >= 1) {
    const timer = setTimeout(() => {
      reloadSessionFromDatabase();
    }, 200);
    return () => clearTimeout(timer);
  }
}, [currentStep, tenantId]);
```

## 🎯 Resultado

**Antes:**
- ❌ Dados desapareciam ao voltar
- ❌ Botão "Próximo" ficava desabilitado
- ❌ Dados não recarregavam do banco

**Agora:**
- ✅ Dados persistem na tela ao voltar
- ✅ Botão "Próximo" funciona corretamente
- ✅ Dados são recarregados do banco automaticamente
- ✅ Campos são preenchidos com dados salvos

## 🧪 Como Testar

1. Preencha Step 1 e clique em "Próximo"
2. Vá para Step 2
3. Clique em "Voltar" ou clique no Step 1 na barra de progresso
4. **Verificar**: Dados do Step 1 devem estar preenchidos ✅
5. Clique em "Salvar" manualmente
6. **Verificar**: Botão "Próximo" deve continuar habilitado ✅
7. Clique em "Próximo"
8. **Verificar**: Deve avançar normalmente ✅

