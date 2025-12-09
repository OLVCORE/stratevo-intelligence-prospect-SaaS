# 🔥 SOLUÇÃO DIRETA - CONECTAR DADOS À LLM

## 🎯 PROBLEMA IDENTIFICADO

Temos TODOS os dados das 6 etapas do onboarding, mas a LLM não está recebendo ou usando esses dados.

## ✅ SOLUÇÃO PRÁTICA (3 PASSOS)

### PASSO 1: Verificar se os dados estão chegando na Edge Function

Execute este comando no terminal para ver os logs:

```bash
# Ver logs da Edge Function em tempo real
supabase functions logs generate-icp-report --follow
```

Quando gerar um relatório, procure por estas linhas nos logs:
- `[GENERATE-ICP-REPORT] 📊 Report Model COMPLETO`
- `[GENERATE-ICP-REPORT] 🔥 VERIFICAÇÃO CRÍTICA DE DADOS NO REPORT MODEL`

Se você ver `step1_razaoSocial: null` ou `step4_diferenciais: 0`, os dados NÃO estão chegando.

### PASSO 2: Teste Direto - Enviar Dados Mínimos para LLM

Crie um script de teste que envia APENAS os dados do onboarding para a LLM:

```typescript
// Teste simples: enviar só onboardingData para LLM
const testPrompt = `
Você recebeu os dados do onboarding abaixo.

DADOS DO ONBOARDING:
${JSON.stringify(onboardingDataForModel, null, 2)}

TAREFA: Escreva um parágrafo de 3 linhas descrevendo:
1. O nome da empresa (use step1_DadosBasicos.razaoSocial)
2. Os diferenciais (use step4_SituacaoAtual.diferenciais)
3. Os setores-alvo (use step2_SetoresNichos.setoresAlvo)

Se você não encontrar esses dados no JSON acima, escreva "DADOS NÃO ENCONTRADOS".
`;

// Enviar para LLM e ver resposta
```

### PASSO 3: Validar Resposta da LLM

A resposta da LLM deve mencionar:
- ✅ Nome real da empresa (não genérico)
- ✅ Diferenciais reais (não "qualidade" genérico)
- ✅ Setores reais (não "vários setores")

Se a resposta for genérica, o problema está no prompt ou na LLM ignorando os dados.

## 🔧 CORREÇÃO IMEDIATA

Se os dados NÃO estão chegando, o problema está em `buildReportModel`. 

Se os dados ESTÃO chegando mas a LLM ignora, o problema está no prompt.

## 📊 CHECKLIST DE VALIDAÇÃO

- [ ] Logs mostram `step1_razaoSocial` com valor real (não null)
- [ ] Logs mostram `step4_diferenciais` com array não vazio
- [ ] Logs mostram `step5_clientesAtuais` com array não vazio
- [ ] Prompt enviado para LLM contém o JSON completo do `onboardingDataForModel`
- [ ] Resposta da LLM menciona dados reais (não genéricos)

## 🚀 PRÓXIMO PASSO

Execute o teste do PASSO 2 e me envie:
1. O que aparece nos logs quando você gera um relatório
2. A resposta da LLM no teste simples

Com isso, identifico EXATAMENTE onde está o problema e corrijo.

