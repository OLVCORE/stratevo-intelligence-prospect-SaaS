# 🔒 EXPLICAÇÃO DE SEGURANÇA - POLÍTICAS RLS

## ✅ O QUE ESTÁ PROTEGIDO

### 1. **Usuários Não Autenticados (Público/Anônimo)**
❌ **BLOQUEADOS COMPLETAMENTE**
- Não podem ver NADA
- Não podem inserir NADA
- Não podem atualizar NADA
- Não podem deletar NADA

**Por quê?** Todas as políticas usam `auth.uid() IS NOT NULL`, o que significa que apenas usuários autenticados podem acessar.

---

### 2. **Usuários Autenticados (Logados no Sistema)**
✅ **ACESSO RESTRITO POR TENANT**

#### O que podem fazer:
- ✅ **VER** apenas dados do seu próprio tenant
- ✅ **INSERIR** apenas no seu próprio tenant
- ✅ **ATUALIZAR** apenas dados do seu próprio tenant
- ✅ **DELETAR** apenas dados do seu próprio tenant

#### Como funciona:
```sql
-- Exemplo de política (legal_data)
tenant_id IN (
  SELECT tenant_id FROM public.tenant_users 
  WHERE user_id = auth.uid() AND status = 'active'
)
```

**Isso significa:**
- Usuário só vê dados onde `tenant_id` está na lista de tenants dele
- Usuário só pode inserir/atualizar/deletar se o `tenant_id` for do tenant dele
- **Isolamento total entre tenants** - um tenant não vê dados de outro

---

### 3. **Service Role (Backend/Administrador)**
🔓 **ACESSO TOTAL (BYPASSA RLS)**

O `service_role` é uma chave especial usada pelo backend:
- ✅ **BYPASSA todas as políticas RLS**
- ✅ Pode acessar TODOS os dados
- ✅ Pode fazer QUALQUER operação

**IMPORTANTE:**
- ⚠️ Esta chave **NUNCA** deve ser exposta no frontend
- ⚠️ Deve ser usada **APENAS** em:
  - Edge Functions (serverless)
  - Backend services
  - Scripts administrativos
  - Migrations

---

## 📊 RESUMO POR TIPO DE ACESSO

| Tipo de Usuário | Ver Dados | Inserir | Atualizar | Deletar |
|----------------|-----------|---------|-----------|---------|
| **Público (não logado)** | ❌ Nada | ❌ Nada | ❌ Nada | ❌ Nada |
| **Usuário Autenticado** | ✅ Apenas seu tenant | ✅ Apenas seu tenant | ✅ Apenas seu tenant | ✅ Apenas seu tenant |
| **Service Role** | ✅ Tudo | ✅ Tudo | ✅ Tudo | ✅ Tudo |

---

## 🔐 TABELAS PROTEGIDAS

As seguintes tabelas agora têm RLS habilitado:

1. ✅ `coaching_cards` - Isolamento por tenant
2. ✅ `conversation_analyses` - Isolamento por tenant
3. ✅ `conversation_transcriptions` - Isolamento por tenant
4. ✅ `objection_patterns` - Isolamento por tenant
5. ✅ `qualified_prospects` - Isolamento por tenant
6. ✅ `competitor_stc_matches` - Isolamento via `company_id` → `tenant_id`
7. ✅ `legal_data` - Isolamento por tenant
8. ✅ `purchase_intent_signals` - Isolamento por tenant
9. ✅ `prospect_qualification_jobs` - Isolamento por tenant
10. ✅ `step_registry` - Leitura global, escrita apenas para service_role

---

## ⚠️ PONTOS DE ATENÇÃO

### 1. **Service Role Key**
- 🔴 **NUNCA** exponha a `service_role` key no frontend
- 🔴 **NUNCA** use em código cliente (browser/mobile)
- ✅ Use apenas em Edge Functions e backend

### 2. **Tabelas Sem RLS**
Algumas tabelas podem não ter RLS habilitado ainda. Verifique:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;
```

### 3. **Políticas Permissivas**
Se uma política usar `USING (true)`, ela permite acesso total para aquele tipo de usuário. Verifique:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND (definition LIKE '%USING (true)%' OR definition LIKE '%WITH CHECK (true)%');
```

---

## ✅ CONCLUSÃO

### **Está seguro?**
✅ **SIM**, com as políticas atuais:

1. ✅ **Público não autenticado** → **BLOQUEADO** completamente
2. ✅ **Usuários autenticados** → **ISOLADOS** por tenant
3. ✅ **Service Role** → Acesso total, mas **NUNCA** exposto no frontend

### **Quem pode alterar dados?**
- ✅ **Usuários autenticados** → Apenas dados do seu tenant
- ✅ **Service Role** → Todos os dados (usado apenas no backend)
- ❌ **Público** → Ninguém

### **Recomendações:**
1. ✅ Mantenha a `service_role` key segura
2. ✅ Monitore políticas RLS regularmente
3. ✅ Teste isolamento entre tenants
4. ✅ Use `service_role` apenas em Edge Functions/backend

---

**Data:** 2025-02-24  
**Status:** ✅ Seguro com as políticas atuais

