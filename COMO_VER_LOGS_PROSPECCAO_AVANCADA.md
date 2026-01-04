# 🔍 Como Ver os Logs da Prospecção Avançada

## 📍 ONDE VER OS LOGS

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions**
2. Clique em **`prospeccao-avancada-buscar`**
3. Clique na aba **"Logs"** ou **"Invoke logs"**
4. Filtre por **"Last 1 hour"** ou **"Last 24 hours"**

### Opção 2: Via Terminal (CLI)

```bash
# Ver logs em tempo real
supabase functions logs prospeccao-avancada-buscar --follow

# Ver últimos 100 logs
supabase functions logs prospeccao-avancada-buscar --limit 100
```

## 🔍 O QUE PROCURAR NOS LOGS

### ✅ SE ESTIVER FUNCIONANDO:

```
[ProspeccaoAvancada] 📥 Request recebido: { filtros: {...}, tenant_id: "..." }
[ProspeccaoAvancada] 🚀 Iniciando busca com filtros: {...}
[ProspeccaoAvancada] 📦 Produtos do tenant para busca: X
[ProspeccaoAvancada] 🔍 Iniciando buscas paralelas...
[ProspeccaoAvancada] ✅ EmpresaQui retornou: X empresas
[ProspeccaoAvancada] ✅ SERPER encontrou X empresas únicas
[ProspeccaoAvancada] 📊 Resultados brutos - EmpresaQui: X | SERPER: Y
[ProspeccaoAvancada] 📊 Empresas processadas (antes do filtro): Z
[ProspeccaoAvancada] ✅ Total final (após filtro): W
```

### ❌ SE NÃO ESTIVER FUNCIONANDO:

#### Problema 1: Nenhuma empresa encontrada
```
[ProspeccaoAvancada] ⚠️ NENHUMA empresa encontrada nas APIs! Verificar:
  - EMPRESAQUI_API_KEY configurada? false
  - SERPER_API_KEY configurada? false
```

**Solução:**
- Verificar se as API keys estão configuradas no Supabase Dashboard
- Settings → Edge Functions → Secrets

#### Problema 2: EmpresaQui retornou 0 empresas
```
[ProspeccaoAvancada] ✅ EmpresaQui retornou: 0 empresas
```

**Possíveis causas:**
- Filtros muito restritivos (segmento/localização não encontrado)
- API key inválida ou sem créditos
- Erro na API do EmpresaQui

**Solução:**
- Tentar busca sem filtros primeiro
- Verificar créditos da API EmpresaQui
- Verificar se a API key está correta

#### Problema 3: SERPER retornou 0 empresas
```
[ProspeccaoAvancada] ✅ SERPER encontrou 0 empresas únicas
```

**Possíveis causas:**
- Query muito específica
- Filtros muito restritivos
- API key inválida ou sem créditos

**Solução:**
- Verificar se SERPER_API_KEY está configurada
- Tentar busca mais genérica (sem produtos do tenant)

#### Problema 4: Todas as empresas foram filtradas
```
[ProspeccaoAvancada] ⚠️ Todas as empresas foram filtradas (sem site/LinkedIn/decisores)
```

**Causa:** Empresas encontradas não têm site, LinkedIn ou decisores

**Solução:**
- Relaxar filtro de fit (aceitar empresas sem decisores)
- Verificar se Apollo/Hunter estão funcionando

## 📊 LOGS DETALHADOS POR ETAPA

### 1. Recebimento da Requisição
```
[ProspeccaoAvancada] 📥 Request recebido: { filtros: {...}, tenant_id: "..." }
```
- Verificar se `tenant_id` está presente
- Verificar se `filtros` estão corretos

### 2. Busca de Produtos do Tenant
```
[ProspeccaoAvancada] 📦 Produtos do tenant para busca: X
[ProspeccaoAvancada] 📦 Primeiros produtos: [...]
```
- Se `X = 0`, a busca será baseada apenas em segmento/localização
- Se `X > 0`, a busca usará os produtos para gerar queries no SERPER

### 3. Busca nas APIs
```
[ProspeccaoAvancada] 🔍 EmpresaQui URL: https://api.empresaqui.com.br/...
[ProspeccaoAvancada] ✅ EmpresaQui retornou: X empresas
[ProspeccaoAvancada] 🔍 Query SERPER: ...
[ProspeccaoAvancada] ✅ SERPER encontrou X empresas únicas
```

### 4. Processamento
```
[ProspeccaoAvancada] 📊 Empresas processadas (antes do filtro): X
[ProspeccaoAvancada] ⚠️ Empresa filtrada (sem fit): ...
[ProspeccaoAvancada] ✅ Total final (após filtro): Y
```

## 🚨 ERROS COMUNS E SOLUÇÕES

### Erro: "tenant_id é obrigatório"
- **Causa:** Frontend não está enviando `tenant_id`
- **Solução:** Verificar se o contexto do tenant está funcionando

### Erro: "EMPRESAQUI_API_KEY não configurada"
- **Causa:** API key não está nas variáveis de ambiente do Supabase
- **Solução:** Adicionar no Dashboard → Settings → Edge Functions → Secrets

### Erro: "SERPER_API_KEY não configurada"
- **Causa:** API key não está nas variáveis de ambiente do Supabase
- **Solução:** Adicionar no Dashboard → Settings → Edge Functions → Secrets

### Erro: "Nenhuma empresa encontrada"
- **Causa:** Filtros muito restritivos ou APIs sem resultados
- **Solução:** 
  1. Tentar busca sem filtros
  2. Verificar se as APIs têm créditos
  3. Verificar logs detalhados acima

## 📝 EXEMPLO DE LOG COMPLETO (SUCESSO)

```
[ProspeccaoAvancada] 📥 Request recebido: { filtros: { segmento: "Tecnologia", localizacao: "São Paulo" }, tenant_id: "533568b9-895f-4c9e-bfd7-50b76ae24a71" }
[ProspeccaoAvancada] 🚀 Iniciando busca com filtros: { "segmento": "Tecnologia", "localizacao": "São Paulo" }
[ProspeccaoAvancada] 📦 Produtos do tenant para busca: 5
[ProspeccaoAvancada] 📦 Primeiros produtos: ["Software ERP", "Sistema de Gestão", ...]
[ProspeccaoAvancada] 🔍 Iniciando buscas paralelas...
[ProspeccaoAvancada] 🔍 EmpresaQui URL: https://api.empresaqui.com.br/v1/empresas/busca?razao_social=Tecnologia&cidade=São Paulo&limit=30
[ProspeccaoAvancada] ✅ EmpresaQui retornou: 15 empresas
[ProspeccaoAvancada] 📋 Primeiras empresas EmpresaQui: [...]
[ProspeccaoAvancada] 🔍 Query SERPER: empresas que compram ("Software ERP" OR "Sistema de Gestão") ...
[ProspeccaoAvancada] ✅ SERPER encontrou 8 empresas únicas
[ProspeccaoAvancada] 📊 Resultados brutos - EmpresaQui: 15 | SERPER: 8
[ProspeccaoAvancada] 📊 Empresas processadas (antes do filtro): 20
[ProspeccaoAvancada] ✅ Total final (após filtro): 18
```

## 🎯 PRÓXIMOS PASSOS SE NÃO FUNCIONAR

1. **Copie os logs completos** do Supabase Dashboard
2. **Verifique as API keys** no Dashboard → Settings → Edge Functions → Secrets
3. **Teste sem filtros** primeiro (deixe todos os campos vazios)
4. **Verifique créditos** das APIs (EmpresaQui, SERPER, Apollo, Hunter)

