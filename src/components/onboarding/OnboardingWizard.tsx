// src/components/onboarding/OnboardingWizard.tsx

import { useState, useEffect } from 'react';
import { Step1DadosBasicos } from './steps/Step1DadosBasicos';
import { Step2SetoresNichos } from './steps/Step2SetoresNichos';
import { Step3PerfilClienteIdeal } from './steps/Step3PerfilClienteIdeal';
import { Step4SituacaoAtual } from './steps/Step4SituacaoAtual';
import { Step5HistoricoEnriquecimento } from './steps/Step5HistoricoEnriquecimento';
import { Step6ResumoReview } from './steps/Step6ResumoReview';
import { ProgressBar } from './ProgressBar';
import { OnboardingStepGuide } from './OnboardingStepGuide';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'onboarding_form_data';
const ONBOARDING_STEP_KEY = 'onboarding_current_step';

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
  step2_SetoresNichos: {
    sectorAtual: string;
    nicheAtual: string;
    cnaes: string[];
    setoresAlvo: string[];
    nichosAlvo: string[];
    cnaesAlvo: string[];
  };
  step3_PerfilClienteIdeal: {
    setoresAlvo: string[];
    nichosAlvo: string[];
    cnaesAlvo: string[];
    ncmsAlvo: string[];
    porteAlvo: string[];
    localizacaoAlvo: {
      estados: string[];
      regioes: string[];
      municipios?: string[];
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
    ticketsECiclos: Array<{
      ticketMedio: number;
      cicloVenda: number;
      criterio: string; // Critério comum para ticket e ciclo
    }>;
    // 🔥 Mantido para compatibilidade com dados antigos
    ticketMedio?: number;
    criterioTicketMedio?: string;
    cicloVendaMedia?: number;
    criterioCicloVenda?: string;
    ticketsMedios?: Array<{ valor: number; criterio: string }>; // Versão antiga
    concorrentesDiretos: Array<{
      cnpj: string;
      razaoSocial: string;
      nomeFantasia?: string;
      setor: string;
      cidade: string;
      estado: string;
      capitalSocial: number;
      cnaePrincipal: string;
      cnaePrincipalDescricao?: string;
      website?: string;
      diferencialDeles?: string;
    }>;
  };
  step5_HistoricoEEnriquecimento: {
    clientesAtuais?: Array<{
      cnpj: string;
      razaoSocial: string;
      nome?: string; // Alias para compatibilidade
      setor: string;
      ticketMedio: number;
      cidade: string;
      estado: string;
      capitalSocial: number;
      cnaePrincipal: string;
      cnaePrincipalDescricao?: string;
    }>;
    empresasBenchmarking?: Array<{ // 🔥 UNIFICADO: Empresas para ICP Benchmarking com campos completos
      cnpj: string;
      razaoSocial: string;
      nomeFantasia?: string;
      setor: string;
      cidade: string;
      estado: string;
      capitalSocial: number;
      cnaePrincipal: string;
      cnaePrincipalDescricao?: string;
    }>;
    catalogoProdutos?: File;
    apresentacaoEmpresa?: File;
    casesSuccesso?: File[];
    analisarComIA: boolean;
  };
}

