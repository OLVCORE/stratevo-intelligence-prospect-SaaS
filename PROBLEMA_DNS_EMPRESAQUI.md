# 🔍 Problema DNS: API EmpresaQui não está acessível

## ❌ Erro Identificado

```
dns error: failed to lookup address information: Name or service not known
```

O Edge Function do Supabase **não consegue resolver o DNS** de `api.empresaqui.com.br`.

## 🔧 Correções Implementadas

### 1. **Retry com Backoff**
- ✅ 3 tentativas automáticas com delay crescente (1s, 2s)
- ✅ Timeout de 10 segundos por tentativa
- ✅ Detecta especificamente erros DNS e tenta novamente

### 2. **Logs Detalhados**
- ✅ Preview da API Key (primeiros 10 caracteres)
- ✅ URL completa sendo chamada
- ✅ Mensagens específicas para erro DNS

### 3. **Tratamento de Erro Específico**
- ✅ Detecta erros DNS vs outros tipos de erro
- ✅ Logs informativos para diagnóstico

## 🔍 Possíveis Causas

### 1. **Problema Temporário de Rede/DNS**
- ⚠️ Pode ser intermitente
- ✅ **Solução:** Retry implementado (3 tentativas)

### 2. **URL da API Incorreta**
- ⚠️ Verificar se `https://api.empresaqui.com.br/v1/empresas/busca` está correto
- ✅ **Verificação:** Outros Edge Functions usam a mesma URL

### 3. **API EmpresaQui Offline**
- ⚠️ Servidor pode estar temporariamente indisponível
- ✅ **Solução:** Retry ajuda a contornar

### 4. **Restrições de Rede no Supabase Edge Functions**
- ⚠️ Pode haver bloqueio de DNS específico
- ✅ **Verificação:** Testar com outras APIs externas

## 📋 Próximos Passos para Diagnóstico

### 1. **Verificar Logs Após Deploy**
```bash
# Acesse: Supabase Dashboard → Edge Functions → prospeccao-avancada-buscar → Logs
# Procure por:
# - "🔑 API Key detectada (preview): a8725d0dbe..."
# - "🔄 Retry X/3..."
# - "❌ Erro DNS persistente após 3 tentativas"
```

### 2. **Testar API EmpresaQui Manualmente**
```bash
# Teste se a API está acessível:
curl -H "Authorization: Bearer a8725d0dbe..." \
  "https://api.empresaqui.com.br/v1/empresas/busca?cnae=6201-5&situacao=ATIVA&limit=5"
```

### 3. **Verificar Status da API EmpresaQui**
- Acesse: https://empresaqui.com.br
- Verifique se há avisos de manutenção
- Entre em contato com suporte da EmpresaQui se necessário

### 4. **Alternativa: Usar Outra Fonte de Dados**
Se o problema persistir, podemos:
- Usar BrasilAPI para dados cadastrais
- Usar ReceitaWS como fallback
- Implementar cache local de empresas já encontradas

## ✅ O Que Foi Feito

1. ✅ Adicionado retry automático (3 tentativas)
2. ✅ Timeout de 10 segundos por requisição
3. ✅ Logs detalhados para diagnóstico
4. ✅ Tratamento específico de erro DNS
5. ✅ Preview da API Key nos logs (para verificação)

## 🚀 Deploy

As correções foram commitadas e enviadas. Após o deploy no Supabase:

1. **Aguarde 1-2 minutos** para o Edge Function atualizar
2. **Faça uma nova busca** no frontend
3. **Verifique os logs** no Supabase Dashboard
4. **Procure por:**
   - `🔑 API Key detectada` - confirma qual chave está sendo usada
   - `🔄 Retry` - mostra tentativas de reconexão
   - `❌ Erro DNS` - confirma se o problema persiste

## 📞 Se o Problema Persistir

1. **Verifique a API Key:**
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Confirme que `EMPRESASAQUI_API_KEY` está configurada
   - Valor deve começar com `a8725d0dbe...`

2. **Teste a API Manualmente:**
   - Use Postman ou curl para testar diretamente
   - Se funcionar localmente mas não no Supabase, pode ser restrição de rede

3. **Entre em Contato:**
   - Suporte EmpresaQui: verificar se há problemas conhecidos
   - Supabase Support: verificar se há restrições de DNS

## 🔄 Status Atual

- ✅ **Retry implementado** - 3 tentativas automáticas
- ✅ **Logs melhorados** - diagnóstico detalhado
- ⏳ **Aguardando teste** - após deploy, verificar se resolve

