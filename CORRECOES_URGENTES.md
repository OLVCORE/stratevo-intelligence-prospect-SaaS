# 🔧 CORREÇÕES URGENTES - Problemas Identificados

## 📋 Problemas Encontrados

1. **❌ Tabela `chat_sessions` não encontrada**
   - Erro: `Could not find the table 'public.chat_sessions' in the schema cache`
   - Solução: Aplicar migration `APLICAR_MIGRATION_CHAT_SESSIONS.sql`

2. **❌ CORS Error no `chat-ai`**
   - Erro: `Response to preflight request doesn't pass access control check`
   - Status: Já configurado corretamente no código, mas pode precisar de redeploy

3. **❌ Erro ao carregar `MyCompanies.tsx`**
   - Erro: `Failed to fetch dynamically imported module`
   - Causa: Servidor Vite desconectado (`[vite] server connection lost`)

4. **❌ Erro 400 em `legal_data`**
   - Erro: `Failed to load resource: the server responded with a status of 400`
   - Causa: Possível problema de RLS ou query incorreta

---

## ✅ SOLUÇÕES

### 1. Aplicar Migration de Chat Sessions

**Execute no SQL Editor do Supabase:**

```sql
-- Copie e cole o conteúdo de: APLICAR_MIGRATION_CHAT_SESSIONS.sql
```

Ou execute diretamente:

```powershell
# No Supabase Dashboard → SQL Editor → New Query
# Cole o conteúdo de APLICAR_MIGRATION_CHAT_SESSIONS.sql
```

### 2. Redeploy das Edge Functions de Chat

```powershell
.\DEPLOY_CHAT_UNIFICADO.ps1
```

Ou manualmente:

```powershell
npx supabase functions deploy chat-ai --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
npx supabase functions deploy elevenlabs-conversation-v2 --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

### 3. Reiniciar Servidor Vite

```powershell
# Pare o servidor (Ctrl+C)
# Depois reinicie:
npm run dev
```

### 4. Verificar RLS de `legal_data`

Se o erro persistir, verifique as políticas RLS da tabela `legal_data` no Supabase Dashboard.

---

## 🚀 CHECKLIST DE EXECUÇÃO

- [ ] 1. Aplicar migration `APLICAR_MIGRATION_CHAT_SESSIONS.sql` no Supabase
- [ ] 2. Redeploy das Edge Functions (`DEPLOY_CHAT_UNIFICADO.ps1`)
- [ ] 3. Reiniciar servidor Vite (`npm run dev`)
- [ ] 4. Testar chat interface
- [ ] 5. Testar navegação para MyCompanies
- [ ] 6. Verificar logs do console para erros restantes

---

## 📝 NOTAS

- O `config.toml` já está configurado corretamente para `chat-ai` e `elevenlabs-conversation-v2`
- A migration de `chat_sessions` é idempotente (pode ser executada múltiplas vezes)
- O erro de `MyCompanies.tsx` deve desaparecer após reiniciar o Vite

