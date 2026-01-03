# 🔍 DEBUG: Erro 500 na Edge Function

**Problema:** Edge Function retorna 500 (Internal Server Error)

## ✅ Correções Aplicadas

1. **Função `normalizarFiltros` mais robusta:**
   - Valida se `filtros` é objeto válido
   - Valida tipos antes de usar
   - Trata `undefined` e `null` corretamente

2. **Função `buscarViaEmpresaQui` corrigida:**
   - Recebe `metaCandidates` como parâmetro
   - Remove cálculo duplicado

3. **Tratamento de erros melhorado:**
   - Valida `filtrosRaw` antes de normalizar

## 🔍 Como Verificar os Logs

### **1. Acessar Logs no Supabase Dashboard:**
```
1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Clique em "prospeccao-avancada-buscar"
3. Vá para a aba "Logs"
4. Procure por erros recentes
```

### **2. Logs Esperados (se funcionando):**
```
[ProspeccaoAvancada] 📥 Request recebido: { filtros: {...}, tenant_id: "..." }
[ProspeccaoAvancada] 🚀 Iniciando busca: { quantidadeDesejada: 20, ... }
[ProspeccaoAvancada] 🎯 Meta candidatas: 60
[ProspeccaoAvancada] 🔍 Buscando candidatas no EmpresaQui...
```

### **3. Logs de Erro (se falhando):**
```
[ProspeccaoAvancada] ❌ Erro: ...
```

## 🐛 Possíveis Causas do Erro 500

### **1. EMPRESAQUI_API_KEY não configurada:**
- **Sintoma:** Erro 500 com `error_code: "MISSING_EMPRESAQUI_API_KEY"`
- **Solução:** Configurar no Supabase Dashboard → Settings → Edge Functions → Secrets

### **2. Erro na API EmpresaQui:**
- **Sintoma:** Logs mostram erro ao chamar `https://api.empresaqui.com.br`
- **Solução:** Verificar se a API key é válida e se há rate limit

### **3. Erro de sintaxe TypeScript:**
- **Sintoma:** Erro ao fazer deploy
- **Solução:** Já corrigido - deploy foi bem-sucedido

### **4. Erro ao acessar Supabase:**
- **Sintoma:** Erro ao criar cliente Supabase
- **Solução:** Verificar se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configurados

## ✅ Próximos Passos

1. **Testar novamente a busca**
2. **Verificar logs no Supabase Dashboard**
3. **Compartilhar logs de erro** se o problema persistir

## 📝 Comando para Testar Localmente (Opcional)

```bash
# Testar a Edge Function localmente
supabase functions serve prospeccao-avancada-buscar

# Em outro terminal, fazer requisição de teste:
curl -X POST http://localhost:54321/functions/v1/prospeccao-avancada-buscar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "filtros": {
      "segmento": "Manufatura",
      "localizacao": "São Paulo, SP",
      "quantidadeDesejada": 10
    },
    "tenant_id": "YOUR_TENANT_ID"
  }'
```

---

**Status:** ✅ Deploy realizado com sucesso  
**Próximo passo:** Testar novamente e verificar logs

