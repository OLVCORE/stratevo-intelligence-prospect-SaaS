# 🔥 Correção: Inclusão de TODOS os Dados das 6 Etapas do Onboarding

## Problema Identificado

O `onboardingDataForModel` estava incluindo apenas campos selecionados das etapas do onboarding, perdendo dados importantes que estão disponíveis na plataforma.

## Solução Implementada

### 1. Logs Detalhados Adicionados
- ✅ Logs dos dados do onboarding (concorrentes, diferenciais, clientes, benchmarking)
- ✅ Logs dos primeiros dados reais encontrados
- ✅ Verificação crítica dos dados no `reportModel` antes de enviar ao LLM

### 2. Prompt Reforçado
- ✅ Exemplos concretos de como usar cada tipo de dado
- ✅ Instruções explícitas para listar concorrentes, produtos e clientes reais
- ✅ Proibição explícita de frases genéricas como "faltando concorrentes"

### 3. Validação Pré-LLM
- ✅ Verificação se os dados estão presentes no `reportModel`
- ✅ Logs mostrando exatamente quais dados estão disponíveis
- ✅ Alertas quando dados importantes estão faltando

## Próximos Passos Necessários

### Alteração no `buildReportModel` (linha ~797)

O `onboardingDataForModel` precisa ser expandido para incluir TODOS os dados das 6 etapas:

```typescript
const onboardingDataForModel: any = {
  // Campos simplificados (mantidos para compatibilidade)
  diferenciais: onboardingData.step4_SituacaoAtual?.diferenciais || [],
  casosDeUso: onboardingData.step4_SituacaoAtual?.casosDeUso || [],
  ticketsECiclos: onboardingData.step4_SituacaoAtual?.ticketsECiclos || [],
  categoriaSolucao: onboardingData.step4_SituacaoAtual?.categoriaSolucao,
  setoresAlvo: step2.setoresAlvo || step3.setoresAlvo || [],
  nichosAlvo: step2.nichosAlvo || step3.nichosAlvo || [],
  cnaesAlvo: step2.cnaesAlvo || step3.cnaesAlvo || [],
  porteAlvo: step3.porteAlvo || [],
  localizacaoAlvo: step3.localizacaoAlvo || {},
  faturamentoAlvo: step3.faturamentoAlvo || {},
  funcionariosAlvo: step3.funcionariosAlvo || [],
  
  // 🔥🔥🔥 DADOS COMPLETOS DAS 6 ETAPAS (adicionados)
  step1_DadosBasicos: {
    razaoSocial: onboardingData.step1_DadosBasicos?.razaoSocial,
    nomeFantasia: onboardingData.step1_DadosBasicos?.nomeFantasia,
    cnpj: onboardingData.step1_DadosBasicos?.cnpj,
    setorPrincipal: onboardingData.step1_DadosBasicos?.setorPrincipal,
    porteEmpresa: onboardingData.step1_DadosBasicos?.porteEmpresa,
    capitalSocial: onboardingData.step1_DadosBasicos?.capitalSocial,
    endereco: onboardingData.step1_DadosBasicos?.endereco,
    concorrentesDiretos: onboardingData.step1_DadosBasicos?.concorrentesDiretos || [],
    clientesAtuais: onboardingData.step1_DadosBasicos?.clientesAtuais || [],
  },
  step2_SetoresNichos: {
    setoresAlvo: step2.setoresAlvo || [],
    nichosAlvo: step2.nichosAlvo || [],
    cnaesAlvo: step2.cnaesAlvo || [],
  },
  step3_PerfilClienteIdeal: {
    setoresAlvo: step3.setoresAlvo || [],
    nichosAlvo: step3.nichosAlvo || [],
    cnaesAlvo: step3.cnaesAlvo || [],
    ncmsAlvo: step3.ncmsAlvo || [],
    porteAlvo: step3.porteAlvo || [],
    localizacaoAlvo: step3.localizacaoAlvo || {},
    faturamentoAlvo: step3.faturamentoAlvo || {},
    funcionariosAlvo: step3.funcionariosAlvo || {},
    caracteristicasEspeciais: step3.caracteristicasEspeciais || [],
  },
  step4_SituacaoAtual: {
    categoriaSolucao: onboardingData.step4_SituacaoAtual?.categoriaSolucao,
    diferenciais: onboardingData.step4_SituacaoAtual?.diferenciais || [],
    casosDeUso: onboardingData.step4_SituacaoAtual?.casosDeUso || [],
    ticketsECiclos: onboardingData.step4_SituacaoAtual?.ticketsECiclos || [],
    ticketMedio: onboardingData.step4_SituacaoAtual?.ticketMedio,
    cicloVendaMedia: onboardingData.step4_SituacaoAtual?.cicloVendaMedia,
    concorrentesDiretos: onboardingData.step4_SituacaoAtual?.concorrentesDiretos || [],
  },
  step5_HistoricoEEnriquecimento: {
    clientesAtuais: onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais || [],
    empresasBenchmarking: onboardingData.step5_HistoricoEEnriquecimento?.empresasBenchmarking || [],
  },
};
```

## Status

✅ Logs detalhados implementados
✅ Prompt reforçado com exemplos
✅ Validação pré-LLM implementada
⏳ **PENDENTE**: Expansão do `onboardingDataForModel` para incluir todas as 6 etapas

## Como Testar

1. Gerar um novo relatório
2. Verificar os logs da Edge Function no Supabase Dashboard
3. Confirmar que os dados das 6 etapas aparecem nos logs
4. Verificar se o relatório gerado usa os dados reais

