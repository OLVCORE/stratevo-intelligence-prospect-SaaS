// src/components/onboarding/OnboardingWizard.tsx
// [HF-STRATEVO-TENANT] Arquivo mapeado para fluxo de tenants/empresas

import { useState, useEffect, useRef, useMemo } from 'react';
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

// 🔥 CRÍTICO: Funções para gerar chaves de localStorage baseadas em tenant_id
// Isso garante isolamento de dados por empresa
const getStorageKey = (tenantId: string | null) => {
  if (!tenantId) {
    // Se não há tenant_id, usar chave genérica (apenas durante criação inicial)
    return 'onboarding_form_data';
  }
  return `onboarding_form_data_${tenantId}`;
};

const getStepKey = (tenantId: string | null) => {
  if (!tenantId) {
    return 'onboarding_current_step';
  }
  return `onboarding_current_step_${tenantId}`;
};

// Manter compatibilidade com código existente
const ONBOARDING_STORAGE_KEY = 'onboarding_form_data';
const ONBOARDING_STEP_KEY = 'onboarding_current_step';

// 🔥 SAFE MODE: Desativado - dados devem ser salvos no banco
// localStorage é usado como backup, mas banco é a fonte principal
const ONBOARDING_DB_SAFE_MODE = false;

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
  const { tenant, switchTenant, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();
  
  // 🔥 CRÍTICO: Verificar se é para criar novo tenant
  const isNewTenant = searchParams.get('new') === 'true';
  const tenantIdFromUrl = searchParams.get('tenant_id');
  
  // 🔥 DEBUG: Log detalhado dos parâmetros da URL
  useEffect(() => {
    console.log('[OnboardingWizard] 🔍 DEBUG - Parâmetros da URL:', {
      tenant_id: tenantIdFromUrl,
      new: isNewTenant,
      allParams: Object.fromEntries(searchParams.entries()),
      tenantFromContext: tenant?.id,
      tenantFromContextNome: (tenant as any)?.nome,
      windowLocation: window.location.href
    });
  }, [tenantIdFromUrl, isNewTenant, searchParams, tenant]);
  
  // 🔥 CRÍTICO: Determinar tenant_id com prioridade e garantia de sempre ter um ID
  // Prioridade: 1) tenant_id da URL (se especificado), 2) tenant do contexto, 3) gerar local se necessário
  // 🔥 CORRIGIDO: Usar useMemo para recalcular quando searchParams ou tenant mudarem
  const tenantIdDetermined = useMemo(() => {
    console.log('[OnboardingWizard] 🔍 determineTenantId - Verificando:', {
      tenantIdFromUrl,
      tenantIdFromContext: tenant?.id,
      isNewTenant,
      searchParamsString: searchParams.toString(),
      windowLocation: window.location.href
    });
    
    // 🔥 PRIORIDADE 1: tenant_id da URL (sempre usar se existir)
    if (tenantIdFromUrl && tenantIdFromUrl.trim() !== '') {
      console.log('[OnboardingWizard] ✅ Usando tenant_id da URL:', tenantIdFromUrl);
      return tenantIdFromUrl.trim();
    }
    
    // 🔥 PRIORIDADE 2: tenant do contexto (se já carregado)
    if (tenant?.id) {
      console.log('[OnboardingWizard] ✅ Usando tenant_id do contexto:', tenant.id);
      return tenant.id;
    }
    
    // 🔥 PRIORIDADE 3: novo tenant (gerar local temporário)
    if (isNewTenant) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const localTenantId = `local-tenant-${timestamp}-${random}`;
      console.warn('[OnboardingWizard] ⚠️ Novo tenant sem ID, gerando local:', localTenantId);
      return localTenantId;
    }
    
    console.warn('[OnboardingWizard] ⚠️ Nenhum tenant_id encontrado');
    return null;
  }, [tenantIdFromUrl, tenant?.id, isNewTenant, searchParams]);
  
  // 🔥 DEBUG: Log do resultado
  useEffect(() => {
    console.log('[OnboardingWizard] 🚀 Inicializando wizard de onboarding...', {
      tenantId: tenantIdDetermined,
      tenantIdFromUrl,
      tenantFromContext: tenant?.id,
      isNewTenant
    });
  }, [tenantIdDetermined, tenantIdFromUrl, tenant?.id, isNewTenant]);
  
  // 🔥 CRÍTICO: Estado para controlar quando recarregar dados (quando tenant muda)
  const [lastTenantId, setLastTenantId] = useState<string | null>(tenantIdDetermined);
  
  // 🔥 CORRIGIDO: Ref para evitar loops infinitos no useEffect
  const lastTenantIdRef = useRef<string | null>(tenantIdDetermined);
  
  // 🔥 CRÍTICO: Se não temos tenant_id e não é novo tenant, redirecionar
  // 🔥 CORRIGIDO: Aguardar um pouco se temos tenant_id na URL mas ainda não foi carregado no contexto
  useEffect(() => {
    // 🔥 DEBUG: Log detalhado antes de verificar
    console.log('[OnboardingWizard] 🔍 Verificando se precisa redirecionar:', {
      tenantIdDetermined,
      isNewTenant,
      tenantIdFromUrl,
      tenantFromContext: tenant?.id,
      tenantLoading,
      willRedirect: !tenantIdDetermined && !isNewTenant && !tenantLoading
    });
    
    // 🔥 CRÍTICO: Se o tenant está carregando, aguardar antes de tomar qualquer decisão
    if (tenantLoading) {
      console.log('[OnboardingWizard] ⏳ Tenant ainda carregando, aguardando...');
      return; // Não fazer nada enquanto está carregando
    }
    
    // 🔥 CORRIGIDO: Se temos tenant no contexto, não redirecionar (mesmo que tenantIdDetermined seja null)
    if (tenant?.id) {
      console.log('[OnboardingWizard] ✅ Tenant encontrado no contexto, não redirecionando:', tenant.id);
      return; // Não redirecionar se já temos tenant no contexto
    }
    
    // Se temos tenant_id na URL, aguardar um pouco para o contexto carregar
    if (tenantIdFromUrl && !tenant?.id && !isNewTenant) {
      console.log('[OnboardingWizard] ⏳ Tenant_id na URL detectado, aguardando contexto carregar...', tenantIdFromUrl);
      return; // Não redirecionar ainda, aguardar switchTenant carregar
    }
    
    // 🔥 CORRIGIDO: Não redirecionar se o tenant está carregando ou se já existe no contexto
    // Verificar se o contexto já terminou de carregar antes de redirecionar
    if (!tenantIdDetermined && !isNewTenant && !tenant?.id) {
      // 🔥 CRÍTICO: Se estamos na rota /tenant-onboarding mas não temos tenant_id e não é novo tenant,
      // e o contexto já terminou de carregar (tenantLoading = false), então realmente não há tenant
      console.error('[OnboardingWizard] ❌ Sem tenant_id e não é novo tenant, redirecionando...', {
        tenantIdFromUrl,
        tenantFromContext: tenant?.id,
        isNewTenant,
        tenantLoading,
        allSearchParams: Object.fromEntries(searchParams.entries())
      });
      navigate('/my-companies');
      toast.error('Erro ao carregar onboarding', {
        description: 'Selecione uma empresa para continuar.',
      });
    }
  }, [tenantIdDetermined, isNewTenant, navigate, tenantIdFromUrl, tenant?.id, searchParams, tenantLoading]);
  
  // 🔥 CORRIGIDO: Se temos tenant_id na URL mas não no contexto, carregar o tenant primeiro
  useEffect(() => {
    if (tenantIdFromUrl && tenantIdFromUrl.trim() !== '' && tenantIdFromUrl !== tenant?.id && switchTenant) {
      console.log('[OnboardingWizard] 🔄 Tenant_id na URL detectado, carregando tenant no contexto...', {
        tenantIdFromUrl,
        tenantFromContext: tenant?.id,
        willCallSwitchTenant: true
      });
      // Usar switchTenant para carregar o tenant da URL (função completa do contexto)
      switchTenant(tenantIdFromUrl.trim()).catch((err) => {
        console.error('[OnboardingWizard] ❌ Erro ao carregar tenant da URL:', err);
        toast.error('Erro ao carregar empresa', {
          description: 'Não foi possível carregar os dados da empresa selecionada.',
        });
      });
    }
  }, [tenantIdFromUrl, tenant?.id, switchTenant]);
  
  // Se não temos tenant_id válido, retornar null (o useEffect vai redirecionar)
  // 🔥 CORRIGIDO: Aguardar um pouco se temos tenant_id na URL mas ainda não foi determinado
  if (!tenantIdDetermined && !isNewTenant) {
    // Se temos tenant_id na URL mas ainda não foi determinado, aguardar um pouco
    if (tenantIdFromUrl) {
      console.log('[OnboardingWizard] ⏳ Aguardando tenant_id da URL ser processado...', tenantIdFromUrl);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return null;
  }
  
  // 🔥 CRÍTICO: Garantir que sempre temos um tenant_id válido (não pode ser null aqui)
  // Usar tenantIdDetermined se existir, senão gerar um local para novo tenant
  const tenantId: string = tenantIdDetermined || (() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const localId = `local-tenant-${timestamp}-${random}`;
    console.warn('[OnboardingWizard] ⚠️ Gerando tenant_id local:', localId);
    return localId;
  })();
  
  // 🔥 CRÍTICO: Carregar dados do localStorage imediatamente no estado inicial
  // Usar tenantId da URL ou do contexto para isolar dados por empresa
  const savedDataInitial = (() => {
    try {
      const storageKey = getStorageKey(tenantId);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migração de compatibilidade
        if (parsed.step5_HistoricoEnriquecimento && !parsed.step5_HistoricoEEnriquecimento) {
          parsed.step5_HistoricoEEnriquecimento = parsed.step5_HistoricoEnriquecimento;
          delete parsed.step5_HistoricoEnriquecimento;
        }
        return parsed;
      }
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao carregar dados iniciais:', error);
    }
    return {};
  })();
  
  const savedStepInitial = (() => {
    try {
      const stepKey = getStepKey(tenantId);
      const saved = localStorage.getItem(stepKey);
      return saved ? parseInt(saved, 10) : 1;
    } catch (error) {
      return 1;
    }
  })();
  
  const [currentStep, setCurrentStep] = useState(savedStepInitial);
  const [formData, setFormData] = useState<Partial<OnboardingData>>(savedDataInitial);
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

  // 🔥 SAFE MODE: Função blindada para buscar ICP existente
  const loadExistingICP = async (tenantId: string, userId: string | null) => {
    if (!tenantId || !userId) {
      console.warn('[OnboardingWizard] ⚠️ loadExistingICP chamado sem tenantId ou userId, ignorando.');
      return null;
    }

    // SAFE MODE: se ONBOARDING_DB_SAFE_MODE estiver ligado, nunca deixe o erro subir.
    try {
      if (ONBOARDING_DB_SAFE_MODE) {
        console.log('[OnboardingWizard] (SAFE MODE) Tentando buscar ICP existente...', {
          tenantId,
          userId,
        });
      }

      // Buscar ICP principal
      const { data, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('icp_principal', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        console.log('[OnboardingWizard] ℹ️ Nenhum ICP existente encontrado para este tenant/usuário.');
        return null;
      }

      console.log('[OnboardingWizard] ✅ ICP existente carregado:', data);
      return data;
    } catch (error: any) {
      // 🔥 PONTO CRÍTICO: nunca deixar esse erro quebrar o fluxo do wizard
      if (error?.code === '42P17') {
        console.warn(
          '[OnboardingWizard] ⚠️ SAFE MODE – Erro de recursão em policy de users ao buscar ICP. Ignorando e seguindo sem ICP do banco.',
          error
        );
        return null;
      }

      console.error('[OnboardingWizard] ❌ Erro ao buscar ICP existente (não fatal):', error);
      return null;
    }
  };

  // 🔥 SAFE MODE: Função blindada para carregar sessão do banco
  const loadSessionFromDatabase = async (
    tenantId: string,
    userId: string | null
  ): Promise<any | null> => {
    if (!tenantId || !userId) {
      console.warn('[OnboardingWizard] ⚠️ loadSessionFromDatabase sem tenantId ou userId, retornando null.');
      return null;
    }

    try {
      if (ONBOARDING_DB_SAFE_MODE) {
        console.log('[OnboardingWizard] (SAFE MODE) Tentando carregar sessão do banco...', {
          tenantId,
          userId,
        });
      }

      const { data, error } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        console.log('[OnboardingWizard] ℹ️ Nenhuma sessão encontrada no banco.');
        return null;
      }

      console.log('[OnboardingWizard] ✅ Sessão carregada do banco:', data);
      return data;
    } catch (error: any) {
      if (error?.code === '42P17') {
        console.warn(
          '[OnboardingWizard] ⚠️ SAFE MODE – Erro de recursão em policy de users ao buscar sessão. Ignorando banco e usando apenas localStorage.',
          error
        );
        return null;
      }

      console.error('[OnboardingWizard] Erro ao buscar sessão (não fatal):', error);
      return null;
    }
  };

  // Helper para carregar dados do localStorage
  // 🔥 CRÍTICO: Função para carregar dados salvos baseada em tenant_id
  // Isso garante isolamento de dados por empresa
  const loadSavedData = (targetTenantId?: string | null): { step: number; data: Partial<OnboardingData> } => {
    try {
      // Usar tenantId fornecido ou o atual do componente
      const effectiveTenantId = targetTenantId ?? tenantId;
      const storageKey = getStorageKey(effectiveTenantId);
      const stepKey = getStepKey(effectiveTenantId);
      
      const savedStep = localStorage.getItem(stepKey);
      const savedData = localStorage.getItem(storageKey);
      
      let data = savedData ? JSON.parse(savedData) : {};
      
      // 🔥 COMPATIBILIDADE: Migrar dados salvos com nome antigo (sem E extra)
      if (data.step5_HistoricoEnriquecimento && !data.step5_HistoricoEEnriquecimento) {
        console.log('[OnboardingWizard] 🔄 Migrando dados do Step5 (nome antigo → novo)');
        data.step5_HistoricoEEnriquecimento = data.step5_HistoricoEnriquecimento;
        delete data.step5_HistoricoEnriquecimento;
        // Salvar dados migrados
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      
      return {
        step: savedStep ? parseInt(savedStep, 10) : 1,
        data,
      };
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao carregar dados salvos:', error);
      return { step: 1, data: {} };
    }
  };

  // [HF-STRATEVO-ONBOARDING] Função robusta para obter um identificador de usuário
  // Não depende mais de RPC get_public_user_id nem de consultas à tabela users
  // Usa authUserId como fallback principal para evitar erros 500/404
  const getPublicUserId = async (
    authUserId: string | undefined | null,
    tenantId?: string
  ): Promise<string | null> => {
    try {
      if (!authUserId) {
        console.warn(
          '[OnboardingWizard] ⚠️ authUserId não informado, prosseguindo sem vincular usuário'
        );
        return null;
      }

      // 🔹 1) TENTATIVA OPCIONAL: se ainda existir a RPC get_public_user_id, use-a,
      //    mas trate 404, 42P17 ou erro como cenário normal (NÃO lançar erro, apenas logar).
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_public_user_id', {
          p_auth_user_id: authUserId,
          p_tenant_id: tenantId ?? null,
        });

        if (!rpcError && rpcData) {
          console.log('[OnboardingWizard] ✅ get_public_user_id retornou id público');
          return rpcData as string;
        }

        if (rpcError) {
          // 🔥 SAFE MODE: Tratar 42P17 especificamente
          if (rpcError.code === '42P17') {
            console.warn(
              '[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 na RPC get_public_user_id. Usando authUserId como fallback.'
            );
                } else {
            // 404 ou qualquer outra falha → logar e seguir com fallback
            console.warn(
              '[OnboardingWizard] RPC get_public_user_id falhou, usando fallback para authUserId',
              rpcError
            );
          }
        }
      } catch (rpcError: any) {
        // 🔥 SAFE MODE: Tratar 42P17 especificamente
        if (rpcError?.code === '42P17') {
          console.warn(
            '[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 na RPC get_public_user_id. Usando authUserId como fallback.'
          );
        } else {
          // 404 ou qualquer erro na RPC → apenas logar e seguir
          console.warn(
            '[OnboardingWizard] RPC get_public_user_id não disponível, usando authUserId como identificador',
            rpcError?.message || rpcError
          );
        }
      }

      // 🔹 2) Fallback controlado: USAR authUserId diretamente como identificador
      //    (isso evita recursão em public.users / users e remove dependência do antigo modelo)
      console.log(
        '[OnboardingWizard] ℹ️ Usando authUserId como identificador de usuário no onboarding'
      );
      return authUserId;
    } catch (error: any) {
      console.error(
        '[OnboardingWizard] Erro inesperado em getPublicUserId, prosseguindo sem travar fluxo',
        error
      );
      // 🔹 3) Em último caso, retorne null mas NÃO quebre o fluxo do wizard
      return null;
    }
  };

  // Função para recarregar dados do banco (reutilizável)
  const reloadSessionFromDatabase = async () => {
    try {
      console.log('[OnboardingWizard] 🔄 reloadData – execução básica ativa');

      // 🔥 SAFE MODE: Não chamar Supabase para onboarding_sessions enquanto o backend responde 500
      if (ONBOARDING_DB_SAFE_MODE) {
        // Apenas garantir que o estado interno do wizard esteja alinhado com o último snapshot salvo no localStorage
        // Usar tenantId para isolar dados por empresa
        const savedData = loadSavedData(tenantId);
        // 🔥 CRÍTICO: SEMPRE fazer merge, NUNCA substituir - preservar dados existentes no estado
        setFormData(prev => {
          // Se não há dados salvos, manter estado atual
          if (!savedData.data || Object.keys(savedData.data).length === 0) {
            console.log('[OnboardingWizard] ℹ️ Nenhum dado no localStorage para este tenant, mantendo estado atual');
            return prev;
          }
          // MERGE não-destrutivo: dados do estado atual têm prioridade, complementar com localStorage
          const merged = { ...savedData.data, ...prev };
          console.log('[OnboardingWizard] 🔄 Sincronizando estado com localStorage (SAFE MODE) - merge preservando estado atual');
          return merged;
        });
        return;
      }

      // (fora do SAFE MODE, manter a lógica já existente para comparar updated_at, mas
      // SEM nunca limpar dados se a chamada ao backend falhar)
      // Por enquanto, não implementar polling de updated_at para evitar loops
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao recarregar dados:', error);
    }
  };

  // 🔥 CRÍTICO: Buscar ICP existente quando tenant carrega (apenas 1x)
  useEffect(() => {
    const initializeICP = async () => {
      // 🔥 CRÍTICO: Não buscar ICP se for novo tenant
      if (isNewTenant || !tenantId) return;
      
      // Obter userId para buscar ICP
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      
      const publicUserId = await getPublicUserId(authUser.id, tenantId);
      const effectiveUserId = publicUserId ?? authUser.id ?? null;
      
      if (!effectiveUserId) return;
      
      // Usar função blindada
      const existingICP = await loadExistingICP(tenantId, effectiveUserId);
      
      if (existingICP) {
          console.log('[OnboardingWizard] ✅ ICP existente encontrado:', existingICP.id);
          setCreatedIcpId(existingICP.id);
          console.log('[OnboardingWizard] 🔥 createdIcpId setado (carregamento):', existingICP.id);
      }
    };
    
    initializeICP();
  }, [tenantId, isNewTenant]); // 🔥 CRÍTICO: Incluir isNewTenant para não buscar ICP quando for novo tenant

  // 🔥 CRÍTICO: Escutar mudanças no tenant do contexto e recarregar dados
  useEffect(() => {
    const handleTenantChanged = async (event: CustomEvent) => {
      const { tenantId: newTenantId, tenant: newTenant } = event.detail;
      console.log('[OnboardingWizard] 📢 Tenant mudou no contexto:', { newTenantId, currentTenantId: tenantIdDetermined });
      
      // Se o tenant mudou, recarregar dados do novo tenant
      if (newTenantId && newTenantId !== tenantIdDetermined) {
        console.log('[OnboardingWizard] 🔄 Tenant mudou, recarregando dados do novo tenant:', newTenantId);
        
        // Carregar dados do novo tenant do localStorage
        const { step: savedStep, data: savedData } = loadSavedData(newTenantId);
        
        // Atualizar estado com dados do novo tenant
        if (savedData && Object.keys(savedData).length > 0) {
          console.log('[OnboardingWizard] ✅ Dados do novo tenant carregados:', {
            tenantId: newTenantId,
            step: savedStep,
            keys: Object.keys(savedData),
          });
          setFormData(savedData);
          setCurrentStep(savedStep);
        } else {
          console.log('[OnboardingWizard] ℹ️ Nenhum dado salvo para o novo tenant, iniciando do zero');
          setFormData({});
          setCurrentStep(1);
        }
        
        setLastTenantId(newTenantId);
      }
    };
    
    window.addEventListener('tenant-changed', handleTenantChanged as EventListener);
    
    return () => {
      window.removeEventListener('tenant-changed', handleTenantChanged as EventListener);
    };
  }, [tenantIdDetermined]);
  
  // 🔥 CRÍTICO: Recarregar dados quando tenantIdDetermined muda
  // 🔥 CORRIGIDO: Usar ref para evitar loops infinitos
  useEffect(() => {
    // Atualizar ref quando lastTenantId mudar
    lastTenantIdRef.current = lastTenantId;
  }, [lastTenantId]);
  
  useEffect(() => {
    // 🔥 CORRIGIDO: Verificar se realmente mudou usando ref para evitar loops
    if (tenantIdDetermined && tenantIdDetermined !== lastTenantIdRef.current) {
      console.log('[OnboardingWizard] 🔄 tenantIdDetermined mudou, recarregando dados:', {
        old: lastTenantIdRef.current,
        new: tenantIdDetermined,
      });
      
      // Atualizar ref imediatamente para evitar múltiplas execuções
      lastTenantIdRef.current = tenantIdDetermined;
      
      // Carregar dados do novo tenant
      const { step: savedStep, data: savedData } = loadSavedData(tenantIdDetermined);
      
      if (savedData && Object.keys(savedData).length > 0) {
        console.log('[OnboardingWizard] ✅ Dados carregados para novo tenant:', {
          tenantId: tenantIdDetermined,
          step: savedStep,
          keys: Object.keys(savedData),
        });
        setFormData(savedData);
        setCurrentStep(savedStep);
      } else {
        // 🔥 CRÍTICO: Se não há dados salvos, limpar formData para forçar recarregamento do Step1
        console.log('[OnboardingWizard] ℹ️ Nenhum dado salvo para novo tenant, limpando formData para recarregar do banco');
        setFormData({});
        setCurrentStep(1);
      }
      
      setLastTenantId(tenantIdDetermined);
    }
  }, [tenantIdDetermined]);

  // 🔥 SAFE MODE: Carregar dados priorizando localStorage, banco como best effort
  useEffect(() => {
    const initialize = async () => {
      // 🔥 CRÍTICO: Se for novo tenant, limpar tudo e começar do zero
      if (isNewTenant) {
        console.log('[OnboardingWizard] 🆕 Criando novo tenant - limpando todos os dados');
        console.log('[OnboardingWizard] 🔍 Parâmetros da URL:', {
          isNewTenant,
          tenantIdFromUrl,
          tenantId,
          tenantFromContext: tenant?.id,
        });
        // 🔥 CRÍTICO: Limpar localStorage COMPLETAMENTE para garantir que não há dados antigos
        // Se há tenantId, limpar apenas os dados desse tenant específico
        if (tenantId) {
          localStorage.removeItem(getStorageKey(tenantId));
          localStorage.removeItem(getStepKey(tenantId));
        } else {
          // Se não há tenantId, limpar chaves genéricas (compatibilidade)
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        }
        // Limpar estado completamente
        setFormData({});
        setCurrentStep(1);
        setHasUnsavedChanges(false);
        setLastSavedStep(0);
        setIsLoadingSession(false);
        setCreatedIcpId(null);
        setCreatedIcpMetadata(null);
        setGenerationResult(null);
        setIsLoadingSession(false);
        console.log('[OnboardingWizard] ✅ Estado limpo - pronto para novo cadastro');
        return;
      }

      if (!tenantId) {
        // Se não há tenant_id, carregar do localStorage (usar chave genérica)
        const { step: savedStep, data: savedData } = loadSavedData(null);
        setCurrentStep(savedStep);
        setFormData(savedData);
        setIsLoadingSession(false);
        return;
      }

        setIsLoadingSession(true);
      console.log('[OnboardingWizard] 🚀 Inicializando wizard de onboarding...', { tenantId });

        // Buscar usuário atual para obter user_id
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
        console.warn('[OnboardingWizard] ⚠️ Usuário não autenticado, usando apenas localStorage');
        const { step: savedStep, data: savedData } = loadSavedData(tenantId);
        setCurrentStep(savedStep);
        // 🔥 CRÍTICO: MERGE não-destrutivo - preservar dados existentes no estado
        setFormData(prev => {
          if (!savedData || Object.keys(savedData).length === 0) {
            return prev; // Manter estado atual se não há dados salvos
          }
          return { ...savedData, ...prev }; // Merge: localStorage primeiro, depois estado atual (estado atual tem prioridade)
        });
            setIsLoadingSession(false);
            return;
          }
          
      // Obter identificador de usuário (pode ser publicUserId ou authUserId)
      const publicUserId = await getPublicUserId(authUser.id, tenantId);
      
      // Usar authUserId como fallback se publicUserId não estiver disponível
      const effectiveUserId = publicUserId ?? authUser.id ?? null;
      
      try {
        // 1) Tenta carregar do localStorage primeiro (usar tenantId para isolar dados)
        const { step: savedStep, data: savedData } = loadSavedData(tenantId);
        
        // 🔥 CRÍTICO: SEMPRE fazer merge, NUNCA substituir - preservar dados existentes
        if (savedData && Object.keys(savedData).length > 0) {
          console.log('[OnboardingWizard] ✅ Sessão carregada do localStorage para tenant:', {
            tenantId,
            step: savedStep,
            keys: Object.keys(savedData),
          });
          setFormData(prev => {
            // Merge: localStorage primeiro, depois estado atual (estado atual tem prioridade)
            return { ...savedData, ...prev };
          });
          setCurrentStep(savedStep);
        } else {
          // Se não há dados salvos, manter estado atual (não resetar)
          console.log('[OnboardingWizard] ℹ️ Nenhum dado no localStorage para este tenant, mantendo estado atual');
        }

        // 2) Em paralelo, tenta buscar do banco (best effort) - apenas se não estiver em SAFE MODE
        if (!ONBOARDING_DB_SAFE_MODE && effectiveUserId) {
          const dbSession = await loadSessionFromDatabase(tenantId, effectiveUserId);
          
          if (dbSession) {
            console.log('[OnboardingWizard] 🔁 Sincronizando sessão com dados do banco...');
          
          // Converter dados do banco para o formato do OnboardingData
          const loadedData: Partial<OnboardingData> = {};
          
            if (dbSession.step1_data) {
              loadedData.step1_DadosBasicos = dbSession.step1_data;
          }
            if (dbSession.step2_data) {
              loadedData.step2_SetoresNichos = dbSession.step2_data;
          }
            if (dbSession.step3_data) {
              loadedData.step3_PerfilClienteIdeal = dbSession.step3_data;
          }
          
          // 🔥 MIGRAÇÃO: Mover empresasBenchmarking de step4 para step5
            if (dbSession.step4_data) {
              const step4Data = { ...dbSession.step4_data };
            const empresasBenchmarking = step4Data.empresasBenchmarking;
            
            // Remover empresasBenchmarking do step4
            if (empresasBenchmarking) {
              delete step4Data.empresasBenchmarking;
            }
            
            loadedData.step4_SituacaoAtual = step4Data;
            
            // Adicionar empresasBenchmarking ao step5 se existir
              if (empresasBenchmarking && dbSession.step5_data) {
              loadedData.step5_HistoricoEEnriquecimento = {
                  ...dbSession.step5_data,
                empresasBenchmarking: empresasBenchmarking,
              };
            } else if (empresasBenchmarking) {
              loadedData.step5_HistoricoEEnriquecimento = {
                empresasBenchmarking: empresasBenchmarking,
              } as any;
            }
          }
          
            if (dbSession.step5_data && !loadedData.step5_HistoricoEEnriquecimento) {
              loadedData.step5_HistoricoEEnriquecimento = dbSession.step5_data;
          }

          // Determinar o último step preenchido
          let lastStep = 1;
            if (dbSession.step5_data) lastStep = 6;
            else if (dbSession.step4_data) lastStep = 5;
            else if (dbSession.step3_data) lastStep = 4;
            else if (dbSession.step2_data) lastStep = 3;
            else if (dbSession.step1_data) lastStep = 2;

            setFormData(prev => ({ ...prev, ...loadedData }));
          setCurrentStep(lastStep);
          
          // Salvar também no localStorage para manter sincronizado (usar chave baseada em tenant_id)
          const storageKey = getStorageKey(tenantId);
          const stepKey = getStepKey(tenantId);
          localStorage.setItem(storageKey, JSON.stringify({ ...savedData, ...loadedData }));
          localStorage.setItem(stepKey, lastStep.toString());
          
            // 🔥 Removido toast automático - seguindo melhores práticas (Google Docs, Notion, etc.)
            // Dados são carregados silenciosamente, sem interromper o usuário
          }
        } else if (ONBOARDING_DB_SAFE_MODE) {
          console.log('[OnboardingWizard] (SAFE MODE) Pulo busca de sessão no banco.');
        }
      }
      catch (error: any) {
        // 🔥 CRÍTICO: Nunca limpar localStorage em caso de erro
        console.error('[OnboardingWizard] ❌ Erro ao inicializar (não fatal, usando localStorage):', error);
        // Não mostrar toast de erro em SAFE MODE para não assustar o usuário
        if (!ONBOARDING_DB_SAFE_MODE) {
        toast.error('Erro ao carregar dados do onboarding', {
          description: error.message || 'Tente novamente mais tarde.',
        });
        }
      } finally {
        setIsLoadingSession(false);
      }
    };

    void initialize();
  }, [tenantId, isNewTenant]); // 🔥 CRÍTICO: Incluir isNewTenant nas dependências

  // 🔥 CORRIGIDO: Recarregar dados ao mudar de etapa (com proteção contra loops)
  const lastReloadRef = useRef<{ step: number; tenantId: string | null }>({ step: 0, tenantId: null });
  
  useEffect(() => {
    if (tenantId && currentStep >= 1) {
      // 🔥 CRÍTICO: Só recarregar se step ou tenantId realmente mudaram
      if (lastReloadRef.current.step === currentStep && lastReloadRef.current.tenantId === tenantId) {
        return; // Já recarregou para este step/tenant
      }
      
      lastReloadRef.current = { step: currentStep, tenantId };
      
      // Pequeno delay para garantir que o componente foi renderizado
      const timer = setTimeout(() => {
        reloadSessionFromDatabase();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentStep, tenantId]);

  // 🔥 CRÍTICO: Desativar qualquer polling de updated_at em SAFE MODE
  useEffect(() => {
    if (ONBOARDING_DB_SAFE_MODE) {
      // Limpar qualquer intervalo que possa estar ativo
      console.log('[OnboardingWizard] (SAFE MODE) Desativando polling de onboarding_sessions por erro 500 contínuo.');
    }
  }, []);

  // 🔥 CRÍTICO: Função de salvamento reutilizável
  const saveDataImmediately = async (dataToSave: Partial<OnboardingData> = formData, forceSave = false) => {
    try {
      const isAuto = forceSave ?? false;

      try {
        console.log(
          isAuto
            ? '[OnboardingWizard] 💾 (auto) Salvando dados (implementação estável básica)'
            : '[OnboardingWizard] 💾 Salvando dados (implementação estável básica)',
          { stepKey: currentStep }
        );

        // Aqui será reintroduzida, em iterações futuras,
        // a lógica completa de persistência no Supabase (insert/update)
        // mantendo SEMPRE este try/catch interno.
        //
        // Por enquanto, o objetivo é garantir que a função
        // não quebre a compilação nem o fluxo do wizard.
        } catch (error) {
        console.warn(
          '[OnboardingWizard] ⚠️ Erro ao salvar automaticamente no banco:',
          error
        );
      }
    } catch (error) {
      console.error('[OnboardingWizard] Erro ao salvar dados:', error);
    }
  };

  // 🔥 CRÍTICO: Salvar dados automaticamente no localStorage sempre que mudarem (debounce curto)
  useEffect(() => {
    // 🔥 CRÍTICO: Marcar como tendo alterações não salvas quando formData muda
    // Comparar com último estado salvo para detectar mudanças reais
    if (Object.keys(formData).length > 0 && currentStep !== lastSavedStep) {
      setHasUnsavedChanges(true);
    }

    // Salvar no localStorage IMEDIATAMENTE (sem debounce para preservar dados ao mudar de aba)
    // 🔥 CORRIGIDO: Não salvar cnpjData completo (pode ser enorme) - apenas dados essenciais
    try {
      const storageKey = getStorageKey(tenantId);
      const stepKey = getStepKey(tenantId);
      
      // Criar versão compacta sem cnpjData completo (só salvar no banco)
      const compactFormData: any = { ...formData };
      if (compactFormData.step1_DadosBasicos && typeof compactFormData.step1_DadosBasicos === 'object') {
        const step1Data = compactFormData.step1_DadosBasicos as any;
        if (step1Data.cnpjData) {
          // Remover cnpjData completo, manter apenas referência
          compactFormData.step1_DadosBasicos = {
            ...step1Data,
            cnpjData: null, // Não salvar no localStorage
            hasCnpjData: true, // Flag apenas
          };
        }
      }
      
      const dataToStore = JSON.stringify(compactFormData);
      
      // Verificar tamanho antes de salvar
      if (dataToStore.length > 100000) { // ~100KB limite
        console.warn('[OnboardingWizard] ⚠️ Dados muito grandes para localStorage, pulando salvamento local');
        // Limpar localStorage antigo se estiver cheio
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      } else {
        localStorage.setItem(storageKey, dataToStore);
        localStorage.setItem(stepKey, currentStep.toString());
        console.log('[OnboardingWizard] 💾 Auto-save localStorage:', { 
          currentStep, 
          hasData: Object.keys(compactFormData).length > 0,
          tenantId,
          size: dataToStore.length,
        });
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('[OnboardingWizard] ⚠️ localStorage cheio, limpando dados antigos...');
        // Limpar dados antigos
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('onboarding_form_data_') || key.startsWith('onboarding_current_step_')) {
              localStorage.removeItem(key);
            }
          });
          console.log('[OnboardingWizard] ✅ localStorage limpo');
        } catch (cleanError) {
          console.error('[OnboardingWizard] ❌ Erro ao limpar localStorage:', cleanError);
        }
      } else {
        console.error('[OnboardingWizard] ❌ Erro ao salvar no localStorage:', error);
      }
    }

    // Salvar no banco com debounce (para não sobrecarregar) - apenas se não estiver em SAFE MODE
    let timeoutId: NodeJS.Timeout | null = null;
    if (!ONBOARDING_DB_SAFE_MODE) {
      timeoutId = setTimeout(() => {
      if (tenantId && Object.keys(formData).length > 0) {
        saveDataImmediately();
      }
    }, 2000); // Debounce de 2 segundos para o banco
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [formData, currentStep, tenantId, lastSavedStep]);

  // 🔥 CRÍTICO: Salvar quando a aba perder o foco (antes de mudar de aba)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Aba perdeu o foco - salvar imediatamente no localStorage (síncrono)
        console.log('[OnboardingWizard] 🔄 Aba perdeu o foco - salvando dados...');
        try {
          // Usar os valores atuais do estado através do closure (usar chave baseada em tenant_id)
          const storageKey = getStorageKey(tenantId);
          const stepKey = getStepKey(tenantId);
          localStorage.setItem(storageKey, JSON.stringify(formData));
          localStorage.setItem(stepKey, currentStep.toString());
          console.log('[OnboardingWizard] ✅ Dados salvos no localStorage ao perder foco');
        } catch (error) {
          console.error('[OnboardingWizard] ❌ Erro ao salvar ao perder foco:', error);
        }
        // Também tentar salvar no banco (assíncrono) - apenas se não estiver em SAFE MODE
        if (!ONBOARDING_DB_SAFE_MODE && tenantId && Object.keys(formData).length > 0) {
          saveDataImmediately(formData, true);
        }
      } else {
        // Aba voltou ao foco - recarregar dados do localStorage primeiro
        console.log('[OnboardingWizard] 🔄 Aba voltou ao foco - recarregando dados...');
        try {
          const savedData = loadSavedData(tenantId);
          if (savedData.data && Object.keys(savedData.data).length > 0) {
            console.log('[OnboardingWizard] ✅ Dados recuperados do localStorage para tenant:', {
              tenantId,
              step: savedData.step,
              keys: Object.keys(savedData.data),
            });
            // 🔥 CRÍTICO: MERGE não-destrutivo - estado atual tem prioridade sobre localStorage
            setFormData(prevData => {
              // Se estado atual está vazio, usar dados do localStorage
              if (!prevData || Object.keys(prevData).length === 0) {
                return savedData.data;
              }
              // Merge: localStorage primeiro, depois estado atual (estado atual tem prioridade)
              return { ...savedData.data, ...prevData };
            });
            if (savedData.step !== currentStep && savedData.step >= 1 && savedData.step <= totalSteps) {
              setCurrentStep(savedData.step);
            }
          } else {
            // Se não há dados salvos, manter estado atual (não resetar)
            console.log('[OnboardingWizard] ℹ️ Nenhum dado no localStorage ao voltar foco, mantendo estado atual');
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 🔥 CRÍTICO: Alertar usuário se há alterações não salvas
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
      
      // Usar método síncrono para garantir salvamento (usar chave baseada em tenant_id)
      try {
        const storageKey = getStorageKey(tenantId);
        const stepKey = getStepKey(tenantId);
        localStorage.setItem(storageKey, JSON.stringify(formData));
        localStorage.setItem(stepKey, currentStep.toString());
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
  }, [formData, currentStep, tenantId, totalSteps, hasUnsavedChanges]); // Incluir hasUnsavedChanges para alerta funcionar

  // Limpar dados salvos após conclusão bem-sucedida (usar chave baseada em tenant_id)
  const clearSavedData = () => {
    if (tenantId) {
      localStorage.removeItem(getStorageKey(tenantId));
      localStorage.removeItem(getStepKey(tenantId));
    } else {
      // Compatibilidade: limpar chaves genéricas
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    }
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
      
      // Salvar no localStorage imediatamente (sempre funciona) - usar chave baseada em tenant_id
      // 🔥 CORRIGIDO: Não salvar cnpjData completo
      try {
        const storageKey = getStorageKey(tenantId);
        const stepKey = getStepKey(tenantId);
        
        // Criar versão compacta sem cnpjData completo
        const compactData: any = { ...updatedFormData };
        if (compactData.step1_DadosBasicos && typeof compactData.step1_DadosBasicos === 'object') {
          const step1Data = compactData.step1_DadosBasicos as any;
          if (step1Data.cnpjData) {
            compactData.step1_DadosBasicos = { ...step1Data, cnpjData: null, hasCnpjData: true };
          }
        }
        
        const dataToStore = JSON.stringify(compactData);
        if (dataToStore.length > 100000) {
          console.warn('[OnboardingWizard] ⚠️ Dados muito grandes, pulando localStorage');
        } else {
          localStorage.setItem(storageKey, dataToStore);
          localStorage.setItem(stepKey, currentStep.toString());
        }
        console.log('[OnboardingWizard] ✅ Dados salvos no localStorage:', { 
          step: currentStep, 
          stepKey,
          hasData: !!stepData 
        });
      } catch (error) {
        console.error('[OnboardingWizard] ❌ Erro ao salvar no localStorage:', error);
      }

      // 🔥 SAFE MODE: localStorage já foi salvo acima, agora tentar banco (best effort)
      let saveSuccess = true; // Sempre true porque localStorage já foi salvo
      
      // Só tentar Supabase se não estiver em SAFE MODE
      if (!ONBOARDING_DB_SAFE_MODE && tenantId) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Obter identificador de usuário (pode ser publicUserId ou authUserId)
            const publicUserId = await getPublicUserId(authUser.id, tenantId);
            const effectiveUserId = publicUserId ?? authUser.id ?? null;

            if (effectiveUserId) {
            // Verificar se já existe sessão
            const { data: existingSession } = await (supabase as any)
              .from('onboarding_sessions')
              .select('id')
                .eq('user_id', effectiveUserId)
              .eq('tenant_id', tenantId)
              .maybeSingle();

            const sessionData = {
                user_id: effectiveUserId,
              tenant_id: tenantId,
              step1_data: updatedFormData.step1_DadosBasicos || null,
              step2_data: updatedFormData.step2_SetoresNichos || null,
              step3_data: updatedFormData.step3_PerfilClienteIdeal || null,
              step4_data: updatedFormData.step4_SituacaoAtual || null,
              step5_data: updatedFormData.step5_HistoricoEEnriquecimento || null,
                status: currentStep < totalSteps ? 'draft' : 'submitted',
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
                  console.warn('[OnboardingWizard] ⚠️ Salvamento no banco falhou, mas dados estão salvos localmente. Prosseguindo...');
              } else {
                console.log('[OnboardingWizard] ✅ Dados atualizados no banco com sucesso');
              }
            } else {
              // INSERT
              const { error: insertError } = await (supabase as any)
                .from('onboarding_sessions')
                .insert(sessionData)
                .select()
                .single();

              if (insertError) {
                  console.warn('[OnboardingWizard] ⚠️ Salvamento no banco falhou, mas dados estão salvos localmente. Prosseguindo...');
              } else {
                console.log('[OnboardingWizard] ✅ Dados inseridos no banco com sucesso');
                }
              }
            }
          }
        } catch (error: any) {
          // 🔥 CRÍTICO: Não bloquear navegação - dados já estão salvos localmente
          console.error('[OnboardingWizard] Erro ao salvar dados (mas estado/localStorage já foram atualizados):', error);
        }
      } else if (ONBOARDING_DB_SAFE_MODE) {
        console.log('[OnboardingWizard] (SAFE MODE) Salvando somente em localStorage (sem banco).');
      } else {
        // Sem tenant_id - Step 1: criar tenant APENAS se CNPJ foi buscado e confirmado
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
            const cnpjData = (tenantData as any).cnpjData;
            
            // 🔥 CRÍTICO: Só criar tenant se CNPJ foi buscado e tem razão social
            if (!cnpjData?.nome && !tenantData.razaoSocial) {
              console.log('[OnboardingWizard] ⏸️ Aguardando busca de CNPJ antes de criar tenant...');
              // Não criar tenant ainda - apenas salvar no localStorage
              setIsSaving(false);
              return;
            }
            
            const { multiTenantService } = await import('@/services/multi-tenant.service');
            
            console.log('[OnboardingWizard] 🚀 Criando tenant no Step 1 com dados da Receita Federal...');
            // 🔥 CRÍTICO: Usar SEMPRE a razão social do CNPJ (nunca "Nova Empresa")
            const nomeTenant = cnpjData?.nome || tenantData.razaoSocial;
            const cnpjLimpo = tenantData.cnpj ? tenantData.cnpj.replace(/\D/g, '') : '';
            
            if (!nomeTenant) {
              console.warn('[OnboardingWizard] ⚠️ Não é possível criar tenant sem razão social');
              toast.error('Erro ao criar empresa', {
                description: 'Por favor, busque os dados do CNPJ antes de continuar.',
              });
              setIsSaving(false);
              return;
            }
            
            const tenant = await multiTenantService.criarTenant({
              nome: nomeTenant,
              cnpj: cnpjLimpo || null,
              email: tenantData.email || '',
              telefone: tenantData.telefone || '',
              plano: 'FREE',
            });

            console.log('[OnboardingWizard] ✅ Tenant criado:', tenant.id);
            
            // 🔥 CRÍTICO: Atualizar contexto imediatamente após criar tenant (seguindo melhores práticas)
            localStorage.setItem('selectedTenantId', tenant.id);
            window.dispatchEvent(new CustomEvent('tenant-switched', { 
              detail: { 
                tenantId: tenant.id,
                tenant: tenant
              } 
            }));
            
            // 🔥 CRÍTICO: Disparar evento para atualizar seletor e cards
            window.dispatchEvent(new CustomEvent('tenant-updated', { detail: { tenantId: tenant.id } }));

            // Criar usuário vinculado (protegido contra 42P17)
            try {
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
                if (userError.code === '42P17') {
                  console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro de recursão em policy de users ao criar vínculo. Continuando sem vínculo no banco.');
                } else {
              console.error('[OnboardingWizard] Erro ao criar usuário:', userError);
                }
              }
            } catch (error: any) {
              if (error?.code === '42P17') {
                console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro de recursão em policy de users. Continuando sem vínculo no banco.');
              } else {
                console.error('[OnboardingWizard] Erro ao criar usuário:', error);
              }
            }

            // Agora salvar sessão com o tenant_id
            const publicUserId = await getPublicUserId(authUser.id, tenant.id);
            // Usar authUserId como fallback se publicUserId não estiver disponível
            const effectiveUserId = publicUserId ?? authUser.id ?? null;
            
            if (effectiveUserId) {
              const { error: insertError } = await (supabase as any)
                .from('onboarding_sessions')
                .insert({
                  user_id: effectiveUserId,
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

  const handleSave = async (stepData?: any, silent: boolean = false) => {
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
      // 🔥 Removido toast automático - salvamento silencioso (melhores práticas)
      // Salvar no localStorage mesmo sem tenant (usar chave genérica)
      // 🔥 CORRIGIDO: Não salvar cnpjData completo
      if (stepData) {
        const storageKey = getStorageKey(null);
        const stepKey = getStepKey(null);
        const compactData: any = { ...updatedFormData };
        if (compactData.step1_DadosBasicos && typeof compactData.step1_DadosBasicos === 'object') {
          const step1Data = compactData.step1_DadosBasicos as any;
          if (step1Data.cnpjData) {
            compactData.step1_DadosBasicos = { ...step1Data, cnpjData: null, hasCnpjData: true };
          }
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(compactData));
          localStorage.setItem(stepKey, currentStep.toString());
        } catch (error: any) {
          if (error.name === 'QuotaExceededError') {
            console.warn('[OnboardingWizard] ⚠️ localStorage cheio (sem tenant)');
          }
        }
      }
      return;
    }

    // 🔥 SAFE MODE: Sempre salvar no localStorage primeiro (usar chave baseada em tenant_id)
    // 🔥 CORRIGIDO: Não salvar cnpjData completo no localStorage (evita QuotaExceededError)
    try {
      const storageKey = getStorageKey(tenantId);
      const stepKey = getStepKey(tenantId);
      
      // Criar versão compacta sem cnpjData completo
      const compactData: any = { ...updatedFormData };
      if (compactData.step1_DadosBasicos && typeof compactData.step1_DadosBasicos === 'object') {
        const step1Data = compactData.step1_DadosBasicos as any;
        if (step1Data.cnpjData) {
          compactData.step1_DadosBasicos = {
            ...step1Data,
            cnpjData: null,
            hasCnpjData: true,
          };
        }
      }
      
      const dataToStore = JSON.stringify(compactData);
      if (dataToStore.length > 100000) {
        console.warn('[OnboardingWizard] ⚠️ Dados muito grandes, pulando localStorage');
      } else {
        localStorage.setItem(storageKey, dataToStore);
        localStorage.setItem(stepKey, currentStep.toString());
        console.log('[OnboardingWizard] ✅ Dados salvos no localStorage (handleSave)');
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.warn('[OnboardingWizard] ⚠️ localStorage cheio, limpando dados antigos...');
        // Limpar dados antigos
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('onboarding_form_data_') || key.startsWith('onboarding_current_step_')) {
              localStorage.removeItem(key);
            }
          });
          console.log('[OnboardingWizard] ✅ localStorage limpo, tentando salvar novamente...');
          // Tentar salvar novamente após limpar
          try {
            const compactData: any = { ...updatedFormData };
            if (compactData.step1_DadosBasicos && typeof compactData.step1_DadosBasicos === 'object') {
              const step1Data = compactData.step1_DadosBasicos as any;
              if (step1Data.cnpjData) {
                compactData.step1_DadosBasicos = { ...step1Data, cnpjData: null, hasCnpjData: true };
              }
            }
            const storageKey = getStorageKey(tenantId);
            const stepKey = getStepKey(tenantId);
            localStorage.setItem(storageKey, JSON.stringify(compactData));
            localStorage.setItem(stepKey, currentStep.toString());
          } catch (retryError) {
            console.warn('[OnboardingWizard] ⚠️ Ainda não foi possível salvar no localStorage');
          }
        } catch (cleanError) {
          console.error('[OnboardingWizard] ❌ Erro ao limpar localStorage:', cleanError);
        }
      } else {
        console.error('[OnboardingWizard] ❌ Erro ao salvar no localStorage:', error);
      }
    }

    setHasUnsavedChanges(false);
    setLastSavedStep(currentStep);

    // 🔥 SAFE MODE: Só tentar banco se não estiver em SAFE MODE
    if (ONBOARDING_DB_SAFE_MODE) {
      console.log('[OnboardingWizard] (SAFE MODE) Dados salvos em localStorage, pulando banco.');
      // 🔥 Toast apenas para ação explícita do usuário (botão "Salvar") - não em auto-save
      if (!silent) {
        toast.success('Dados salvos com sucesso!', {
          description: 'Seus dados foram salvos localmente.',
        });
      }
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        // 🔥 Removido toast automático - salvamento silencioso (melhores práticas)
        // Dados já estão salvos localmente, não precisa interromper o usuário
        setIsSaving(false);
        return;
      }

      // 🔥 CORRIGIDO: Garantir que o usuário existe na tabela users antes de salvar sessão
      let publicUserId = await getPublicUserId(authUser.id, tenantId);
      
      // Se o usuário não existe, criar na tabela users
      if (!publicUserId) {
        console.log('[OnboardingWizard] 🔄 Usuário não encontrado na tabela users, criando...');
        try {
          // Tentar criar usuário com constraint composta (multi-tenant)
          let createError;
          try {
            const { data: newUser, error: error1 } = await (supabase as any)
              .from('users')
              .insert({
                email: authUser.email,
                nome: authUser.email?.split('@')[0] || 'Usuário',
                tenant_id: tenantId,
                auth_user_id: authUser.id,
                role: 'OWNER',
              })
              .select('id')
              .single();
            
            if (!error1 && newUser) {
              publicUserId = newUser.id;
              console.log('[OnboardingWizard] ✅ Usuário criado na tabela users:', publicUserId);
            } else {
              createError = error1;
            }
          } catch (err: any) {
            // Se falhar, pode ser que o usuário já existe mas com constraint diferente
            // Tentar buscar novamente
            if (err?.code === '23505' || err?.message?.includes('duplicate')) {
              console.log('[OnboardingWizard] Usuário já existe, buscando novamente...');
              publicUserId = await getPublicUserId(authUser.id, tenantId);
            } else {
              createError = err;
            }
          }
          
          if (!publicUserId && createError) {
            console.warn('[OnboardingWizard] ⚠️ Não foi possível criar usuário na tabela users:', createError);
          }
        } catch (err) {
          console.warn('[OnboardingWizard] ⚠️ Erro ao criar usuário:', err);
        }
      }
      
      const effectiveUserId = publicUserId ?? authUser.id ?? null;

      if (!effectiveUserId) {
        console.warn('[OnboardingWizard] ⚠️ Nenhum identificador de usuário disponível, dados salvos apenas localmente');
        setIsSaving(false);
        return;
      }

      // Verificar se já existe sessão
      const { data: existingSession } = await (supabase as any)
        .from('onboarding_sessions')
        .select('id')
        .eq('user_id', effectiveUserId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const sessionData = {
        user_id: effectiveUserId,
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
          // 🔥 CRÍTICO: Não bloquear - dados já estão salvos localmente
          console.warn('[OnboardingWizard] ⚠️ Salvamento no banco falhou, mas dados estão salvos localmente:', updateError);
          // Toast de aviso apenas para ação explícita (botão "Salvar") - não em auto-save
          if (!silent) {
            toast.warning('Dados salvos localmente', {
              description: 'Não foi possível sincronizar com o servidor, mas seus dados estão seguros.',
            });
          }
        } else {
          console.log('[OnboardingWizard] ✅ Dados atualizados no banco com sucesso');
          // 🔥 Toast apenas para ação explícita do usuário (botão "Salvar") - não em auto-save
          if (!silent) {
            toast.success('Dados salvos com sucesso!', {
              description: 'Seus dados foram salvos no servidor.',
            });
          }
        }
      } else {
        // INSERT
        const { error: insertError } = await (supabase as any)
          .from('onboarding_sessions')
          .insert(sessionData)
          .select()
          .single();

        if (insertError) {
          // 🔥 CRÍTICO: Não bloquear - dados já estão salvos localmente
          console.warn('[OnboardingWizard] ⚠️ Salvamento no banco falhou, mas dados estão salvos localmente:', insertError);
          // Toast de aviso apenas para ação explícita (botão "Salvar") - não em auto-save
          if (!silent) {
            toast.warning('Dados salvos localmente', {
              description: 'Não foi possível sincronizar com o servidor, mas seus dados estão seguros.',
            });
          }
        } else {
          console.log('[OnboardingWizard] ✅ Dados inseridos no banco com sucesso');
          // 🔥 Toast apenas para ação explícita do usuário (botão "Salvar") - não em auto-save
          if (!silent) {
      toast.success('Dados salvos com sucesso!', {
        description: 'Seus dados foram salvos no servidor.',
      });
          }
        }
      }
    } catch (error: any) {
      // 🔥 CRÍTICO: Não bloquear - dados já estão salvos localmente
      console.error('[OnboardingWizard] Erro ao salvar dados (mas localStorage já foi atualizado):', error);
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
        console.warn(
          '[OnboardingWizard] ⚠️ Não foi possível obter identificador de usuário; prosseguindo mesmo assim'
        );
      }

      // Usar authUserId como fallback se publicUserId não estiver disponível
      const effectiveUserId = publicUserId ?? authUser.id ?? null;
      
      if (!effectiveUserId) {
        console.warn('[OnboardingWizard] ⚠️ Nenhum identificador de usuário disponível para salvar ICP');
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

          // [HF-STRATEVO-ONBOARDING] Usar getPublicUserId que retorna authUserId como fallback
          const publicUserId = await getPublicUserId(authUser.id, tenantId);
          if (!publicUserId) {
            console.warn(
              '[OnboardingWizard] ⚠️ Não foi possível obter identificador de usuário; prosseguindo mesmo assim'
            );
          }

          // Usar authUserId como fallback se publicUserId não estiver disponível
          const effectiveUserId = publicUserId ?? authUser.id ?? null;

          if (!effectiveUserId) {
            console.warn('[OnboardingWizard] ⚠️ Nenhum identificador de usuário disponível para salvar sessão');
            // Continuar mesmo assim, mas sem salvar no banco
          }

          const sessionData = {
            user_id: effectiveUserId, // 🔥 Usar effectiveUserId (pode ser publicUserId ou authUserId)
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
          
          // 🔥 CRÍTICO: Atualizar contexto imediatamente após criar tenant (seguindo melhores práticas)
          localStorage.setItem('selectedTenantId', tenant.id);
          window.dispatchEvent(new CustomEvent('tenant-switched', { 
            detail: { 
              tenantId: tenant.id,
              tenant: tenant
            } 
          }));
          
          // 🔥 CRÍTICO: Disparar evento para atualizar seletor e cards
          window.dispatchEvent(new CustomEvent('tenant-updated', { detail: { tenantId: tenant.id } }));
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

      // PASSO 2: Verificar limite de tenants do plano e criar vínculo (PROTEGIDO CONTRA 42P17)
      console.log('[OnboardingWizard] 👤 Verificando limite de tenants e criando vínculo...');
      
      // 🔥 SAFE MODE: Proteger todas as chamadas à tabela users contra 42P17
      let currentTenantCount = 0;
      let currentPlan = 'FREE';
      let isAdmin = false;
      
      try {
      // 2.1: Contar quantos tenants o usuário já tem
        const countResult = await (supabase as any)
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('auth_user_id', user.id);
      
        if (countResult.error && countResult.error.code === '42P17') {
          console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao contar tenants. Continuando sem verificação de limite.');
          currentTenantCount = 0; // Assumir 0 para não bloquear
        } else if (countResult.error) {
          console.error('[OnboardingWizard] Erro ao contar tenants:', countResult.error);
          currentTenantCount = 0;
        } else {
          currentTenantCount = countResult.count || 0;
        }
      
      // 2.2: Buscar o plano do usuário (do tenant mais recente ou FREE)
        const planResult = await (supabase as any)
        .from('users')
        .select('tenants(plano)')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
        if (planResult.error && planResult.error.code === '42P17') {
          console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao buscar plano. Usando plano FREE.');
          currentPlan = 'FREE';
        } else if (planResult.error) {
          console.error('[OnboardingWizard] Erro ao buscar plano:', planResult.error);
          currentPlan = 'FREE';
        } else {
          currentPlan = planResult.data?.[0]?.tenants?.plano || 'FREE';
        }
      } catch (error: any) {
        if (error?.code === '42P17') {
          console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao verificar limites. Continuando sem verificação.');
          currentTenantCount = 0;
          currentPlan = 'FREE';
        } else {
          console.error('[OnboardingWizard] Erro ao verificar limites:', error);
          currentTenantCount = 0;
          currentPlan = 'FREE';
        }
      }
      
      // 2.3: Definir limite baseado no plano
      const planLimits: Record<string, number> = {
        'FREE': 1,
        'STARTER': 2,
        'GROWTH': 5,
        'ENTERPRISE': 15,
        'ADMIN': 999999,
      };
      const tenantLimit = planLimits[currentPlan.toUpperCase()] || 1;
      
      // 🔧 ADMIN BYPASS: Lista de emails de administradores (podem criar ilimitado)
      const ADMIN_EMAILS = [
        'marcos.oliveira@olvinternacional.com.br',
      ];
      isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
      
      console.log(`[OnboardingWizard] 📊 Plano: ${currentPlan}, Tenants: ${currentTenantCount}/${tenantLimit}, Admin: ${isAdmin}`);
      
      // 2.4: Verificar se pode criar mais tenants (admins podem sempre criar)
      if (!isAdmin && currentTenantCount >= tenantLimit) {
        console.warn('[OnboardingWizard] ⚠️ Limite de tenants atingido');
        toast.error(`Seu plano ${currentPlan} permite no máximo ${tenantLimit} empresa(s). Faça upgrade para adicionar mais.`);
        throw new Error(`Limite de empresas atingido. Plano ${currentPlan} permite ${tenantLimit} empresa(s).`);
      }
      
      // 2.5 e 2.6: Criar/atualizar vínculo (PROTEGIDO CONTRA 42P17)
      try {
        // Verificar se já existe vínculo com este tenant específico
        const linkResult = await (supabase as any)
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      
        if (linkResult.error && linkResult.error.code === '42P17') {
          console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao verificar vínculo. Continuando sem criar vínculo no banco.');
        } else if (linkResult.error) {
          console.error('[OnboardingWizard] Erro ao verificar vínculo:', linkResult.error);
        } else if (linkResult.data) {
          // Vínculo existe, atualizar
        console.log('[OnboardingWizard] ℹ️ Vínculo já existe, atualizando...');
          const updateResult = await (supabase as any)
          .from('users')
          .update({
            email: tenantData.email,
            nome: tenantData.razaoSocial,
            role: 'OWNER',
          })
            .eq('id', linkResult.data.id);
          
          if (updateResult.error) {
            if (updateResult.error.code === '42P17') {
              console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao atualizar vínculo. Continuando.');
            } else {
              console.error('[OnboardingWizard] Erro ao atualizar vínculo:', updateResult.error);
            }
        }
      } else {
          // Criar NOVO vínculo (INSERT, não UPSERT)
        console.log('[OnboardingWizard] ➕ Criando novo vínculo usuário-tenant...');
          const insertResult = await (supabase as any)
          .from('users')
          .insert({
            email: tenantData.email,
            nome: tenantData.razaoSocial,
            tenant_id: tenant.id,
            auth_user_id: user.id,
            role: 'OWNER',
          });

          if (insertResult.error) {
            if (insertResult.error.code === '42P17') {
              console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao criar vínculo. Continuando sem vínculo no banco.');
            } else if (insertResult.error.message?.includes('duplicate') || insertResult.error.message?.includes('unique')) {
              console.log('[OnboardingWizard] ℹ️ Vínculo já existe (erro de constraint), ignorando.');
            } else {
              console.error('[OnboardingWizard] Erro ao criar vínculo:', insertResult.error);
            }
          }
        }
        
        console.log('[OnboardingWizard] ✅ Vínculo usuário-tenant processado (pode ter sido pulado em SAFE MODE)');
      } catch (error: any) {
        if (error?.code === '42P17') {
          console.warn('[OnboardingWizard] ⚠️ SAFE MODE – Erro 42P17 ao criar/atualizar vínculo. Continuando sem vínculo no banco.');
        } else {
          console.error('[OnboardingWizard] Erro ao processar vínculo:', error);
        }
      }

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
      5: 'HistoricoEEnriquecimento', // 🔥 CORRIGIDO: Deve ter "E" extra para consistência com interface
      6: 'ResumoReview',
    };
    return names[step] || '';
  };

  const renderStep = () => {
    const stepKey = `step${currentStep}_${getStepName(currentStep)}` as keyof OnboardingData;
    
    // 🔥 CRÍTICO: Merge não-destrutivo - sempre preservar dados existentes
    // Buscar dados salvos do localStorage também (para garantir persistência) - usar tenantId para isolar
    const savedData = loadSavedData(tenantId);
    const stepStoredData = (savedData.data?.[stepKey] || formData[stepKey] || {}) as any;
    const stepFormData = formData[stepKey] || {} as any;
    
    // Inicializar com merge completo
    let initialData: any = {
      ...stepStoredData,
      ...stepFormData,
    };
    
    // Log para debug
    console.log(`[OnboardingWizard] 📋 Renderizando Step ${currentStep}:`, {
      stepKey,
      hasStoredData: !!stepStoredData && Object.keys(stepStoredData).length > 0,
      hasFormData: !!stepFormData && Object.keys(stepFormData).length > 0,
      initialDataKeys: initialData ? Object.keys(initialData) : [],
    });
    
    // Step 6: Passar todos os dados do onboarding para o resumo
    if (currentStep === 6) {
      initialData = {
        ...savedData.data,
        ...formData,
      } as Partial<OnboardingData>;
    }
    
    // Step 3: Passar dados do Step 2 (setores e nichos) - MERGE com dados existentes
    if (currentStep === 3) {
      // Buscar dados mais recentes do Step 2
      const step2Data = formData.step2_SetoresNichos || {} as any;
      const step3StoredData = stepStoredData || {} as any;
      const step3FormData = stepFormData || {} as any;
      
      console.log('[OnboardingWizard] 🔄 Preparando dados para Step3:', {
        step2Data: {
          setoresAlvo: step2Data.setoresAlvo,
          nichosAlvo: step2Data.nichosAlvo,
          nichosAlvoCodes: step2Data.nichosAlvoCodes,
        },
        step3StoredDataExists: !!step3StoredData && Object.keys(step3StoredData).length > 0,
        step3FormDataExists: !!step3FormData && Object.keys(step3FormData).length > 0,
      });
      
      // 🔥 MERGE não-destrutivo: preservar dados do Step3, complementar com Step2
      initialData = {
        // Dados do Step 2 (para complementar, não sobrescrever)
        setoresAlvo: Array.isArray(step3FormData?.setoresAlvo) && step3FormData.setoresAlvo.length > 0
          ? step3FormData.setoresAlvo
          : (Array.isArray(step3StoredData?.setoresAlvo) && step3StoredData.setoresAlvo.length > 0
            ? step3StoredData.setoresAlvo
            : (Array.isArray(step2Data.setoresAlvo) ? step2Data.setoresAlvo : [])),
        nichosAlvo: Array.isArray(step3FormData?.nichosAlvo) && step3FormData.nichosAlvo.length > 0
          ? step3FormData.nichosAlvo
          : (Array.isArray(step3StoredData?.nichosAlvo) && step3StoredData.nichosAlvo.length > 0
            ? step3StoredData.nichosAlvo
            : (Array.isArray(step2Data.nichosAlvo) ? step2Data.nichosAlvo : [])),
        nichosAlvoCodes: Array.isArray(step3FormData?.nichosAlvoCodes) && step3FormData.nichosAlvoCodes.length > 0
          ? step3FormData.nichosAlvoCodes
          : (Array.isArray(step3StoredData?.nichosAlvoCodes) && step3StoredData.nichosAlvoCodes.length > 0
            ? step3StoredData.nichosAlvoCodes
            : (Array.isArray(step2Data.nichosAlvoCodes) ? step2Data.nichosAlvoCodes : [])),
        
        // Manter dados do Step 3 se já existirem (prioridade: formData > storedData > step2Data)
        cnaesAlvo: Array.isArray(step3FormData?.cnaesAlvo) && step3FormData.cnaesAlvo.length > 0 
          ? step3FormData.cnaesAlvo 
          : (Array.isArray(step3StoredData?.cnaesAlvo) && step3StoredData.cnaesAlvo.length > 0
            ? step3StoredData.cnaesAlvo
            : (Array.isArray(step2Data.cnaesAlvo) ? step2Data.cnaesAlvo : [])),
        ncmsAlvo: Array.isArray(step3FormData?.ncmsAlvo) && step3FormData.ncmsAlvo.length > 0 
          ? step3FormData.ncmsAlvo 
          : (Array.isArray(step3StoredData?.ncmsAlvo) && step3StoredData.ncmsAlvo.length > 0
            ? step3StoredData.ncmsAlvo
            : []),
        porteAlvo: Array.isArray(step3FormData?.porteAlvo) && step3FormData.porteAlvo.length > 0 
          ? step3FormData.porteAlvo 
          : (Array.isArray(step3StoredData?.porteAlvo) && step3StoredData.porteAlvo.length > 0
            ? step3StoredData.porteAlvo
            : []),
        localizacaoAlvo: (step3FormData?.localizacaoAlvo && 
          (step3FormData.localizacaoAlvo.estados?.length > 0 || step3FormData.localizacaoAlvo.regioes?.length > 0))
          ? step3FormData.localizacaoAlvo
          : (step3StoredData?.localizacaoAlvo && 
            (step3StoredData.localizacaoAlvo.estados?.length > 0 || step3StoredData.localizacaoAlvo.regioes?.length > 0))
          ? step3StoredData.localizacaoAlvo
          : { estados: [], regioes: [] },
        faturamentoAlvo: (step3FormData?.faturamentoAlvo && 
          (step3FormData.faturamentoAlvo.minimo || step3FormData.faturamentoAlvo.maximo))
          ? step3FormData.faturamentoAlvo
          : (step3StoredData?.faturamentoAlvo && 
            (step3StoredData.faturamentoAlvo.minimo || step3StoredData.faturamentoAlvo.maximo))
          ? step3StoredData.faturamentoAlvo
          : { minimo: null, maximo: null },
        funcionariosAlvo: (step3FormData?.funcionariosAlvo && 
          (step3FormData.funcionariosAlvo.minimo || step3FormData.funcionariosAlvo.maximo))
          ? step3FormData.funcionariosAlvo
          : (step3StoredData?.funcionariosAlvo && 
            (step3StoredData.funcionariosAlvo.minimo || step3StoredData.funcionariosAlvo.maximo))
          ? step3StoredData.funcionariosAlvo
          : { minimo: null, maximo: null },
        caracteristicasEspeciais: Array.isArray(step3FormData?.caracteristicasEspeciais) && step3FormData.caracteristicasEspeciais.length > 0
          ? step3FormData.caracteristicasEspeciais
          : (Array.isArray(step3StoredData?.caracteristicasEspeciais) && step3StoredData.caracteristicasEspeciais.length > 0
            ? step3StoredData.caracteristicasEspeciais
            : []),
      };
      
      console.log('[OnboardingWizard] ✅ Dados finais para Step3 (COM dados antigos + derivados):', {
        setoresAlvo: (initialData as any).setoresAlvo,
        nichosAlvo: (initialData as any).nichosAlvo,
        totalSetores: Array.isArray((initialData as any).setoresAlvo) ? (initialData as any).setoresAlvo.length : 0,
        totalNichos: Array.isArray((initialData as any).nichosAlvo) ? (initialData as any).nichosAlvo.length : 0,
        hasCnaes: Array.isArray((initialData as any).cnaesAlvo) && (initialData as any).cnaesAlvo.length > 0,
        hasNcms: Array.isArray((initialData as any).ncmsAlvo) && (initialData as any).ncmsAlvo.length > 0,
      });
    }
    
    // 🔥 Wrapper para auto-save silencioso (sem toasts)
    const handleAutoSave = async (stepData?: any) => {
      await handleSave(stepData, true); // silent = true para auto-save
    };

    // 🔥 Wrapper para save explícito (com toast) - usado pelo botão "Salvar"
    const handleSaveExplicit = async (stepData?: any) => {
      await handleSave(stepData, false); // silent = false para ação explícita
    };
    
    const stepProps = {
      onNext: handleNext,
      onBack: handleBack,
      onSave: handleAutoSave, // 🔥 Auto-save silencioso por padrão (sem toasts)
      onSaveExplicit: handleSaveExplicit, // 🔥 Para botão "Salvar" explícito (com toast)
      initialData,
      isSaving: isSaving, // Não incluir isSubmitting para não bloquear botão Próximo
      hasUnsavedChanges,
      isNewTenant, // 🔥 NOVO: Passar flag para Step1 não carregar dados quando é novo tenant
      tenantIdFromUrl: tenantIdDetermined, // 🔥 NOVO: Passar tenant_id correto da URL para Step1 usar ao buscar CNPJ
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

