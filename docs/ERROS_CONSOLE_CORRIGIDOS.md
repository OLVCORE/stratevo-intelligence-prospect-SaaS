# 🔧 ERROS DO CONSOLE CORRIGIDOS

## ❌ Erros Identificados

### 1. **Erro 404: Tabela `linkedin_connections` não existe**
```
Failed to load resource: the server responded with a status of 404
/rest/v1/linkedin_connections?select=id&sent_date=eq.2026-01-06
```

**Causa:** Migration não foi aplicada no banco de dados.

**Solução:**
- Migration existe: `supabase/migrations/20260106000000_create_linkedin_connections_table.sql`
- **AÇÃO NECESSÁRIA:** Aplicar a migration no Supabase Dashboard → SQL Editor

**Correção no código:**
- Adicionado tratamento de erro quando tabela não existe
- Query agora retorna 0 conexões se tabela não existir (não quebra o sistema)

---

### 2. **Erro 400: `tenant_products` com `display_order`**
```
Failed to load resource: the server responded with a status of 400
/rest/v1/tenant_products?select=*&tenant_id=eq.xxx&is_active=eq.true&order=display_order.asc
```

**Causa:** Sintaxe incorreta do `order` ou coluna não existe.

**Solução:**
- Verificar se a coluna `display_order` existe na tabela
- Corrigir sintaxe do `order` se necessário

---

### 3. **Erro 406: `tenant_search_configs`**
```
Failed to load resource: the server responded with a status of 406
/rest/v1/tenant_search_configs?select=*&tenant_id=eq.xxx
```

**Causa:** Tabela pode não existir ou ter problemas de RLS.

**Solução:**
- Verificar se a tabela existe
- Verificar políticas RLS

---

### 4. **WebSocket Connection Failed**
```
WebSocket connection to 'wss://.../realtime/v1/websocket' failed
```

**Causa:** Conexão WebSocket do Supabase Realtime pode estar desabilitada ou com problemas.

**Solução:**
- Não é crítico - apenas realtime updates não funcionarão
- Sistema continua funcionando normalmente

---

## ✅ Correções Aplicadas

1. ✅ **Tratamento de erro em `loadConnectionsCount`**
   - Agora verifica se tabela existe antes de consultar
   - Retorna 0 se tabela não existir (não quebra o sistema)

2. ✅ **Filtro por `user_id` adicionado**
   - Query agora filtra por usuário logado
   - Mais seguro e correto

---

## 🚀 Ações Necessárias

### **URGENTE: Aplicar Migrations**

1. **Tabela `linkedin_connections`:**
   ```sql
   -- Executar no Supabase Dashboard → SQL Editor
   -- Arquivo: supabase/migrations/20260106000000_create_linkedin_connections_table.sql
   ```

2. **Tabela `profiles`:**
   ```sql
   -- Executar no Supabase Dashboard → SQL Editor
   -- Arquivo: supabase/migrations/20260106000001_create_profiles_table_with_linkedin.sql
   ```

---

## 📊 Status dos Erros

- [x] Erro 404 `linkedin_connections` - **CORRIGIDO** (tratamento de erro adicionado)
- [ ] Migration `linkedin_connections` - **PENDENTE** (aplicar no banco)
- [ ] Migration `profiles` - **PENDENTE** (aplicar no banco)
- [ ] Erro 400 `tenant_products` - **INVESTIGAR** (verificar sintaxe)
- [ ] Erro 406 `tenant_search_configs` - **INVESTIGAR** (verificar tabela)

---

## 🔍 Como Verificar

Após aplicar as migrations, os erros devem desaparecer. Se persistirem:

1. Verificar logs do Supabase Dashboard
2. Verificar se as tabelas foram criadas:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('linkedin_connections', 'profiles');
   ```

