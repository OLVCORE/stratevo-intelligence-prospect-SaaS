# 🧪 Como Testar a Prospecção Avançada

## ✅ Passo 1: Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba **Console**
3. Faça uma busca no Motor de Busca Avançada
4. Procure por logs que começam com:
   - `[EnrichmentService]`
   - `[ProspeccaoAvancada]`

## ✅ Passo 2: Verificar Network Tab

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Faça uma busca
4. Procure por uma requisição para `prospeccao-avancada-buscar`
5. Clique na requisição e veja:
   - **Request Payload**: Deve ter `filtros` e `tenant_id`
   - **Response**: Deve ter `sucesso: true` e `empresas: [...]`

## ✅ Passo 3: Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Clique em `prospeccao-avancada-buscar`
3. Veja os logs mais recentes
4. Procure por:
   - `[ProspeccaoAvancada] 🚀 Iniciando busca`
   - `[ProspeccaoAvancada] 📦 Produtos do tenant`
   - `[ProspeccaoAvancada] ✅ SERPER encontrou`
   - `[ProspeccaoAvancada] ✅ Total encontrado`

## 🔍 Problemas Comuns

### ❌ "Nenhuma empresa encontrada"

**Possíveis causas:**
1. **SERPER_API_KEY não configurada** → Verificar variáveis de ambiente no Supabase
2. **Sem produtos no tenant** → Adicionar produtos em `tenant_products`
3. **Filtros muito restritivos** → Tentar busca sem filtros
4. **APIs externas falhando** → Verificar logs da Edge Function

### ❌ "Erro ao buscar empresas"

**Verificar:**
1. Console do navegador para ver erro completo
2. Network tab para ver status HTTP (deve ser 200)
3. Logs da Edge Function no Supabase Dashboard

### ❌ "Ainda mostra empresa hardcoded"

**Isso NÃO deveria acontecer!** Se acontecer:
1. Limpar cache do navegador (Ctrl+Shift+R)
2. Verificar se a Edge Function foi deployada (versão mais recente)
3. Verificar resposta no Network tab - deve vir da Edge Function, não mockado

## 🚀 Teste Manual via cURL

```bash
curl -X POST \
  'https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/prospeccao-avancada-buscar' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "filtros": {
      "segmento": "Tecnologia",
      "localizacao": "São Paulo"
    },
    "tenant_id": "SEU_TENANT_ID"
  }'
```

## 📝 Checklist de Debug

- [ ] Console mostra `[EnrichmentService] 🚀 Chamando Edge Function`
- [ ] Network tab mostra requisição para `prospeccao-avancada-buscar`
- [ ] Resposta tem `sucesso: true`
- [ ] Resposta tem array `empresas` (pode estar vazio se não encontrou)
- [ ] Logs da Edge Function mostram busca sendo executada
- [ ] SERPER_API_KEY está configurada no Supabase
- [ ] Tenant tem produtos cadastrados (opcional, mas melhora resultados)

