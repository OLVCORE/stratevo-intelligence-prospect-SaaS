// =====================================================
// PATCH: Adicionar dados completos das 6 etapas ao onboardingDataForModel
// =====================================================
// 
// INSTRUÇÕES:
// 1. Abra: supabase/functions/generate-icp-report/index.ts
// 2. Localize a linha 798: const onboardingDataForModel = {
// 3. Substitua TODO o bloco até a linha 810 (antes de "// 7. 🔥 NOVO: Análise Competitiva")
// 4. Cole o código abaixo
// 
// =====================================================

// 🔥🔥🔥 SUBSTITUIR ESTE BLOCO (linhas 797-810):
/*
  // 7. 🔥 DADOS COMPLETOS DO ONBOARDING (para LLM usar)
  const onboardingDataForModel = {
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
  };
*/

// 🔥🔥🔥 POR ESTE BLOCO COMPLETO:
/*
  // 7. 🔥🔥🔥 DADOS COMPLETOS DAS 6 ETAPAS DO ONBOARDING (TUDO para LLM usar)
  // ⚠️ CRÍTICO: Incluir TODOS os dados das 6 etapas, não apenas campos selecionados
  const onboardingDataForModel: any = {
    // Campos simplificados para compatibilidade (mantidos para não quebrar código existente)
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
    
    // 🔥🔥🔥 DADOS COMPLETOS DAS 6 ETAPAS (adicionados para LLM usar TODOS os dados)
    step1_DadosBasicos: {
      razaoSocial: onboardingData.step1_DadosBasicos?.razaoSocial,
      nomeFantasia: onboardingData.step1_DadosBasicos?.nomeFantasia,
      cnpj: onboardingData.step1_DadosBasicos?.cnpj,
      email: onboardingData.step1_DadosBasicos?.email,
      telefone: onboardingData.step1_DadosBasicos?.telefone,
      website: onboardingData.step1_DadosBasicos?.website,
      setorPrincipal: onboardingData.step1_DadosBasicos?.setorPrincipal,
      porteEmpresa: onboardingData.step1_DadosBasicos?.porteEmpresa,
      capitalSocial: onboardingData.step1_DadosBasicos?.capitalSocial,
      naturezaJuridica: onboardingData.step1_DadosBasicos?.naturezaJuridica,
      dataAbertura: onboardingData.step1_DadosBasicos?.dataAbertura,
      situacaoCadastral: onboardingData.step1_DadosBasicos?.situacaoCadastral,
      cnaePrincipal: onboardingData.step1_DadosBasicos?.cnaePrincipal,
      cnaesSecundarios: onboardingData.step1_DadosBasicos?.cnaesSecundarios || [],
      endereco: onboardingData.step1_DadosBasicos?.endereco,
      // 🔥 CRÍTICO: Concorrentes do Step 1
      concorrentesDiretos: onboardingData.step1_DadosBasicos?.concorrentesDiretos || [],
      // 🔥 CRÍTICO: Clientes do Step 1
      clientesAtuais: onboardingData.step1_DadosBasicos?.clientesAtuais || [],
    },
    step2_SetoresNichos: {
      setoresAlvo: step2.setoresAlvo || [],
      nichosAlvo: step2.nichosAlvo || [],
      cnaesAlvo: step2.cnaesAlvo || [],
      setoresAlvoCodes: step2.setoresAlvoCodes || [],
      customSectorNames: step2.customSectorNames || {},
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
      // 🔥 CRÍTICO: Diferenciais REAIS
      diferenciais: onboardingData.step4_SituacaoAtual?.diferenciais || [],
      // 🔥 CRÍTICO: Casos de Uso REAIS
      casosDeUso: onboardingData.step4_SituacaoAtual?.casosDeUso || [],
      // 🔥 CRÍTICO: Tickets e Ciclos REAIS
      ticketsECiclos: onboardingData.step4_SituacaoAtual?.ticketsECiclos || [],
      ticketMedio: onboardingData.step4_SituacaoAtual?.ticketMedio,
      cicloVendaMedia: onboardingData.step4_SituacaoAtual?.cicloVendaMedia,
      // 🔥 CRÍTICO: Concorrentes do Step 4
      concorrentesDiretos: onboardingData.step4_SituacaoAtual?.concorrentesDiretos || [],
      analisarComIA: onboardingData.step4_SituacaoAtual?.analisarComIA,
    },
    step5_HistoricoEEnriquecimento: {
      // 🔥 CRÍTICO: Clientes Atuais REAIS (já mesclados de Step1 e Step5)
      clientesAtuais: onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais || [],
      // 🔥 CRÍTICO: Empresas de Benchmarking REAIS
      empresasBenchmarking: onboardingData.step5_HistoricoEEnriquecimento?.empresasBenchmarking || [],
    },
  };
*/

