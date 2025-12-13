# 🚨 INSTRUÇÕES URGENTES: Corrigir Loop Infinito e RLS

## 📋 PROBLEMAS CRÍTICOS IDENTIFICADOS

1. **Erro 500 infinito**: Recursão RLS na tabela `users` (migration não aplicada)
2. **Loop infinito**: OnboardingWizard renderizando infinitamente
3. **Inconsistência de dados**: Seletor mostra "UNI LUVAS" mas onboarding mostra "METALIFE"
4. **Dados misturados**: localStorage com dados de tenants diferentes

## ✅ CORREÇÕES APLICADAS

### 1. Migration RLS Mais Robusta

Criada migration `20250219000001_fix_users_rls_recursion_URGENT.sql` que:
- **Desabilita RLS temporariamente** para limpar políticas problemáticas
- **Remove TODAS as políticas antigas** (usando loop dinâmico)
- **Cria políticas simples** que usam APENAS `auth.uid()` diretamente
- **Reabilita RLS** após correção

### 2. Correção do Loop Infinito

- Adicionado `reloadingRef` para prevenir múltiplas execuções simultâneas
- Adicionado `lastReloadRef` para só recarregar quando step/tenant realmente mudou
- Proteção contra loops no `reloadSessionFromDatabase`

### 3. Limpeza de Dados Inconsistentes

- Quando o tenant muda, os dados do tenant anterior são removidos do localStorage
- Isso evita mistura de dados entre tenants diferentes

## 🔧 PASSO A PASSO PARA APLICAR

### PASSO 1: Aplicar Migration RLS (URGENTE)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo: `supabase/migrations/20250219000001_fix_users_rls_recursion_URGENT.sql`
4. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. **Cole no SQL Editor** do Supabase
6. **Execute** (Run)
7. **Verifique** se não há erros

### PASSO 2: Limpar localStorage (Opcional mas Recomendado)

1. Abra o **Console do Navegador** (F12)
2. Execute:
```javascript
// Limpar todos os dados de onboarding
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('onboarding_') || key.startsWith('local_tenants')) {
    localStorage.removeItem(key);
    console.log('Removido:', key);
  }
});
console.log('✅ localStorage limpo!');
```

### PASSO 3: Recarregar a Página

1. **Recarregue a página** (Ctrl+F5 para limpar cache)
2. **Teste criar um novo tenant**
3. **Teste mudar entre tenants**
4. **Verifique se o loop parou**

## 🎯 RESULTADO ESPERADO

Após aplicar as correções:

1. ✅ **Erro 500 deve parar** (RLS corrigido)
2. ✅ **Loop infinito deve parar** (proteções adicionadas)
3. ✅ **Dados consistentes** (limpeza automática ao mudar tenant)
4. ✅ **Tenant correto** (seletor e onboarding sincronizados)

## 🚨 SE AINDA HOUVER PROBLEMAS

1. **Limpar cache do navegador** completamente
2. **Verificar se a migration foi aplicada** (verificar no Supabase)
3. **Verificar console** para novos erros
4. **Testar em aba anônima** para garantir que não é cache

