# ✅ DEPLOY CONCLUÍDO - Próximos Passos

## 🎉 STATUS ATUAL

✅ **Edge Functions Deployadas:**
- ✅ `find-prospect-website` → Deployado com sucesso
- ✅ `scan-prospect-website` → Deployado com sucesso

**Dashboard:** https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions

---

## 📋 PRÓXIMOS PASSOS OBRIGATÓRIOS

### **1. ✅ CONFIGURAR VARIÁVEIS DE AMBIENTE (CRÍTICO)**

**No Supabase Dashboard:**
1. Ir para: **Settings** → **Edge Functions** → **Secrets**
2. Adicionar/Verificar estas 3 variáveis:

```
SERPER_API_KEY = sua_chave_serper
OPENAI_API_KEY = sua_chave_openai
SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key
```

**⚠️ SEM ISSO, AS FUNÇÕES NÃO FUNCIONARÃO!**

---

### **2. ✅ APLICAR MIGRATION NO BANCO**

**Arquivo:** `supabase/migrations/20250221000001_prospect_extracted_products.sql`

**No Supabase Dashboard:**
1. Ir para: **SQL Editor**
2. Clicar em: **"New query"**
3. Copiar e colar o conteúdo completo do arquivo
4. Clicar em: **"Run"**

**O que faz:**
- Cria tabela `prospect_extracted_products`
- Adiciona colunas em `qualified_prospects`:
  - `website_encontrado`
  - `website_fit_score`
  - `website_products_match`
  - `linkedin_url`

---

### **3. ✅ TESTAR AS FUNÇÕES**

#### **Teste 1: find-prospect-website**

**No Dashboard Supabase:**
1. Ir para: **Edge Functions** → **find-prospect-website**
2. Clicar em: **"Invoke"** (aba)
3. Testar com:
```json
{
  "razao_social": "Uniluvas Indústria e Comércio de Luvas",
  "cnpj": "12345678000190",
  "tenant_id": "seu_tenant_id_aqui"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "website": "https://www.uniluvas.com.br",
  "confidence": 95
}
```

#### **Teste 2: scan-prospect-website**

**No Dashboard Supabase:**
1. Ir para: **Edge Functions** → **scan-prospect-website**
2. Clicar em: **"Invoke"** (aba)
3. Testar com:
```json
{
  "tenant_id": "seu_tenant_id_aqui",
  "qualified_prospect_id": "temp",
  "website_url": "https://www.uniluvas.com.br",
  "razao_social": "Uniluvas"
}
```

**Resposta esperada:**
```json
{
  "success": true,
  "products_found": 14,
  "products_inserted": 14,
  "compatible_products": 9
}
```

---

### **4. ✅ TESTAR FLUXO COMPLETO**

#### **Teste: Upload de Planilha SEM Website**

1. Ir para: `/leads/qualification-engine`
2. Upload de CSV com CNPJs (sem coluna website)
3. Executar qualificação
4. **Verificar:**
   - ✅ Website foi buscado automaticamente
   - ✅ Website salvo em `qualified_prospects.website_encontrado`
   - ✅ Website Fit Score calculado
   - ✅ LinkedIn encontrado (se disponível)

#### **Teste: Verificar Dados no Estoque Qualificado**

1. Ir para: `/leads/qualified-stock`
2. **Verificar:**
   - ✅ Dados aparecem corretamente
   - ✅ Website está presente
   - ✅ Website Fit Score está presente

---

## ✅ CHECKLIST FINAL

### Antes de Testar:
- [x] Edge Functions deployadas ✅
- [ ] Variáveis de ambiente configuradas (SERPER, OPENAI, SERVICE_ROLE)
- [ ] Migration aplicada no banco

### Durante os Testes:
- [ ] Teste 1: find-prospect-website funciona
- [ ] Teste 2: scan-prospect-website funciona
- [ ] Teste 3: Upload de planilha → Website buscado automaticamente
- [ ] Teste 4: Dados aparecem no Estoque Qualificado

---

## 🐛 TROUBLESHOOTING

### **Erro: "SERPER_API_KEY não configurada"**
**Solução:**
- Ir para Settings → Edge Functions → Secrets
- Adicionar `SERPER_API_KEY` com valor correto
- Fazer redeploy (ou aguardar alguns segundos)

### **Erro: "SERVICE_ROLE_KEY não configurada"**
**Solução:**
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está nas Secrets
- Verificar se está sendo lida corretamente

### **Erro: Migration não aplica**
**Solução:**
- Verificar se já existe tabela `prospect_extracted_products`
- Verificar se colunas já existem em `qualified_prospects`
- Se já existem, migration pode dar erro (mas está OK)

---

## 🎯 RESUMO

**✅ FEITO:**
- Edge Functions deployadas via CLI

**⏳ FALTANDO:**
1. Configurar 3 variáveis de ambiente (Secrets)
2. Aplicar 1 migration (SQL Editor)
3. Testar fluxo completo

---

## 📝 NOTA IMPORTANTE

**Método correto de deploy:** Via CLI (como você fez)
- ✅ Mais rápido
- ✅ Mais confiável
- ✅ Não depende de interface visual

**Dashboard:** Apenas para gerenciar e testar (não para deploy via upload)

