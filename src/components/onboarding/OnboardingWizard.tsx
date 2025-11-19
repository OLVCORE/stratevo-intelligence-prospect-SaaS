// src/components/onboarding/OnboardingWizard.tsx

'use client';

import { useState } from 'react';
import { Step1DadosBasicos } from './steps/Step1DadosBasicos';
import { Step2AtividadesCNAEs } from './steps/Step2AtividadesCNAEs';
import { Step3PerfilClienteIdeal } from './steps/Step3PerfilClienteIdeal';
import { Step4SituacaoAtual } from './steps/Step4SituacaoAtual';
import { Step5HistoricoEnriquecimento } from './steps/Step5HistoricoEnriquecimento';
import { ProgressBar } from './ProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export interface OnboardingData {
  step1_DadosBasicos: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    website: string;
    telefone: string;
    email: string;
    setorPrincipal: string;
    porteEmpresa: string;
  };
  step2_AtividadesCNAEs: {
    cnaePrincipal: string;
    cnaesSecundarios: string[];
    descricaoAtividade: string;
    produtosServicos: Array<{
      nome: string;
      categoria: string;
      descricao: string;
    }>;
  };
  step3_PerfilClienteIdeal: {
    setoresAlvo: string[];
    cnaesAlvo: string[];
    porteAlvo: string[];
    localizacaoAlvo: {
      estados: string[];
      regioes: string[];
      raioKm?: number;
    };
    faturamentoAlvo: {
      minimo?: number;
      maximo?: number;
    };
    funcionariosAlvo: {
      minimo?: number;
      maximo?: number;
    };
    caracteristicasEspeciais: string[];
  };
  step4_SituacaoAtual: {
    categoriaSolucao: string;
    diferenciais: string[];
    casosDeUso: string[];
    ticketMedio: number;
    cicloVendaMedia: number;
    concorrentesDiretos: Array<{
      nome: string;
      website: string;
      diferencialDeles: string;
    }>;
  };
  step5_HistoricoEEnriquecimento: {
    clientesAtuais?: Array<{
      cnpj: string;
      razaoSocial: string;
      setor: string;
      porte: string;
      motivoCompra: string;
      resultadoObtido: string;
    }>;
    catalogoProdutos?: File;
    apresentacaoEmpresa?: File;
    casesSuccesso?: File[];
    analisarComIA: boolean;
  };
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const totalSteps = 5;

  const handleNext = async (stepData: any) => {
    // Atualizar dados do form
    const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
    setFormData((prev) => ({
      ...prev,
      [stepKey]: stepData,
    }));

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Último step - submeter
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Criar tenant com dados do step 1
      const tenantData = formData.step1_DadosBasicos;
      if (!tenantData) {
        throw new Error('Dados básicos não preenchidos');
      }

      const { multiTenantService } = await import('@/services/multi-tenant.service');
      
      // Criar tenant
      const tenant = await multiTenantService.criarTenant({
        nome: tenantData.razaoSocial,
        cnpj: tenantData.cnpj,
        email: tenantData.email,
        telefone: tenantData.telefone,
        plano: 'FREE', // Inicia com plano gratuito
      });

      // Criar usuário vinculado ao tenant
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: tenantData.email,
          nome: tenantData.razaoSocial,
          tenant_id: tenant.id,
          auth_user_id: user.id,
          role: 'OWNER',
        });

      if (userError) {
        throw new Error(`Erro ao criar usuário: ${userError.message}`);
      }

      // Salvar ICP Profile (step 3)
      if (formData.step3_PerfilClienteIdeal) {
        const icpProfile = formData.step3_PerfilClienteIdeal;
        
        // Criar cliente Supabase para o schema do tenant
        const tenantSupabase = await multiTenantService.getSupabaseForTenant(tenant.id);
        
        await tenantSupabase
          .from('icp_profile')
          .insert({
            setores_alvo: icpProfile.setoresAlvo,
            cnaes_alvo: icpProfile.cnaesAlvo,
            porte_alvo: icpProfile.porteAlvo,
            estados_alvo: icpProfile.localizacaoAlvo.estados,
            regioes_alvo: icpProfile.localizacaoAlvo.regioes,
            faturamento_min: icpProfile.faturamentoAlvo.minimo,
            faturamento_max: icpProfile.faturamentoAlvo.maximo,
            funcionarios_min: icpProfile.funcionariosAlvo.minimo,
            funcionarios_max: icpProfile.funcionariosAlvo.maximo,
            caracteristicas_buscar: icpProfile.caracteristicasEspeciais,
            score_weights: {}, // Valores padrão
            clientes_historico: formData.step5_HistoricoEEnriquecimento?.clientesAtuais || [],
          });
      }

      toast.success('Onboarding concluído com sucesso!');
      
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao submeter onboarding:', error);
      toast.error(error.message || 'Erro ao salvar dados. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepName = (step: number): string => {
    const names: Record<number, string> = {
      1: 'DadosBasicos',
      2: 'AtividadesCNAEs',
      3: 'PerfilClienteIdeal',
      4: 'SituacaoAtual',
      5: 'HistoricoEnriquecimento',
    };
    return names[step] || '';
  };

  const renderStep = () => {
    const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      initialData: formData[stepKey] || {},
    };

    switch (currentStep) {
      case 1:
        return <Step1DadosBasicos {...stepProps} />;
      case 2:
        return <Step2AtividadesCNAEs {...stepProps} />;
      case 3:
        return <Step3PerfilClienteIdeal {...stepProps} />;
      case 4:
        return <Step4SituacaoAtual {...stepProps} />;
      case 5:
        return <Step5HistoricoEnriquecimento {...stepProps} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Configure sua Plataforma
          </h1>
          <p className="mt-2 text-gray-600">
            Complete as informações para personalizar sua experiência
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          {renderStep()}
        </div>

        {/* Footer Helper */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Passo {currentStep} de {totalSteps}
        </div>
      </div>
    </div>
  );
}

