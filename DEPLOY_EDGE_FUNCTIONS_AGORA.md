# 🚀 DEPLOY DAS EDGE FUNCTIONS - PASSO A PASSO

## ✅ CONFIRMADO: Arquivos Existem Localmente

- ✅ `supabase/functions/find-prospect-website/index.ts` (existe)
- ✅ `supabase/functions/scan-prospect-website/index.ts` (existe)

---

## 📋 MÉTODO 1: Via Supabase CLI (Mais Rápido)

### **Passo 1: Verificar se Supabase CLI está instalado**
```bash
supabase --version
```

Se não estiver instalado:
```bash
# Windows (via Scoop)
scoop install supabase

# OU via npm
npm install -g supabase
```

### **Passo 2: Fazer Login**
```bash
supabase login
```

### **Passo 3: Linkar ao Projeto**
```bash
cd c:\Projects\stratevo-intelligence-prospect
supabase link --project-ref vkdvezuivlovzqxmnohk
```

### **Passo 4: Deploy das Funções**
```bash
# Deploy find-prospect-website
supabase functions deploy find-prospect-website

# Deploy scan-prospect-website
supabase functions deploy scan-prospect-website
```

---

## 📋 MÉTODO 2: Via Supabase Dashboard (Visual)

### **Passo 1: Acessar Edge Functions**
1. Ir para: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Clicar em: **"Deploy a new function"** (botão verde)

### **Passo 2: Deploy find-prospect-website**
1. **Nome da função:** `find-prospect-website`
2. **Método:** "Upload folder"
3. **Selecionar pasta:** `c:\Projects\stratevo-intelligence-prospect\supabase\functions\find-prospect-website`
4. **Clicar em:** Deploy

### **Passo 3: Deploy scan-prospect-website**
1. **Nome da função:** `scan-prospect-website`
2. **Método:** "Upload folder"
3. **Selecionar pasta:** `c:\Projects\stratevo-intelligence-prospect\supabase\functions\scan-prospect-website`
4. **Clicar em:** Deploy

---

## 🔧 CONFIGURAR VARIÁVEIS DE AMBIENTE (OBRIGATÓRIO)

### **No Supabase Dashboard:**
1. Ir para: **Settings** → **Edge Functions** → **Secrets**
2. Adicionar/Verificar:

```
SERPER_API_KEY = sua_chave_serper_aqui
OPENAI_API_KEY = sua_chave_openai_aqui
SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key_aqui
```

**⚠️ IMPORTANTE:** Sem essas variáveis, as funções não funcionarão!

---

## ✅ VERIFICAR DEPLOY

### **Após deploy, verificar:**
1. Ir para: **Edge Functions** no Dashboard
2. Procurar por: `find-prospect-website` e `scan-prospect-website`
3. **Deve aparecer** na lista (não mais "No results found")

### **Testar via Dashboard:**
1. Clicar na função `find-prospect-website`
2. Ir para aba **"Invoke"**
3. Testar com:
```json
{
  "razao_social": "Uniluvas Indústria e Comércio de Luvas",
  "cnpj": "12345678000190",
  "tenant_id": "seu_tenant_id_aqui"
}
```

---

## 🐛 TROUBLESHOOTING

### **Erro: "Function not found"**
- Aguardar alguns segundos após deploy
- Recarregar a página do Dashboard
- Verificar se o nome está correto (sem espaços, sem caracteres especiais)

### **Erro: "SERPER_API_KEY não configurada"**
- Verificar se a variável está nas Secrets
- Verificar se o nome está exatamente: `SERPER_API_KEY` (maiúsculas)
- Fazer redeploy após adicionar a variável

### **Erro: "Permission denied"**
- Verificar se está logado no Supabase CLI
- Verificar se o projeto está linkado corretamente
- Verificar permissões do projeto

---

## 📝 CHECKLIST FINAL

Antes de testar:
- [ ] Edge Functions deployadas (aparecem no Dashboard)
- [ ] Variáveis de ambiente configuradas (SERPER, OPENAI, SERVICE_ROLE)
- [ ] Migration aplicada no banco (20250221000001_prospect_extracted_products.sql)
- [ ] Teste rápido via Dashboard funciona

---

## 🎯 PRÓXIMO PASSO APÓS DEPLOY

1. ✅ Aplicar migration no banco
2. ✅ Testar qualificação com planilha
3. ✅ Verificar dados salvos
4. ✅ Adicionar colunas visuais no frontend