export function OnboardingWizard() {
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  
  // 🔥 CRÍTICO: Verificar se é para criar novo tenant
  const isNewTenant = searchParams.get('new') === 'true';
  const tenantIdFromUrl = searchParams.get('tenant_id');
  
  // 🔥 CRÍTICO: Se for novo tenant, ignorar tenant do contexto
  // Prioridade: 1) tenant_id da URL (se especificado), 2) novo tenant (null), 3) tenant do contexto
  const tenantId = tenantIdFromUrl 
    ? tenantIdFromUrl // Se há tenant_id na URL, usar ele (para recarregar onboarding existente)
    : (isNewTenant 
      ? null // Forçar criação de novo tenant (ignorar contexto)
      : (tenant?.id || null)); // Se não for novo e não tem na URL, usar do contexto
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingICP, setIsGeneratingICP] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [createdIcpId, setCreatedIcpId] = useState<string | null>(null); // ID do ICP criado
  const [createdIcpMetadata, setCreatedIcpMetadata] = useState<any>(null); // Metadata do ICP criado
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isLoadingSession, setIsLoadingSession] = useState(!!tenantId);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedStep, setLastSavedStep] = useState(0);

  const totalSteps = 6;

  // Helper para carregar dados do localStorage
  const loadSavedData = (): { step: number; data: Partial<OnboardingData> } => {
    try {
      const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
      const savedData = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      
      return {
        step: savedStep ? parseInt(savedStep, 10) : 1,
        data: savedData ? JSON.parse(savedData) : {},
      };
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao carregar dados salvos:', error);
      return { step: 1, data: {} };
    }
  };

  // Helper para obter public.users.id a partir de auth.users.id
  const getPublicUserId = async (authUserId: string, tenantId: string): Promise<string | null> => {
    try {
      // Buscar usuário em public.users usando auth_user_id
      const { data: publicUser, error: userError } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (userError) {
        console.error('[OnboardingWizard] Erro ao buscar public.users:', userError);
        return null;
      }

      if (publicUser) {
        return publicUser.id;
      }

      // Se não encontrou, tentar criar
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: newUser, error: createError } = await (supabase as any)
        .from('users')
        .insert({
          email: authUser.email || '',
          nome: authUser.user_metadata?.full_name || authUser.email || 'Usuário',
          auth_user_id: authUserId,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (createError) {
        console.error('[OnboardingWizard] Erro ao criar usuário:', createError);
        return null;
      }

      return newUser?.id || null;
    } catch (error) {
      console.error('[OnboardingWizard] Erro em getPublicUserId:', error);
      return null;
    }
  };

  // Função para recarregar dados do banco (reutilizável)
  const reloadSessionFromDatabase = async () => {
    if (!tenantId) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const publicUserId = await getPublicUserId(authUser.id, tenantId);
      if (!publicUserId) return;

      const { data: sessionData } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('user_id', publicUserId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (sessionData) {
        const loadedData: Partial<OnboardingData> = {};
        if (sessionData.step1_data) loadedData.step1_DadosBasicos = sessionData.step1_data;
        if (sessionData.step2_data) loadedData.step2_SetoresNichos = sessionData.step2_data;
        if (sessionData.step3_data) loadedData.step3_PerfilClienteIdeal = sessionData.step3_data;
        
        // 🔥 MIGRAÇÃO: Mover empresasBenchmarking de step4 para step5
        if (sessionData.step4_data) {
          const step4Data = { ...sessionData.step4_data };
          const empresasBenchmarking = step4Data.empresasBenchmarking;
          
          // Remover empresasBenchmarking do step4
          if (empresasBenchmarking) {
            delete step4Data.empresasBenchmarking;
          }
          
          loadedData.step4_SituacaoAtual = step4Data;
        }
        
        // 🔥 CRÍTICO: Sempre carregar step5_data completo
        if (sessionData.step5_data) {
          // Garantir que arrays sejam sempre arrays e não undefined/null
          const clientesAtuais = Array.isArray(sessionData.step5_data?.clientesAtuais) 
            ? sessionData.step5_data.clientesAtuais 
            : [];
          const empresasBenchmarking = Array.isArray(sessionData.step5_data?.empresasBenchmarking)
            ? sessionData.step5_data.empresasBenchmarking
            : [];
          
          loadedData.step5_HistoricoEEnriquecimento = {
            ...sessionData.step5_data,
            clientesAtuais,
            empresasBenchmarking,
          };
        } else if (sessionData.step4_data?.empresasBenchmarking) {
          // Se não há step5_data, mas há empresasBenchmarking no step4 (migração)
          loadedData.step5_HistoricoEEnriquecimento = {
            clientesAtuais: [],
            empresasBenchmarking: Array.isArray(sessionData.step4_data.empresasBenchmarking)
              ? sessionData.step4_data.empresasBenchmarking
              : [],
          } as any;
        }
        
        console.log('[OnboardingWizard] ✅ Dados carregados do banco:', {
          step5: loadedData.step5_HistoricoEEnriquecimento,
          clientes: loadedData.step5_HistoricoEEnriquecimento?.clientesAtuais?.length || 0,
          benchmarking: loadedData.step5_HistoricoEEnriquecimento?.empresasBenchmarking?.length || 0,
        });
        
        setFormData(prev => ({ ...prev, ...loadedData }));
      }
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao recarregar dados:', error);
    }
  };

  // 🔥 CRÍTICO: Buscar ICP existente quando tenant carrega (apenas 1x)
  useEffect(() => {
    const loadExistingICP = async () => {
      // 🔥 CRÍTICO: Não buscar ICP se for novo tenant
      if (isNewTenant || !tenantId) return;
      
      try {
        console.log('[OnboardingWizard] 🔍 Buscando ICP existente para tenant:', tenantId);
        
        // Buscar ICP principal
        const { data: existingICP, error } = await (supabase as any)
          .from('icp_profiles_metadata')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('icp_principal', true)
          .maybeSingle();
        
        if (!error && existingICP) {
          console.log('[OnboardingWizard] ✅ ICP existente encontrado:', existingICP.id);
          setCreatedIcpId(existingICP.id);
          console.log('[OnboardingWizard] 🔥 createdIcpId setado (carregamento):', existingICP.id);
        } else if (error) {
          console.error('[OnboardingWizard] ❌ Erro ao buscar ICP existente:', error);
        } else {
          console.log('[OnboardingWizard] ℹ️ Nenhum ICP existente encontrado para este tenant');
        }
        
        // Buscar contador de ICPs gerados
        const { count, error: countError } = await (supabase as any)
          .from('icp_profiles_metadata')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId);
        
        if (!countError && count !== null) {
          console.log('[OnboardingWizard] 📊 Total de ICPs gerados:', count);
          setGeneratedCount(count);
        }
      } catch (error) {
        console.error('[OnboardingWizard] ❌ Erro ao buscar ICP existente:', error);
      }
    };
    
    loadExistingICP();
  }, [tenantId, isNewTenant]); // 🔥 CRÍTICO: Incluir isNewTenant para não buscar ICP quando for novo tenant

  // Carregar dados do banco quando há tenant_id na URL
  useEffect(() => {
    const loadSessionFromDatabase = async () => {
      // 🔥 CRÍTICO: Se for novo tenant, limpar tudo e começar do zero
      if (isNewTenant) {
        console.log('[OnboardingWizard] 🆕 Criando novo tenant - limpando todos os dados');
        console.log('[OnboardingWizard] 🔍 Parâmetros da URL:', {
          isNewTenant,
          tenantIdFromUrl,
          tenantId,
          tenantFromContext: tenant?.id,
        });
        // Limpar localStorage para garantir que não há dados antigos
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        // Limpar estado completamente
        setFormData({});
        setCurrentStep(1);
        setCreatedIcpId(null);
        setCreatedIcpMetadata(null);
        setGenerationResult(null);
        setIsLoadingSession(false);
        console.log('[OnboardingWizard] ✅ Estado limpo - pronto para novo cadastro');
        return;
      }

      if (!tenantId) {
        // Se não há tenant_id, carregar do localStorage
        const { step: savedStep, data: savedData } = loadSavedData();
        setCurrentStep(savedStep);
        setFormData(savedData);
        setIsLoadingSession(false);
        return;
      }

      try {
        setIsLoadingSession(true);
        console.log('[OnboardingWizard] 🔍 Carregando sessão do banco para tenant:', tenantId);

        // Buscar usuário atual para obter user_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          throw new Error('Usuário não autenticado');
        }

        // Obter public.users.id
        const publicUserId = await getPublicUserId(authUser.id, tenantId);
        if (!publicUserId) {
          console.warn('[OnboardingWizard] ⚠️ Não foi possível obter public.users.id, carregando do localStorage');
          const { step: savedStep, data: savedData } = loadSavedData();
          setCurrentStep(savedStep);
          setFormData(savedData);
          setIsLoadingSession(false);
          return;
        }

        // Buscar sessão de onboarding do banco
        const { data: sessionData, error: sessionError } = await (supabase as any)
          .from('onboarding_sessions')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('user_id', publicUserId) // 🔥 Usar public.users.id
          .maybeSingle();

        if (sessionError && sessionError.code !== 'PGRST116') {
          console.error('[OnboardingWizard] Erro ao buscar sessão:', sessionError);
          throw sessionError;
        }

        if (sessionData) {
          console.log('[OnboardingWizard] ✅ Sessão encontrada:', sessionData);
          
          // Converter dados do banco para o formato do OnboardingData
          const loadedData: Partial<OnboardingData> = {};
          
          if (sessionData.step1_data) {
            loadedData.step1_DadosBasicos = sessionData.step1_data;
          }
          if (sessionData.step2_data) {
            loadedData.step2_SetoresNichos = sessionData.step2_data;
          }
          if (sessionData.step3_data) {
            loadedData.step3_PerfilClienteIdeal = sessionData.step3_data;
          }
          
          // 🔥 MIGRAÇÃO: Mover empresasBenchmarking de step4 para step5
          if (sessionData.step4_data) {
            const step4Data = { ...sessionData.step4_data };
            const empresasBenchmarking = step4Data.empresasBenchmarking;
            
            // Remover empresasBenchmarking do step4
            if (empresasBenchmarking) {
              delete step4Data.empresasBenchmarking;
            }
            
            loadedData.step4_SituacaoAtual = step4Data;
            
            // Adicionar empresasBenchmarking ao step5 se existir
            if (empresasBenchmarking && sessionData.step5_data) {
              loadedData.step5_HistoricoEEnriquecimento = {
                ...sessionData.step5_data,
                empresasBenchmarking: empresasBenchmarking,
              };
            } else if (empresasBenchmarking) {
              loadedData.step5_HistoricoEEnriquecimento = {
                empresasBenchmarking: empresasBenchmarking,
              } as any;
            }
          }
          
          if (sessionData.step5_data && !loadedData.step5_HistoricoEEnriquecimento) {
            loadedData.step5_HistoricoEEnriquecimento = sessionData.step5_data;
          }

          // Determinar o último step preenchido
          let lastStep = 1;
          if (sessionData.step5_data) lastStep = 6;
          else if (sessionData.step4_data) lastStep = 5;
          else if (sessionData.step3_data) lastStep = 4;
          else if (sessionData.step2_data) lastStep = 3;
          else if (sessionData.step1_data) lastStep = 2;

          setFormData(loadedData);
          setCurrentStep(lastStep);
          
          // Salvar também no localStorage para manter sincronizado
          localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(loadedData));
          localStorage.setItem(ONBOARDING_STEP_KEY, lastStep.toString());
          
          toast.success('Dados do onboarding carregados!', {
            description: 'Você pode continuar de onde parou.',
          });
        } else {
          console.log('[OnboardingWizard] ⚠️ Nenhuma sessão encontrada, iniciando novo onboarding');
          // Se não há sessão, tentar carregar do localStorage
          const { step: savedStep, data: savedData } = loadSavedData();
          setCurrentStep(savedStep);
          setFormData(savedData);
        }
      } catch (error: any) {
        console.error('[OnboardingWizard] ❌ Erro ao carregar sessão:', error);
        toast.error('Erro ao carregar dados do onboarding', {
          description: error.message || 'Tente novamente mais tarde.',
        });
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSessionFromDatabase();
  }, [tenantId, isNewTenant]); // 🔥 CRÍTICO: Incluir isNewTenant nas dependências

  // Recarregar dados ao mudar de etapa
  useEffect(() => {
    if (tenantId && currentStep >= 1) {
      // Pequeno delay para garantir que o componente foi renderizado
      const timer = setTimeout(() => {
        reloadSessionFromDatabase();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentStep, tenantId]);

  // 🔥 CRÍTICO: Função de salvamento reutilizável
  const saveDataImmediately = async (dataToSave: Partial<OnboardingData> = formData, forceSave = false) => {
    try {
      // Salvar no localStorage IMEDIATAMENTE (sem debounce para preservar dados ao mudar de aba)
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
      console.log('[OnboardingWizard] 💾 Dados salvos IMEDIATAMENTE no localStorage:', { 
        currentStep, 
        hasData: Object.keys(dataToSave).length > 0 
      });
      
      // Se há tenant_id, também salvar no banco
      if (tenantId && Object.keys(dataToSave).length > 0) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const publicUserId = await getPublicUserId(authUser.id, tenantId);
            if (!publicUserId) {
              console.warn('[OnboardingWizard] ⚠️ Não foi possível obter public.users.id, pulando salvamento automático');
              return;
            }

            // Verificar se já existe sessão
            const { data: existingSession } = await (supabase as any)
              .from('onboarding_sessions')
              .select('id')
              .eq('user_id', publicUserId)
              .eq('tenant_id', tenantId)
              .maybeSingle();

            if (existingSession) {
              // UPDATE se já existe
              const { error: updateError } = await (supabase as any)
                .from('onboarding_sessions')
                .update({
                  step1_data: dataToSave.step1_DadosBasicos || null,
                  step2_data: dataToSave.step2_SetoresNichos || null,
                  step3_data: dataToSave.step3_PerfilClienteIdeal || null,
                  step4_data: dataToSave.step4_SituacaoAtual || null,
                  step5_data: dataToSave.step5_HistoricoEEnriquecimento || null,
                  status: 'draft',
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', publicUserId)
                .eq('tenant_id', tenantId);

              if (!updateError) {
                console.log('[OnboardingWizard] ✅ Dados salvos no banco');
              }
            }
          }
        } catch (error) {
          console.warn('[OnboardingWizard] ⚠️ Erro ao salvar automaticamente no banco:', error);
        }
      }
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao salvar dados:', error);
    }
  };

  // 🔥 CRÍTICO: Salvar dados automaticamente no localStorage sempre que mudarem (debounce curto)
  useEffect(() => {
    // Salvar no localStorage IMEDIATAMENTE (sem debounce para preservar dados ao mudar de aba)
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(formData));
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
      console.log('[OnboardingWizard] 💾 Auto-save localStorage:', { 
        currentStep, 
        hasData: Object.keys(formData).length > 0 
      });
    } catch (error) {
      console.error('[OnboardingWizard] ❌ Erro ao salvar no localStorage:', error);
    }

    // Salvar no banco com debounce (para não sobrecarregar)
    const timeoutId = setTimeout(() => {
      if (tenantId && Object.keys(formData).length > 0) {
        saveDataImmediately();
      }
    }, 2000); // Debounce de 2 segundos para o banco

    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, tenantId]);

  // 🔥 CRÍTICO: Salvar quando a aba perder o foco (antes de mudar de aba)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Aba perdeu o foco - salvar imediatamente no localStorage (síncrono)
        console.log('[OnboardingWizard] 🔄 Aba perdeu o foco - salvando dados...');
        try {
          // Usar os valores atuais do estado através do closure
          localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(formData));
          localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
          console.log('[OnboardingWizard] ✅ Dados salvos no localStorage ao perder foco');
        } catch (error) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar ao perder foco:', error);
        }
        // Também tentar salvar no banco (assíncrono)
        if (tenantId && Object.keys(formData).length > 0) {
          saveDataImmediately(formData, true);
        }
      } else {
        // Aba voltou ao foco - recarregar dados do localStorage primeiro
        console.log('[OnboardingWizard] 🔄 Aba voltou ao foco - recarregando dados...');
        try {
          const savedData = loadSavedData();
          if (savedData.data && Object.keys(savedData.data).length > 0) {
            console.log('[OnboardingWizard] ✅ Dados recuperados do localStorage:', {
              step: savedData.step,
              keys: Object.keys(savedData.data),
            });
            // Atualizar estado com dados salvos
            setFormData(prevData => ({ ...prevData, ...savedData.data }));
            if (savedData.step !== currentStep && savedData.step >= 1 && savedData.step <= totalSteps) {
              setCurrentStep(savedData.step);
            }
          }
          
          // Se há tenant, também recarregar do banco (mas preservar localStorage se mais recente)
          if (tenantId) {
            setTimeout(() => {
              reloadSessionFromDatabase();
            }, 500);
          }
        } catch (error) {
          console.error('[OnboardingWizard] ❌ Erro ao recarregar dados ao voltar:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Salvar antes de sair da página (usando synchronous localStorage)
    const handleBeforeUnload = () => {
      // Usar método síncrono para garantir salvamento
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
        console.log('[OnboardingWizard] ✅ Dados salvos antes de sair');
      } catch (error) {
        console.error('[OnboardingWizard] ❌ Erro ao salvar antes de sair:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, currentStep, tenantId, totalSteps]); // Incluir dependências necessárias

  // Limpar dados salvos após conclusão bem-sucedida
  const clearSavedData = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  };

  const handleNext = async (stepData: any) => {
    // 🔥 CRÍTICO: Mostrar loading imediatamente
    setIsSaving(true);
    
    try {
      // Atualizar dados do form
      const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
      const updatedFormData = {
        ...formData,
        [stepKey]: stepData,
      };
      
      // Atualizar estado imediatamente
      setFormData(updatedFormData);
      
      // Salvar no localStorage imediatamente (sempre funciona)
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedFormData));
        localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
        console.log('[OnboardingWizard] ✅ Dados salvos no localStorage:', { 
          step: currentStep, 
          stepKey,
          hasData: !!stepData 
        });
      } catch (error) {
        console.error('[OnboardingWizard] ❌ Erro ao salvar no localStorage:', error);
      }

      // 🔥 OBRIGATÓRIO: Salvar no banco ANTES de avançar
      let saveSuccess = false;
      
      // Se há tenant_id, salvar automaticamente no banco
      if (tenantId) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Obter public.users.id
            const publicUserId = await getPublicUserId(authUser.id, tenantId);
            if (!publicUserId) {
              console.warn('[OnboardingWizard] ⚠️ Não foi possível obter public.users.id');
              toast.error('Erro ao salvar', {
                description: 'Não foi possível obter seu perfil. Tente novamente.',
              });
              setIsSaving(false);
              return; // 🔥 BLOQUEAR navegação se não conseguir salvar
            }

            console.log('[OnboardingWizard] 💾 Salvando no banco para tenant:', tenantId);
            
            // Verificar se já existe sessão
            const { data: existingSession } = await (supabase as any)
              .from('onboarding_sessions')
              .select('id')
              .eq('user_id', publicUserId)
              .eq('tenant_id', tenantId)
              .maybeSingle();

            const sessionData = {
              user_id: publicUserId,
              tenant_id: tenantId,
              step1_data: updatedFormData.step1_DadosBasicos || null,
              step2_data: updatedFormData.step2_SetoresNichos || null,
              step3_data: updatedFormData.step3_PerfilClienteIdeal || null,
              step4_data: updatedFormData.step4_SituacaoAtual || null,
              step5_data: updatedFormData.step5_HistoricoEEnriquecimento || null,
              status: currentStep < totalSteps ? 'draft' : 'submitted', // ✅ Usar 'draft' ao invés de 'in_progress'
              updated_at: new Date().toISOString(),
            };

            if (existingSession) {
              // UPDATE
              const { error: updateError } = await (supabase as any)
                .from('onboarding_sessions')
                .update(sessionData)
                .eq('id', existingSession.id)
                .select()
                .single();

              if (updateError) {
                console.error('[OnboardingWizard] ❌ Erro ao atualizar sessão:', updateError);
                toast.error('Erro ao salvar dados', {
                  description: updateError.message || 'Não foi possível salvar no servidor. Tente novamente.',
                });
                setIsSaving(false);
                return; // 🔥 BLOQUEAR navegação se falhar
              } else {
                console.log('[OnboardingWizard] ✅ Dados atualizados no banco com sucesso');
                saveSuccess = true;
              }
            } else {
              // INSERT
              const { error: insertError } = await (supabase as any)
                .from('onboarding_sessions')
                .insert(sessionData)
                .select()
                .single();

              if (insertError) {
                console.error('[OnboardingWizard] ❌ Erro ao inserir sessão:', insertError);
                toast.error('Erro ao salvar dados', {
                  description: insertError.message || 'Não foi possível salvar no servidor. Tente novamente.',
                });
                setIsSaving(false);
                return; // 🔥 BLOQUEAR navegação se falhar
              } else {
                console.log('[OnboardingWizard] ✅ Dados inseridos no banco com sucesso');
                saveSuccess = true;
              }
            }
          }
        } catch (error: any) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar sessão:', error);
          toast.error('Erro ao salvar dados', {
            description: error.message || 'Erro desconhecido ao salvar. Tente novamente.',
          });
          setIsSaving(false);
          return; // 🔥 BLOQUEAR navegação se falhar
        }
      } else {
        // Sem tenant_id - Step 1: criar tenant primeiro
        if (currentStep === 1 && updatedFormData.step1_DadosBasicos) {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
              toast.error('Erro de autenticação', {
                description: 'Faça login novamente para continuar.',
              });
              setIsSaving(false);
              return;
            }

            const tenantData = updatedFormData.step1_DadosBasicos;
            const { multiTenantService } = await import('@/services/multi-tenant.service');
            
            console.log('[OnboardingWizard] 🚀 Criando tenant no Step 1...');
            const tenant = await multiTenantService.criarTenant({
              nome: tenantData.razaoSocial,
              cnpj: tenantData.cnpj,
              email: tenantData.email,
              telefone: tenantData.telefone,
              plano: 'FREE',
            });

            console.log('[OnboardingWizard] ✅ Tenant criado:', tenant.id);

            // Criar usuário vinculado
            const { error: userError } = await (supabase as any)
              .from('users')
              .upsert({
                email: tenantData.email,
                nome: tenantData.razaoSocial,
                tenant_id: tenant.id,
                auth_user_id: authUser.id,
                role: 'OWNER',
              }, {
                onConflict: 'auth_user_id'
              });

            if (userError) {
              console.error('[OnboardingWizard] Erro ao criar usuário:', userError);
            }

            // Agora salvar sessão com o tenant_id
            const publicUserId = await getPublicUserId(authUser.id, tenant.id);
            if (publicUserId) {
              const { error: insertError } = await (supabase as any)
                .from('onboarding_sessions')
                .insert({
                  user_id: publicUserId,
                  tenant_id: tenant.id,
                  step1_data: updatedFormData.step1_DadosBasicos || null,
                  step2_data: updatedFormData.step2_SetoresNichos || null,
                  step3_data: updatedFormData.step3_PerfilClienteIdeal || null,
                  step4_data: updatedFormData.step4_SituacaoAtual || null,
                  step5_data: updatedFormData.step5_HistoricoEEnriquecimento || null,
                  status: 'draft',
                  updated_at: new Date().toISOString(),
                });

              if (insertError) {
                console.error('[OnboardingWizard] ❌ Erro ao salvar sessão:', insertError);
                toast.error('Erro ao salvar dados', {
                  description: 'Tenant criado, mas houve erro ao salvar sessão.',
                });
                setIsSaving(false);
                return;
              } else {
                saveSuccess = true;
                // Atualizar tenantId no contexto
                window.location.href = `/tenant-onboarding?tenant_id=${tenant.id}`;
                return;
              }
            }
          } catch (error: any) {
            console.error('[OnboardingWizard] ❌ Erro ao criar tenant:', error);
            toast.error('Erro ao criar empresa', {
              description: error.message || 'Não foi possível criar a empresa. Tente novamente.',
            });
            setIsSaving(false);
            return;
          }
        } else {
          // Sem tenant_id e não é Step 1 - apenas salvar localmente
          saveSuccess = true;
        }
      }

      // 🔥 SÓ AVANÇAR SE SALVOU COM SUCESSO
      if (saveSuccess) {
        setHasUnsavedChanges(false);
        setLastSavedStep(currentStep);
        
        toast.success('Dados salvos com sucesso!', {
          description: 'Prosseguindo para próxima etapa...',
        });

        // Pequeno delay para mostrar feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        if (currentStep < totalSteps) {
          setCurrentStep(currentStep + 1);
          // Recarregar dados do banco ao mudar de etapa
          await reloadSessionFromDatabase();
        } else {
          // Último step - submeter
          await handleSubmit();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (hasUnsavedChanges && currentStep !== lastSavedStep) {
      const shouldLeave = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair sem salvar?'
      );
      if (!shouldLeave) {
        return;
      }
    }
    if (currentStep > 1) {
      const previousStep = currentStep - 1;
      setCurrentStep(previousStep);
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      // Recarregar dados do banco ao voltar
      await reloadSessionFromDatabase();
    }
  };

  const handleStepClick = async (step: number) => {
    if (hasUnsavedChanges && currentStep !== lastSavedStep) {
      const shouldLeave = window.confirm(
        'Você tem alterações não salvas. Deseja realmente mudar de etapa sem salvar?'
      );
      if (!shouldLeave) {
        return;
      }
    }
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      // Recarregar dados do banco ao mudar de etapa
      await reloadSessionFromDatabase();
    }
  };

  const handleSave = async (stepData?: any) => {
    // 🔥 CRÍTICO: Verificar se stepData é um evento ou objeto com referências circulares
    if (stepData && typeof stepData === 'object') {
      // Se for um evento do React, não processar
      if ('nativeEvent' in stepData || 'target' in stepData && stepData.target?.tagName) {
        console.warn('[OnboardingWizard] ⚠️ stepData parece ser um evento, ignorando...');
        stepData = undefined;
      }
    }

    // 🔥 CRÍTICO: Se dados do step foram fornecidos, atualizar formData primeiro
    let updatedFormData = formData;
    if (stepData && typeof stepData === 'object' && !('nativeEvent' in stepData)) {
      const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
      updatedFormData = {
        ...formData,
        [stepKey]: stepData,
      };
      // Atualizar estado imediatamente
      setFormData(updatedFormData);
      console.log('[OnboardingWizard] 💾 Dados do step atualizados antes de salvar:', {
        step: currentStep,
        stepKey,
        hasData: !!stepData,
      });
    }

    if (!tenantId) {
      toast.warning('Salvamento automático', {
        description: 'Os dados estão sendo salvos automaticamente no navegador.',
      });
      // Salvar no localStorage mesmo sem tenant
      if (stepData) {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedFormData));
        localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
      }
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Erro de autenticação', {
          description: 'Faça login novamente para salvar.',
        });
        return;
      }

      const publicUserId = await getPublicUserId(authUser.id, tenantId);
      if (!publicUserId) {
        toast.error('Erro ao obter perfil', {
          description: 'Não foi possível obter seu perfil. Tente novamente.',
        });
        return;
      }

      // Verificar se já existe sessão
      const { data: existingSession } = await (supabase as any)
        .from('onboarding_sessions')
        .select('id')
        .eq('user_id', publicUserId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      // 🔥 CRÍTICO: Log detalhado do que está sendo salvo
      console.log('[OnboardingWizard] 💾 Salvando step5_data:', {
        step5: updatedFormData.step5_HistoricoEEnriquecimento,
        clientes: updatedFormData.step5_HistoricoEEnriquecimento?.clientesAtuais?.length || 0,
        benchmarking: updatedFormData.step5_HistoricoEEnriquecimento?.empresasBenchmarking?.length || 0,
        benchmarkingDetalhes: updatedFormData.step5_HistoricoEEnriquecimento?.empresasBenchmarking,
      });

      const sessionData = {
        user_id: publicUserId,
        tenant_id: tenantId,
        step1_data: updatedFormData.step1_DadosBasicos || null,
        step2_data: updatedFormData.step2_SetoresNichos || null,
        step3_data: updatedFormData.step3_PerfilClienteIdeal || null,
        step4_data: updatedFormData.step4_SituacaoAtual || null,
        step5_data: updatedFormData.step5_HistoricoEEnriquecimento || null,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      if (existingSession) {
        // UPDATE
        const { error: updateError } = await (supabase as any)
          .from('onboarding_sessions')
          .update(sessionData)
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar:', updateError);
          toast.error('Erro ao salvar', {
            description: updateError.message || 'Não foi possível salvar os dados.',
          });
          return;
        }
      } else {
        // INSERT
        const { error: insertError } = await (supabase as any)
          .from('onboarding_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (insertError) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar:', insertError);
          toast.error('Erro ao salvar', {
            description: insertError.message || 'Não foi possível salvar os dados.',
          });
          return;
        }
      }

      // Salvar também no localStorage
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedFormData));
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());

      setHasUnsavedChanges(false);
      setLastSavedStep(currentStep);
      toast.success('Dados salvos com sucesso!', {
        description: 'Seus dados foram salvos no servidor.',
      });
    } catch (error: any) {
      console.error('[OnboardingWizard] ❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar', {
        description: error.message || 'Não foi possível salvar os dados.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para salvar ICP em icp_profiles_metadata após gerar análise
  const saveICPFromRecommendation = async (recommendation: any) => {
    if (!tenantId || !recommendation) {
      console.warn('[OnboardingWizard] ⚠️ Não é possível salvar ICP: tenantId ou recommendation ausente');
      return;
    }

    try {
      console.log('[OnboardingWizard] 💾 Salvando ICP em icp_profiles_metadata...');
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.warn('[OnboardingWizard] ⚠️ Usuário não autenticado');
        return;
      }

      const publicUserId = await getPublicUserId(authUser.id, tenantId);
      if (!publicUserId) {
        console.warn('[OnboardingWizard] ⚠️ Não foi possível obter publicUserId');
        return;
      }

      // Buscar tenant para obter schema_name
      const { data: tenantData } = await (supabase as any)
        .from('tenants')
        .select('id, schema_name')
        .eq('id', tenantId)
        .single();

      if (!tenantData) {
        console.error('[OnboardingWizard] ❌ Tenant não encontrado');
        return;
      }

      // Buscar ICP principal do tenant (ou criar se não existir)
      const { data: existingICP } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('icp_principal', true)
        .maybeSingle();

      const icpProfile = recommendation.icp_profile || {};
      const analiseDetalhada = recommendation.analise_detalhada || {};

      if (existingICP) {
        // Atualizar ICP existente
        const { error: updateError } = await (supabase as any)
          .from('icp_profiles_metadata')
          .update({
            descricao: analiseDetalhada.resumo_executivo || existingICP.descricao,
            setor_foco: icpProfile.setores_recomendados?.[0] || existingICP.setor_foco,
            nicho_foco: icpProfile.nichos_recomendados?.[0] || existingICP.nicho_foco,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingICP.id);

        if (updateError) {
          console.error('[OnboardingWizard] ❌ Erro ao atualizar ICP:', updateError);
        } else {
          console.log('[OnboardingWizard] ✅ ICP atualizado:', existingICP.id);
          setCreatedIcpId(existingICP.id); // 🔥 CRÍTICO: Setar o ID para exibir botões
          console.log('[OnboardingWizard] 🔥 createdIcpId setado (atualização):', existingICP.id);
          setGeneratedCount(prev => prev + 1);
        }
      } else {
        // Criar novo ICP usando create_icp_profile
        // Converter arrays para JSONB corretamente (Supabase aceita arrays e converte automaticamente)
        const setoresAlvo = Array.isArray(icpProfile.setores_recomendados) 
          ? icpProfile.setores_recomendados 
          : [];
        const cnaesAlvo = Array.isArray(icpProfile.cnaes_recomendados) 
          ? icpProfile.cnaes_recomendados 
          : [];
        const porteAlvo = icpProfile.porte_ideal 
          ? [icpProfile.porte_ideal] 
          : [];
        const estadosAlvo = Array.isArray(icpProfile.localizacao_ideal?.estados)
          ? icpProfile.localizacao_ideal.estados
          : [];
        const regioesAlvo = Array.isArray(icpProfile.localizacao_ideal?.regioes)
          ? icpProfile.localizacao_ideal.regioes
          : [];
        const caracteristicasEspeciais = Array.isArray(icpProfile.caracteristicas_especiais)
          ? icpProfile.caracteristicas_especiais
          : [];
        
        console.log('[OnboardingWizard] 🎯 Criando ICP com dados:', {
          tenantId,
          setores: setoresAlvo.length,
          cnaes: cnaesAlvo.length,
        });
        
        const { data: icpResult, error: createError } = await (supabase as any).rpc('create_icp_profile', {
          p_tenant_id: tenantId,
          p_nome: 'ICP Principal',
          p_descricao: analiseDetalhada.resumo_executivo || 'ICP gerado durante onboarding',
          p_tipo: 'core',
          p_setor_foco: setoresAlvo[0] || null,
          p_nicho_foco: null, // Não temos nichos_recomendados no formato atual
          p_setores_alvo: setoresAlvo, // Supabase converte array para JSONB automaticamente
          p_cnaes_alvo: cnaesAlvo,
          p_porte_alvo: porteAlvo,
          p_estados_alvo: estadosAlvo,
          p_regioes_alvo: regioesAlvo,
          p_faturamento_min: icpProfile.faturamento_ideal?.minimo || null,
          p_faturamento_max: icpProfile.faturamento_ideal?.maximo || null,
          p_funcionarios_min: icpProfile.funcionarios_ideal?.minimo || null,
          p_funcionarios_max: icpProfile.funcionarios_ideal?.maximo || null,
          p_caracteristicas_buscar: caracteristicasEspeciais,
          p_icp_principal: true,
        });

        if (createError) {
          console.error('[OnboardingWizard] ❌ Erro ao criar ICP:', createError);
          throw createError; // Propagar erro para ser tratado acima
        } else {
          console.log('[OnboardingWizard] ✅ ICP criado (ID no tenant):', icpResult);
          
          // Buscar metadata do ICP criado (buscar pelo icp_profile_id OU o último criado)
          let icpMetadataId: string | null = null;
          
          // Primeira tentativa: buscar pelo icp_profile_id
          const { data: icpMetadata, error: metadataError } = await (supabase as any)
            .from('icp_profiles_metadata')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('icp_profile_id', icpResult)
            .maybeSingle();
          
          if (!metadataError && icpMetadata) {
            icpMetadataId = icpMetadata.id;
            console.log('[OnboardingWizard] ✅ Metadata do ICP encontrada:', icpMetadataId);
          } else {
            // Fallback: buscar o último ICP criado para este tenant
            console.log('[OnboardingWizard] 🔍 Buscando último ICP criado (fallback)...');
            const { data: lastMetadata, error: lastError } = await (supabase as any)
              .from('icp_profiles_metadata')
              .select('*')
              .eq('tenant_id', tenantId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (!lastError && lastMetadata) {
              icpMetadataId = lastMetadata.id;
              console.log('[OnboardingWizard] ✅ Metadata do ICP encontrada (fallback):', icpMetadataId);
            } else {
              console.error('[OnboardingWizard] ❌ Não foi possível encontrar metadata do ICP');
            }
          }
          
          if (icpMetadataId) {
            setCreatedIcpId(icpMetadataId);
          }
          
          setGeneratedCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('[OnboardingWizard] ❌ Erro ao salvar ICP:', error);
    }
  };

  const triggerICPGeneration = async (redirect = true) => {
    if (isGeneratingICP) return generationResult;
    setIsGeneratingICP(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Erro de autenticação', {
          description: 'Faça login novamente para continuar.',
        });
        return null;
      }

      // Verificar se os dados mínimos estão preenchidos
      if (!formData.step1_DadosBasicos || !formData.step2_SetoresNichos || !formData.step3_PerfilClienteIdeal) {
        toast.error('Dados incompletos', {
          description: 'Complete pelo menos as etapas 1, 2 e 3 antes de gerar o ICP.',
        });
        setIsGeneratingICP(false);
        return null;
      }

      // Garantir que os dados estão salvos no banco antes de gerar ICP
      console.log('[OnboardingWizard] 💾 Garantindo que dados estão salvos no banco...');
      console.log('[OnboardingWizard] 📋 Dados atuais:', {
        has_step1: !!formData.step1_DadosBasicos,
        has_step2: !!formData.step2_SetoresNichos,
        has_step3: !!formData.step3_PerfilClienteIdeal,
        has_step4: !!formData.step4_SituacaoAtual,
        has_step5: !!formData.step5_HistoricoEEnriquecimento,
        tenantId: tenantId || 'NÃO DISPONÍVEL',
      });

      if (tenantId) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            console.error('[OnboardingWizard] ❌ Usuário não autenticado');
            toast.error('Erro de autenticação', {
              description: 'Faça login novamente para continuar.',
            });
            setIsGeneratingICP(false);
            return null;
          }

          // 🔥 CRÍTICO: Buscar public.users.id usando auth_user_id
          // A tabela onboarding_sessions referencia public.users(id), não auth.users(id)
          const { data: publicUser, error: userError } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('auth_user_id', authUser.id)
            .eq('tenant_id', tenantId)
            .maybeSingle();

          let publicUserId: string | null = null;

          if (userError || !publicUser) {
            console.error('[OnboardingWizard] ❌ Erro ao buscar usuário em public.users:', userError);
            console.log('[OnboardingWizard] 🔍 Tentando criar usuário em public.users...');
            
            // Tentar criar usuário em public.users se não existir
            const { data: newUser, error: createError } = await (supabase as any)
              .from('users')
              .insert({
                email: authUser.email || '',
                nome: authUser.user_metadata?.full_name || authUser.email || 'Usuário',
                auth_user_id: authUser.id,
                tenant_id: tenantId,
              })
              .select()
              .single();

            if (createError || !newUser) {
              console.error('[OnboardingWizard] ❌ Erro ao criar usuário:', createError);
              toast.error('Erro ao criar perfil', {
                description: 'Não foi possível criar seu perfil. Tente novamente.',
              });
              setIsGeneratingICP(false);
              return null;
            }

            console.log('[OnboardingWizard] ✅ Usuário criado em public.users:', newUser.id);
            publicUserId = newUser.id;
          } else {
            publicUserId = publicUser.id;
            console.log('[OnboardingWizard] ✅ Usuário encontrado em public.users:', publicUserId);
          }

          if (!publicUserId) {
            console.error('[OnboardingWizard] ❌ Não foi possível obter publicUserId');
            toast.error('Erro ao obter perfil', {
              description: 'Não foi possível obter seu perfil. Tente novamente.',
            });
            setIsGeneratingICP(false);
            return null;
          }

          const sessionData = {
            user_id: publicUserId, // 🔥 Usar public.users.id, não auth.users.id
            tenant_id: tenantId,
            step1_data: formData.step1_DadosBasicos,
            step2_data: formData.step2_SetoresNichos,
            step3_data: formData.step3_PerfilClienteIdeal,
            step4_data: formData.step4_SituacaoAtual || null,
            step5_data: formData.step5_HistoricoEEnriquecimento || null,
            status: 'draft',
            updated_at: new Date().toISOString(),
          };

          console.log('[OnboardingWizard] 💾 Salvando sessão:', {
            user_id: sessionData.user_id,
            tenant_id: sessionData.tenant_id,
            has_step1: !!sessionData.step1_data,
            has_step2: !!sessionData.step2_data,
            has_step3: !!sessionData.step3_data,
          });

          // Forçar salvamento antes de gerar ICP
          // Primeiro verificar se já existe sessão
          const { data: existingSession } = await (supabase as any)
            .from('onboarding_sessions')
            .select('id')
            .eq('user_id', publicUserId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

          let savedSession;
          if (existingSession) {
            // UPDATE se já existe
            const { data: updatedSession, error: updateError } = await (supabase as any)
              .from('onboarding_sessions')
              .update({
                step1_data: sessionData.step1_data,
                step2_data: sessionData.step2_data,
                step3_data: sessionData.step3_data,
                step4_data: sessionData.step4_data,
                step5_data: sessionData.step5_data,
                status: sessionData.status,
                updated_at: sessionData.updated_at,
              })
              .eq('id', existingSession.id)
              .select()
              .single();

            if (updateError) {
              console.error('[OnboardingWizard] ❌ Erro ao atualizar dados antes de gerar ICP:', updateError);
              toast.error('Erro ao salvar dados', {
                description: `Erro: ${updateError.message || 'Não foi possível salvar os dados.'}`,
              });
              setIsGeneratingICP(false);
              return null;
            }
            savedSession = updatedSession;
          } else {
            // INSERT se não existe
            const { data: insertedSession, error: insertError } = await (supabase as any)
              .from('onboarding_sessions')
              .insert(sessionData)
              .select()
              .single();

            if (insertError) {
              console.error('[OnboardingWizard] ❌ Erro ao inserir dados antes de gerar ICP:', insertError);
              toast.error('Erro ao salvar dados', {
                description: `Erro: ${insertError.message || 'Não foi possível salvar os dados.'}`,
              });
              setIsGeneratingICP(false);
              return null;
            }
            savedSession = insertedSession;
          }
          
          console.log('[OnboardingWizard] ✅ Dados salvos com sucesso antes de gerar ICP. Session ID:', savedSession?.id);
        } catch (saveErr: any) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar dados:', saveErr);
          toast.error('Erro ao salvar dados', {
            description: saveErr.message || 'Não foi possível salvar os dados.',
          });
          setIsGeneratingICP(false);
          return null;
        }
      } else {
        console.warn('[OnboardingWizard] ⚠️ Tenant ID não disponível - tentando gerar ICP sem tenant_id');
        // Continuar mesmo sem tenant_id - a Edge Function vai buscar qualquer sessão do usuário
      }

      console.log('[OnboardingWizard] 🚀 Iniciando geração de ICP...');
      
      // Usar fetch direto para evitar problemas de CORS com supabase.functions.invoke
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/analyze-onboarding-icp`;
      
      console.log('[OnboardingWizard] 📡 Chamando função:', functionUrl);
      
      try {
        // Enviar tenant_id no body para a Edge Function encontrar a sessão correta
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey || '',
          },
          body: JSON.stringify({
            tenant_id: tenantId || null,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          
          console.error('[OnboardingWizard] ❌ Erro na resposta:', {
            status: response.status,
            error: errorData,
          });
          
          throw new Error(`HTTP ${response.status}: ${errorData.error || errorText}${errorData.hint ? ` - ${errorData.hint}` : ''}`);
        }

        const analysisData = await response.json();

        console.log('[OnboardingWizard] ✅ ICP gerado com sucesso:', analysisData);

        setGenerationResult(analysisData);
        
        // Atualizar contador se disponível
        if (analysisData?.generated_count !== undefined) {
          setGeneratedCount(analysisData.generated_count);
        } else {
          // Incrementar contador localmente se não vier do servidor
          setGeneratedCount(prev => prev + 1);
        }

        toast.success('ICP gerado com sucesso!', {
          description: redirect 
            ? 'A análise foi concluída. Redirecionando para visualizar os resultados...'
            : 'A análise foi concluída e será salva ao finalizar o onboarding.',
        });

        if (analysisData?.recommendation && redirect) {
          setTimeout(() => {
            navigate('/onboarding/icp-recommendations', {
              state: { recommendation: analysisData?.recommendation },
            });
          }, 1500);
        }

        return analysisData;
      } catch (error: any) {
        console.error('[OnboardingWizard] ❌ Erro ao gerar ICP:', error);
        toast.error('Erro ao gerar ICP', {
          description: error.message || 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        });
        return null;
      }
    } catch (error: any) {
      console.warn('[OnboardingWizard] ⚠️ Erro ao chamar geração de ICP (não crítico):', error);
      toast.error('Erro ao gerar ICP', {
        description: error.message || 'Erro desconhecido ao tentar gerar ICP.',
      });
      return null;
    } finally {
      setIsGeneratingICP(false);
    }
  };

  const handleSubmit = async () => {
    console.log('[OnboardingWizard] 🚀 handleSubmit chamado - Finalizando onboarding...');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const tenantData = formData.step1_DadosBasicos;
      if (!tenantData) {
        throw new Error('Dados básicos não preenchidos');
      }

      // 🔥 CRÍTICO: Verificar se tenant já existe (foi criado no Step 1)
      let tenant;
      const { multiTenantService } = await import('@/services/multi-tenant.service');
      
      if (tenantId) {
        // Tenant já existe - usar o existente
        console.log('[OnboardingWizard] ✅ Usando tenant existente:', tenantId);
        tenant = await multiTenantService.obterTenant(tenantId);
        if (!tenant) {
          throw new Error('Tenant não encontrado. Por favor, recomece o onboarding.');
        }
        console.log('[OnboardingWizard] ✅ Tenant encontrado:', tenant.id);
      } else {
        // Tentar criar tenant (caso não tenha sido criado no Step 1)
        console.log('[OnboardingWizard] 🚀 Criando novo tenant...');
        try {
          tenant = await multiTenantService.criarTenant({
            nome: tenantData.razaoSocial,
            cnpj: tenantData.cnpj,
            email: tenantData.email,
            telefone: tenantData.telefone,
            plano: 'FREE',
          });
          console.log('[OnboardingWizard] ✅ Tenant criado:', tenant.id);
        } catch (createError: any) {
          // Se falhou porque já existe, buscar pelo CNPJ
          if (createError.message?.includes('já existe')) {
            console.log('[OnboardingWizard] ⚠️ Tenant já existe, buscando pelo CNPJ...');
            const { data: existingTenant } = await (supabase as any)
              .from('tenants')
              .select('*')
              .eq('cnpj', tenantData.cnpj.replace(/\D/g, ''))
              .single();
            
            if (existingTenant) {
              tenant = existingTenant;
              console.log('[OnboardingWizard] ✅ Tenant existente encontrado:', tenant.id);
            } else {
              throw new Error('Não foi possível criar ou encontrar o tenant. Tente novamente.');
            }
          } else {
            throw createError;
          }
        }
      }

      // PASSO 2: Criar ou atualizar usuário vinculado ao tenant
      console.log('[OnboardingWizard] 👤 Criando/atualizando usuário...');
      const { error: userError } = await (supabase as any)
        .from('users')
        .upsert({
          email: tenantData.email,
          nome: tenantData.razaoSocial,
          tenant_id: tenant.id,
          auth_user_id: user.id,
          role: 'OWNER',
        }, {
          onConflict: 'auth_user_id'
        });

      if (userError) {
        console.error('[OnboardingWizard] Erro ao criar usuário:', userError);
        // Tentar apenas atualizar se o usuário já existe
        const { error: updateError } = await (supabase as any)
          .from('users')
          .update({
            tenant_id: tenant.id,
            email: tenantData.email,
            nome: tenantData.razaoSocial,
          })
          .eq('auth_user_id', user.id);

        if (updateError) {
          console.error('[OnboardingWizard] Erro ao atualizar usuário:', updateError);
          throw new Error(`Erro ao criar/atualizar usuário: ${userError.message}`);
        }
      }

      console.log('[OnboardingWizard] ✅ Usuário criado');

      // PASSO 3: Salvar todos os dados do onboarding na sessão (para processamento com IA depois)
      console.log('[OnboardingWizard] 💾 Salvando dados do onboarding...');
      
      const { error: saveError } = await (supabase as any).rpc('save_onboarding_session', {
        p_step1_data: formData.step1_DadosBasicos || null,
        p_step2_data: formData.step2_SetoresNichos || null,
        p_step3_data: formData.step3_PerfilClienteIdeal || null,
        p_step4_data: formData.step4_SituacaoAtual || null,
        p_step5_data: formData.step5_HistoricoEEnriquecimento || null,
      });

      if (saveError) {
        console.warn('[OnboardingWizard] ⚠️ Erro ao salvar sessão (não crítico):', saveError);
        // Não falhar se não conseguir salvar sessão, tenant já foi criado
      }

      console.log('[OnboardingWizard] ✅ Onboarding concluído!');

      // PASSO 4: Gerar múltiplos ICPs automaticamente
      console.log('[OnboardingWizard] 🎯 Gerando múltiplos ICPs...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: icpResult, error: icpError } = await (supabase as any).rpc('generate_icps_from_onboarding', {
            p_tenant_id: tenant.id,
            p_step2_data: formData.step2_SetoresNichos ? JSON.parse(JSON.stringify(formData.step2_SetoresNichos)) : null,
            p_step3_data: formData.step3_PerfilClienteIdeal ? JSON.parse(JSON.stringify(formData.step3_PerfilClienteIdeal)) : null
          });

          if (icpError) {
            console.error('[OnboardingWizard] ❌ Erro ao gerar ICPs:', icpError);
            toast.error('Aviso', {
              description: 'ICP foi criado, mas pode não aparecer imediatamente. Recarregue a página "Meus ICPs" em alguns segundos.',
            });
          } else {
            console.log('[OnboardingWizard] ✅ ICPs gerados:', icpResult);
            if (icpResult?.generated_count) {
              setGeneratedCount(icpResult.generated_count);
            }
            
            // Salvar configuração da empresa
            const { CompanyConfigService } = await import('@/services/companyConfig.service');
            await CompanyConfigService.saveCompanyConfig(
              tenantData,
              tenant.id,
              tenant.schema_name || '',
              'FREE',
              {
                principal: icpResult.icp_core_id,
                mercados: Object.keys(icpResult.icps || {})
                  .filter(key => key.startsWith('icp_') && key !== 'icp_core')
                  .map((key, idx) => ({
                    id: icpResult.icps[key],
                    setor: formData.step2_SetoresNichos?.setoresAlvo?.[idx] || `Setor ${idx + 1}`
                  }))
              }
            );
          }
        }
      } catch (error) {
        console.warn('[OnboardingWizard] ⚠️ Erro ao gerar ICPs (não crítico):', error);
      }

      // 🔥 CRÍTICO: Gerar ICP automaticamente se ainda não foi gerado
      let finalIcpId = createdIcpId;
      
      if (generationResult?.recommendation) {
        // ICP já foi gerado, garantir que está salvo e obter o ID
        console.log('[OnboardingWizard] 💾 Salvando ICP já gerado...');
        await saveICPFromRecommendation(generationResult.recommendation);
        // Aguardar um pouco para garantir que createdIcpId foi atualizado
        await new Promise(resolve => setTimeout(resolve, 500));
        finalIcpId = createdIcpId;
      } else {
        // Gerar ICP automaticamente se não foi gerado ainda
        console.log('[OnboardingWizard] 🎯 Gerando ICP automaticamente ao finalizar...');
        try {
          const analysisData = await triggerICPGeneration(false);
          if (analysisData?.recommendation) {
            await saveICPFromRecommendation(analysisData.recommendation);
            // Aguardar para garantir que createdIcpId foi atualizado
            await new Promise(resolve => setTimeout(resolve, 1000));
            finalIcpId = createdIcpId;
            
            // Se ainda não tem ID, buscar o último ICP criado
            if (!finalIcpId) {
              const { data: lastICP } = await (supabase as any)
                .from('icp_profiles_metadata')
                .select('id')
                .eq('tenant_id', tenant.id)
                .eq('icp_principal', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (lastICP) {
                finalIcpId = lastICP.id;
                console.log('[OnboardingWizard] ✅ ICP encontrado após busca:', finalIcpId);
              }
            }
          }
        } catch (icpError: any) {
          console.error('[OnboardingWizard] ❌ Erro ao gerar ICP ao finalizar:', icpError);
          toast.error('Erro ao gerar ICP', {
            description: 'O tenant foi criado, mas houve um erro ao gerar o ICP. Você pode gerar manualmente em "Meus ICPs".',
          });
        }
      }
      
      // 🔥 CRÍTICO: Redirecionar para o ICP criado
      if (finalIcpId) {
        console.log('[OnboardingWizard] ✅ Redirecionando para ICP:', finalIcpId);
        toast.success('✅ Onboarding concluído com sucesso!', {
          description: 'Redirecionando para o ICP gerado...',
        });
        
        // Limpar dados salvos
        clearSavedData();
        
        // Redirecionar para o perfil do ICP criado
        navigate(`/central-icp/profile/${finalIcpId}`);
      } else {
        console.warn('[OnboardingWizard] ⚠️ ICP não foi criado - redirecionando para lista');
        toast.success('✅ Onboarding concluído!', {
          description: 'Acesse "Meus ICPs" para gerar seu ICP ou configurá-lo manualmente.',
        });
        
        // Limpar dados salvos
        clearSavedData();
        
        // Fallback: redirecionar para lista de ICPs
        navigate('/central-icp/profiles');
      }
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
      2: 'SetoresNichos',
      3: 'PerfilClienteIdeal',
      4: 'SituacaoAtual', // Mantém nome interno para compatibilidade
      5: 'HistoricoEnriquecimento', // Mantém nome interno para compatibilidade
      6: 'ResumoReview',
    };
    return names[step] || '';
  };

  const renderStep = () => {
    const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
    
    // Preparar initialData com dados de steps anteriores quando necessário
    // 🔥 CRÍTICO: Sempre usar dados mais recentes do formData
    let initialData = formData[stepKey] || {};
    
    // Log para debug
    console.log(`[OnboardingWizard] 📋 Renderizando Step ${currentStep}:`, {
      stepKey,
      hasInitialData: !!initialData,
      initialDataKeys: initialData ? Object.keys(initialData) : [],
      formDataKeys: Object.keys(formData),
    });
    
    // Step 6: Passar todos os dados do onboarding para o resumo
    if (currentStep === 6) {
      initialData = formData as Partial<OnboardingData>;
    }
    
    // Step 3: Passar dados do Step 2 (setores e nichos) - SEMPRE atualizar
    if (currentStep === 3) {
      // Buscar dados mais recentes do Step 2 (SEMPRE do step2_SetoresNichos)
      const step2Data = formData.step2_SetoresNichos || {} as any;
      const step3Data = initialData as any;
      
      console.log('[OnboardingWizard] 🔄 Preparando dados para Step3:', {
        step2Data: {
          setoresAlvo: step2Data.setoresAlvo,
          nichosAlvo: step2Data.nichosAlvo,
          nichosAlvoCodes: step2Data.nichosAlvoCodes,
        },
        step3DataExists: !!step3Data,
        step3DataKeys: step3Data ? Object.keys(step3Data) : [],
      });
      
      // FORÇAR: Sempre usar dados do Step2, SEM fallback para dados antigos
      initialData = {
        // Dados do Step 2 (SEMPRE do Step2, SEM dados antigos/mockados)
        setoresAlvo: Array.isArray(step2Data.setoresAlvo) ? step2Data.setoresAlvo : [],
        nichosAlvo: Array.isArray(step2Data.nichosAlvo) ? step2Data.nichosAlvo : [], // NOMES legíveis dos nichos
        nichosAlvoCodes: Array.isArray(step2Data.nichosAlvoCodes) ? step2Data.nichosAlvoCodes : [], // Códigos para salvar no banco
        
        // Manter dados do Step 3 se já existirem (mas não sobrescrever com dados antigos)
        cnaesAlvo: Array.isArray(step3Data?.cnaesAlvo) && step3Data.cnaesAlvo.length > 0 
          ? step3Data.cnaesAlvo 
          : (Array.isArray(step2Data.cnaesAlvo) ? step2Data.cnaesAlvo : []),
        ncmsAlvo: Array.isArray(step3Data?.ncmsAlvo) && step3Data.ncmsAlvo.length > 0 
          ? step3Data.ncmsAlvo 
          : [],
        porteAlvo: Array.isArray(step3Data?.porteAlvo) && step3Data.porteAlvo.length > 0 
          ? step3Data.porteAlvo 
          : [],
        localizacaoAlvo: step3Data?.localizacaoAlvo && 
          (step3Data.localizacaoAlvo.estados?.length > 0 || step3Data.localizacaoAlvo.regioes?.length > 0)
          ? step3Data.localizacaoAlvo
          : { estados: [], regioes: [] },
        faturamentoAlvo: step3Data?.faturamentoAlvo && 
          (step3Data.faturamentoAlvo.minimo || step3Data.faturamentoAlvo.maximo)
          ? step3Data.faturamentoAlvo
          : { minimo: null, maximo: null },
        funcionariosAlvo: step3Data?.funcionariosAlvo && 
          (step3Data.funcionariosAlvo.minimo || step3Data.funcionariosAlvo.maximo)
          ? step3Data.funcionariosAlvo
          : { minimo: null, maximo: null },
        caracteristicasEspeciais: Array.isArray(step3Data?.caracteristicasEspeciais) && step3Data.caracteristicasEspeciais.length > 0
          ? step3Data.caracteristicasEspeciais
          : [],
      };
      
      console.log('[OnboardingWizard] ✅ Dados finais para Step3 (SEM dados antigos):', {
        setoresAlvo: (initialData as any).setoresAlvo,
        nichosAlvo: (initialData as any).nichosAlvo,
        totalSetores: Array.isArray((initialData as any).setoresAlvo) ? (initialData as any).setoresAlvo.length : 0,
        totalNichos: Array.isArray((initialData as any).nichosAlvo) ? (initialData as any).nichosAlvo.length : 0,
      });
    }
    
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      onSave: handleSave,
      initialData,
      isSaving: isSaving, // Não incluir isSubmitting para não bloquear botão Próximo
      hasUnsavedChanges,
    };

    switch (currentStep) {
      case 1:
        return <Step1DadosBasicos {...stepProps} />;
      case 2:
        return <Step2SetoresNichos {...stepProps} />;
      case 3:
        return <Step3PerfilClienteIdeal {...stepProps} />;
      case 4:
        return <Step4SituacaoAtual {...stepProps} />;
      case 5:
        return <Step5HistoricoEnriquecimento {...stepProps} />;
      case 6:
        return (
          <Step6ResumoReview
            {...stepProps}
            isSubmitting={isSubmitting}
            isGenerating={isGeneratingICP}
            onGenerate={async () => {
              // Gerar ICP e salvar em icp_profiles_metadata
              const result = await triggerICPGeneration(false); // Não redirecionar ainda
              if (result?.recommendation && tenantId) {
                // Salvar ICP em icp_profiles_metadata após gerar
                await saveICPFromRecommendation(result.recommendation);
              }
              return result;
            }}
            generatedCount={generatedCount}
            onNext={handleSubmit} // 🔥 CRÍTICO: Conectar ao handleSubmit
            createdIcpId={createdIcpId}
            icpResult={generationResult}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Configure sua Plataforma
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete as informações para personalizar sua experiência
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Guide */}
        <OnboardingStepGuide stepNumber={currentStep} />

        {/* Step Content */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 mt-8">
          {renderStep()}
        </div>

        {/* Footer Helper */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Passo {currentStep} de {totalSteps}
        </div>
      </div>
    </div>
  );
}

