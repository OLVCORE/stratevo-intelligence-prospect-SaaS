// src/pages/MyCompanies.tsx
// [HF-STRATEVO-TENANT] Arquivo mapeado para fluxo de tenants/empresas
// Página para listar e gerenciar múltiplos tenants (CNPJs) do usuário
// VERSÃO MELHORADA: Abas dinâmicas, deleção com senha, deleção em massa

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useUserTenants, type UserTenant } from '@/hooks/useUserTenants';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Settings,
  Sparkles,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  AlertTriangle,
  Lock,
  Crown,
  Target,
  Users,
  ArrowUpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getPlanLimits, formatLimit, getUpgradePlan, isAdminEmail, type PlanType } from '@/config/planLimits';
import { TenantTrashModal } from '@/components/tenants/TenantTrashModal';

interface Tenant {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: string;
  status: string;
  creditos: number;
  data_expiracao: string;
  created_at: string;
}

interface TenantOnboardingSummary {
  tenantId: string;
  lastStep: number;
  status: string;
  updatedAt: string;
}

type ViewMode = 'cards' | 'table';

export default function MyCompanies() {
  const { user } = useAuth();
  const { tenant: currentTenant, setTenant } = useTenant();
  const { tenants: userTenants, loading: loadingTenants, error: tenantsError, refetch: refetchTenants } = useUserTenants();
  const navigate = useNavigate();
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  
  // 🔥 CRÍTICO: Converter UserTenant para formato Tenant usado na página
  // userTenants já inclui tenants locais se houver erro 42P17 (via useUserTenants)
  const tenants: Tenant[] = userTenants.map(t => ({
    id: t.id,
    nome: t.nome || t.name || '',
    cnpj: t.cnpj || '',
    email: t.email || '',
    plano: t.plano || 'FREE',
    status: t.status || 'ACTIVE',
    creditos: t.creditos || 0,
    data_expiracao: t.data_expiracao || null,
    created_at: t.created_at || new Date().toISOString(),
  }));
  
  const loading = loadingTenants;
  const [onboardingSummaries, setOnboardingSummaries] = useState<Record<string, TenantOnboardingSummary>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  
  // Estados para deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Estado para modal da lixeira
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  
  // Estados para limites de plano
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('FREE');
  const [icpCount, setIcpCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  // 🔥 CRÍTICO: Bloqueio permanente para evitar loops infinitos quando há erro 42P17
  const has42P17Error = useRef(false);
  const isLoadingCounts = useRef(false);
  const lastLoadTime = useRef(0);
  const loadCountsExecuted = useRef(false); // Flag para garantir execução única por montagem

  // [HF-STRATEVO-TENANT] Usar tenant atual do contexto para determinar currentTenantId
  useEffect(() => {
    if (currentTenant?.id) {
      setCurrentTenantId(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // 🔥 CRÍTICO: Refetch quando tenant é atualizado ou mudado
  useEffect(() => {
    const handleTenantUpdated = () => {
      console.log('[MyCompanies] Tenant atualizado, refetchando...');
      refetchTenants();
    };
    
    const handleTenantChanged = () => {
      console.log('[MyCompanies] Tenant mudado, refetchando...');
      refetchTenants();
    };

    window.addEventListener('tenant-updated', handleTenantUpdated);
    window.addEventListener('tenant-changed', handleTenantChanged);
    return () => {
      window.removeEventListener('tenant-updated', handleTenantUpdated);
      window.removeEventListener('tenant-changed', handleTenantChanged);
    };
  }, [refetchTenants]);

  // Determinar plano atual baseado no primeiro tenant
  useEffect(() => {
    if (tenants.length > 0) {
      const plan = (tenants[0]?.plano || 'FREE').toUpperCase() as PlanType;
      setCurrentPlan(plan);
    }
  }, [tenants]);

  // Carregar contadores de ICPs e usuários (com bloqueio anti-loop DEFINITIVO)
  useEffect(() => {
    const loadCounts = async () => {
      // 🔥 BLOQUEIO PERMANENTE: Se já houve erro 42P17, NUNCA mais tentar
      if (has42P17Error.current) {
        setIcpCount(0);
        setUserCount(0);
        return;
      }

      // 🔥 BLOQUEIO: Evitar requisições repetidas
      const now = Date.now();
      if (isLoadingCounts.current || (now - lastLoadTime.current < 5000)) {
        return; // Já está carregando ou foi carregado há menos de 5 segundos
      }

      // 🔥 BLOQUEIO: Executar apenas uma vez por montagem do componente
      if (loadCountsExecuted.current && has42P17Error.current) {
        return;
      }

      if (!user?.id || tenants.length === 0) {
        // Se não há tenants, usar valores padrão
        setIcpCount(0);
        setUserCount(0);
        return;
      }
      
      isLoadingCounts.current = true;
      lastLoadTime.current = now;
      loadCountsExecuted.current = true;

      try {
        // Contar ICPs do primeiro tenant (protegido contra 42P17)
        try {
          const { count: icps, error: icpsError } = await (supabase as any)
            .from('icp_profiles_metadata')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenants[0]?.id);
          
          // Se erro 500, pode ser 42P17 - não tentar mais
          if (icpsError && (icpsError.code === '42P17' || icpsError.message?.includes('infinite recursion'))) {
            has42P17Error.current = true;
            console.warn('[MyCompanies] ⚠️ Erro 42P17 detectado em icp_profiles_metadata, bloqueando futuras requisições');
          } else if (icpsError) {
            console.error('[MyCompanies] Erro ao contar ICPs:', icpsError);
          }
          
          if (!has42P17Error.current) {
            setIcpCount(icps || 0);
          }
        } catch (icpsError: any) {
          if (icpsError?.code === '42P17' || icpsError?.message?.includes('infinite recursion')) {
            has42P17Error.current = true;
            console.warn('[MyCompanies] ⚠️ Erro 42P17 detectado em icp_profiles_metadata, bloqueando futuras requisições');
          }
        }
        
        // Contar usuários do primeiro tenant (BLOQUEADO se já houve erro 42P17)
        if (!has42P17Error.current) {
          try {
            const { count: users, error: usersError } = await (supabase as any)
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', tenants[0]?.id);
            
            // Se erro 42P17, bloquear futuras requisições
            if (usersError && (usersError.code === '42P17' || usersError.message?.includes('infinite recursion'))) {
              has42P17Error.current = true;
              console.warn('[MyCompanies] ⚠️ Erro 42P17 detectado em users, bloqueando futuras requisições');
              setUserCount(0); // Usar 0 quando há erro 42P17
            } else if (usersError) {
              console.error('[MyCompanies] Erro ao contar usuários:', usersError);
              setUserCount(0);
            } else {
              setUserCount(users || 0);
            }
          } catch (usersError: any) {
            if (usersError?.code === '42P17' || usersError?.message?.includes('infinite recursion')) {
              has42P17Error.current = true;
              console.warn('[MyCompanies] ⚠️ Erro 42P17 detectado em users, bloqueando futuras requisições');
            }
            setUserCount(0);
          }
        } else {
          // Se já houve erro 42P17, usar 0 sem fazer requisição
          setUserCount(0);
        }
      } catch (error) {
        console.error('[MyCompanies] Erro ao carregar contadores:', error);
      } finally {
        isLoadingCounts.current = false;
      }
    };
    
    loadCounts();
  }, [user?.id, tenants]);

  // Verificar se é admin (bypass de limites)
  const userEmail = user?.email;
  const isAdmin = isAdminEmail(userEmail);
  
  // Verificar se pode adicionar mais empresas
  const planLimits = getPlanLimits(currentPlan, userEmail);
  const canAddTenant = isAdmin || tenants.length < planLimits.tenants;
  const canAddICP = isAdmin || icpCount < planLimits.icps;
  const canAddUser = isAdmin || userCount < planLimits.users;
  const upgradePlan = getUpgradePlan(currentPlan);

  // 🔥 CRÍTICO: Função auxiliar para criar tenant local quando Supabase falhar
  const criarTenantLocal = (nome: string, email: string): { id: string; nome: string; email: string; plano: string; status: string; created_at: string } => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const localTenantId = `local-tenant-${timestamp}-${random}`;
    
    const localTenant = {
      id: localTenantId,
      nome,
      email,
      plano: 'FREE',
      status: 'TRIAL',
      created_at: new Date().toISOString(),
    };

    // Salvar tenant local em localStorage para listagem futura
    try {
      const localTenantsKey = 'local_tenants';
      const existingLocalTenants = localStorage.getItem(localTenantsKey);
      const localTenants = existingLocalTenants ? JSON.parse(existingLocalTenants) : [];
      localTenants.push(localTenant);
      localStorage.setItem(localTenantsKey, JSON.stringify(localTenants));
      console.log('[MyCompanies] 💾 Tenant local salvo:', localTenantId);
    } catch (error) {
      console.error('[MyCompanies] Erro ao salvar tenant local:', error);
    }

    return localTenant;
  };

  const handleAddCompany = async () => {
    if (!canAddTenant) {
      setUpgradeDialogOpen(true);
      return;
    }

    try {
      // 🔥 CRÍTICO: Criar tenant DEFINITIVO imediatamente (não temporário)
      // Isso garante que o tenant tenha um ID real desde o início
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Erro de autenticação', {
          description: 'Faça login novamente para continuar.',
        });
        return;
      }

      // Importar serviço de multi-tenant
      const { multiTenantService } = await import('@/services/multi-tenant.service');
      
      // Criar tenant com dados mínimos (será preenchido no Step 1)
      const tenantName = `Nova Empresa ${new Date().toLocaleDateString('pt-BR')}`;
      console.log('[MyCompanies] 🚀 Criando tenant definitivo imediatamente...');
      
      let newTenant;
      try {
        newTenant = await multiTenantService.criarTenant({
          nome: tenantName,
          cnpj: '', // Será preenchido no Step 1
          email: authUser.email || '',
          telefone: '',
          plano: 'FREE',
        });
        console.log('[MyCompanies] ✅ Tenant criado no Supabase:', newTenant.id);
      } catch (tenantError: any) {
        // 🔥 CRÍTICO: Se falhar (42P17, 500, CORS), criar tenant LOCAL
        const is42P17 = tenantError?.code === '42P17' || tenantError?.message?.includes('infinite recursion');
        const is500 = tenantError?.message?.includes('500') || tenantError?.status === 500;
        const isCORS = tenantError?.message?.includes('CORS') || tenantError?.message?.includes('Failed to fetch');
        
        if (is42P17 || is500 || isCORS) {
          console.warn('[MyCompanies] ⚠️ Erro ao criar tenant no Supabase, criando tenant local:', {
            is42P17,
            is500,
            isCORS,
            error: tenantError?.message,
          });
          
          // Criar tenant local como fallback
          newTenant = criarTenantLocal(tenantName, authUser.email || '');
          console.log('[MyCompanies] ✅ Tenant local criado:', newTenant.id);
          
          toast.warning('Empresa criada localmente', {
            description: 'A empresa foi criada localmente. Os dados serão sincronizados quando o sistema estiver disponível.',
          });
        } else {
          // Se for outro tipo de erro, relançar
          throw tenantError;
        }
      }

      // Vincular usuário ao tenant (protegido contra 42P17) - apenas se não for tenant local
      if (!newTenant.id.startsWith('local-tenant-')) {
        try {
          // 🔥 CORRIGIDO: Verificar se a constraint é composta (auth_user_id, tenant_id) ou simples (auth_user_id)
          // Tentar primeiro com constraint composta (multi-tenant)
          let userError;
          try {
            const { error: error1 } = await (supabase as any)
              .from('users')
              .upsert({
                email: authUser.email,
                nome: authUser.email?.split('@')[0] || 'Usuário',
                tenant_id: newTenant.id,
                auth_user_id: authUser.id,
                role: 'OWNER',
              }, {
                onConflict: 'auth_user_id,tenant_id'
              });
            userError = error1;
          } catch (err: any) {
            // Se falhar com constraint composta, tentar com constraint simples
            if (err?.code === '42P10' || err?.message?.includes('ON CONFLICT')) {
              console.log('[MyCompanies] Tentando com constraint simples auth_user_id...');
              const { error: error2 } = await (supabase as any)
                .from('users')
                .upsert({
                  email: authUser.email,
                  nome: authUser.email?.split('@')[0] || 'Usuário',
                  tenant_id: newTenant.id,
                  auth_user_id: authUser.id,
                  role: 'OWNER',
                }, {
                  onConflict: 'auth_user_id'
                });
              userError = error2;
            } else {
              throw err;
            }
          }

          if (userError && userError.code !== '42P17') {
            console.warn('[MyCompanies] ⚠️ Erro ao vincular usuário (não crítico):', userError);
          } else {
            console.log('[MyCompanies] ✅ Usuário vinculado ao tenant com sucesso');
          }
        } catch (error: any) {
          if (error?.code !== '42P17') {
            console.warn('[MyCompanies] ⚠️ Erro ao vincular usuário (não crítico):', error);
          }
        }
      }

      // 🔥 CRÍTICO: Atualizar contexto imediatamente após criar tenant (seguindo melhores práticas)
      // Isso garante que a plataforma saiba do novo tenant antes de navegar
      try {
        const { useTenant } = await import('@/contexts/TenantContext');
        // Nota: Não podemos usar hook aqui, então vamos disparar evento e atualizar localStorage
        localStorage.setItem('selectedTenantId', newTenant.id);
        
        // Disparar evento para que TenantContext atualize
        window.dispatchEvent(new CustomEvent('tenant-switched', { 
          detail: { 
            tenantId: newTenant.id,
            tenant: newTenant
          } 
        }));
        
        console.log('[MyCompanies] ✅ Contexto atualizado após criar tenant:', newTenant.id);
      } catch (ctxError) {
        console.warn('[MyCompanies] ⚠️ Erro ao atualizar contexto (não crítico):', ctxError);
      }

      // Limpar localStorage antes de navegar para garantir onboarding do zero
      const storageKey = `onboarding_form_data_${newTenant.id}`;
      const stepKey = `onboarding_current_step_${newTenant.id}`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(stepKey);

      // Navegar para onboarding com o tenant_id já criado (remoto ou local)
      // Isso garante que o estado seja isolado por tenant desde o início
      navigate(`/tenant-onboarding?tenant_id=${newTenant.id}&new=true`);
    } catch (error: any) {
      console.error('[MyCompanies] ❌ Erro ao criar tenant:', error);
      
      toast.error('Erro ao criar empresa', {
        description: error.message || 'Não foi possível criar a empresa. Tente novamente.',
      });
    }
  };

  // [HF-STRATEVO-TENANT] Removida função loadTenants - agora usa useUserTenants hook

  // [HF-STRATEVO-TENANT] Função para abrir empresa e navegar para onboarding
  const handleOpenCompany = useCallback(async (tenant: Tenant) => {
    try {
      console.log('[HF-STRATEVO-TENANT] MyCompanies -> handleOpenCompany', tenant);

      // Buscar dados completos do tenant via RPC
      try {
        const { data: tenantData, error: rpcError } = await (supabase as any).rpc('get_tenant_safe', {
          p_tenant_id: tenant.id,
        });

        if (!rpcError && tenantData && tenantData.length > 0) {
          const fullTenant = tenantData[0];
          const tenantObj = {
            id: fullTenant.id,
            slug: fullTenant.slug || '',
            nome: fullTenant.nome || fullTenant.name || '',
            cnpj: fullTenant.cnpj || '',
            email: fullTenant.email || '',
            telefone: fullTenant.telefone || '',
            schema_name: fullTenant.schema_name || '',
            plano: (fullTenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
            status: (fullTenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
            creditos: fullTenant.creditos || 0,
            data_expiracao: fullTenant.data_expiracao || undefined,
            created_at: fullTenant.created_at || new Date().toISOString(),
            updated_at: fullTenant.updated_at || new Date().toISOString(),
          };
          setTenant(tenantObj);
          console.log('[HF-STRATEVO-TENANT] Tenant definido via handleOpenCompany (RPC):', tenantObj.nome);
        } else {
          // Fallback: usar dados do hook
          const tenantObj = {
            id: tenant.id,
            slug: '',
            nome: tenant.nome || '',
            cnpj: tenant.cnpj || '',
            email: tenant.email || '',
            telefone: '',
            schema_name: '',
            plano: (tenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
            status: (tenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
            creditos: tenant.creditos || 0,
            data_expiracao: tenant.data_expiracao || undefined,
            created_at: tenant.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setTenant(tenantObj);
          console.log('[HF-STRATEVO-TENANT] Tenant definido via handleOpenCompany (hook):', tenantObj.nome);
        }
      } catch (err) {
        console.warn('[MyCompanies] Erro ao buscar tenant completo, usando dados do hook:', err);
        // Usar dados básicos do hook
        const tenantObj = {
          id: tenant.id,
          slug: '',
          nome: tenant.nome || '',
          cnpj: tenant.cnpj || '',
          email: tenant.email || '',
          telefone: '',
          schema_name: '',
          plano: (tenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
          status: (tenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
          creditos: tenant.creditos || 0,
          data_expiracao: tenant.data_expiracao || undefined,
          created_at: tenant.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTenant(tenantObj);
      }

      // Navegar para onboarding com tenant_id
      navigate(`/tenant-onboarding?tenant_id=${tenant.id}`);
    } catch (error: any) {
      console.error('[MyCompanies] Erro ao abrir empresa:', error);
      toast.error('Erro ao abrir empresa');
    }
  }, [setTenant, navigate]);

  const switchTenant = async (tenantId: string) => {
    try {
      // [HF-STRATEVO-TENANT] Buscar dados completos do tenant via RPC e usar setTenant
      try {
        const { data: tenantData, error: rpcError } = await (supabase as any).rpc('get_tenant_safe', {
          p_tenant_id: tenantId,
        });

        if (!rpcError && tenantData && tenantData.length > 0) {
          const fullTenant = tenantData[0];
          const tenantObj = {
            id: fullTenant.id,
            slug: fullTenant.slug || '',
            nome: fullTenant.nome || fullTenant.name || '',
            cnpj: fullTenant.cnpj || '',
            email: fullTenant.email || '',
            telefone: fullTenant.telefone || '',
            schema_name: fullTenant.schema_name || '',
            plano: (fullTenant.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
            status: (fullTenant.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
            creditos: fullTenant.creditos || 0,
            data_expiracao: fullTenant.data_expiracao || undefined,
            created_at: fullTenant.created_at || new Date().toISOString(),
            updated_at: fullTenant.updated_at || new Date().toISOString(),
          };
          setTenant(tenantObj);
          console.log('[HF-STRATEVO-TENANT] Tenant atualizado via switchTenant:', tenantObj.nome);
        } else {
          // Fallback: buscar do array de tenants do hook
          const tenantFromHook = tenants.find(t => t.id === tenantId);
          if (tenantFromHook && setTenant) {
            const tenantObj = {
              id: tenantFromHook.id,
              slug: '',
              nome: tenantFromHook.nome || '',
              cnpj: tenantFromHook.cnpj || '',
              email: tenantFromHook.email || '',
              telefone: '',
              schema_name: '',
              plano: (tenantFromHook.plano || 'FREE') as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
              status: (tenantFromHook.status || 'ACTIVE') as 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
              creditos: tenantFromHook.creditos || 0,
              data_expiracao: tenantFromHook.data_expiracao || undefined,
              created_at: tenantFromHook.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setTenant(tenantObj);
          }
        }
      } catch (err) {
        console.warn('[MyCompanies] Erro ao buscar tenant completo:', err);
      }

      setCurrentTenantId(tenantId);
      toast.success('Empresa alterada com sucesso!');
      
      // [HF-STRATEVO-TENANT] Navegar sem recarregar página
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao trocar empresa:', error);
        toast.error('Erro ao trocar empresa');
    }
  };

  const determineLastStep = useCallback((sessionData: any): number => {
    if (!sessionData) return 1;
    if (sessionData.step5_data) return 6;
    if (sessionData.step4_data) return 5;
    if (sessionData.step3_data) return 4;
    if (sessionData.step2_data) return 3;
    if (sessionData.step1_data) return 2;
    return 1;
  }, []);

  const stepLabels = [
    'Dados Básicos',
    'Atividades',
    'Cliente Ideal',
    'Diferenciais',
    'ICP Benchmarking',
    'Revisão & ICP',
  ];

  const formatStatusLabel = (status: string) => status.replace('_', ' ').toLowerCase();

  const loadOnboardingSummaries = useCallback(async (tenantList: Tenant[]) => {
    if (!user?.id || tenantList.length === 0) return;

    const summaries: Record<string, TenantOnboardingSummary> = {};

    await Promise.all(tenantList.map(async (tenant) => {
      try {
        // 🔥 CORRIGIR: Buscar publicUserId primeiro
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Buscar public.users.id
        const { data: publicUser } = await (supabase as any)
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (!publicUser?.id) return;

        const { data: sessionData, error } = await (supabase as any)
          .from('onboarding_sessions')
          .select('step1_data,step2_data,step3_data,step4_data,step5_data,status,updated_at')
          .eq('tenant_id', tenant.id)
          .eq('user_id', publicUser.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('[MyCompanies] Erro ao buscar sessão', error);
          return;
        }

        if (sessionData) {
          summaries[tenant.id] = {
            tenantId: tenant.id,
            lastStep: determineLastStep(sessionData),
            status: sessionData.status || 'draft',
            updatedAt: sessionData.updated_at,
          };
        }
      } catch (error) {
        console.error('[MyCompanies] Falha ao carregar onboarding:', error);
      }
    }));

    setOnboardingSummaries(summaries);
  }, [user?.id, determineLastStep]);

  useEffect(() => {
    if (!user?.id || tenants.length === 0) return;
    loadOnboardingSummaries(tenants);
  }, [tenants, user?.id, loadOnboardingSummaries]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      ACTIVE: { variant: 'default', icon: CheckCircle2 },
      TRIAL: { variant: 'secondary', icon: Clock },
      SUSPENDED: { variant: 'destructive', icon: XCircle },
      CANCELED: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || variants.TRIAL;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status === 'ACTIVE' ? 'Ativo' : status === 'TRIAL' ? 'Trial' : status === 'SUSPENDED' ? 'Suspenso' : 'Cancelado'}
      </Badge>
    );
  };

  const getPlanoBadge = (plano: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-500',
      STARTER: 'bg-blue-500',
      GROWTH: 'bg-green-500',
      ENTERPRISE: 'bg-purple-500',
    };

    return (
      <Badge className={`${colors[plano] || 'bg-gray-500'} text-white`}>
        {plano === 'FREE' ? 'Gratuito' : plano === 'STARTER' ? 'Starter' : plano === 'GROWTH' ? 'Growth' : 'Enterprise'}
      </Badge>
    );
  };

  // 🔥 CORRIGIDO: Verificar senha REAL do usuário logado (não senha de admin genérica)
  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    try {
      // Obter usuário atual
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        console.error('[MyCompanies] Usuário não autenticado');
        return false;
      }

      // 🔥 CRÍTICO: Validar senha tentando fazer login (mesma validação do CompaniesManagementPage)
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: password,
      });

      if (authError) {
        console.warn('[MyCompanies] Senha incorreta:', authError.message);
        return false;
      }

      // Se chegou aqui, a senha está correta
      console.log('[MyCompanies] ✅ Senha validada com sucesso');
      return true;
    } catch (error) {
      console.error('[MyCompanies] Erro ao verificar senha:', error);
      return false;
    }
  };

  // 🔥 NOVO: Deletar tenant individual
  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;

    setPasswordError('');
    
    if (!adminPassword.trim()) {
      setPasswordError('Senha de administrador é obrigatória');
      return;
    }

    const isValidPassword = await verifyAdminPassword(adminPassword);
    if (!isValidPassword) {
      setPasswordError('Senha de administrador incorreta');
      return;
    }

    setIsDeleting(true);
    try {
      // 🗑️ SOFT DELETE: Move para lixeira ao invés de deletar permanentemente
      const { data, error } = await (supabase as any).rpc('soft_delete_tenant', {
        p_tenant_id: tenantToDelete.id,
        p_reason: 'Deletado manualmente pelo administrador'
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`"${tenantToDelete.nome}" movido para lixeira!`, {
          description: 'Você pode restaurar em até 30 dias.',
          action: {
            label: 'Ver Lixeira',
            onClick: () => setTrashModalOpen(true),
          },
        });
        setDeleteDialogOpen(false);
        setTenantToDelete(null);
        setAdminPassword('');
        await refetchTenants();
        setSelectedTenants([]);
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro ao deletar tenant:', error);
      
      // Se a função não existir, mostrar mensagem para aplicar migration
      if (error.message?.includes('does not exist')) {
        toast.error('Função de lixeira não encontrada. Execute a migration no Supabase.');
      } else {
        toast.error('Erro ao deletar empresa. Tente novamente.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 🔥 NOVO: Deletar tenants em massa
  const handleBulkDelete = async () => {
    if (selectedTenants.length === 0) return;

    setPasswordError('');
    
    if (!adminPassword.trim()) {
      setPasswordError('Senha de administrador é obrigatória');
      return;
    }

    const isValidPassword = await verifyAdminPassword(adminPassword);
    if (!isValidPassword) {
      setPasswordError('Senha de administrador incorreta');
      return;
    }

    setIsDeleting(true);
    try {
      const tenantsToDelete = tenants.filter(t => selectedTenants.includes(t.id));
      let successCount = 0;
      let errorCount = 0;
      
      // 🗑️ SOFT DELETE: Move cada tenant para a lixeira
      for (const tenant of tenantsToDelete) {
        try {
          const { data, error } = await (supabase as any).rpc('soft_delete_tenant', {
            p_tenant_id: tenant.id,
            p_reason: 'Deleção em massa pelo administrador'
          });

          if (error) {
            console.error(`Erro ao deletar ${tenant.nome}:`, error);
            errorCount++;
          } else if (data?.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erro ao deletar ${tenant.nome}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} empresa(s) movida(s) para lixeira!`, {
          description: errorCount > 0 ? `${errorCount} falha(s)` : 'Você pode restaurar em até 30 dias.',
          action: {
            label: 'Ver Lixeira',
            onClick: () => setTrashModalOpen(true),
          },
        });
      } else if (errorCount > 0) {
        toast.error('Falha ao deletar empresas. Verifique se a migration foi aplicada.');
      }
      
      setBulkDeleteDialogOpen(false);
      setAdminPassword('');
      setSelectedTenants([]);
      await refetchTenants();
    } catch (error: any) {
      console.error('Erro ao deletar tenants em massa:', error);
      toast.error('Erro ao deletar empresas. Execute a migration no Supabase.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectTenant = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map(t => t.id));
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Empresas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todas as empresas (CNPJs) associadas à sua conta
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTenants.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletar Selecionadas ({selectedTenants.length})
            </Button>
          )}
          
          {/* 🗑️ Botão Ver Lixeira */}
          <Button
            variant="outline"
            onClick={() => setTrashModalOpen(true)}
            className="flex items-center gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Ver Lixeira
          </Button>
          
          <Button variant="outline" onClick={() => navigate('/tenant-onboarding')} className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Retomar onboarding / Gerar SP
          </Button>
          <Button 
            onClick={handleAddCompany} 
            className="flex items-center gap-2"
            variant={canAddTenant ? "default" : "outline"}
          >
            {canAddTenant ? (
              <>
                <Plus className="h-4 w-4" />
                Adicionar Empresa
              </>
            ) : (
              <>
                <ArrowUpCircle className="h-4 w-4" />
                Fazer Upgrade
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Card de Status do Plano */}
      <Card className={cn(
        "border-2 bg-gradient-to-r",
        isAdmin 
          ? "border-purple-500/50 from-purple-500/10 to-transparent" 
          : "border-primary/20 from-primary/5 to-transparent"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Crown className={cn("h-5 w-5", isAdmin ? "text-purple-500" : "text-yellow-500")} />
            {isAdmin ? (
              <>
                <span className="text-purple-500">Modo Administrador</span>
                <Badge className="ml-2 bg-purple-500 text-white">
                  🔓 Limites Desbloqueados
                </Badge>
              </>
            ) : (
              <>
                Seu Plano: <span className="text-primary">{currentPlan}</span>
                {planLimits.trialDays > 0 && planLimits.trialDays < 999 && (
                  <Badge variant="secondary" className="ml-2">
                    Trial {planLimits.trialDays} dias
                  </Badge>
                )}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Empresas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Empresas
                </span>
                <span className={cn(
                  "font-semibold",
                  !canAddTenant && "text-destructive"
                )}>
                  {tenants.length} / {formatLimit(planLimits.tenants)}
                </span>
              </div>
              <Progress 
                value={(tenants.length / planLimits.tenants) * 100} 
                className={cn("h-2", !canAddTenant && "bg-destructive/20")}
              />
              {!canAddTenant && (
                <p className="text-xs text-destructive">Limite atingido</p>
              )}
            </div>
            
            {/* ICPs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  ICPs
                </span>
                <span className={cn(
                  "font-semibold",
                  !canAddICP && "text-destructive"
                )}>
                  {icpCount} / {formatLimit(planLimits.icps)}
                </span>
              </div>
              <Progress 
                value={planLimits.icps >= 999999 ? 10 : (icpCount / planLimits.icps) * 100} 
                className="h-2"
              />
            </div>
            
            {/* Usuários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-purple-500" />
                  Usuários
                </span>
                <span className={cn(
                  "font-semibold",
                  !canAddUser && "text-destructive"
                )}>
                  {userCount} / {formatLimit(planLimits.users)}
                </span>
              </div>
              <Progress 
                value={planLimits.users >= 999999 ? 10 : (userCount / planLimits.users) * 100} 
                className="h-2"
              />
            </div>
          </div>
          
          {(!canAddTenant || !canAddICP || !canAddUser) && (
            <div className="mt-4 flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Você atingiu o limite do plano {currentPlan}
                </span>
              </div>
              {upgradePlan && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/plans')}
                  className="border-amber-500 text-amber-700 hover:bg-amber-500/20"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                  Upgrade para {upgradePlan}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cada empresa (CNPJ) possui uma assinatura separada. Se você tem 2 empresas com plano Enterprise,
            você paga 2x o valor do Enterprise. Você pode adicionar quantas empresas quiser, cada uma com seu próprio plano.
          </p>
        </CardContent>
      </Card>

      {/* Modal de Upgrade */}
      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Limite de Empresas Atingido
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Seu plano <strong>{currentPlan}</strong> permite no máximo{' '}
                <strong>{formatLimit(planLimits.tenants)} empresa(s)</strong>.
              </p>
              <p>
                Para adicionar mais empresas, faça upgrade para o plano{' '}
                <strong>{upgradePlan}</strong> que permite{' '}
                <strong>{formatLimit(getPlanLimits(upgradePlan || 'STARTER').tenants)} empresas</strong>.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Comparativo de Planos:</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="font-semibold">Plano</div>
                  <div className="font-semibold">Empresas</div>
                  <div className="font-semibold">ICPs</div>
                  <div className="font-semibold">Usuários</div>
                  
                  <div>FREE</div><div>1</div><div>1</div><div>1</div>
                  <div>STARTER</div><div>2</div><div>3</div><div>2</div>
                  <div>GROWTH</div><div>5</div><div>10</div><div>5</div>
                  <div>ENTERPRISE</div><div>15</div><div>∞</div><div>Vendas</div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/plans')}>
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Ver Planos e Fazer Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lista de Tenants */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando empresas...</p>
          </CardContent>
        </Card>
      )}

      {!loading && tenantsError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar empresas</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Não foi possível carregar as empresas. Tente novamente mais tarde.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !tenantsError && tenants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Comece cadastrando sua primeira empresa para usar a plataforma
            </p>
            <Button onClick={() => navigate('/tenant-onboarding?new=true')}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !tenantsError && tenants.length > 0 && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                Tabela
              </TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {tenants.length} empresa{tenants.length !== 1 ? 's' : ''}
            </div>
          </div>

          <TabsContent value="cards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <Card
                  key={tenant.id}
                  className={cn(
                    "transition-all hover:shadow-lg cursor-pointer",
                    currentTenantId === tenant.id && "ring-2 ring-primary",
                    selectedTenants.includes(tenant.id) && "ring-2 ring-destructive"
                  )}
                  onClick={() => handleOpenCompany(tenant)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Checkbox
                          checked={selectedTenants.includes(tenant.id)}
                          onCheckedChange={() => toggleSelectTenant(tenant.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tenant.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            CNPJ: {formatCNPJ(tenant.cnpj)}
                          </CardDescription>
                        </div>
                      </div>
                      {currentTenantId === tenant.id && (
                        <Badge variant="outline" className="ml-2">Atual</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Plano:</span>
                        {getPlanoBadge(tenant.plano)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(tenant.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Créditos:</span>
                        <span className="font-semibold">{tenant.creditos}</span>
                      </div>
                      {tenant.data_expiracao && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Expira em:</span>
                          <span className="text-sm">
                            {new Date(tenant.data_expiracao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                          <Button
                          variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                            handleOpenCompany(tenant);
                            }}
                          >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar / Abrir Plataforma
                          </Button>
                        {currentTenantId !== tenant.id && (
                        <Button
                            variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                              switchTenant(tenant.id);
                          }}
                        >
                            Usar Esta Empresa
                        </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTenantToDelete(tenant);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {onboardingSummaries[tenant.id] ? (
                        <div className="pt-3 border-t border-border space-y-1">
                          <p className="text-xs text-muted-foreground">Última sessão salva</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {stepLabels[onboardingSummaries[tenant.id].lastStep - 1] || `Passo ${onboardingSummaries[tenant.id].lastStep}`}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(onboardingSummaries[tenant.id].updatedAt).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              Status: {formatStatusLabel(onboardingSummaries[tenant.id].status)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/tenant-onboarding?tenant_id=${tenant.id}`);
                              }}
                            >
                              Recarregar onboarding salvo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground pt-3">Nenhuma sessão salva ainda.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTenants.length === tenants.length && tenants.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className={cn(
                        "cursor-pointer",
                        currentTenantId === tenant.id && "bg-primary/5",
                        selectedTenants.includes(tenant.id) && "bg-destructive/5"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedTenants.includes(tenant.id)}
                          onCheckedChange={() => toggleSelectTenant(tenant.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{tenant.nome}</div>
                          <div className="text-xs text-muted-foreground">{tenant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{formatCNPJ(tenant.cnpj)}</TableCell>
                      <TableCell>{getPlanoBadge(tenant.plano)}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell className="font-semibold">{tenant.creditos}</TableCell>
                      <TableCell>
                        {tenant.data_expiracao
                          ? new Date(tenant.data_expiracao).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {onboardingSummaries[tenant.id] ? (
                          <div className="space-y-1.5">
                            <div className="text-xs">
                              <div className="font-medium">
                                {stepLabels[onboardingSummaries[tenant.id].lastStep - 1] || `Passo ${onboardingSummaries[tenant.id].lastStep}`}
                              </div>
                              <div className="text-muted-foreground">
                                {formatStatusLabel(onboardingSummaries[tenant.id].status)}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {new Date(onboardingSummaries[tenant.id].updatedAt).toLocaleString('pt-BR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tenant-onboarding?tenant_id=${tenant.id}`);
                              }}
                              className="w-full text-xs h-7"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Recarregar onboarding
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="text-xs text-muted-foreground">Não iniciado</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tenant-onboarding?tenant_id=${tenant.id}`);
                              }}
                              className="w-full text-xs h-7"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Iniciar onboarding
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentTenantId !== tenant.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                switchTenant(tenant.id);
                              }}
                            >
                              Usar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tenant-onboarding?tenant_id=${tenant.id}`);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTenantToDelete(tenant);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog de Deleção Individual */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Deleção
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso deletará permanentemente a empresa{' '}
              <strong>{tenantToDelete?.nome}</strong> e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha de Administrador
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Digite sua senha de administrador"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setPasswordError('');
                }}
                className={cn(passwordError && "border-destructive")}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setTenantToDelete(null);
                setAdminPassword('');
                setPasswordError('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              disabled={isDeleting || !adminPassword.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Empresa
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Deleção em Massa */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Deleção em Massa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso deletará permanentemente{' '}
              <strong>{selectedTenants.length} empresa(s)</strong> e todos os dados associados.
              <ul className="list-disc list-inside mt-2 space-y-1">
                {tenants
                  .filter(t => selectedTenants.includes(t.id))
                  .slice(0, 5)
                  .map(tenant => (
                    <li key={tenant.id} className="text-sm">{tenant.nome}</li>
                  ))}
                {selectedTenants.length > 5 && (
                  <li className="text-sm">... e mais {selectedTenants.length - 5} empresa(s)</li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password-bulk" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha de Administrador
              </Label>
              <Input
                id="admin-password-bulk"
                type="password"
                placeholder="Digite sua senha de administrador"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setPasswordError('');
                }}
                className={cn(passwordError && "border-destructive")}
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setBulkDeleteDialogOpen(false);
                setAdminPassword('');
                setPasswordError('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting || !adminPassword.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar {selectedTenants.length} Empresa(s)
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🗑️ Modal da Lixeira */}
      <TenantTrashModal
        open={trashModalOpen}
        onOpenChange={setTrashModalOpen}
        onTenantRestored={refetchTenants}
      />
    </div>
  );
}

