// src/components/onboarding/steps/Step1DadosBasicos.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Globe, Sparkles, X, Package, Plus, Building2, RefreshCw, MapPin, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { TenantProductsCatalog } from '@/components/products/TenantProductsCatalog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: (data?: any) => void | Promise<void>; // Auto-save silencioso
  onSaveExplicit?: (data?: any) => void | Promise<void>; // Botão "Salvar" explícito (com toast)
  initialData: any;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export function Step1DadosBasicos({ onNext, onBack, onSave, onSaveExplicit, initialData, isSaving = false, hasUnsavedChanges = false }: Props) {
  const [formData, setFormData] = useState({
    cnpj: initialData?.cnpj || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    telefone: initialData?.telefone || '',
  });

  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [cnpjData, setCnpjData] = useState<any>(initialData?.cnpjData || null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  // 🔥 NOVO: Estados para scan de produtos do tenant
  const [scanningTenantWebsite, setScanningTenantWebsite] = useState(false);
  const [tenantProductsCount, setTenantProductsCount] = useState(0);
  const [tenantProducts, setTenantProducts] = useState<Array<{ id: string; nome: string; descricao?: string; categoria?: string }>>([]);
  const [productsCatalogOpen, setProductsCatalogOpen] = useState(false);
  const [tenantProductsViewMode, setTenantProductsViewMode] = useState<'cards' | 'table'>('cards');
  const [tenantProductsOpen, setTenantProductsOpen] = useState(false); // 🔥 CORRIGIDO: Começar fechado
  
  // 🔥 NOVO: Estados para as caixas verdes de dados encontrados
  const [dadosEmpresaOpen, setDadosEmpresaOpen] = useState(false); // Começar fechado
  const [dadosConcorrenteOpen, setDadosConcorrenteOpen] = useState(false); // Começar fechado
  
  // 🔥 NOVO: Estados para concorrentes
  interface ConcorrenteDireto {
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
    urlParaScan?: string; // NOVO: URL manual para scan
    produtosExtraidos?: number; // NOVO: Contador de produtos
    produtos?: Array<{ id: string; nome: string; descricao?: string; categoria?: string }>; // NOVO: Lista de produtos
    cep?: string; // 🔥 NOVO: CEP
    endereco?: string; // 🔥 NOVO: Endereço
    bairro?: string; // 🔥 NOVO: Bairro
    numero?: string; // 🔥 NOVO: Número
  }
  
  const [concorrentes, setConcorrentes] = useState<ConcorrenteDireto[]>(
    initialData?.concorrentesDiretos || []
  );
  
  // 🔥 NOVO: Estados para cards colapsáveis
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);
  
  const [novoConcorrente, setNovoConcorrente] = useState<ConcorrenteDireto>({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    setor: '',
    cidade: '',
    estado: '',
    capitalSocial: 0,
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
    website: '',
    urlParaScan: '',
    cep: '', // 🔥 NOVO: CEP
    endereco: '', // 🔥 NOVO: Endereço
    bairro: '', // 🔥 NOVO: Bairro
    numero: '', // 🔥 NOVO: Número
  });
  
  const [buscandoCNPJConcorrente, setBuscandoCNPJConcorrente] = useState(false);
  const [cnpjConcorrenteEncontrado, setCnpjConcorrenteEncontrado] = useState(false);
  const [erroCNPJConcorrente, setErroCNPJConcorrente] = useState<string | null>(null);
  const [reprocessandoEnderecos, setReprocessandoEnderecos] = useState(false);
  const [showAlertaEnderecos, setShowAlertaEnderecos] = useState(false);
  const [scanningConcorrente, setScanningConcorrente] = useState<Record<string, boolean>>({});
  const cnpjConcorrenteUltimoBuscadoRef = useRef<string>('');
  const [bulkExtracting, setBulkExtracting] = useState(false); // 🔥 NOVO: Estado para extração em massa
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 }); // 🔥 NOVO: Progresso da extração em massa
  const [extractionStatus, setExtractionStatus] = useState<Record<string, 'pending' | 'extracting' | 'success' | 'error'>>({}); // 🔥 NOVO: Status de extração por CNPJ/tenant
  
  const { tenant, refreshTenant, switchTenant } = useTenant();
  
  // 🔥 CRÍTICO: Carregar dados do tenant do banco quando tenant muda
  const loadTenantData = useCallback(async () => {
    if (!tenant?.id) {
      console.warn('[Step1] ⚠️ Tenant não identificado para carregar dados');
      return;
    }
    
    // 🔥 CRÍTICO: Verificar se tenant_id é um UUID válido (não é tenant local)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant.id);
    if (!isUUID) {
      console.log('[Step1] ℹ️ Tenant local detectado, usando dados do contexto:', tenant.id);
      // Para tenant local, usar dados do contexto se disponíveis
      if (tenant.nome || tenant.cnpj || tenant.email) {
        setFormData(prev => ({
          cnpj: tenant.cnpj || prev.cnpj || '',
          email: tenant.email || prev.email || '',
          website: prev.website || '',
          telefone: prev.telefone || '',
        }));
      }
      return;
    }
    
    try {
      console.log('[Step1] 🔍 Carregando dados do tenant do banco:', tenant.id);
      
      // Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await (supabase as any)
        .from('tenants')
        .select('id, nome, cnpj, email, telefone')
        .eq('id', tenant.id)
        .maybeSingle();
      
      if (tenantError) {
        console.warn('[Step1] ⚠️ Erro ao buscar dados do tenant:', tenantError);
        return;
      }
      
      if (tenantData) {
        console.log('[Step1] ✅ Dados do tenant carregados:', tenantData);
        
        // Atualizar formData com dados do tenant (MERGE não-destrutivo)
        setFormData(prev => ({
          cnpj: tenantData.cnpj || prev.cnpj || '',
          email: tenantData.email || prev.email || '',
          website: prev.website || '',
          telefone: tenantData.telefone || prev.telefone || '',
        }));
        
        // Se tem CNPJ mas não tem cnpjData, buscar da Receita Federal
        if (tenantData.cnpj && !cnpjData) {
          const cnpjLimpo = tenantData.cnpj.replace(/\D/g, '');
          if (cnpjLimpo.length === 14) {
            console.log('[Step1] 🔍 CNPJ encontrado no tenant, buscando dados da Receita Federal...');
            // Não buscar automaticamente, apenas logar que poderia buscar
            // O usuário pode clicar em "Buscar Dados" se quiser
          }
        }
      }
    } catch (error) {
      console.error('[Step1] ❌ Erro ao carregar dados do tenant:', error);
    }
  }, [tenant?.id, tenant?.cnpj, tenant?.email, tenant?.nome, cnpjData]);
  
  // 🔥 CRÍTICO: Carregar dados do tenant quando tenant muda
  useEffect(() => {
    if (tenant?.id) {
      loadTenantData();
    }
  }, [tenant?.id, loadTenantData]);

  // 🔥 NOVO: Carregar produtos do tenant (BUSCA DE AMBAS AS TABELAS)
  // ✅ useCallback para evitar loops infinitos
  const loadTenantProducts = useCallback(async () => {
    if (!tenant?.id) {
      console.warn('[Step1] ⚠️ Tenant não identificado para carregar produtos');
      return;
    }
    
    // 🔥 CRÍTICO: Verificar se tenant_id é um UUID válido (não é tenant local)
    // Tenants locais têm formato "local-tenant-..." e não podem ser usados em queries
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant.id);
    if (!isUUID) {
      console.log('[Step1] ℹ️ Tenant local detectado, pulando busca de produtos do banco:', tenant.id);
      setTenantProducts([]);
      setTenantProductsCount(0);
      return;
    }
    
    try {
      console.log('[Step1] 🔍 Carregando produtos do tenant:', tenant.id);
      
      let produtosData: any[] = [];
      
      // 🔥 CORRIGIDO: Priorizar tenant_products (onde scan-website-products salva)
      // Buscar primeiro de tenant_products (tabela principal para produtos do tenant)
      try {
        const { data: produtosTenant, error: produtosTenantError } = await supabase
          .from('tenant_products' as any)
          .select('id, nome, descricao, categoria, created_at')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false });
        
        if (!produtosTenantError && produtosTenant) {
          produtosData = [...produtosData, ...(produtosTenant || [])];
          console.log('[Step1] ✅ Produtos encontrados em tenant_products:', produtosTenant.length);
        } else if (produtosTenantError) {
          console.warn('[Step1] ⚠️ Erro ao buscar de tenant_products:', produtosTenantError);
        }
      } catch (err: any) {
        console.warn('[Step1] ⚠️ Erro ao buscar de tenant_products:', err);
      }
      
      // 🔥 COMPATIBILIDADE: Buscar também de tenant_competitor_products (para dados antigos)
      // Isso é necessário apenas para compatibilidade com produtos extraídos antes da correção
      const tenantCnpj = formData.cnpj?.replace(/\D/g, '') || '';
      if (tenantCnpj && tenantCnpj.length === 14) {
        try {
          const { data: produtosConcorrente, error: produtosConcorrenteError } = await supabase
            .from('tenant_competitor_products' as any)
            .select('id, nome, descricao, categoria, created_at')
            .eq('tenant_id', tenant.id)
            .eq('competitor_cnpj', tenantCnpj)
            .order('created_at', { ascending: false });
          
          if (!produtosConcorrenteError && produtosConcorrente) {
            // Combinar produtos, evitando duplicatas por nome
            const nomesExistentes = new Set(produtosData.map((p: any) => p.nome?.toLowerCase()));
            const produtosNovos = (produtosConcorrente || []).filter((p: any) => !nomesExistentes.has(p.nome?.toLowerCase()));
            produtosData = [...produtosData, ...produtosNovos];
            console.log('[Step1] ✅ Produtos encontrados em tenant_competitor_products (compatibilidade):', produtosConcorrente.length);
          }
        } catch (err: any) {
          console.warn('[Step1] ⚠️ Erro ao buscar de tenant_competitor_products:', err);
        }
      }
      
      // Remover duplicatas por nome (caso tenha buscado de ambas)
      const produtosUnicos = produtosData.filter((produto: any, index: number, self: any[]) => 
        index === self.findIndex((p: any) => p.nome?.toLowerCase() === produto.nome?.toLowerCase())
      );
      
      const produtos = (produtosUnicos || []) as unknown as Array<{ id: string; nome: string; descricao?: string; categoria?: string }>;
      console.log('[Step1] ✅ Produtos carregados do banco:', produtos.length);
      console.log('[Step1] 📦 Dados brutos:', produtosData);
      
      if (produtos.length > 0) {
        console.log('[Step1] 📦 Produtos encontrados:', produtos.map(p => ({ id: p.id, nome: p.nome, categoria: p.categoria })));
      } else {
        console.log('[Step1] ℹ️ Nenhum produto encontrado no banco para tenant:', tenant.id);
        console.log('[Step1] 💡 Use "Extrair Produtos" para buscar produtos do website');
      }
      
      // 🔥 CRÍTICO: Atualizar estado (FORÇAR NOVA REFERÊNCIA PARA RE-RENDER)
      console.log('[Step1] 🔄 Atualizando estado com produtos:', produtos.length);
      setTenantProducts([...produtos]); // Spread para forçar nova referência
      setTenantProductsCount(produtos.length);
      
      console.log('[Step1] ✅ Estado atualizado:', {
        tenantProductsCount: produtos.length,
        tenantProductsArrayLength: produtos.length,
        produtosNomes: produtos.map(p => p.nome)
      });
    } catch (err: any) {
      console.error('[Step1] ❌ Erro ao carregar produtos do tenant:', err);
      console.error('[Step1] ❌ Stack:', err.stack);
      toast.error('Erro ao carregar produtos', {
        description: err.message || 'Verifique o console para mais detalhes',
        duration: 8000,
      });
      setTenantProductsCount(0);
      setTenantProducts([]);
    }
  }, [tenant?.id, formData.cnpj]); // ✅ Dependências do useCallback

  // 🔥 NOVO: Carregar produtos de um concorrente específico
  const loadCompetitorProducts = async (competitorCnpj: string) => {
    if (!tenant?.id || !competitorCnpj) return 0;
    
    try {
      const { data: produtosData, error } = await supabase
        .from('tenant_competitor_products' as any)
        .select('id, nome, descricao, categoria')
        .eq('tenant_id', tenant.id)
        .eq('competitor_cnpj', competitorCnpj.replace(/\D/g, ''))
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01' || error.message?.includes('404')) {
          console.warn('[Step1] Tabela tenant_competitor_products não existe. Aplique a migration.');
          return 0;
        }
        throw error;
      }
      
      return produtosData?.length || 0;
    } catch (err) {
      console.error('[Step1] Erro ao carregar produtos do concorrente:', err);
      return 0;
    }
  };

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa)
  // 🔥 CORRIGIDO: Usar useRef para evitar loops infinitos
  const initialDataRef = useRef<any>(null);
  const hasInitializedRef = useRef(false);
  const lastTenantIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // 🔥 CRÍTICO: Se o tenant mudou, limpar todos os dados locais primeiro
    if (tenant?.id && tenant.id !== lastTenantIdRef.current) {
      console.log('[Step1] 🔄 Tenant mudou, limpando dados locais:', {
        old: lastTenantIdRef.current,
        new: tenant.id,
      });
      
      const oldTenantId = lastTenantIdRef.current;
      lastTenantIdRef.current = tenant.id;
      
      // 🔥 CRÍTICO: Limpar dados do tenant ANTERIOR do localStorage para evitar mistura
      if (oldTenantId) {
        const oldStorageKey = `onboarding_form_data_${oldTenantId}`;
        const oldStepKey = `onboarding_current_step_${oldTenantId}`;
        localStorage.removeItem(oldStorageKey);
        localStorage.removeItem(oldStepKey);
        console.log('[Step1] 🗑️ Dados do tenant anterior removidos do localStorage:', oldTenantId);
      }
      
      // Limpar dados locais quando tenant muda
      setFormData({
        cnpj: '',
        email: '',
        website: '',
        telefone: '',
      });
      setCnpjData(null);
      initialDataRef.current = null;
      hasInitializedRef.current = false;
    }
    
    // 🔥 CORRIGIDO: Só atualizar se initialData realmente mudou - MERGE não-destrutivo
    // 🔥 CRÍTICO: NÃO resetar campos que o usuário está digitando
    if (initialData && initialData !== initialDataRef.current) {
      console.log('[Step1] 🔄 Atualizando dados do initialData:', initialData);
      initialDataRef.current = initialData;
      hasInitializedRef.current = true;
      
      // 🔥 MERGE não-destrutivo: preservar dados existentes, complementar com initialData
      // 🔥 CRÍTICO: Se usuário está digitando (campo tem foco), NÃO sobrescrever
      setFormData(prev => {
        // Verificar se algum campo tem foco (usuário está digitando)
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.id === 'cnpj' ||
          activeElement.id === 'email' ||
          activeElement.id === 'website' ||
          activeElement.id === 'telefone'
        );
        
        if (isTyping) {
          console.log('[Step1] ⏸️ Usuário está digitando, mantendo valores atuais');
          return prev; // Não atualizar enquanto digita
        }
        
        // Atualizar apenas campos vazios ou que realmente mudaram
        return {
          cnpj: prev.cnpj || initialData.cnpj || '',
          email: prev.email || initialData.email || '',
          website: prev.website || initialData.website || '',
          telefone: prev.telefone || initialData.telefone || '',
        };
      });
      
      // 🔥 CRÍTICO: Restaurar cnpjData PRIMEIRO (antes de carregar produtos)
      // 🔥 CORRIGIDO: Sempre restaurar se houver cnpjData OU dados individuais
      if (initialData.cnpjData) {
        // Se tem cnpjData completo, usar diretamente
        setCnpjData(initialData.cnpjData);
        console.log('[Step1] ✅ cnpjData restaurado (completo):', initialData.cnpjData);
      } else if (initialData.razaoSocial || initialData.nomeFantasia || initialData.situacaoCadastral) {
        // Se não tem cnpjData mas tem dados individuais, reconstruir
        const cnpjDataToSet = {
          nome: initialData.razaoSocial || '',
          fantasia: initialData.nomeFantasia || '',
          situacao: initialData.situacaoCadastral || '',
          abertura: initialData.dataAbertura || '',
          natureza_juridica: initialData.naturezaJuridica || '',
          capital_social: initialData.capitalSocial || null,
          porte: initialData.porteEmpresa || '',
          email: initialData.email || '',
          telefone: initialData.telefone || '',
          logradouro: initialData.endereco?.logradouro || '',
          numero: initialData.endereco?.numero || '',
          complemento: initialData.endereco?.complemento || '',
          bairro: initialData.endereco?.bairro || '',
          municipio: initialData.endereco?.municipio || '',
          uf: initialData.endereco?.uf || '',
          cep: initialData.endereco?.cep || '',
          cnaes: initialData.cnaes || [],
          atividade_principal: initialData.cnaes?.[0] ? [{ code: initialData.cnaes[0], text: '' }] : [],
        };
        setCnpjData(cnpjDataToSet);
        console.log('[Step1] ✅ cnpjData restaurado (reconstruído):', cnpjDataToSet);
      } else if (cnpjData) {
        // Se já tem cnpjData no estado, manter (não resetar)
        console.log('[Step1] ℹ️ Mantendo cnpjData existente no estado');
      }
      
      // 🔥 NOVO: Carregar produtos do tenant ao montar (apenas se tenant não mudou)
      if (tenant?.id && tenant.id === lastTenantIdRef.current) {
        loadTenantProducts();
      }
      
      // 🔥 NOVO: Carregar concorrentes e seus produtos
      if (initialData.concorrentesDiretos && Array.isArray(initialData.concorrentesDiretos) && initialData.concorrentesDiretos.length > 0) {
        const loadConcorrentesComProdutos = async () => {
          const concorrentesComProdutos = await Promise.all(
            initialData.concorrentesDiretos.map(async (conc: ConcorrenteDireto) => {
              if (!tenant?.id || !conc.cnpj) return conc;
              
              try {
                const { data: produtos, error } = await (supabase
                  .from('tenant_competitor_products' as any)
                  .select('id, nome, descricao, categoria')
                  .eq('tenant_id', tenant.id)
                  .eq('competitor_cnpj', conc.cnpj.replace(/\D/g, ''))
                  .order('created_at', { ascending: false }));
                
                // Se erro 404, tabela não existe - retornar concorrente sem produtos
                if (error && (error.code === '42P01' || error.message?.includes('404'))) {
                  console.warn('[Step1] Tabela tenant_competitor_products não existe. Aplique a migration.');
                  return {
                    ...conc,
                    produtos: [],
                    produtosExtraidos: 0
                  };
                }
                
                return {
                  ...conc,
                  produtos: (produtos || []) as unknown as Array<{ id: string; nome: string; descricao?: string; categoria?: string }>,
                  produtosExtraidos: produtos?.length || 0
                };
              } catch (err) {
                console.error('[Step1] Erro ao carregar produtos:', err);
                return {
                  ...conc,
                  produtos: [],
                  produtosExtraidos: 0
                };
              }
            })
          );
          setConcorrentes(concorrentesComProdutos);
        };
        
        loadConcorrentesComProdutos();
      } else if (initialData.concorrentesDiretos === undefined && !hasInitializedRef.current) {
        // 🔥 CORRIGIDO: Só resetar se for a primeira inicialização E não tiver concorrentes
        // Não resetar se já tiver concorrentes no estado
        if (concorrentes.length === 0) {
          setConcorrentes([]);
        }
      }
    } else if (!initialData && hasInitializedRef.current) {
      // Se initialData foi limpo, resetar
      console.log('[Step1] ⚠️ initialData foi limpo, mantendo estado atual');
    }
  }, [initialData?.cnpj, initialData?.email, initialData?.website, initialData?.telefone, initialData?.razaoSocial, tenant?.id, loadTenantProducts]); // ✅ Adicionar loadTenantProducts às dependências

  // 🔥 CRÍTICO: Auto-save quando cnpjData ou formData mudarem (para garantir persistência)
  useEffect(() => {
    // Só salvar se já tiver sido inicializado e tiver dados relevantes
    if (hasInitializedRef.current && (cnpjData || formData.cnpj || formData.email)) {
      const timeoutId = setTimeout(async () => {
        if (onSave) {
          const concorrentesParaSalvar = concorrentes.length > 0 
            ? concorrentes 
            : (initialData?.concorrentesDiretos || []);
          
          const dataToSave = {
            ...formData,
            razaoSocial: cnpjData?.nome || initialData?.razaoSocial || '',
            nomeFantasia: cnpjData?.fantasia || initialData?.nomeFantasia || '',
            situacaoCadastral: cnpjData?.situacao || initialData?.situacaoCadastral || '',
            dataAbertura: cnpjData?.abertura || initialData?.dataAbertura || '',
            naturezaJuridica: cnpjData?.natureza_juridica || initialData?.naturezaJuridica || '',
            capitalSocial: cnpjData?.capital_social || initialData?.capitalSocial || null,
            porteEmpresa: cnpjData?.porte || initialData?.porteEmpresa || '',
            endereco: cnpjData ? {
              logradouro: cnpjData.logradouro || '',
              numero: cnpjData.numero || '',
              complemento: cnpjData.complemento || '',
              bairro: cnpjData.bairro || '',
              cep: cnpjData.cep || '',
              cidade: cnpjData.municipio || '',
              estado: cnpjData.uf || '',
            } : (initialData?.endereco || null),
            cnaes: cnpjData?.atividade_principal ? [
              cnpjData.atividade_principal[0]?.code,
              ...(cnpjData.atividades_secundarias || []).map((a: any) => a.code)
            ].filter(Boolean) : (initialData?.cnaes || []),
            cnpjData: cnpjData || initialData?.cnpjData || null,
            concorrentesDiretos: concorrentesParaSalvar,
          };
          
          try {
            await onSave(dataToSave);
            console.log('[Step1] ✅ Auto-save executado:', { cnpj: formData.cnpj, temCnpjData: !!cnpjData });
          } catch (err) {
            console.error('[Step1] ❌ Erro no auto-save:', err);
          }
        }
      }, 1000); // Aguardar 1 segundo após última mudança
      
      return () => clearTimeout(timeoutId);
    }
  }, [cnpjData, formData.cnpj, formData.email, formData.website, formData.telefone, concorrentes.length]);

  // Buscar dados automaticamente ao preencher CNPJ
  const handleCNPJSearch = async () => {
    const cnpjClean = formData.cnpj.replace(/\D/g, '');
    if (!cnpjClean || cnpjClean.length !== 14) {
      setCnpjError('CNPJ inválido (deve ter 14 dígitos)');
      return;
    }

    setLoadingCNPJ(true);
    setCnpjError(null);

    try {
      const result = await consultarReceitaFederal(formData.cnpj);
      
      if (!result.success || !result.data) {
        setCnpjError(result.error || 'Erro ao buscar dados do CNPJ');
        return;
      }

      // O serviço retorna um objeto merged com campos adicionais (email, telefone, etc.)
      // que não estão no tipo ReceitaWSResponse, então fazemos cast para any
      let data = result.data as any;
      
      // 🔥 NOVO: Se só tem CEP mas falta endereço, buscar no ViaCEP
      if (data.cep && !data.logradouro) {
        console.log('[Step1] 🔍 Tenant: Buscando endereço no ViaCEP para CEP:', data.cep);
        try {
          const viaCepResponse = await fetch(`https://viacep.com.br/ws/${data.cep.replace(/\D/g, '')}/json/`);
          const viaCepData = await viaCepResponse.json();
          
          if (!viaCepData.erro) {
            data = {
              ...data,
              logradouro: viaCepData.logradouro || data.logradouro || '',
              bairro: viaCepData.bairro || data.bairro || '',
              cep: viaCepData.cep,
            };
            console.log('[Step1] ✅ Tenant: Endereço enriquecido via ViaCEP');
          }
        } catch (viaCepError) {
          console.warn('[Step1] ⚠️ Tenant: Erro ao buscar ViaCEP:', viaCepError);
        }
      }
      
      setCnpjData(data);
      
      // Preencher campos automaticamente se disponíveis
      const updatedFormData = { ...formData };
      if (data.email && !formData.email) {
        updatedFormData.email = data.email;
      }
      if (data.telefone && !formData.telefone) {
        updatedFormData.telefone = data.telefone;
      }
      if (data.website && !formData.website) {
        updatedFormData.website = data.website;
      }
      setFormData(updatedFormData);
      
      // 🔥 CRÍTICO: Atualizar nome E CNPJ do tenant se já existir (banco OU localStorage)
      if (tenant?.id && data.nome) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant.id);
        const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
        
        if (isUUID) {
          // Tenant do banco - atualizar no banco
          try {
            console.log('[Step1] 🔄 Atualizando nome e CNPJ do tenant no banco:', { 
              tenantId: tenant.id, 
              nome: data.nome,
              cnpj: cnpjLimpo 
            });
            const { error: updateError } = await (supabase as any)
              .from('tenants')
              .update({ 
                nome: data.nome,
                cnpj: cnpjLimpo || tenant.cnpj || null
              })
              .eq('id', tenant.id);
            
            if (updateError) {
              console.warn('[Step1] ⚠️ Erro ao atualizar tenant no banco:', updateError);
              // 🔥 NOVO: Mesmo com erro, disparar evento para atualizar UI (pode ser erro 500 temporário)
              // O nome será atualizado quando o erro RLS for corrigido
              window.dispatchEvent(new CustomEvent('tenant-updated', { 
                detail: { 
                  tenantId: tenant.id, 
                  nome: data.nome,
                  cnpj: cnpjLimpo 
                } 
              }));
            } else {
              console.log('[Step1] ✅ Nome e CNPJ do tenant atualizados no banco com sucesso');
              // Disparar evento customizado para refetch do useUserTenants
              window.dispatchEvent(new CustomEvent('tenant-updated', { 
                detail: { 
                  tenantId: tenant.id, 
                  nome: data.nome,
                  cnpj: cnpjLimpo 
                } 
              }));
            }
          } catch (err) {
            console.warn('[Step1] ⚠️ Erro ao atualizar tenant no banco:', err);
            // 🔥 NOVO: Mesmo com erro, disparar evento para atualizar UI
            window.dispatchEvent(new CustomEvent('tenant-updated', { 
              detail: { 
                tenantId: tenant.id, 
                nome: data.nome,
                cnpj: cnpjLimpo 
              } 
            }));
          }
        } else {
          // Tenant local - atualizar no localStorage
          try {
            console.log('[Step1] 🔄 Atualizando nome e CNPJ do tenant local no localStorage:', { 
              tenantId: tenant.id, 
              nome: data.nome,
              cnpj: cnpjLimpo 
            });
            const localTenantsKey = 'local_tenants';
            const localTenantsJson = localStorage.getItem(localTenantsKey);
            
            if (localTenantsJson) {
              const localTenants = JSON.parse(localTenantsJson);
              const tenantIndex = localTenants.findIndex((t: any) => t.id === tenant.id);
              
              if (tenantIndex !== -1) {
                // Atualizar nome e CNPJ do tenant local
                localTenants[tenantIndex] = {
                  ...localTenants[tenantIndex],
                  nome: data.nome,
                  cnpj: cnpjLimpo || localTenants[tenantIndex].cnpj || '',
                };
                localStorage.setItem(localTenantsKey, JSON.stringify(localTenants));
                console.log('[Step1] ✅ Nome e CNPJ do tenant local atualizados no localStorage');
                
                // Disparar evento customizado para refetch do useUserTenants
                window.dispatchEvent(new CustomEvent('tenant-updated', { 
                  detail: { 
                    tenantId: tenant.id, 
                    nome: data.nome,
                    cnpj: cnpjLimpo 
                  } 
                }));
              } else {
                console.warn('[Step1] ⚠️ Tenant local não encontrado no localStorage:', tenant.id);
              }
            }
          } catch (err) {
            console.warn('[Step1] ⚠️ Erro ao atualizar tenant local:', err);
          }
        }
        
        // 🔥 CRÍTICO: Atualizar também o TenantContext imediatamente
        try {
          // O TenantContext já escuta o evento 'tenant-updated'
          window.dispatchEvent(new CustomEvent('tenant-changed', { 
            detail: { 
              tenantId: tenant.id, 
              nome: data.nome,
              cnpj: cnpjLimpo 
            } 
          }));
        } catch (err) {
          console.warn('[Step1] ⚠️ Erro ao disparar evento tenant-changed:', err);
        }
      }
      
      // 🔥 CICLO 1: Criar tenant + sessão atomicamente (PADRÃO GRANDES PLATAFORMAS)
      if (!tenant?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant.id)) {
        try {
          console.log('[Step1] 🚀 CICLO 1: Criando tenant + sessão atomicamente...');
          const { onboardingService } = await import('@/services/onboarding.service');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (!authUser) {
            throw new Error('Usuário não autenticado');
          }

          if (!data.nome) {
            throw new Error('Razão social é obrigatória');
          }

          // CRIAR TENANT + SESSÃO ATOMICAMENTE
          const { tenant: novoTenant, session } = await onboardingService.createTenantWithSession(
            {
              cnpjData: data,
              formData: {
                cnpj: formData.cnpj,
                email: updatedFormData.email || '',
                telefone: updatedFormData.telefone || '',
                website: updatedFormData.website || '',
                razaoSocial: data.nome,
              },
            },
            authUser.id
          );

          console.log('[Step1] ✅ CICLO 1 COMPLETO: Tenant + Sessão criados:', {
            tenantId: novoTenant.id,
            sessionId: session.id,
          });

          // ATUALIZAR CONTEXTO IMEDIATAMENTE
          localStorage.setItem('selectedTenantId', novoTenant.id);
          window.dispatchEvent(new CustomEvent('tenant-switched', { 
            detail: { 
              tenantId: novoTenant.id,
              tenant: novoTenant
            } 
          }));

          // Atualizar contexto via hook
          await switchTenant(novoTenant.id);
          console.log('[Step1] ✅ Contexto atualizado, tenant visível na tela');

          // Toast de sucesso
          toast.success('Empresa criada com sucesso!', {
            description: 'Dados salvos no banco de dados.'
          });
        } catch (err: any) {
          console.error('[Step1] ❌ Erro ao criar tenant + sessão:', err);
          toast.error('Erro ao criar empresa', {
            description: err.message || 'Não foi possível criar a empresa. Tente novamente.'
          });
        }
      }
      
      // 🔥 CRÍTICO: Salvar IMEDIATAMENTE após buscar CNPJ para garantir persistência
      if (onSave) {
        const dataToSave = {
          ...updatedFormData,
          razaoSocial: data.nome || '',
          nomeFantasia: data.fantasia || '',
          situacaoCadastral: data.situacao || '',
          dataAbertura: data.abertura || '',
          naturezaJuridica: data.natureza_juridica || '',
          capitalSocial: data.capital_social || null,
          porteEmpresa: data.porte || '',
          endereco: data.logradouro ? {
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cep: data.cep || '',
            cidade: data.municipio || '',
            estado: data.uf || '',
          } : null,
          cnaes: data.atividade_principal ? [
            data.atividade_principal[0]?.code,
            ...(data.atividades_secundarias || []).map((a: any) => a.code)
          ].filter(Boolean) : [],
          cnpjData: data, // 🔥 CRÍTICO: Salvar cnpjData completo
          concorrentesDiretos: concorrentes.length > 0 ? concorrentes : (initialData?.concorrentesDiretos || []),
        };
        await onSave(dataToSave);
        console.log('[Step1] ✅ Dados salvos após buscar CNPJ:', dataToSave);
      }
    } catch (error: any) {
      setCnpjError(error.message || 'Erro ao buscar dados do CNPJ');
    } finally {
      setLoadingCNPJ(false);
    }
  };

  // 🔥 CORRIGIDO: Usar scan-website-products para o tenant (salva em tenant_products)
  const handleScanTenantWebsite = async () => {
    if (!formData.website || !tenant?.id) {
      toast.error('Informe a URL para escanear');
      return;
    }

    // 🔥 NOVO: Verificar se o tenant é UUID válido (não é local)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenant.id);
    if (!isUUID) {
      toast.error('Aguarde a criação do tenant no banco de dados antes de extrair produtos', {
        description: 'O tenant ainda está sendo criado. Tente novamente em alguns segundos.'
      });
      return;
    }

    setScanningTenantWebsite(true);
    // 🔥 NOVO: Marcar como extraindo
    setExtractionStatus(prev => ({ ...prev, tenant: 'extracting' }));
    toast.info(`Escaneando ${formData.website}...`);

    try {
      console.log('[Step1] 🔍 Escaneando website do tenant:', formData.website);

      // 🔥 CORRIGIDO: Usar scan-website-products (salva em tenant_products)
      const { data, error } = await supabase.functions.invoke('scan-website-products', {
        body: {
          tenant_id: tenant.id,
          website_url: formData.website,
        },
      });

      if (error) {
        console.error('[Step1] ❌ Erro na Edge Function scan-website-products:', error);
        // 🔥 NOVO: Tratar erro CORS ou de rede
        if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
          toast.error('Erro de conexão com o servidor', {
            description: 'Verifique sua conexão ou tente novamente em alguns instantes.'
          });
        } else {
          throw error;
        }
        return;
      }

      console.log('[Step1] ✅ Resposta da Edge Function:', data);

      const extracted = data?.products_extracted || data?.products_found || 0;
      const inserted = data?.products_inserted || 0;
      
      console.log('[Step1] ✅ Resposta da Edge Function:', { 
        success: data?.success, 
        domain: data?.domain, 
        pages_scanned: data?.pages_scanned, 
        products_found: extracted, 
        products_inserted: inserted 
      });
      
      // 🔥 CRÍTICO: Aguardar mais tempo para garantir que os dados foram salvos no banco
      // A Edge Function pode estar processando em background
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 🔥 CRÍTICO: Recarregar produtos múltiplas vezes para garantir que apareçam
      let tentativas = 0;
      const maxTentativas = 3;
      let produtosCarregados = 0;
      
      while (tentativas < maxTentativas && produtosCarregados === 0) {
        console.log(`[Step1] 🔄 Tentativa ${tentativas + 1}/${maxTentativas} de recarregar produtos...`);
        await loadTenantProducts();
        
        // Aguardar um pouco antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se produtos foram carregados
        produtosCarregados = tenantProductsCount;
        tentativas++;
        
        if (produtosCarregados > 0) {
          console.log(`[Step1] ✅ Produtos carregados após ${tentativas} tentativa(s): ${produtosCarregados}`);
          break;
        }
      }
      
      // Buscar contador atualizado
      const totalProdutos = tenantProductsCount;
      
      // 🔥 NOVO: Marcar como sucesso
      setExtractionStatus(prev => ({ ...prev, tenant: 'success' }));
      
      // Limpar status após 3 segundos
      setTimeout(() => {
        setExtractionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus.tenant;
          return newStatus;
        });
      }, 3000);
      
      // Salvar atualização
      if (onSave) {
        const dataToSave = {
          ...formData,
        };
        onSave(dataToSave);
      }

      // 🔥 CRÍTICO: Se produtos foram encontrados mas não inseridos, verificar se é problema de RLS ou duplicatas
      if (extracted > 0 && inserted === 0 && totalProdutos === 0) {
        console.warn('[Step1] ⚠️ Produtos encontrados mas não inseridos. Verificando se é problema de RLS ou duplicatas...');
        toast.warning(`${extracted} produtos encontrados, mas não foram inseridos`, {
          description: 'Pode ser problema de permissões ou produtos duplicados. Verifique os logs da Edge Function.',
          duration: 10000,
        });
      } else if (inserted > 0) {
        toast.success(`${inserted} novos produtos inseridos! Total: ${totalProdutos} produtos`, {
          description: `${extracted} produtos encontrados na URL`
        });
      } else if (extracted > 0 && totalProdutos > 0) {
        toast.info(`${extracted} produtos encontrados, mas já estavam cadastrados. Total: ${totalProdutos} produtos`);
      } else if (extracted > 0) {
        toast.warning(`${extracted} produtos encontrados, mas não foram inseridos`, {
          description: 'Verifique os logs da Edge Function para mais detalhes',
          duration: 10000,
        });
      } else {
        toast.warning('Nenhum produto encontrado na URL', {
          description: 'Tente uma URL diferente ou verifique se o site contém informações de produtos'
        });
      }
    } catch (err: any) {
      console.error('Erro ao escanear URL:', err);
      // 🔥 NOVO: Marcar como erro
      setExtractionStatus(prev => ({ ...prev, tenant: 'error' }));
      setTimeout(() => {
        setExtractionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus.tenant;
          return newStatus;
        });
      }, 5000);
      toast.error('Erro ao escanear URL', { description: err.message });
    } finally {
      setScanningTenantWebsite(false);
    }
  };

  // 🔥 NOVO: Extração em massa de produtos (tenant + todos os concorrentes)
  const handleBulkExtractProducts = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não identificado');
      return;
    }

    setBulkExtracting(true);
    
    // Lista de tarefas de extração
    const extractionTasks: Array<{ type: 'tenant' | 'competitor'; index?: number; name: string; url: string; cnpj?: string }> = [];
    
    // Adicionar tenant se tiver website
    if (formData.website?.trim()) {
      extractionTasks.push({
        type: 'tenant',
        name: cnpjData?.nome || 'Tenant',
        url: formData.website.trim(),
        cnpj: formData.cnpj?.replace(/\D/g, '') || '',
      });
    }
    
    // Adicionar concorrentes que têm URL para scan
    concorrentes.forEach((conc, index) => {
      if (conc.urlParaScan?.trim()) {
        extractionTasks.push({
          type: 'competitor',
          index,
          name: conc.razaoSocial || conc.nomeFantasia || 'Concorrente',
          url: conc.urlParaScan.trim(),
          cnpj: conc.cnpj.replace(/\D/g, ''),
        });
      }
    });
    
    if (extractionTasks.length === 0) {
      toast.warning('Nenhuma URL configurada para extração', {
        description: 'Configure o website do tenant ou URLs dos concorrentes'
      });
      setBulkExtracting(false);
      return;
    }
    
    setBulkProgress({ current: 0, total: extractionTasks.length });
    
    // 🔥 NOVO: Inicializar status de todos como 'pending'
    const initialStatus: Record<string, 'pending' | 'extracting' | 'success' | 'error'> = {};
    extractionTasks.forEach(task => {
      const key = task.type === 'tenant' ? 'tenant' : `competitor_${task.cnpj}`;
      initialStatus[key] = 'pending';
    });
    setExtractionStatus(initialStatus);
    
    toast.info(`Iniciando extração em massa de ${extractionTasks.length} ${extractionTasks.length === 1 ? 'fonte' : 'fontes'}...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Executar extrações em paralelo (mas limitado a 5 simultâneas para não sobrecarregar)
    const batchSize = 5;
    for (let i = 0; i < extractionTasks.length; i += batchSize) {
      const batch = extractionTasks.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (task) => {
          const statusKey = task.type === 'tenant' ? 'tenant' : `competitor_${task.cnpj}`;
          
          // Marcar como extraindo
          setExtractionStatus(prev => ({ ...prev, [statusKey]: 'extracting' }));
          
          try {
            let extracted = 0;
            let inserted = 0;
            
            // 🔥 CORRIGIDO: Usar função diferente para tenant vs concorrente
            if (task.type === 'tenant') {
              // Para tenant: usar scan-website-products (salva em tenant_products)
              console.log('[Step1] 🔍 Extraindo produtos do tenant via scan-website-products');
              const { data, error } = await supabase.functions.invoke('scan-website-products', {
                body: {
                  tenant_id: tenant.id,
                  website_url: task.url,
                },
              });
              
              if (error) throw error;
              
              extracted = data?.products_extracted || data?.products_found || 0;
              inserted = data?.products_inserted || 0;
              
              // Atualizar produtos do tenant
              await new Promise(resolve => setTimeout(resolve, 1000));
              await loadTenantProducts();
            } else {
              // Para concorrentes: usar scan-competitor-url (salva em tenant_competitor_products)
              console.log('[Step1] 🔍 Extraindo produtos do concorrente via scan-competitor-url');
              
              // Detectar tipo de URL
              let sourceType = 'website';
              if (task.url.includes('instagram.com')) sourceType = 'instagram';
              else if (task.url.includes('linkedin.com')) sourceType = 'linkedin';
              else if (task.url.includes('facebook.com')) sourceType = 'facebook';
              
              const { data, error } = await supabase.functions.invoke('scan-competitor-url', {
                body: {
                  tenant_id: tenant.id,
                  competitor_cnpj: task.cnpj || '00000000000000',
                  competitor_name: task.name,
                  source_url: task.url,
                  source_type: sourceType,
                },
              });
              
              if (error) throw error;
              
              extracted = data?.products_extracted || 0;
              inserted = data?.products_inserted || 0;
              
              console.log('[Step1] ✅ Resposta da Edge Function (concorrente em massa):', { 
                competitor_name: task.name,
                products_found: extracted, 
                products_inserted: inserted 
              });
              
              // 🔥 CRÍTICO: Aguardar mais tempo e recarregar múltiplas vezes
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Atualizar produtos do concorrente específico
              if (task.index !== undefined) {
                // Recarregar produtos múltiplas vezes
                let tentativas = 0;
                const maxTentativas = 3;
                while (tentativas < maxTentativas) {
                  await loadCompetitorProducts(task.cnpj || '');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  tentativas++;
                  
                  // Verificar se produtos foram carregados
                  const { data: produtosData } = await supabase
                    .from('tenant_competitor_products' as any)
                    .select('id, nome, descricao, categoria')
                    .eq('tenant_id', tenant.id)
                    .eq('competitor_cnpj', task.cnpj)
                    .order('created_at', { ascending: false });
                  
                  if (produtosData && produtosData.length > 0) {
                    console.log(`[Step1] ✅ Produtos do concorrente carregados após ${tentativas} tentativa(s): ${produtosData.length}`);
                    break;
                  }
                }
                
                // Buscar produtos atualizados (última tentativa)
                const { data: produtosData } = await supabase
                  .from('tenant_competitor_products' as any)
                  .select('id, nome, descricao, categoria')
                  .eq('tenant_id', tenant.id)
                  .eq('competitor_cnpj', task.cnpj)
                  .order('created_at', { ascending: false });
                
                const updated = [...concorrentes];
                updated[task.index] = {
                  ...updated[task.index],
                  produtos: (produtosData || []) as unknown as Array<{ id: string; nome: string; descricao?: string; categoria?: string }>,
                  produtosExtraidos: produtosData?.length || 0
                };
                setConcorrentes(updated);
              }
            }
            
            successCount++;
            setBulkProgress(prev => ({ ...prev, current: prev.current + 1 }));
            
            // 🔥 NOVO: Marcar como sucesso
            setExtractionStatus(prev => ({ ...prev, [statusKey]: 'success' }));
            
            console.log(`[Step1] ✅ Extração concluída: ${task.name} - ${inserted} produtos inseridos`);
          } catch (err: any) {
            errorCount++;
            setBulkProgress(prev => ({ ...prev, current: prev.current + 1 }));
            
            // 🔥 NOVO: Marcar como erro
            setExtractionStatus(prev => ({ ...prev, [statusKey]: 'error' }));
            
            console.error(`[Step1] ❌ Erro ao extrair de ${task.name}:`, err);
          }
        })
      );
    }
    
    // Salvar atualização final
    if (onSave) {
      const dataToSave = {
        ...formData,
        cnpjData: cnpjData || initialData?.cnpjData || null,
        concorrentesDiretos: concorrentes,
      };
      await onSave(dataToSave);
    }
    
    setBulkExtracting(false);
    setBulkProgress({ current: 0, total: 0 });
    
    // 🔥 NOVO: Limpar status após 5 segundos (para não ficar sempre visível)
    setTimeout(() => {
      setExtractionStatus({});
    }, 5000);
    
    // Toast final
    if (successCount > 0) {
      toast.success(`Extração em massa concluída!`, {
        description: `${successCount} ${successCount === 1 ? 'fonte processada' : 'fontes processadas'}${errorCount > 0 ? `, ${errorCount} ${errorCount === 1 ? 'erro' : 'erros'}` : ''}`,
        duration: 5000,
      });
    } else {
      toast.error('Nenhuma extração foi bem-sucedida', {
        description: 'Verifique as URLs e tente novamente'
      });
    }
  };

  // 🔥 NOVO: Buscar dados do CNPJ do concorrente
  // 🔥 NOVO: Processar texto colado para extrair CNPJs
  const processarCNPJsColados = (texto: string): string[] => {
    // Separar por quebras de linha, vírgulas, ponto e vírgula, ou espaços
    const itens = texto
      .split(/[\n\r]+|[;,]\s*|\s{2,}/)
      .map(item => item.trim().replace(/\D/g, '')) // Remover formatação e manter apenas números
      .filter(item => item.length === 14); // Apenas CNPJs válidos (14 dígitos)
    return itens;
  };

  // 🔥 NOVO: Adicionar múltiplos concorrentes em massa
  const adicionarConcorrentesEmMassa = async (cnpjs: string[]) => {
    if (cnpjs.length === 0) return;
    
    toast.info(`Processando ${cnpjs.length} CNPJ(s)...`);
    
    let sucesso = 0;
    let erros = 0;
    const novosConcorrentes: ConcorrenteDireto[] = [];
    
    for (const cnpjClean of cnpjs) {
      // Verificar se já existe
      if (concorrentes.some(c => c.cnpj.replace(/\D/g, '') === cnpjClean)) {
        continue; // Pular duplicatas
      }
      
      try {
        const result = await consultarReceitaFederal(cnpjClean);
        
        if (!result.success || !result.data) {
          erros++;
          continue;
        }

        const data = result.data;
        
        // Extrair setor do CNAE
        let setorExtraido = '';
        if (data.atividade_principal?.[0]?.code) {
          const cnaeCode = data.atividade_principal[0].code.replace(/\D/g, '');
          const secao = cnaeCode.substring(0, 1);
          const setores: Record<string, string> = {
            '1': 'Agricultura', '2': 'Indústria', '3': 'Indústria',
            '4': 'Energia', '5': 'Construção', '6': 'Comércio',
            '7': 'Transporte', '8': 'Serviços', '9': 'Serviços'
          };
          setorExtraido = setores[secao] || 'Outros';
        }

        // Formatar CNPJ
        let cnpjFormatado = cnpjClean;
        if (cnpjClean.length === 14) {
          cnpjFormatado = `${cnpjClean.substring(0, 2)}.${cnpjClean.substring(2, 5)}.${cnpjClean.substring(5, 8)}/${cnpjClean.substring(8, 12)}-${cnpjClean.substring(12, 14)}`;
        }

        // 🔥 NOVO: Se só tem CEP mas falta endereço, buscar no ViaCEP
        let enderecoEnriquecido = {
          cep: data.cep || '',
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          numero: data.numero || '',
        };

        if (data.cep && !data.logradouro) {
          try {
            const viaCepResponse = await fetch(`https://viacep.com.br/ws/${data.cep.replace(/\D/g, '')}/json/`);
            const viaCepData = await viaCepResponse.json();
            
            if (!viaCepData.erro) {
              enderecoEnriquecido = {
                cep: viaCepData.cep,
                endereco: viaCepData.logradouro || data.logradouro || '',
                bairro: viaCepData.bairro || data.bairro || '',
                numero: data.numero || '',
              };
            }
          } catch (viaCepError) {
            console.warn('[Step1] ⚠️ Erro ao buscar ViaCEP:', viaCepError);
          }
        }

        novosConcorrentes.push({
          cnpj: cnpjFormatado,
          razaoSocial: data.nome || data.fantasia || '',
          nomeFantasia: data.fantasia || '',
          setor: setorExtraido,
          cidade: data.municipio || '',
          estado: data.uf || '',
          capitalSocial: (data as any).capital_social || 0,
          cnaePrincipal: data.atividade_principal?.[0]?.code || '',
          cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
          website: '',
          urlParaScan: '',
          cep: enderecoEnriquecido.cep,
          endereco: enderecoEnriquecido.endereco,
          bairro: enderecoEnriquecido.bairro,
          numero: enderecoEnriquecido.numero,
        });
        
        sucesso++;
      } catch (error) {
        console.error(`[Step1] Erro ao buscar CNPJ ${cnpjClean}:`, error);
        erros++;
      }
    }
    
    if (novosConcorrentes.length > 0) {
      const updatedConcorrentes = [...concorrentes, ...novosConcorrentes];
      setConcorrentes(updatedConcorrentes);
      
      // Salvar imediatamente
      if (onSave) {
        const dataToSave = {
          ...formData,
          concorrentesDiretos: updatedConcorrentes,
        };
        onSave(dataToSave);
      }
      
      toast.success(`${sucesso} concorrente(s) adicionado(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ''}`);
    } else if (erros > 0) {
      toast.error(`Nenhum concorrente adicionado. ${erros} erro(s) encontrado(s).`);
    }
  };

  // 🔥 NOVO: Handler para paste de CNPJs
  const handlePasteCNPJ = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const texto = e.clipboardData.getData('text');
    const cnpjs = processarCNPJsColados(texto);
    
    // Se tiver mais de 1 CNPJ, é uma lista - processar em massa
    if (cnpjs.length > 1) {
      e.preventDefault(); // Impedir paste normal
      await adicionarConcorrentesEmMassa(cnpjs);
      setNovoConcorrente({
        cnpj: '',
        razaoSocial: '',
        nomeFantasia: '',
        setor: '',
        cidade: '',
        estado: '',
        capitalSocial: 0,
        cnaePrincipal: '',
        cnaePrincipalDescricao: '',
        website: '',
        urlParaScan: '',
        cep: '', // 🔥 RESET CEP
        endereco: '', // 🔥 RESET Endereço
        bairro: '', // 🔥 RESET Bairro
        numero: '', // 🔥 RESET Número
      });
      setCnpjConcorrenteEncontrado(false);
      setDadosConcorrenteOpen(false); // 🔥 FECHAR card verde
    }
    // Se for só 1 CNPJ, deixar o paste normal acontecer
  };

  const buscarDadosCNPJConcorrente = async (cnpjClean: string) => {
    setBuscandoCNPJConcorrente(true);
    setErroCNPJConcorrente(null);
    setCnpjConcorrenteEncontrado(false);

    try {
      const result = await consultarReceitaFederal(cnpjClean);
      
      if (!result.success || !result.data) {
        setErroCNPJConcorrente(result.error || 'Erro ao buscar dados do CNPJ');
        return;
      }

      const data = result.data;
      
      // Extrair setor do CNAE
      let setorExtraido = '';
      if (data.atividade_principal?.[0]?.code) {
        const cnaeCode = data.atividade_principal[0].code.replace(/\D/g, '');
        const secao = cnaeCode.substring(0, 1);
        const setores: Record<string, string> = {
          '1': 'Agricultura', '2': 'Indústria', '3': 'Indústria',
          '4': 'Energia', '5': 'Construção', '6': 'Comércio',
          '7': 'Transporte', '8': 'Serviços', '9': 'Serviços'
        };
        setorExtraido = setores[secao] || 'Outros';
      }

      // 🔥 NOVO: Se só tem CEP mas falta endereço, buscar no ViaCEP
      let enderecoEnriquecido = {
        cep: data.cep || '',
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        numero: data.numero || '',
      };

      if (data.cep && !data.logradouro) {
        console.log('[Step1] 🔍 Buscando endereço no ViaCEP para CEP:', data.cep);
        try {
          const viaCepResponse = await fetch(`https://viacep.com.br/ws/${data.cep.replace(/\D/g, '')}/json/`);
          const viaCepData = await viaCepResponse.json();
          
          if (!viaCepData.erro) {
            enderecoEnriquecido = {
              cep: viaCepData.cep,
              endereco: viaCepData.logradouro || data.logradouro || '',
              bairro: viaCepData.bairro || data.bairro || '',
              numero: data.numero || '',
            };
            console.log('[Step1] ✅ Endereço enriquecido via ViaCEP:', enderecoEnriquecido);
          }
        } catch (viaCepError) {
          console.warn('[Step1] ⚠️ Erro ao buscar ViaCEP:', viaCepError);
        }
      }

      setNovoConcorrente({
        cnpj: novoConcorrente.cnpj,
        razaoSocial: data.nome || data.fantasia || '',
        nomeFantasia: data.fantasia || '',
        setor: setorExtraido,
        cidade: data.municipio || '',
        estado: data.uf || '',
        capitalSocial: (data as any).capital_social ? parseFloat(String((data as any).capital_social).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        cnaePrincipal: data.atividade_principal?.[0]?.code || '',
        cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
        website: novoConcorrente.website || '',
        urlParaScan: novoConcorrente.urlParaScan || '',
        cep: enderecoEnriquecido.cep,
        endereco: enderecoEnriquecido.endereco,
        bairro: enderecoEnriquecido.bairro,
        numero: enderecoEnriquecido.numero,
      });

      setCnpjConcorrenteEncontrado(true);
    } catch (error: any) {
      setErroCNPJConcorrente(error.message || 'Erro ao buscar dados do CNPJ');
    } finally {
      setBuscandoCNPJConcorrente(false);
    }
  };

  // 🔥 NOVO: Busca automática quando CNPJ tem 14 dígitos
  useEffect(() => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    
    if (cnpjClean.length === 14 && !buscandoCNPJConcorrente && cnpjClean !== cnpjConcorrenteUltimoBuscadoRef.current) {
      cnpjConcorrenteUltimoBuscadoRef.current = cnpjClean;
      buscarDadosCNPJConcorrente(cnpjClean);
    } else if (cnpjClean.length < 14) {
      setCnpjConcorrenteEncontrado(false);
      cnpjConcorrenteUltimoBuscadoRef.current = '';
      setErroCNPJConcorrente(null);
    }
  }, [novoConcorrente.cnpj, buscandoCNPJConcorrente]);

  // 🔥 NOVO: Scan de URL do concorrente
  const handleScanConcorrenteURL = async (concorrente: ConcorrenteDireto, index: number) => {
    if (!concorrente.urlParaScan || !tenant?.id) {
      toast.error('Informe a URL para escanear');
      return;
    }

    setScanningConcorrente(prev => ({ ...prev, [index]: true }));
    // 🔥 NOVO: Marcar como extraindo
    const competitorKey = `competitor_${concorrente.cnpj.replace(/\D/g, '')}`;
    setExtractionStatus(prev => ({ ...prev, [competitorKey]: 'extracting' }));
    toast.info(`Escaneando ${concorrente.urlParaScan}...`);

    try {
      // Detectar tipo de URL
      let sourceType = 'website';
      if (concorrente.urlParaScan.includes('instagram.com')) sourceType = 'instagram';
      else if (concorrente.urlParaScan.includes('linkedin.com')) sourceType = 'linkedin';
      else if (concorrente.urlParaScan.includes('facebook.com')) sourceType = 'facebook';

      // Chamar Edge Function para extrair produtos
      const { data, error } = await supabase.functions.invoke('scan-competitor-url', {
        body: {
          tenant_id: tenant.id,
          competitor_cnpj: concorrente.cnpj.replace(/\D/g, ''),
          competitor_name: concorrente.razaoSocial,
          source_url: concorrente.urlParaScan,
          source_type: sourceType,
        },
      });

      if (error) throw error;

      const extracted = data?.products_extracted || 0;
      const inserted = data?.products_inserted || 0;
      
      console.log('[Step1] ✅ Resposta da Edge Function (concorrente):', { 
        success: data?.success, 
        competitor_name: concorrente.razaoSocial,
        products_found: extracted, 
        products_inserted: inserted 
      });
      
      // 🔥 CRÍTICO: Aguardar mais tempo para garantir que os dados foram salvos no banco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 🔥 CRÍTICO: Recarregar produtos múltiplas vezes para garantir que apareçam
      let tentativas = 0;
      const maxTentativas = 3;
      let produtosCarregados = 0;
      
      while (tentativas < maxTentativas) {
        console.log(`[Step1] 🔄 Tentativa ${tentativas + 1}/${maxTentativas} de recarregar produtos do concorrente...`);
        const total = await loadCompetitorProducts(concorrente.cnpj);
        
        // Aguardar um pouco antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se produtos foram carregados
        produtosCarregados = total;
        tentativas++;
        
        if (produtosCarregados > 0) {
          console.log(`[Step1] ✅ Produtos do concorrente carregados após ${tentativas} tentativa(s): ${produtosCarregados}`);
          break;
        }
      }
      
      const totalProdutos = produtosCarregados;
      
      // Buscar dados completos dos produtos para exibição
      let produtosData: any[] = [];
      try {
        const { data, error } = await supabase
          .from('tenant_competitor_products' as any)
          .select('id, nome, descricao, categoria')
          .eq('tenant_id', tenant.id)
          .eq('competitor_cnpj', concorrente.cnpj.replace(/\D/g, ''))
          .order('created_at', { ascending: false });
        
        if (error && (error.code === '42P01' || error.message?.includes('404'))) {
          console.warn('[Step1] Tabela tenant_competitor_products não existe. Aplique a migration 20250201000002_tenant_competitor_products.sql');
          toast.error('Tabela de produtos não encontrada', {
            description: 'Aplique a migration no Supabase para habilitar esta funcionalidade'
          });
        } else if (!error) {
          produtosData = data || [];
        }
      } catch (err: any) {
        console.error('[Step1] Erro ao buscar produtos:', err);
        if (err.message?.includes('404') || err.code === '42P01') {
          toast.error('Tabela de produtos não encontrada', {
            description: 'Aplique a migration no Supabase'
          });
        }
      }
      
      // Atualizar contador e produtos no concorrente
      const updated = [...concorrentes];
      updated[index] = { 
        ...updated[index], 
        produtosExtraidos: totalProdutos, // Usar total do banco, não apenas os inseridos agora
        produtos: (produtosData || []) as unknown as Array<{ id: string; nome: string; descricao?: string; categoria?: string }>
      };
      setConcorrentes(updated);
      
      // 🔥 NOVO: Marcar como sucesso
      setExtractionStatus(prev => ({ ...prev, [competitorKey]: 'success' }));
      
      // Limpar status após 3 segundos
      setTimeout(() => {
        setExtractionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[competitorKey];
          return newStatus;
        });
      }, 3000);
      
      // Salvar atualização
      if (onSave) {
        const dataToSave = {
          ...formData,
          concorrentesDiretos: updated,
        };
        onSave(dataToSave);
      }

      // Toast mais informativo
      if (inserted > 0) {
        toast.success(`${inserted} novos produtos inseridos! Total: ${totalProdutos} produtos`, {
          description: `${extracted} produtos encontrados na URL`
        });
      } else if (extracted > 0) {
        toast.info(`${extracted} produtos encontrados, mas já estavam cadastrados. Total: ${totalProdutos} produtos`);
      } else {
        toast.warning('Nenhum produto encontrado na URL', {
          description: 'Tente uma URL diferente ou verifique se o site contém informações de produtos'
        });
      }
    } catch (err: any) {
      console.error('Erro ao escanear URL:', err);
      // 🔥 NOVO: Marcar como erro
      setExtractionStatus(prev => ({ ...prev, [competitorKey]: 'error' }));
      setTimeout(() => {
        setExtractionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[competitorKey];
          return newStatus;
        });
      }, 5000);
      toast.error('Erro ao escanear URL', { description: err.message });
    } finally {
      setScanningConcorrente(prev => ({ ...prev, [index]: false }));
    }
  };

  // 🔥 NOVO: Reprocessar endereços de concorrentes existentes
  const reprocessarEnderecosConcorrentes = async () => {
    if (!tenant?.id) {
      toast.error('Tenant não identificado');
      return;
    }

    // Filtrar concorrentes sem CEP ou endereço
    const concorrentesSemEndereco = concorrentes.filter(
      c => !c.cep || !c.endereco
    );

    if (concorrentesSemEndereco.length === 0) {
      toast.success('✅ Todos os concorrentes já têm endereço completo!', {
        description: 'Nenhuma atualização necessária.'
      });
      return;
    }

    setReprocessandoEnderecos(true);
    
    toast.info(`🔄 Reprocessando ${concorrentesSemEndereco.length} concorrente(s)...`, {
      description: 'Buscando na Receita Federal e ViaCEP...'
    });

    let sucesso = 0;
    let erros = 0;
    const concorrentesAtualizados = [...concorrentes];

    console.log('[Step1] 🔄 Iniciando reprocessamento de endereços:', {
      total: concorrentesSemEndereco.length,
      concorrentes: concorrentesSemEndereco.map(c => ({ cnpj: c.cnpj, razao: c.razaoSocial }))
    });

    for (let i = 0; i < concorrentesSemEndereco.length; i++) {
      const concorrente = concorrentesSemEndereco[i];
      
      // Atualizar toast com progresso
      toast.loading(`🔄 Processando ${i + 1}/${concorrentesSemEndereco.length}: ${concorrente.razaoSocial}`, {
        id: 'reprocessamento'
      });
      
      try {
        const cnpjClean = concorrente.cnpj.replace(/\D/g, '');
        console.log(`[Step1] 📞 Consultando Receita Federal: ${cnpjClean}`);
        const result = await consultarReceitaFederal(cnpjClean);

        if (!result.success || !result.data) {
          erros++;
          continue;
        }

        const data = result.data;

        // Enriquecer com ViaCEP se necessário
        let enderecoEnriquecido = {
          cep: data.cep || concorrente.cep || '',
          endereco: data.logradouro || concorrente.endereco || '',
          bairro: data.bairro || concorrente.bairro || '',
          numero: data.numero || concorrente.numero || '',
        };

        if (data.cep && !data.logradouro) {
          try {
            const viaCepResponse = await fetch(`https://viacep.com.br/ws/${data.cep.replace(/\D/g, '')}/json/`);
            const viaCepData = await viaCepResponse.json();

            if (!viaCepData.erro) {
              enderecoEnriquecido = {
                cep: viaCepData.cep,
                endereco: viaCepData.logradouro || data.logradouro || '',
                bairro: viaCepData.bairro || data.bairro || '',
                numero: data.numero || '',
              };
            }
          } catch (viaCepError) {
            console.warn('[Step1] ⚠️ Erro ao buscar ViaCEP:', viaCepError);
          }
        }

        // Atualizar concorrente no array
        const index = concorrentesAtualizados.findIndex(
          c => c.cnpj.replace(/\D/g, '') === cnpjClean
        );

        if (index !== -1) {
          concorrentesAtualizados[index] = {
            ...concorrentesAtualizados[index],
            ...enderecoEnriquecido,
          };
          sucesso++;
        }
      } catch (error) {
        console.error(`[Step1] Erro ao reprocessar ${concorrente.razaoSocial}:`, error);
        erros++;
      }
    }

    // Atualizar estado e salvar
    toast.dismiss('reprocessamento');
    
    if (sucesso > 0) {
      setConcorrentes(concorrentesAtualizados);

      if (onSave) {
        const dataToSave = {
          ...formData,
          concorrentesDiretos: concorrentesAtualizados,
        };
        await onSave(dataToSave);
      }

      console.log('[Step1] ✅ Reprocessamento concluído:', { sucesso, erros });

      toast.success(`✅ ${sucesso} endereço(s) atualizado(s) com sucesso!`, {
        description: erros > 0 
          ? `${erros} erro(s) - Alguns concorrentes podem ter dados incompletos na Receita Federal` 
          : 'Todos os endereços foram atualizados e salvos no banco!',
        duration: 5000,
      });
    } else {
      toast.error(`❌ Nenhum endereço foi atualizado`, {
        description: `${erros} erro(s) encontrado(s). Verifique se os CNPJs estão corretos.`,
        duration: 5000,
      });
    }

    setReprocessandoEnderecos(false);
  };

  // 🔥 NOVO: Adicionar concorrente
  const adicionarConcorrente = () => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    
    if (!cnpjClean || cnpjClean.length !== 14 || !novoConcorrente.razaoSocial.trim()) {
      toast.error('Preencha o CNPJ e aguarde a busca automática dos dados');
      return;
    }

    if (concorrentes.some(c => c.cnpj.replace(/\D/g, '') === cnpjClean)) {
      toast.error('Este concorrente já foi adicionado');
      return;
    }

    const updatedConcorrentes = [...concorrentes, { ...novoConcorrente }];
    setConcorrentes(updatedConcorrentes);
    
    // 🔥 LOG: Verificar se CEP/endereço estão sendo salvos
    console.log('[Step1] ✅ Adicionando concorrente com endereço:', {
      razaoSocial: novoConcorrente.razaoSocial,
      cep: novoConcorrente.cep,
      endereco: novoConcorrente.endereco,
      bairro: novoConcorrente.bairro,
      numero: novoConcorrente.numero,
    });
    
    // 🔥 CRÍTICO: Salvar imediatamente para persistência
    if (onSave) {
      const dataToSave = {
        ...formData,
        concorrentesDiretos: updatedConcorrentes,
      };
      onSave(dataToSave);
    }
    
    // Limpar formulário (incluindo CEP/endereço)
    setNovoConcorrente({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      setor: '',
      cidade: '',
      estado: '',
      capitalSocial: 0,
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
      website: '',
      urlParaScan: '',
      cep: '', // 🔥 RESET CEP
      endereco: '', // 🔥 RESET Endereço
      bairro: '', // 🔥 RESET Bairro
      numero: '', // 🔥 RESET Número
    });
    setCnpjConcorrenteEncontrado(false);
    setDadosConcorrenteOpen(false); // 🔥 FECHAR card verde
    cnpjConcorrenteUltimoBuscadoRef.current = '';
    
    toast.success('✅ Concorrente adicionado com sucesso!', {
      description: 'CEP e endereço salvos no banco de dados'
    });
  };

  // 🔥 NOVO: Remover concorrente
  const removerConcorrente = (index: number) => {
    const updatedConcorrentes = concorrentes.filter((_, i) => i !== index);
    setConcorrentes(updatedConcorrentes);
    
    // 🔥 CRÍTICO: Salvar imediatamente para persistência
    if (onSave) {
      const dataToSave = {
        ...formData,
        concorrentesDiretos: updatedConcorrentes,
      };
      onSave(dataToSave);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!formData.cnpj || !formData.email) {
      toast.error('Campos obrigatórios', {
        description: 'Preencha CNPJ e Email antes de continuar.',
      });
      return;
    }

    // 🔥 CRÍTICO: OBRIGAR busca de CNPJ antes de avançar (nunca criar tenant sem dados reais)
    if (!cnpjData && !initialData?.razaoSocial && !initialData?.cnpjData) {
      toast.error('CNPJ não encontrado', {
        description: 'Por favor, clique em "Buscar Dados" para consultar a Receita Federal antes de continuar. A empresa só será criada após confirmar os dados.',
      });
      return;
    }
    
    // 🔥 CRÍTICO: Verificar se tem razão social (nome da empresa)
    const razaoSocial = cnpjData?.nome || initialData?.razaoSocial;
    if (!razaoSocial) {
      toast.error('Dados incompletos', {
        description: 'Não foi possível obter a razão social da empresa. Por favor, busque os dados do CNPJ novamente.',
      });
      return;
    }

    // 🔥 CRÍTICO: Salvar antes de avançar
    // 🔥 CRÍTICO: Preservar concorrentes existentes se não houver novos
    const concorrentesParaSalvar = concorrentes.length > 0 
      ? concorrentes 
      : (initialData?.concorrentesDiretos || []);
    
    const dataToSave = {
      ...formData,
      // Dados administrativos (buscados automaticamente)
      razaoSocial: cnpjData?.nome || initialData?.razaoSocial || formData.cnpj,
      nomeFantasia: cnpjData?.fantasia || initialData?.nomeFantasia || '',
      situacaoCadastral: cnpjData?.situacao || initialData?.situacaoCadastral || '',
      dataAbertura: cnpjData?.abertura || initialData?.dataAbertura || '',
      naturezaJuridica: cnpjData?.natureza_juridica || initialData?.naturezaJuridica || '',
      capitalSocial: cnpjData?.capital_social || initialData?.capitalSocial || null,
      porteEmpresa: cnpjData?.porte || initialData?.porteEmpresa || '',
      endereco: cnpjData ? {
        logradouro: cnpjData.logradouro || '',
        numero: cnpjData.numero || '',
        complemento: cnpjData.complemento || '',
        bairro: cnpjData.bairro || '',
        cep: cnpjData.cep || '',
        cidade: cnpjData.municipio || '',
        estado: cnpjData.uf || '',
      } : (initialData?.endereco || null),
      cnaes: cnpjData?.atividade_principal ? [
        cnpjData.atividade_principal[0]?.code,
        ...(cnpjData.atividades_secundarias || []).map((a: any) => a.code)
      ].filter(Boolean) : (initialData?.cnaes || []),
      // 🔥 CRÍTICO: Incluir cnpjData para persistência
      cnpjData: cnpjData || initialData?.cnpjData || null,
      // 🔥 CRÍTICO: Incluir concorrentes (preservar existentes se não houver novos)
      concorrentesDiretos: concorrentesParaSalvar,
    };
    
    // Salvar antes de avançar
    if (onSave) {
      await onSave(dataToSave);
    }
    
    // Avançar para próximo step
    onNext(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          Dados Básicos da Empresa
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Informe os dados principais da sua empresa
        </CardDescription>
      </div>

      {/* CNPJ com Busca Automática */}
      <div>
        <Label htmlFor="cnpj" className="text-foreground">
          CNPJ *
        </Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="cnpj"
            type="text"
            value={formData.cnpj}
            onChange={(e) => {
              // 🔥 CRÍTICO: Usar função de atualização para garantir estado atualizado
              const newCnpj = e.target.value;
              setFormData(prev => ({ ...prev, cnpj: newCnpj }));
              setCnpjData(null);
              setCnpjError(null);
            }}
            placeholder="00.000.000/0000-00"
            className="flex-1"
            required
          />
          <Button
            type="button"
            onClick={handleCNPJSearch}
            disabled={loadingCNPJ || !formData.cnpj}
            className="flex items-center gap-2"
          >
            {loadingCNPJ ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar Dados'
            )}
          </Button>
        </div>
        {cnpjError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cnpjError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Dados Encontrados (Read-Only) - Collapsible */}
      {cnpjData && (
        <Collapsible open={dadosEmpresaOpen} onOpenChange={setDadosEmpresaOpen}>
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-green-900 dark:text-green-100">
                      Dados Encontrados Automaticamente
                    </CardTitle>
                  </div>
                  {dadosEmpresaOpen ? (
                    <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Razão Social:</span>
                <p className="font-medium text-foreground">{cnpjData.nome}</p>
              </div>
              {cnpjData.fantasia && (
                <div>
                  <span className="text-muted-foreground">Nome Fantasia:</span>
                  <p className="font-medium text-foreground">{cnpjData.fantasia}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Situação:</span>
                <p className="font-medium text-foreground">{cnpjData.situacao}</p>
              </div>
              {cnpjData.abertura && (
                <div>
                  <span className="text-muted-foreground">Data de Abertura:</span>
                  <p className="font-medium text-foreground">{cnpjData.abertura}</p>
                </div>
              )}
              {cnpjData.natureza_juridica && (
                <div>
                  <span className="text-muted-foreground">Natureza Jurídica:</span>
                  <p className="font-medium text-foreground">{cnpjData.natureza_juridica}</p>
                </div>
              )}
              {cnpjData.capital_social && (
                <div>
                  <span className="text-muted-foreground">Capital Social:</span>
                  <p className="font-medium text-foreground">R$ {Number(cnpjData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {cnpjData.porte && (
                <div>
                  <span className="text-muted-foreground">Porte:</span>
                  <p className="font-medium text-foreground">{cnpjData.porte}</p>
                </div>
              )}
              {cnpjData.atividade_principal?.[0] && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">CNAE Principal:</span>
                  <p className="font-medium text-foreground">{cnpjData.atividade_principal[0].code} - {cnpjData.atividade_principal[0].text}</p>
                </div>
              )}
              {/* 🔥 NOVO: CEP e Endereço Completo */}
              {cnpjData.cep && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-muted-foreground text-xs">CEP:</span>
                    <p className="font-medium text-foreground">{cnpjData.cep}</p>
                  </div>
                </div>
              )}
              {cnpjData.logradouro && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Endereço Completo:</span>
                  <p className="font-medium text-foreground flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      {cnpjData.logradouro}
                      {cnpjData.numero && `, ${cnpjData.numero}`}
                      {cnpjData.bairro && ` - ${cnpjData.bairro}`}
                      {(cnpjData.municipio || cnpjData.uf) && ` - ${cnpjData.municipio}, ${cnpjData.uf}`}
                    </span>
                  </p>
                </div>
              )}
            </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Campos Manuais */}
      <div>
        <Label htmlFor="email" className="text-foreground">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contato@empresa.com.br"
          className="mt-2"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          O email informado será usado para notificações e recuperação de conta
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website" className="text-foreground">
            Website
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://exemplo.com.br"
              className="flex-1"
            />
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleScanTenantWebsite}
              disabled={scanningTenantWebsite || !formData.website?.trim() || !tenant?.id}
              className="flex items-center gap-2"
              title={!formData.website?.trim() ? 'Informe o website primeiro' : !tenant?.id ? 'Tenant não identificado' : 'Extrair produtos do website'}
            >
              {scanningTenantWebsite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extrair Produtos
                </>
              )}
            </Button>
          </div>
          {tenantProductsCount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <Package className="h-3 w-3" />
              {tenantProductsCount} produtos extraídos
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="telefone" className="text-foreground">
            Telefone
          </Label>
          <Input
            id="telefone"
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="mt-2"
          />
        </div>
      </div>

      {/* 🔥 NOVO: Card de Produtos do Tenant com Collapsible (IGUAL AO CATÁLOGO) */}
      <Separator className="my-6" />
      
      <Collapsible open={tenantProductsOpen} onOpenChange={setTenantProductsOpen}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Seus Produtos ({tenantProductsCount})
              {/* 🔥 NOVO: Indicador de status de extração - MAIOR E MAIS VISÍVEL */}
              {extractionStatus.tenant && (
                <div 
                  className={`h-4 w-4 rounded-full border-2 border-background shadow-lg ${
                    extractionStatus.tenant === 'extracting' ? 'bg-yellow-500 animate-pulse' :
                    extractionStatus.tenant === 'success' ? 'bg-green-500' :
                    extractionStatus.tenant === 'error' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`} 
                  title={
                    extractionStatus.tenant === 'extracting' ? 'Extraindo produtos...' :
                    extractionStatus.tenant === 'success' ? 'Produtos extraídos com sucesso!' :
                    extractionStatus.tenant === 'error' ? 'Erro ao extrair produtos' :
                    'Aguardando extração'
                  }
                />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tenantProductsCount > 0 
                ? `${tenantProductsCount} produtos extraídos do website`
                : 'Nenhum produto encontrado ainda. Clique em "Extrair Produtos" para buscar produtos.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!tenant?.id) {
                  toast.error('Tenant não identificado para recarregar produtos');
                  return;
                }
                console.log('[Step1] 🔄 Botão Recarregar clicado. Tenant:', tenant.id);
                toast.info('Recarregando seus produtos...');
                await loadTenantProducts();
                await new Promise(resolve => setTimeout(resolve, 300));
                console.log('[Step1] ✅ Após recarregar - tenantProducts.length:', tenantProducts.length);
                console.log('[Step1] ✅ Após recarregar - tenantProductsCount:', tenantProductsCount);
                toast.success(`${tenantProducts.length} produtos carregados!`);
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {tenantProductsOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar Produtos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar Produtos
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <Card className="mt-4 border-l-4 border-l-green-500">
            <CardContent className="pt-4">
              {/* Abas: Cards / Tabela - SÓ MOSTRAR SE HOUVER PRODUTOS */}
              {tenantProducts.length > 0 ? (
                <Tabs value={tenantProductsViewMode} onValueChange={(v) => setTenantProductsViewMode(v as 'cards' | 'table')}>
                  <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50">
                    <TabsTrigger value="cards" className="text-xs py-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Cards</TabsTrigger>
                    <TabsTrigger value="table" className="text-xs py-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Tabela</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cards" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                      {tenantProducts.map((produto, prodIdx) => (
                        <Card key={produto.id || prodIdx} className="p-3 border-l-2 border-l-green-500">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{produto.nome}</div>
                            {produto.categoria && (
                              <Badge variant="outline" className="text-xs">
                                {produto.categoria}
                              </Badge>
                            )}
                            {produto.descricao && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {produto.descricao}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="table" className="mt-4">
                    <div className="max-h-96 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Descrição</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tenantProducts.map((produto, prodIdx) => (
                            <TableRow key={produto.id || prodIdx}>
                              <TableCell className="font-medium">{produto.nome}</TableCell>
                              <TableCell>
                                {produto.categoria && (
                                  <Badge variant="outline">{produto.categoria}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {produto.descricao || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="mt-4 p-4 border border-dashed rounded-md text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum produto encontrado ainda.</p>
                  <p className="text-xs mt-1">Use o botão "Extrair Produtos" ao lado do campo Website para buscar produtos automaticamente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* 🔥 NOVO: Catálogo Completo de Produtos do Tenant (Avançado) */}
      <Separator className="my-6" />
      
      <Collapsible open={productsCatalogOpen} onOpenChange={setProductsCatalogOpen}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo de Produtos
            </h3>
            <p className="text-sm text-muted-foreground">
              Gerencie seus produtos para cálculo de FIT com prospects. Cadastre manualmente ou extraia do website.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              {productsCatalogOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar Catálogo
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Abrir Catálogo
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <TenantProductsCatalog websiteUrl={formData.website} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* 🔥 NOVO: Seção de Concorrentes */}
      <Separator className="my-6" />
      
      <div>
        {/* 🔥 ALERTA GLOBAL: Concorrentes sem endereço */}
        {concorrentes.length > 0 && concorrentes.some(c => !c.cep || !c.endereco) && (
          <Alert className="mb-4 border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="bg-yellow-500 rounded-full p-2">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                  ⚠️ {concorrentes.filter(c => !c.cep || !c.endereco).length} concorrente(s) sem endereço completo
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200 mt-1.5">
                  O mapa e as análises precisam de endereços completos para funcionar corretamente.
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={reprocessarEnderecosConcorrentes}
                    disabled={reprocessandoEnderecos}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {reprocessandoEnderecos ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando endereços...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        🔄 Atualizar TODOS os Endereços Agora
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-yellow-700 dark:text-yellow-300">
                    ⚡ Automático via Receita Federal + ViaCEP
                  </span>
                </div>
              </div>
            </div>
          </Alert>
        )}
        
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-semibold text-foreground">🏆 Meus Concorrentes</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre seus concorrentes para análise competitiva. O CNPJ busca dados automaticamente.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 🔥 NOVO: Botão de Extração em Massa */}
            {(formData.website?.trim() || concorrentes.some(c => c.urlParaScan?.trim())) && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleBulkExtractProducts}
                disabled={bulkExtracting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {bulkExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {bulkProgress.total > 0 
                      ? `Extraindo... (${bulkProgress.current}/${bulkProgress.total})`
                      : 'Extraindo...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extrair Produtos em Massa
                  </>
                )}
              </Button>
            )}
            {concorrentes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newState = !allExpanded;
                  setAllExpanded(newState);
                  const newExpanded: Record<number, boolean> = {};
                  concorrentes.forEach((_, idx) => {
                    newExpanded[idx] = newState;
                  });
                  setExpandedCards(newExpanded);
                }}
                className="flex items-center gap-2"
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Fechar Todos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Abrir Todos
                  </>
                )}
              </Button>
            )}
            {/* 🔥 NOVO: Botão para reprocessar endereços */}
            {concorrentes.some(c => !c.cep || !c.endereco) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reprocessarEnderecosConcorrentes}
                disabled={reprocessandoEnderecos}
                className="flex items-center gap-2 border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
              >
                {reprocessandoEnderecos ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reprocessando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Atualizar Endereços
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={adicionarConcorrente}
              disabled={!cnpjConcorrenteEncontrado}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Concorrente
            </Button>
          </div>
        </div>

        {/* Formulário de Novo Concorrente */}
        <Card className="mb-4 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>CNPJ do Concorrente</Label>
              <Input
                value={novoConcorrente.cnpj}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  let formatted = clean;
                  if (clean.length > 2) formatted = clean.substring(0, 2) + '.' + clean.substring(2);
                  if (clean.length > 5) formatted = formatted.substring(0, 6) + '.' + clean.substring(5);
                  if (clean.length > 8) formatted = formatted.substring(0, 10) + '/' + clean.substring(8);
                  if (clean.length > 12) formatted = formatted.substring(0, 15) + '-' + clean.substring(12);
                  setNovoConcorrente({ ...novoConcorrente, cnpj: formatted });
                }}
                onPaste={handlePasteCNPJ}
                placeholder="00.000.000/0000-00 ou cole múltiplos CNPJs (um por linha)"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Dica: Cole múltiplos CNPJs separados por linha, vírgula ou ponto e vírgula para adicionar em massa
              </p>
              {buscandoCNPJConcorrente && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando dados...
                </p>
              )}
              {cnpjConcorrenteEncontrado && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dados encontrados! Preencha a URL e clique em "Adicionar Concorrente"
                </p>
              )}
              {erroCNPJConcorrente && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{erroCNPJConcorrente}</p>
              )}
            </div>

            {/* Dados Encontrados - Card Completo - Collapsible */}
            {cnpjConcorrenteEncontrado && (
              <Collapsible open={dadosConcorrenteOpen} onOpenChange={setDadosConcorrenteOpen}>
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <CardTitle className="text-green-900 dark:text-green-100 text-base">
                            Dados Encontrados Automaticamente
                          </CardTitle>
                        </div>
                        {dadosConcorrenteOpen ? (
                          <ChevronUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Razão Social:</span>
                      <p className="font-medium text-foreground">{novoConcorrente.razaoSocial}</p>
                    </div>
                    {novoConcorrente.nomeFantasia && (
                      <div>
                        <span className="text-muted-foreground">Nome Fantasia:</span>
                        <p className="font-medium text-foreground">{novoConcorrente.nomeFantasia}</p>
                      </div>
                    )}
                    {novoConcorrente.setor && (
                      <div>
                        <span className="text-muted-foreground">Setor:</span>
                        <p className="font-medium text-foreground">{novoConcorrente.setor}</p>
                      </div>
                    )}
                    {(novoConcorrente.cidade || novoConcorrente.estado) && (
                      <div>
                        <span className="text-muted-foreground">Localização:</span>
                        <p className="font-medium text-foreground">
                          {novoConcorrente.cidade}{novoConcorrente.cidade && novoConcorrente.estado ? ', ' : ''}{novoConcorrente.estado}
                        </p>
                      </div>
                    )}
                    {novoConcorrente.capitalSocial > 0 && (
                      <div>
                        <span className="text-muted-foreground">Capital Social:</span>
                        <p className="font-medium text-foreground">
                          R$ {novoConcorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {novoConcorrente.cnaePrincipal && (
                      <div>
                        <span className="text-muted-foreground">CNAE Principal:</span>
                        <p className="font-mono text-xs text-foreground">{novoConcorrente.cnaePrincipal}</p>
                      </div>
                    )}
                    {novoConcorrente.cnaePrincipalDescricao && (
                      <div className="col-span-2 md:col-span-3">
                        <span className="text-muted-foreground">Descrição CNAE:</span>
                        <p className="text-xs text-foreground">{novoConcorrente.cnaePrincipalDescricao}</p>
                      </div>
                    )}
                    {/* 🔥 NOVO: CEP e Endereço Completo */}
                    {novoConcorrente.cep && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <span className="text-muted-foreground text-xs">CEP:</span>
                          <p className="font-medium text-foreground">{novoConcorrente.cep}</p>
                        </div>
                      </div>
                    )}
                    {novoConcorrente.endereco && (
                      <div className="col-span-2 md:col-span-3">
                        <span className="text-muted-foreground text-xs">Endereço Completo:</span>
                        <p className="font-medium text-foreground flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span>
                            {novoConcorrente.endereco}
                            {novoConcorrente.numero && `, ${novoConcorrente.numero}`}
                            {novoConcorrente.bairro && ` - ${novoConcorrente.bairro}`}
                            {(novoConcorrente.cidade || novoConcorrente.estado) && ` - ${novoConcorrente.cidade}, ${novoConcorrente.estado}`}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* URL para Scan */}
                  <div className="mt-4 space-y-2">
                    <Label>URL para Scan (Website, Instagram, LinkedIn)</Label>
                    <Input
                      value={novoConcorrente.urlParaScan || ''}
                      onChange={(e) => setNovoConcorrente({ ...novoConcorrente, urlParaScan: e.target.value })}
                      placeholder="https://exemplo.com.br ou instagram.com/empresa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe a URL para extrair produtos automaticamente
                    </p>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Lista de Concorrentes Cadastrados */}
        {concorrentes.length > 0 && (
          <div className="space-y-3">
            {concorrentes.map((concorrente, index) => {
              const isExpanded = expandedCards[index] ?? false;
              return (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Cabeçalho com Nome e Botão Dropdown */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-foreground text-lg truncate">
                                  {concorrente.razaoSocial}
                                </div>
                                {/* 🔥 NOVO: Indicador de status de extração - AO LADO DO NOME (MAIS VISÍVEL) */}
                                {extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] && (
                                  <div 
                                    className={`h-4 w-4 rounded-full border-2 border-background shadow-lg flex-shrink-0 ${
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'extracting' ? 'bg-yellow-500 animate-pulse' :
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'success' ? 'bg-green-500' :
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'error' ? 'bg-red-500' :
                                      'bg-gray-400'
                                    }`} 
                                    title={
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'extracting' ? 'Extraindo produtos...' :
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'success' ? 'Produtos extraídos com sucesso!' :
                                      extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] === 'error' ? 'Erro ao extrair produtos' :
                                      'Aguardando extração'
                                    }
                                  />
                                )}
                                {/* 🔥 NOVO: Indicador permanente se tiver produtos extraídos (só mostra se não estiver em processo) */}
                                {!extractionStatus[`competitor_${concorrente.cnpj.replace(/\D/g, '')}`] && concorrente.produtosExtraidos && concorrente.produtosExtraidos > 0 && (
                                  <div 
                                    className="h-4 w-4 rounded-full bg-green-500 border-2 border-background shadow-lg flex-shrink-0" 
                                    title={`${concorrente.produtosExtraidos} produtos extraídos`}
                                  />
                                )}
                              </div>
                              {concorrente.nomeFantasia && (
                                <div className="text-sm text-muted-foreground">{concorrente.nomeFantasia}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                            onClick={() => {
                              setExpandedCards(prev => ({
                                ...prev,
                                [index]: !prev[index]
                              }));
                              setAllExpanded(false);
                            }}
                            className="flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Fechar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Abrir
                              </>
                            )}
                          </Button>
                          </div>
                        </div>
                      
                      {/* Dados Completos - Grid (Colapsável) */}
                      {isExpanded && (
                        <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">CNPJ:</span>
                          <div className="font-mono text-foreground">{concorrente.cnpj}</div>
                        </div>
                        {concorrente.setor && (
                          <div>
                            <span className="font-medium text-muted-foreground">Setor:</span>
                            <div className="text-foreground">{concorrente.setor}</div>
                          </div>
                        )}
                        {(concorrente.cidade || concorrente.estado) && (
                          <div>
                            <span className="font-medium text-muted-foreground">Localização:</span>
                            <div className="text-foreground">
                              {concorrente.cidade}{concorrente.cidade && concorrente.estado ? ', ' : ''}{concorrente.estado}
                            </div>
                          </div>
                        )}
                        {concorrente.capitalSocial > 0 && (
                          <div>
                            <span className="font-medium text-muted-foreground">Capital Social:</span>
                            <div className="text-foreground">
                              R$ {concorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        )}
                        {concorrente.cnaePrincipal && (
                          <div>
                            <span className="font-medium text-muted-foreground">CNAE Principal:</span>
                            <div className="font-mono text-xs text-foreground">{concorrente.cnaePrincipal}</div>
                          </div>
                        )}
                        {concorrente.produtosExtraidos !== undefined && (
                          <div>
                            <span className="font-medium text-muted-foreground">Produtos Extraídos:</span>
                            <div className="text-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {concorrente.produtosExtraidos}
                            </div>
                          </div>
                        )}
                        {concorrente.cnaePrincipalDescricao && (
                          <div className="col-span-2 md:col-span-3">
                            <span className="font-medium text-muted-foreground">Descrição CNAE:</span>
                            <div className="text-xs text-foreground">{concorrente.cnaePrincipalDescricao}</div>
                          </div>
                        )}
                        {/* 🔥 NOVO: CEP e Endereço Completo */}
                        {concorrente.cep && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div>
                              <span className="font-medium text-muted-foreground text-xs">CEP:</span>
                              <div className="text-foreground">{concorrente.cep}</div>
                            </div>
                          </div>
                        )}
                        {concorrente.endereco && (
                          <div className="col-span-2">
                            <span className="font-medium text-muted-foreground text-xs">Endereço Completo:</span>
                            <div className="text-foreground flex items-start gap-1.5">
                              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                              <span>
                                {concorrente.endereco}
                                {concorrente.numero && `, ${concorrente.numero}`}
                                {concorrente.bairro && ` - ${concorrente.bairro}`}
                                {(concorrente.cidade || concorrente.estado) && ` - ${concorrente.cidade}, ${concorrente.estado}`}
                              </span>
                            </div>
                          </div>
                        )}
                        {concorrente.website && (
                          <div>
                            <span className="font-medium text-muted-foreground">Website:</span>
                            <div className="text-blue-600 hover:underline">
                              <a href={concorrente.website} target="_blank" rel="noopener noreferrer">
                                {concorrente.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Campo URL + Botão Scan */}
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm">URL para Extração de Produtos</Label>
                        <div className="flex gap-2">
                          <Input
                            value={concorrente.urlParaScan || ''}
                            onChange={(e) => {
                              const updated = [...concorrentes];
                              updated[index] = { ...updated[index], urlParaScan: e.target.value };
                              setConcorrentes(updated);
                              // Salvar ao editar
                              if (onSave) {
                                const dataToSave = {
                                  ...formData,
                                  concorrentesDiretos: updated,
                                };
                                onSave(dataToSave);
                              }
                            }}
                            placeholder="https://exemplo.com.br ou instagram.com/empresa"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleScanConcorrenteURL(concorrente, index)}
                            disabled={scanningConcorrente[index] || !concorrente.urlParaScan}
                            className="flex items-center gap-2"
                          >
                            {scanningConcorrente[index] ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Escaneando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Extrair Produtos
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Informe a URL (website, Instagram, LinkedIn) para extrair produtos automaticamente
                        </p>
                      </div>
                      
                      {/* 🔥 NOVO: Lista de Produtos Extraídos com ABAS */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Produtos Extraídos ({concorrente.produtos?.length || 0})
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!tenant?.id || !concorrente.cnpj) {
                                toast.error('Dados incompletos para recarregar produtos');
                                return;
                              }
                              
                              toast.info('Recarregando produtos...');
                              
                              try {
                                const { data: produtosData, error } = await (supabase
                                  .from('tenant_competitor_products' as any)
                                  .select('id, nome, descricao, categoria')
                                  .eq('tenant_id', tenant.id)
                                  .eq('competitor_cnpj', concorrente.cnpj.replace(/\D/g, ''))
                                  .order('created_at', { ascending: false }));
                                
                                if (error && (error.code === '42P01' || error.message?.includes('404'))) {
                                  toast.error('Tabela de produtos não encontrada', {
                                    description: 'Aplique a migration 20250201000002_tenant_competitor_products.sql no Supabase'
                                  });
                                  return;
                                }
                                
                                if (error) {
                                  throw error;
                                }
                                
                                const updated = [...concorrentes];
                                updated[index] = {
                                  ...updated[index],
                                  produtos: (produtosData || []) as unknown as Array<{ id: string; nome: string; descricao?: string; categoria?: string }>,
                                  produtosExtraidos: produtosData?.length || 0
                                };
                                setConcorrentes(updated);
                                
                                // Salvar atualização
                                if (onSave) {
                                  const dataToSave = {
                                    ...formData,
                                    concorrentesDiretos: updated,
                                  };
                                  onSave(dataToSave);
                                }
                                
                                toast.success(`${produtosData?.length || 0} produtos carregados!`);
                              } catch (err: any) {
                                console.error('[Step1] Erro ao recarregar produtos:', err);
                                toast.error('Erro ao recarregar produtos', {
                                  description: err.message || 'Tente novamente'
                                });
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Recarregar Produtos
                          </Button>
                        </div>
                        {concorrente.produtos && concorrente.produtos.length > 0 ? (
                          <Tabs defaultValue="cards" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50">
                              <TabsTrigger value="cards" className="text-xs py-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Cards</TabsTrigger>
                              <TabsTrigger value="table" className="text-xs py-1 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Tabela</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="cards" className="mt-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                                {concorrente.produtos.map((produto, prodIdx) => (
                                  <Card key={produto.id || prodIdx} className="p-2 border-l-2 border-l-green-500">
                                    <div className="space-y-1">
                                      <div className="font-medium text-sm">{produto.nome}</div>
                                      {produto.categoria && (
                                        <Badge variant="outline" className="text-xs">
                                          {produto.categoria}
                                        </Badge>
                                      )}
                                      {produto.descricao && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {produto.descricao}
                                        </p>
                                      )}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="table" className="mt-2">
                              <div className="max-h-96 overflow-y-auto border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Categoria</TableHead>
                                      <TableHead>Descrição</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {concorrente.produtos.map((produto, prodIdx) => (
                                      <TableRow key={produto.id || prodIdx}>
                                        <TableCell className="font-medium">{produto.nome}</TableCell>
                                        <TableCell>
                                          {produto.categoria && (
                                            <Badge variant="outline">{produto.categoria}</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                          {produto.descricao || '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            Nenhum produto extraído ainda. Use o botão "Extrair Produtos" acima.
                          </div>
                        )}
                      </div>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerConcorrente(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={() => {
          // Se estiver na primeira página, voltar para dashboard
          if (window.confirm('Deseja cancelar o cadastro e voltar ao dashboard?')) {
            window.location.href = '/dashboard';
          }
        }}
        onNext={handleSubmit}
        onSave={onSaveExplicit || onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        showBack={true}
        backLabel="Cancelar"
        nextLabel="Próximo →"
        nextDisabled={!cnpjData}
      />
    </form>
  );
}

