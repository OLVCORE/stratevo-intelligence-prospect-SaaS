# 🗑️ LIMPEZA COMPLETA DO BANCO DE DADOS

## ⚠️ ATENÇÃO: ISSO DELETA TUDO!

Esta migration vai deletar:
- ✅ TODOS os tenants
- ✅ TODOS os usuários (public.users)
- ✅ TODAS as sessões de onboarding
- ✅ TODOS os ICPs
- ✅ TODOS os produtos
- ✅ TODOS os schemas de tenants

## 📋 PASSO A PASSO

### PASSO 1: Aplicar Migration no Supabase

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo: `supabase/migrations/20250219000002_LIMPAR_TODOS_TENANTS_ZERO.sql`
4. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
5. **Cole no SQL Editor** do Supabase
6. **Execute** (Run)
7. **Verifique** se não há erros

### PASSO 2: Limpar localStorage do Navegador

1. Abra o **Console do Navegador** (F12)
2. Execute este código:

```javascript
// Limpar TODOS os dados relacionados a tenants
console.log('🗑️ Limpando localStorage...');

// Lista de chaves para limpar
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.startsWith('onboarding_') ||
    key.startsWith('local_tenants') ||
    key.startsWith('selectedTenantId') ||
    key.includes('tenant') ||
    key.includes('onboarding')
  )) {
    keysToRemove.push(key);
  }
}

// Remover todas as chaves
keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('✅ Removido:', key);
});

console.log(`✅ ${keysToRemove.length} itens removidos do localStorage!`);
console.log('🔄 Recarregue a página agora (Ctrl+F5)');
```

### PASSO 3: Recarregar a Página

1. **Recarregue a página** com cache limpo (Ctrl+F5)
2. **Verifique** se não há mais dados antigos

### PASSO 4: Criar Novo Tenant

1. Vá em **Configurações → Minhas Empresas**
2. Clique em **"Criar Nova Empresa"**
3. Preencha os dados
4. **Teste** se está funcionando corretamente

## ✅ RESULTADO ESPERADO

Após a limpeza:
- ✅ Banco de dados vazio (sem tenants)
- ✅ localStorage limpo
- ✅ Sistema pronto para começar do zero
- ✅ Sem dados "grudados" da Metalife ou outras empresas

## 🚨 SE AINDA HOUVER PROBLEMAS

1. **Limpe o cache do navegador completamente** (Ctrl+Shift+Delete)
2. **Feche e abra o navegador novamente**
3. **Teste em aba anônima** para garantir que não é cache
4. **Verifique o console** para erros

