# 🔧 CORREÇÃO: Extração de Produtos Não Aparecendo na Tela

## 🔴 PROBLEMA IDENTIFICADO

1. **Edge Function encontra produtos mas não insere** (`products_inserted: 0`)
2. **Produtos não aparecem na tela** após extração
3. **Mesmo problema para produtos de concorrentes** em massa

## ✅ CORREÇÕES APLICADAS

### 1. Edge Function `scan-website-products` ✅
**Arquivo:** `supabase/functions/scan-website-products/index.ts`

**Melhorias:**
- ✅ Tratamento robusto de erros na verificação de duplicatas
- ✅ Usa `ilike` para comparação case-insensitive (evita duplicatas por diferença de maiúsculas)
- ✅ Logs detalhados de cada etapa (inserção, erro, duplicata)
- ✅ Tratamento de exceções com stack trace
- ✅ Remove espaços em branco do nome do produto antes de inserir

**Mudanças:**
- Verificação de duplicatas não bloqueia inserção se houver erro de RLS
- Logs detalhados para debug
- Tratamento de constraint violations (duplicatas)

### 2. Edge Function `scan-competitor-url` ✅
**Arquivo:** `supabase/functions/scan-competitor-url/index.ts`

**Melhorias:**
- ✅ Mesmas melhorias da `scan-website-products`
- ✅ Contadores separados: `productsInserted`, `productsSkipped`, `productsError`
- ✅ Logs detalhados para debug

### 3. Recarregamento de Produtos ✅
**Arquivo:** `src/components/onboarding/steps/Step1DadosBasicos.tsx`

**Melhorias:**
- ✅ **Recarregamento múltiplo** após extração (até 3 tentativas)
- ✅ **Aguarda 2 segundos** antes de recarregar (garante que dados foram salvos)
- ✅ **Feedback visual** melhorado nos toasts
- ✅ **Logs detalhados** de cada tentativa de recarregamento

**Mudanças:**
```typescript
// ANTES: 1 tentativa, 1 segundo de espera
await new Promise(resolve => setTimeout(resolve, 1000));
await loadTenantProducts();

// DEPOIS: 3 tentativas, 2 segundos iniciais + 1 segundo entre tentativas
await new Promise(resolve => setTimeout(resolve, 2000));
let tentativas = 0;
const maxTentativas = 3;
while (tentativas < maxTentativas) {
  await loadTenantProducts();
  await new Promise(resolve => setTimeout(resolve, 1000));
  tentativas++;
  if (tenantProductsCount > 0) break;
}
```

### 4. Feedback Visual Melhorado ✅
- ✅ Toast informa se produtos foram encontrados mas não inseridos
- ✅ Toast mostra total de produtos após recarregamento
- ✅ Logs detalhados no console para debug

## 🔍 POSSÍVEIS CAUSAS DO PROBLEMA ORIGINAL

1. **RLS bloqueando verificação de duplicatas** - Corrigido com tratamento de erros
2. **Produtos sendo inseridos mas não recarregados** - Corrigido com recarregamento múltiplo
3. **Duplicatas por diferença de maiúsculas** - Corrigido com `ilike`
4. **Timing: recarregamento muito rápido** - Corrigido com espera de 2 segundos

## 📋 CHECKLIST DE TESTES

### Teste 1: Extração de Produtos do Tenant
- [ ] Clicar em "Extrair Produtos" no campo Website
- [ ] Verificar logs no console: `products_found` e `products_inserted`
- [ ] Verificar se produtos aparecem na tela após extração
- [ ] Verificar se contador é atualizado
- [ ] Clicar em "Recarregar" e verificar se produtos persistem

### Teste 2: Extração em Massa de Concorrentes
- [ ] Adicionar múltiplos concorrentes
- [ ] Clicar em "Extrair Produtos em Massa"
- [ ] Verificar logs no console para cada concorrente
- [ ] Verificar se produtos aparecem na tabela de cada concorrente
- [ ] Verificar se não há duplicatas

### Teste 3: Verificação de Duplicatas
- [ ] Extrair produtos do mesmo website duas vezes
- [ ] Verificar se não cria duplicatas
- [ ] Verificar logs: `productsSkipped` deve aumentar

## 🎯 PRÓXIMOS PASSOS

1. **Testar extração** e verificar se produtos aparecem
2. **Verificar logs da Edge Function** no Supabase Dashboard
3. **Se ainda não funcionar**, verificar:
   - RLS policies da tabela `tenant_products`
   - Logs da Edge Function para erros específicos
   - Se `SERVICE_ROLE_KEY` está configurada corretamente

## 📊 LOGS ESPERADOS

### Console do Navegador:
```
[Step1] ✅ Resposta da Edge Function: {success: true, products_found: 17, products_inserted: 17}
[Step1] 🔄 Tentativa 1/3 de recarregar produtos...
[Step1] ✅ Produtos encontrados em tenant_products: 17
[Step1] ✅ Produtos carregados após 1 tentativa(s): 17
```

### Logs da Edge Function (Supabase Dashboard):
```
[ScanWebsite] 🔄 Tentando inserir 17 produtos...
[ScanWebsite] ➕ Inserindo produto: Produto 1
[ScanWebsite] ✅ Produto inserido com sucesso: Produto 1 (ID: xxx)
...
[ScanWebsite] 📊 Resumo da inserção: 17 inseridos, 0 já existiam, 0 com erro
```

