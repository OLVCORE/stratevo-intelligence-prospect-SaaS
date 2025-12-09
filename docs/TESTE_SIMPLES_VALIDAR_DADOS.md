# 🧪 TESTE SIMPLES - VALIDAR SE DADOS CHEGAM NA LLM

## 🎯 OBJETIVO

Validar se os dados das 6 etapas do onboarding estão chegando na LLM.

## 📋 PASSO A PASSO

### 1. Gerar um Relatório e Ver os Logs

1. No Supabase Dashboard, vá em **Edge Functions** → **generate-icp-report** → **Logs**
2. Gere um novo relatório pela interface
3. Procure nos logs por estas linhas:

```
[GENERATE-ICP-REPORT] 🔥🔥🔥 ONBOARDING DATA COMPLETO (JSON):
[BUILD-LLM-PROMPT] 🔥🔥🔥 ONBOARDING DATA COMPLETO ENVIADO PARA LLM:
[GENERATE-ICP-REPORT] 🔥 VERIFICAÇÃO CRÍTICA DE DADOS NO REPORT MODEL:
```

### 2. Verificar o que aparece nos logs

**Se você ver:**
- `step1_razaoSocial: "UNI LUVAS CONFECCAO DE LUVAS LTDA"` ✅ DADOS CHEGANDO
- `step4_diferenciais: 3` (número > 0) ✅ DADOS CHEGANDO
- `step5_clientes: 5` (número > 0) ✅ DADOS CHEGANDO

**Se você ver:**
- `step1_razaoSocial: null` ❌ DADOS NÃO CHEGANDO
- `step4_diferenciais: 0` ❌ DADOS NÃO CHEGANDO
- `step5_clientes: 0` ❌ DADOS NÃO CHEGANDO

### 3. Verificar o JSON completo enviado para LLM

Procure no log por:
```
[BUILD-LLM-PROMPT] 🔥🔥🔥 ONBOARDING DATA COMPLETO ENVIADO PARA LLM:
```

Copie esse JSON e verifique se contém:
- `step1_DadosBasicos` com `razaoSocial`, `cnpj`, etc.
- `step4_SituacaoAtual` com `diferenciais` (array não vazio)
- `step5_HistoricoEEnriquecimento` com `clientesAtuais` (array não vazio)

## 🔍 O QUE FAZER COM OS RESULTADOS

### Cenário A: Dados ESTÃO chegando (logs mostram valores reais)

**Problema:** A LLM está ignorando os dados.

**Solução:** O prompt precisa ser mais enfático. Vou ajustar o `SYSTEM_PROMPT` para forçar a LLM a usar os dados.

### Cenário B: Dados NÃO estão chegando (logs mostram null/0)

**Problema:** Os dados não estão sendo carregados do banco ou não estão sendo passados para o `reportModel`.

**Solução:** Verificar:
1. Se o onboarding foi completado (todas as 6 etapas)
2. Se os dados estão no banco (usar o script SQL de verificação)
3. Se a função `buildReportModel` está buscando corretamente

## 📊 ENVIE PARA MIM

Depois de gerar um relatório, me envie:

1. **Os logs** (especialmente as linhas com `🔥🔥🔥`)
2. **O que aparece** em `step1_razaoSocial`, `step4_diferenciais`, `step5_clientes`
3. **Um trecho do JSON** do `onboardingData` que foi enviado para a LLM

Com isso, identifico EXATAMENTE onde está o problema e corrijo.

## 🚀 PRÓXIMO PASSO

Execute o teste acima e me envie os resultados. Vou corrigir o problema específico que aparecer.

