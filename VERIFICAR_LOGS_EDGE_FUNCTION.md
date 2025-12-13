# 🔍 COMO VERIFICAR LOGS DA EDGE FUNCTION

## 📍 ONDE VER OS LOGS

### Supabase Dashboard

1. Acesse: **Supabase Dashboard** → Seu Projeto
2. Menu lateral: **Edge Functions**
3. Clique em: **`scan-website-products`**
4. Aba: **Logs** ou **Invoke logs**

---

## 🔍 O QUE PROCURAR NOS LOGS

### 1. Logs de Inserção

Procure por estas linhas:

```
[ScanWebsite] 🔄 Tentando inserir 14 produtos...
[ScanWebsite] ➕ Inserindo produto: [nome do produto]
[ScanWebsite] ✅ Produto inserido com sucesso: [nome] (ID: [uuid])
```

OU

```
[ScanWebsite] ❌ ERRO AO INSERIR PRODUTO:
  error_code: [código]
  error_message: [mensagem]
  error_hint: [hint]
```

### 2. Logs de Verificação de Duplicatas

```
[ScanWebsite] ⏭️ Produto já existe: [nome]
```

Se TODOS os produtos mostrarem "já existe", pode ser problema na verificação de duplicatas.

### 3. Logs de SERVICE_ROLE_KEY

```
[ScanWebsite] ✅ SERVICE_ROLE_KEY configurada
[ScanWebsite] ✅ Tabela tenant_products acessível via SERVICE_ROLE_KEY
```

Se não aparecer, SERVICE_ROLE_KEY pode não estar configurada.

### 4. Logs de Erro RLS

```
[ScanWebsite] 🔒 ERRO DE PERMISSÃO RLS - SERVICE_ROLE_KEY não está bypassando RLS!
```

Se aparecer, RLS ainda está bloqueando.

---

## 📋 INFORMAÇÕES PARA ME ENVIAR

Se encontrar erros, me envie:

1. **Código de erro** (ex: `42501`, `23505`, etc.)
2. **Mensagem de erro completa**
3. **Quantos produtos tentaram inserir**
4. **Quantos produtos foram inseridos com sucesso**
5. **Quantos produtos foram pulados (duplicatas)**

---

## 🎯 RESULTADO ESPERADO

Se tudo estiver funcionando, você deve ver:

```
[ScanWebsite] 🔄 Tentando inserir 14 produtos...
[ScanWebsite] ➕ Inserindo produto: Produto 1
[ScanWebsite] ✅ Produto inserido com sucesso: Produto 1 (ID: xxx)
[ScanWebsite] ➕ Inserindo produto: Produto 2
[ScanWebsite] ✅ Produto inserido com sucesso: Produto 2 (ID: xxx)
...
[ScanWebsite] 📊 Resumo da inserção: 14 inseridos, 0 já existiam, 0 com erro
```

---

## ⚠️ SE NÃO ENCONTRAR LOGS

1. Verifique se a Edge Function foi executada (última execução)
2. Verifique o filtro de tempo (últimas 1h, 24h, etc.)
3. Tente executar a extração novamente para gerar novos logs

