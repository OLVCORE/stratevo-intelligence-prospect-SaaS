// 👔 ABA DECISORES & CONTATOS - Apollo + Corporate Theme
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { Users, Mail, Phone, Linkedin, Sparkles, Loader2, ExternalLink, Target, TrendingUp, MapPin, AlertCircle, CheckCircle2, XCircle, Building2, Filter } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { performFullLinkedInAnalysis } from '@/services/phantomBusterEnhanced';
import { corporateTheme } from '@/lib/theme/corporateTheme';
import type { LinkedInProfileData } from '@/services/phantomBusterEnhanced';
import { registerTab, unregisterTab } from './tabsRegistry';

interface DecisorsContactsTabProps {
  companyId?: string;
  companyName?: string;
  linkedinUrl?: string;
  domain?: string;
  savedData?: any;
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
}

export function DecisorsContactsTab({ 
  companyId, 
  companyName, 
  linkedinUrl, 
  domain,
  savedData,
  stcHistoryId,
  onDataChange 
}: DecisorsContactsTabProps) {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(savedData || {
    decisors: [],
    decisorsWithEmails: [],
    insights: [],
    companyData: null
  });
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState(linkedinUrl || '');
  const [customApolloUrl, setCustomApolloUrl] = useState('');
  
  // 🔍 FILTROS MÚLTIPLOS
  const [filterBuyingPower, setFilterBuyingPower] = useState<string[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterSeniority, setFilterSeniority] = useState<string[]>([]);
  
  // 🔥 BUSCAR DECISORES JÁ SALVOS (de enrichment em massa)
  useEffect(() => {
    const loadExistingDecisors = async () => {
      if (!companyId) return;
      
      // 1️⃣ Buscar dados da empresa (Apollo Organization)
      const { data: companyData } = await supabase
        .from('companies')
        .select('raw_data, industry')
        .eq('id', companyId)
        .single();
      
      console.log('[DECISORES-TAB] 🏢 Company raw_data:', companyData?.raw_data);
      console.log('[DECISORES-TAB] 🏢 Apollo Organization:', companyData?.raw_data?.apollo_organization);
      
      // 2️⃣ Buscar decisores salvos na tabela decision_makers
      const { data: existingDecisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);
      
      if (existingDecisors && existingDecisors.length > 0) {
        console.log('[DECISORES-TAB] ✅ Encontrados', existingDecisors.length, 'decisores já salvos');
        
        // 🎯 CLASSIFICAÇÃO DEFINITIVA: C-Level + Diretor + Gerente + Supervisor = DECISION MAKER
        const classifyBuyingPower = (title: string, seniority: string) => {
          const titleLower = (title || '').toLowerCase();
          const seniorityLower = (seniority || '').toLowerCase();
          
          // 🔴 DECISION MAKERS: C-Level, Diretor, Gerente, Supervisor
          if (
            // Seniority Apollo
            seniorityLower.includes('c_suite') || 
            seniorityLower.includes('c-suite') ||
            seniorityLower.includes('vp') || 
            seniorityLower.includes('founder') ||
            seniorityLower.includes('owner') ||
            seniorityLower.includes('partner') ||
            seniorityLower.includes('director') ||
            seniorityLower.includes('manager') ||
            // C-Level
            titleLower.includes('ceo') || 
            titleLower.includes('cfo') || 
            titleLower.includes('cto') || 
            titleLower.includes('cio') || 
            titleLower.includes('cmo') ||
            titleLower.includes('presidente') ||
            titleLower.includes('vice-presidente') ||
            titleLower.includes('vice presidente') ||
            titleLower.includes('sócio') ||
            titleLower.includes('fundador') ||
            titleLower.includes('proprietário') ||
            // DIRETOR (qualquer tipo)
            titleLower.includes('diretor') ||
            titleLower.includes('director') ||
            // GERENTE (qualquer tipo)
            titleLower.includes('gerente') || 
            titleLower.includes('manager') ||
            // SUPERVISOR (qualquer tipo)
            titleLower.includes('supervisor')
          ) {
            return 'decision-maker';
          }
          
          // 🟡 INFLUENCERS: Coordenadores, Líderes, Heads
          if (
            titleLower.includes('coordenador') || 
            titleLower.includes('coordinator') ||
            titleLower.includes('head of') ||
            titleLower.includes('líder') ||
            titleLower.includes('leader') ||
            seniorityLower.includes('senior')
          ) {
            return 'influencer';
          }
          
          // 🔵 USUÁRIOS: Analistas, Assistentes, Técnicos, etc.
          return 'user';
        };
        
        // Formatar decisores para match com estrutura esperada (TODOS CAMPOS APOLLO)
        const formattedDecisors = existingDecisors.map(d => {
          console.log('[DECISORES-TAB] 🔍 raw_data para', d.full_name || d.name, ':', d.raw_data);
          
          return {
            name: d.full_name || d.name,
            title: d.position || d.title,
            position: d.position,
            email: d.email,
            email_status: d.email_status,
            phone: d.phone,
            linkedin_url: d.linkedin_url,
            department: d.department,
            seniority_level: d.seniority_level,
            buying_power: classifyBuyingPower(d.position || '', d.seniority_level || ''),
            city: d.city,
            state: d.state,
            country: d.country || 'Brazil',
            photo_url: d.photo_url,
            headline: d.headline,
            // 🔥 CAMPOS APOLLO EXPANDIDOS (múltiplas fontes possíveis)
            apollo_score: d.raw_data?.apollo_score || d.apollo_score,
            organization_name: d.raw_data?.organization_name || d.organization_name,
            organization_employees: d.raw_data?.organization_employees || 
                                   d.raw_data?.organization_data?.estimated_num_employees ||
                                   d.organization_employees,
            organization_industry: d.raw_data?.organization_industry || 
                                  d.raw_data?.organization_data?.industry ||
                                  d.organization_industry,
            organization_keywords: d.raw_data?.organization_keywords || 
                                  d.raw_data?.organization_data?.keywords || 
                                  d.organization_keywords || [],
            phone_numbers: d.raw_data?.phone_numbers || d.phone_numbers || [],
            departments: d.raw_data?.departments || d.departments || [],
            employment_history: d.raw_data?.employment_history || [],
            enriched_with: 'database'
          };
        });
        
        setAnalysisData({
          decisors: formattedDecisors,
          decisorsWithEmails: formattedDecisors, // 🔥 SEMPRE mostrar todos (mesmo sem email)
          insights: [`${existingDecisors.length} decisores já identificados por enrichment anterior`],
          companyData: { 
            source: 'database',
            followers: 0,
            employees: 0,
            recentPosts: []
          }
        });
        
        sonnerToast.success(`✅ ${existingDecisors.length} decisores carregados!`);
      }
    };
    
    loadExistingDecisors();
  }, [companyId]);
  
  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: decisors');
    
    registerTab('decisors', {
      flushSave: async () => {
        const currentData = {
          analysisData,
          customLinkedInUrl,
          customApolloUrl,
        };
        
        console.log('[DECISORES] 📤 Registry: flushSave() chamado');
        onDataChange?.(currentData);
        sonnerToast.success('✅ Decisores & Contatos Salvos!');
      },
      getStatus: () => analysisData ? 'completed' : 'draft',
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Cleanup removido para manter estado persistente entre trocas de aba
  }, [analysisData, customLinkedInUrl, customApolloUrl, onDataChange]);
  
  // 🔄 RESET
  const handleReset = () => {
    setAnalysisData(null);
  };

  // 💾 SALVAR (mantido para compatibilidade com FloatingNavigation)
  const handleSave = () => {
    onDataChange?.(analysisData);
    sonnerToast.success('✅ Decisores & Contatos Salvos!');
  };

  // 🚀 Enriquecimento TRIPLO (Apollo → Hunter.io → PhantomBuster)
  const apolloMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      if (!analysisData?.decisors) throw new Error('Extraia decisores primeiro');

      let enrichmentData: any = null;
      let source = '';

      // 🥇 TENTATIVA 1: APOLLO
      try {
        sonnerToast.loading('🔍 Buscando em Apollo.io...');
        const apolloResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-apollo-decisores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ companyName, domain }),
        });

        if (apolloResponse.ok) {
          enrichmentData = await apolloResponse.json();
          source = 'Apollo.io';
          sonnerToast.success(`✅ Dados encontrados em ${source}`);
          return { data: enrichmentData, source };
        }
      } catch (apolloError) {
        console.warn('⚠️ Apollo falhou:', apolloError);
      }

      // 🥈 TENTATIVA 2: HUNTER.IO (se Apollo falhar)
      if (!enrichmentData && domain) {
        try {
          sonnerToast.loading('🔍 Buscando em Hunter.io...');
          const hunterResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hunter-domain-search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ domain }),
          });

          if (hunterResponse.ok) {
            enrichmentData = await hunterResponse.json();
            source = 'Hunter.io';
            sonnerToast.success(`✅ Dados encontrados em ${source}`);
            return { data: enrichmentData, source };
          }
        } catch (hunterError) {
          console.warn('⚠️ Hunter.io falhou:', hunterError);
        }
      }

      // 🥉 TENTATIVA 3: PHANTOMBUSTER (última tentativa)
      if (!enrichmentData && linkedinUrl) {
        try {
          sonnerToast.loading('🔍 Buscando em PhantomBuster (LinkedIn)...');
          const phantomData = await performFullLinkedInAnalysis(companyName, linkedinUrl, domain);
          enrichmentData = phantomData;
          source = 'PhantomBuster';
          sonnerToast.success(`✅ Dados encontrados em ${source}`);
          return { data: enrichmentData, source };
        } catch (phantomError) {
          console.warn('⚠️ PhantomBuster falhou:', phantomError);
        }
      }

      // ❌ SE NENHUM FUNCIONOU
      if (!enrichmentData) {
        throw new Error('Nenhuma fonte de enriquecimento disponível (Apollo, Hunter.io, PhantomBuster)');
      }

      return { data: enrichmentData, source };
    },
    onSuccess: (result) => {
      const { data: enrichmentResult, source } = result;
      
      // Merge enrichment data com dados existentes
      const enrichedDecisors = (analysisData?.decisors || []).map((decisor: any) => {
        // Apollo retorna decisores diretamente
        if (source === 'Apollo.io' && enrichmentResult.decisores) {
          const apolloMatch = enrichmentResult.decisores.find((a: any) => 
            a.name?.toLowerCase().includes(decisor.name.toLowerCase()) ||
            decisor.name.toLowerCase().includes(a.name?.toLowerCase() || '')
          );

          if (apolloMatch) {
            return {
              ...decisor,
              email: apolloMatch.email || decisor.email,
              phone: apolloMatch.phone || decisor.phone,
              enriched_with: source,
            };
          }
        }
        
        // Hunter.io retorna emails por domínio
        if (source === 'Hunter.io' && enrichmentResult.emails) {
          const hunterMatch = enrichmentResult.emails.find((e: any) => 
            e.first_name?.toLowerCase() === decisor.name.split(' ')[0]?.toLowerCase()
          );
          
          if (hunterMatch) {
            return {
              ...decisor,
              email: hunterMatch.value || decisor.email,
              enriched_with: source,
            };
          }
        }
        
        // PhantomBuster retorna dados do LinkedIn
        if (source === 'PhantomBuster') {
          return {
            ...decisor,
            ...enrichmentResult.decisors?.find((d: any) => d.name === decisor.name),
            enriched_with: source,
          };
        }

        return decisor;
      });

      const updatedData = {
        ...analysisData,
        decisors: enrichedDecisors,
        enriched_with: source,
        enriched_at: new Date().toISOString(),
      };

      setAnalysisData(updatedData);
      onDataChange?.(updatedData);

      const emailsFound = enrichedDecisors.filter((d: any) => d.email).length;
      const phonesFound = enrichedDecisors.filter((d: any) => d.phone).length;

      toast({
        title: `✅ Enriquecimento via ${source} concluído!`,
        description: `${emailsFound} emails | ${phonesFound} telefones encontrados`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '❌ Erro no enriquecimento Apollo',
        description: error.message,
      });
    },
  });
  
  // 🔥 Análise LinkedIn completa
  const linkedinMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      
      // Usar URLs customizadas se fornecidas
      const linkedinToUse = customLinkedInUrl || linkedinUrl;
      const domainToUse = domain;
      
      return await performFullLinkedInAnalysis(companyName, linkedinToUse, domainToUse);
    },
    onMutate: () => {
      toast({
        title: '🔍 Analisando LinkedIn...',
        description: 'Extraindo decisores, posts e dados da empresa',
      });
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      onDataChange?.(data); // 🔥 NOTIFICAR MUDANÇA PARA SALVAMENTO
      
      const emailsFound = data.decisorsWithEmails.filter(d => d.email).length;
      
      toast({
        title: '✅ Análise LinkedIn concluída!',
        description: `${data.decisors?.length || 0} decisores | ${emailsFound} emails | ${data.insights?.length || 0} insights`,
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Erro na análise LinkedIn',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  });

  // Aplicar filtros
  const filteredDecisors = (analysisData?.decisorsWithEmails || []).filter((d: any) => {
    if (filterBuyingPower.length > 0 && !filterBuyingPower.includes(d.buying_power)) return false;
    if (filterDepartment.length > 0 && !filterDepartment.includes(d.department)) return false;
    if (filterLocation.length > 0 && !filterLocation.includes(d.city || d.state)) return false;
    if (filterSeniority.length > 0 && !filterSeniority.includes(d.seniority_level)) return false;
    return true;
  });

  // Extrair opções únicas para filtros
  const uniqueBuyingPowers = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.buying_power).filter(Boolean))];
  const uniqueDepartments = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.department).filter(Boolean))];
  const uniqueLocations = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.city || d.state).filter(Boolean))];
  const uniqueSeniorities = [...new Set((analysisData?.decisorsWithEmails || []).map((d: any) => d.seniority_level).filter(Boolean))];

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para extração de decisores
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🎯 NAVEGAÇÃO FLUTUANTE */}
      {analysisData && (
        <FloatingNavigation
          onBack={handleReset}
          onHome={handleReset}
          onSave={handleSave}
          showSaveButton={true}
          saveDisabled={!analysisData}
          hasUnsavedChanges={!!analysisData}
        />
      )}
      
      {/* Header */}
      <Card className="p-6 bg-slate-800 border border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-muted/30">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1 text-slate-200">Decisores & Contatos</h3>
              <p className="text-sm text-slate-400">
                Mapeamento de tomadores de decisão via PhantomBuster + LinkedIn
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => linkedinMutation.mutate()}
              disabled={linkedinMutation.isPending}
              variant="default"
            >
              {linkedinMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Extrair Decisores
            </Button>
            
            {analysisData && analysisData.decisors?.length > 0 && (
              <Button
                onClick={() => apolloMutation.mutate()}
                disabled={apolloMutation.isPending}
                variant="secondary"
                className="gap-2"
              >
                {apolloMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Enriquecer Contatos (Apollo + Hunter + Phantom)
              </Button>
            )}
          </div>
        </div>
        
        {/* Campos editáveis - LinkedIn e Apollo URLs */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-600">
          <div>
            <Label className="text-slate-300 text-xs mb-2">LinkedIn Company URL (opcional)</Label>
            <Input 
              value={customLinkedInUrl} 
              onChange={(e) => setCustomLinkedInUrl(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs mb-2">Apollo Company URL (opcional)</Label>
            <Input 
              value={customApolloUrl} 
              onChange={(e) => setCustomApolloUrl(e.target.value)}
              placeholder="https://app.apollo.io/#/organizations/..."
              className="bg-slate-700 border-slate-600 text-slate-200"
            />
          </div>
        </div>
      </Card>

      {/* Loading */}
      {linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="font-medium mb-2">Analisando LinkedIn...</p>
          <p className="text-sm text-muted-foreground">
            Extraindo decisores, emails e dados da empresa (30-60s)
          </p>
        </Card>
      )}

      {/* Resultados */}
      {analysisData && (
        <>
          {/* 📊 Estatísticas - TEMA ESCURO PREMIUM */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Decisores</span>
              </div>
              <div className="text-2xl font-bold text-white">{analysisData?.decisors?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">identificados</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Emails</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0}
              </div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">encontrados</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Taxa Sucesso</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {(analysisData?.decisors?.length || 0) > 0
                  ? Math.round(((analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0) / (analysisData?.decisors?.length || 1)) * 100)
                  : 0}%
              </div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">emails/decisores</Badge>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-medium text-slate-300 uppercase">Insights</span>
              </div>
              <div className="text-2xl font-bold text-white">{analysisData?.insights?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1 border-slate-600 text-slate-400">gerados</Badge>
            </Card>
          </div>

          {/* 🔍 FILTROS MÚLTIPLOS - TEMA ESCURO */}
          {(analysisData?.decisorsWithEmails?.length || 0) > 0 && (
            <Card className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-white">
                <Filter className="w-4 h-4 text-blue-400" />
                Filtros Avançados
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Filtro: Buying Power */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Tipo de Decisor</Label>
                  <Select
                    value={filterBuyingPower.length === 1 ? filterBuyingPower[0] : 'ALL'}
                    onValueChange={(val) => setFilterBuyingPower(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos ({analysisData?.decisorsWithEmails?.length || 0})</SelectItem>
                      {uniqueBuyingPowers.map(bp => (
                        <SelectItem key={bp} value={bp}>
                          {bp === 'decision-maker' ? 'Decision Maker' : bp === 'influencer' ? 'Influencer' : 'Usuário'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Departamento */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Departamento</Label>
                  <Select
                    value={filterDepartment.length === 1 ? filterDepartment[0] : 'ALL'}
                    onValueChange={(val) => setFilterDepartment(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Localização */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Localização</Label>
                  <Select
                    value={filterLocation.length === 1 ? filterLocation[0] : 'ALL'}
                    onValueChange={(val) => setFilterLocation(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueLocations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Seniority */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Senioridade</Label>
                  <Select
                    value={filterSeniority.length === 1 ? filterSeniority[0] : 'ALL'}
                    onValueChange={(val) => setFilterSeniority(val === 'ALL' ? [] : [val])}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {uniqueSeniorities.map(sen => (
                        <SelectItem key={sen} value={sen}>{sen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contador + Limpar Filtros */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-300">
                  Exibindo <strong className="text-white">{filteredDecisors.length}</strong> de <strong className="text-white">{analysisData?.decisorsWithEmails?.length || 0}</strong> decisores
                </p>
                {(filterBuyingPower.length > 0 || filterDepartment.length > 0 || filterLocation.length > 0 || filterSeniority.length > 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                    onClick={() => {
                      setFilterBuyingPower([]);
                      setFilterDepartment([]);
                      setFilterLocation([]);
                      setFilterSeniority([]);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 🏢 RESUMO DA EMPRESA (Apollo Organization Data) - TEMA ESCURO */}
          {(analysisData?.decisorsWithEmails?.[0]?.organization_name || 
            analysisData?.decisorsWithEmails?.[0]?.organization_industry || 
            analysisData?.decisorsWithEmails?.[0]?.organization_employees) && (
            <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {analysisData?.decisorsWithEmails?.[0]?.organization_name || companyName}
                  </h3>
                  {analysisData?.decisorsWithEmails?.[0]?.organization_industry && (
                    <p className="text-sm text-emerald-400 mb-2">
                      {analysisData.decisorsWithEmails[0].organization_industry}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    {analysisData?.decisorsWithEmails?.[0]?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {analysisData.decisorsWithEmails[0].city}, {analysisData.decisorsWithEmails[0].country || 'Brazil'}
                      </span>
                    )}
                    {analysisData?.decisorsWithEmails?.[0]?.organization_employees && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {analysisData.decisorsWithEmails[0].organization_employees} funcionários
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Keywords / Industries */}
              {analysisData?.decisorsWithEmails?.[0]?.organization_keywords && 
               analysisData.decisorsWithEmails[0].organization_keywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <span className="text-xs font-medium text-slate-400 mb-2 block">Keywords:</span>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.decisorsWithEmails[0].organization_keywords.map((kw: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Dados da Empresa LinkedIn - TEMA ESCURO */}
          {analysisData.companyData && (
            <Card className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-white">
                <Linkedin className="w-5 h-5 text-blue-400" />
                Presença no LinkedIn
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Seguidores</span>
                  <p className="text-xl font-bold text-white">{analysisData?.companyData?.followers?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Funcionários</span>
                  <p className="text-xl font-bold text-white">{analysisData?.companyData?.employees?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Posts Recentes</span>
                  <p className="text-xl font-bold text-white">{analysisData?.companyData?.recentPosts?.length || 0}</p>
                </div>
              </div>

              {/* Menções de concorrentes */}
              {analysisData?.companyData?.competitorMentions && analysisData.companyData.competitorMentions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <span className="text-xs font-medium text-slate-400">Concorrentes Mencionados:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysisData.companyData.competitorMentions.map((comp: string, idx: number) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Lista de Decisores - TEMA ESCURO PREMIUM */}
          {filteredDecisors && filteredDecisors.length > 0 && (
            <Card className="p-6 border-2 border-emerald-500/40 bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="font-bold text-xl text-white">
                  Decisores Identificados
                </h4>
                <Badge variant="default" className="bg-emerald-600 text-white text-lg px-4 py-2 shadow-lg">
                  {filteredDecisors.length} pessoas
                </Badge>
              </div>

              <div className="space-y-4">
                {filteredDecisors.map((decisor: any, idx: number) => {
                  // Gerar iniciais para avatar (com validação)
                  const initials = decisor.name
                    ? decisor.name
                        .split(' ')
                        .filter((n: string) => n.length > 0)
                        .slice(0, 2)
                        .map((n: string) => n[0].toUpperCase())
                        .join('')
                    : '??';
                  
                  return (
                  <div key={idx} className="border border-slate-600 rounded-lg p-5 bg-gradient-to-br from-slate-800 to-slate-900 hover:border-primary/50 transition-all hover:shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {/* 📸 FOTO/AVATAR DO DECISOR */}
                      <div className="flex-shrink-0">
                        {decisor.photo_url ? (
                          <img 
                            src={decisor.photo_url} 
                            alt={decisor.name}
                            className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover"
                            onError={(e) => {
                              // Fallback para avatar com iniciais se imagem falhar
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl border-2 border-primary/50 shadow-md ${decisor.photo_url ? 'hidden' : ''}`}>
                          {initials}
                        </div>
                      </div>
                      
                      {/* INFO DO DECISOR */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h5 className="font-bold text-lg text-foreground">{decisor.name}</h5>
                              {decisor.buying_power === 'decision-maker' && (
                                <Badge variant="default" className="text-xs bg-emerald-600">Decision Maker</Badge>
                              )}
                              {decisor.buying_power === 'influencer' && (
                                <Badge variant="default" className="text-xs bg-blue-600">Influencer</Badge>
                              )}
                              {decisor.buying_power === 'user' && (
                                <Badge variant="secondary" className="text-xs">Usuário</Badge>
                              )}
                              {decisor.seniority_level && (
                                <Badge variant="outline" className="text-xs">{decisor.seniority_level}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{decisor.title || decisor.position}</p>
                            {decisor.headline && (
                              <p className="text-xs text-primary/80 italic mb-1">"{decisor.headline}"</p>
                            )}
                            {decisor.department && (
                              <p className="text-xs text-muted-foreground">📁 {decisor.department}</p>
                            )}
                            {decisor.organization_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {decisor.organization_name}
                                {decisor.organization_employees && (
                                  <span className="text-[10px]">• {decisor.organization_employees} funcionários</span>
                                )}
                              </p>
                            )}
                            {decisor.organization_industry && (
                              <p className="text-xs text-muted-foreground">
                                🏢 {decisor.organization_industry}
                              </p>
                            )}
                            {decisor.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {decisor.city}, {decisor.state} - {decisor.country}
                              </p>
                            )}
                            {decisor.apollo_score && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-[10px] bg-purple-500/10">
                                  ⭐ Apollo Score: {decisor.apollo_score}
                                </Badge>
                              </div>
                            )}
                            {decisor.organization_keywords && decisor.organization_keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {decisor.organization_keywords.slice(0, 3).map((kw: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[9px]">{kw}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {decisor.enriched_with || 'Apollo'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Contatos - DESTAQUE MAIOR */}
                    <div className="space-y-3 mb-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      {decisor.email && decisor.email !== 'email_not_unlocked@domain.com' ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-emerald-500/20">
                            <Mail className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Email Corporativo</p>
                            <a 
                              href={`mailto:${decisor.email}`} 
                              className="text-blue-400 hover:text-blue-300 font-semibold text-base hover:underline" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {decisor.email}
                            </a>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded border border-amber-500/30">
                          <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                          <div className="flex-1">
                            <p className="text-amber-200 text-sm font-semibold">
                              💸 Email bloqueado - Revelar consome créditos
                            </p>
                            <p className="text-amber-300 text-xs mt-1">
                              Clique em "Enriquecer Contatos" para revelar via Apollo/Hunter/Phantom
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {decisor.phone ? (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <Phone className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Telefone Verificado</p>
                            <a 
                              href={`tel:${decisor.phone}`} 
                              className="text-blue-400 hover:text-blue-300 font-semibold text-base hover:underline"
                            >
                              {decisor.phone}
                            </a>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded border border-slate-600">
                          <Phone className="w-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-muted-foreground text-sm">
                              💸 Telefone bloqueado - Revelar consome créditos
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Enriquecimento via Apollo/Hunter/Phantom
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* 📞 Phone Numbers Apollo (múltiplos) */}
                      {decisor.phone_numbers && decisor.phone_numbers.length > 0 && (
                        <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <Phone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-slate-300 mb-2 font-medium">Telefones Apollo:</p>
                            <div className="space-y-1">
                              {decisor.phone_numbers.map((phoneObj: any, pIdx: number) => (
                                <a
                                  key={pIdx}
                                  href={`tel:${phoneObj.sanitized_number || phoneObj.raw_number}`}
                                  className="block text-blue-400 hover:text-blue-300 font-medium text-sm hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {phoneObj.sanitized_number || phoneObj.raw_number}
                                  {phoneObj.type && <span className="text-xs text-slate-400 ml-2">({phoneObj.type})</span>}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {decisor.linkedin_url && (
                        <div className="flex items-center gap-2 text-sm">
                          <Linkedin className="w-4 h-4 text-blue-400" />
                          <a href={decisor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                            Ver perfil LinkedIn
                          </a>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Approach Sugerido */}
                    <div className="bg-slate-700/50 rounded p-3 text-xs border border-slate-600">
                      <p className="font-medium text-slate-200 mb-1">💡 Approach Sugerido:</p>
                      <ul className="space-y-1 text-slate-300">
                        {decisor.email && decisor.email !== 'email_not_unlocked@domain.com' && (
                          <li>• Email direto: Mencionar {decisor.title || decisor.position || 'cargo'} e dores do setor</li>
                        )}
                        <li>• LinkedIn InMail: Personalizado com insights da empresa</li>
                        {decisor.phone && (
                          <li>• WhatsApp Business: Follow-up pós-email</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Insights Estratégicos */}
          {analysisData?.insights && analysisData.insights.length > 0 && (
            <Card className="p-6 bg-slate-800 border border-slate-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-slate-200">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                Insights Estratégicos
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                {analysisData.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* Estado vazio */}
      {!analysisData && !linkedinMutation.isPending && (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Extração de Decisores não executada</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em "Extrair Decisores" para mapear tomadores de decisão via PhantomBuster
          </p>
          {!linkedinUrl && (
            <Badge variant="secondary" className="text-xs">
              💡 Dica: LinkedIn URL melhora a precisão
            </Badge>
          )}
        </Card>
      )}
    </div>
  );
}

