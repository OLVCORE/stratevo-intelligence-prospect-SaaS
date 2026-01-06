# 🔍 DEBUG: Envio de Conexões LinkedIn

## ✅ CORREÇÕES APLICADAS

### 1. **Variável de Ambiente com Fallback**
- ✅ Agora aceita `PHANTOMBUSTER_AGENT_ID` como fallback
- ✅ Verifica múltiplas variáveis: `PHANTOM_LINKEDIN_CONNECTION_AGENT_ID`, `PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID`, `PHANTOMBUSTER_AGENT_ID`

### 2. **Atualização de Registro Corrigida**
- ✅ Agora usa `connection_id` quando disponível (mais preciso)
- ✅ Fallback para `user_id + profile_url` se `connection_id` não estiver disponível
- ✅ Removido `.order()` e `.limit()` de UPDATE (não funciona no Supabase)

### 3. **Logs Detalhados Adicionados**
- ✅ Logs em TODAS as etapas
- ✅ Payload do PhantomBuster completo
- ✅ Erros detalhados com status codes
- ✅ Resultado bruto do PhantomBuster

### 4. **Payload PhantomBuster Melhorado**
- ✅ Suporta múltiplos formatos de mensagem (`message`, `messages[]`, `customMessage`)
- ✅ Validação de formato antes de enviar

---

## 🧪 COMO TESTAR AGORA

### **1. Verificar Variáveis de Ambiente**

No Supabase Dashboard → Edge Functions → Secrets, você deve ter:
- ✅ `PHANTOMBUSTER_API_KEY` (já tem)
- ✅ `PHANTOMBUSTER_AGENT_ID` (já tem) - **AGORA FUNCIONA!**

### **2. Verificar Logs**

1. Abra o modal de conexão
2. Preencha e envie
3. Abra: Supabase Dashboard → Edge Functions → `send-linkedin-connection` → Logs
4. Procure por:
   - `🔍 Verificando configuração PhantomBuster`
   - `📦 Payload PhantomBuster`
   - `⏳ Agent iniciado`
   - `📊 Resultado bruto do PhantomBuster`

### **3. Verificar Erros**

Se aparecer erro, os logs agora mostram:
- Status code do PhantomBuster
- Mensagem de erro completa
- Payload enviado
- Agent ID usado

---

## 🚨 POSSÍVEIS PROBLEMAS

### **Problema 1: "PhantomBuster não configurado"**

**Solução:**
- Verificar se `PHANTOMBUSTER_API_KEY` está configurada
- Verificar se `PHANTOMBUSTER_AGENT_ID` está configurada
- **AGORA FUNCIONA COM `PHANTOMBUSTER_AGENT_ID`!**

### **Problema 2: "Agent não encontrado (404)"**

**Solução:**
- Verificar se o Agent ID está correto
- Verificar se o Agent é do tipo "LinkedIn Connection Request Sender"
- Verificar se o Agent aceita `sessionCookie` e `profileUrls`

### **Problema 3: "Timeout ao aguardar resultado"**

**Solução:**
- PhantomBuster pode demorar até 2 minutos
- Verificar logs do PhantomBuster Dashboard
- Verificar se o Agent está rodando

### **Problema 4: "Conexão não aparece no LinkedIn"**

**Solução:**
- Verificar logs da Edge Function
- Verificar se `wasSent = true` nos logs
- Verificar se o session cookie está válido
- Verificar se o Agent realmente enviou (PhantomBuster Dashboard)

---

## 📋 CHECKLIST DE DEBUG

- [ ] Variáveis de ambiente configuradas
- [ ] Session cookie válido no perfil
- [ ] Agent ID correto no PhantomBuster
- [ ] Logs da Edge Function mostram payload
- [ ] Logs mostram Agent iniciado
- [ ] Logs mostram resultado do PhantomBuster
- [ ] Registro atualizado no banco (`linkedin_connections`)
- [ ] Convite aparece em invitation-manager

---

## 🔧 PRÓXIMOS PASSOS SE AINDA NÃO FUNCIONAR

1. **Verificar formato do Agent:**
   - O Agent do PhantomBuster pode esperar formato diferente
   - Verificar documentação do Agent específico
   - Ajustar payload conforme necessário

2. **Testar Agent diretamente:**
   - Ir no PhantomBuster Dashboard
   - Testar o Agent manualmente
   - Verificar formato de resposta

3. **Verificar session cookie:**
   - Cookie pode estar expirado
   - Revalidar no sistema
   - Testar com novo cookie

---

## ✅ GARANTIAS

Após essas correções:
- ✅ Sistema aceita `PHANTOMBUSTER_AGENT_ID`
- ✅ Logs detalhados em todas as etapas
- ✅ Atualização de registro corrigida
- ✅ Payload suporta múltiplos formatos
- ✅ Erros mostram informações completas

**TESTE AGORA E VERIFIQUE OS LOGS!**

