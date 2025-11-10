// 👔 ABA DECISORES & CONTATOS - Apollo + Corporate Theme
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { Users, Mail, Phone, Linkedin, Sparkles, Loader2, ExternalLink, Target, TrendingUp, MapPin, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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
  
  // 🔥 BUSCAR DECISORES JÁ SALVOS (de enrichment em massa)
  useEffect(() => {
    const loadExistingDecisors = async () => {
      if (!companyId) return;
      
      // Buscar decisores salvos na tabela decision_makers
      const { data: existingDecisors } = await supabase
        .from('decision_makers')
        .select('*')
        .eq('company_id', companyId);
      
      if (existingDecisors && existingDecisors.length > 0) {
        console.log('[DECISORES-TAB] ✅ Encontrados', existingDecisors.length, 'decisores já salvos');
        
        // Formatar decisores para match com estrutura esperada
        const formattedDecisors = existingDecisors.map(d => ({
          name: d.name,
          title: d.position || d.title,
          position: d.position,
          email: d.email,
          email_status: d.email_status,
          phone: d.phone,
          linkedin_url: d.linkedin_url,
          department: d.department,
          seniority_level: d.seniority_level,
          buying_power: d.buying_power || 'decision-maker',
          city: d.city,
          state: d.state,
          country: d.country || 'Brazil',
          photo_url: d.photo_url,
          enriched_with: 'database'
        }));
        
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
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Decisores</span>
              </div>
              <div className="text-2xl font-bold">{analysisData?.decisors?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1">identificados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Emails</span>
              </div>
              <div className="text-2xl font-bold">
                {analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0}
              </div>
              <Badge variant="outline" className="text-xs mt-1">encontrados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Taxa Sucesso</span>
              </div>
              <div className="text-2xl font-bold">
                {(analysisData?.decisors?.length || 0) > 0
                  ? Math.round(((analysisData?.decisorsWithEmails?.filter((d: any) => d.email).length || 0) / (analysisData?.decisors?.length || 1)) * 100)
                  : 0}%
              </div>
              <Badge variant="outline" className="text-xs mt-1">emails/decisores</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Insights</span>
              </div>
              <div className="text-2xl font-bold">{analysisData?.insights?.length || 0}</div>
              <Badge variant="outline" className="text-xs mt-1">gerados</Badge>
            </Card>
          </div>

          {/* Dados da Empresa LinkedIn */}
          {analysisData.companyData && (
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-muted-foreground" />
                Presença no LinkedIn
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Seguidores</span>
                  <p className="text-xl font-bold">{analysisData?.companyData?.followers?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Funcionários</span>
                  <p className="text-xl font-bold">{analysisData?.companyData?.employees?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Posts Recentes</span>
                  <p className="text-xl font-bold">{analysisData?.companyData?.recentPosts?.length || 0}</p>
                </div>
              </div>

              {/* Menções de concorrentes */}
              {analysisData?.companyData?.competitorMentions && analysisData.companyData.competitorMentions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-xs font-medium text-muted-foreground">Concorrentes Mencionados:</span>
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

          {/* Lista de Decisores - DESTAQUE COM BALÃO COLORIDO */}
          {analysisData?.decisorsWithEmails && analysisData.decisorsWithEmails.length > 0 && (
            <Card className="p-6 border-2 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-bold text-xl text-foreground">
                  Decisores Identificados
                </h4>
                <Badge variant="default" className="bg-emerald-600 text-white text-lg px-4 py-2 shadow-lg">
                  {analysisData.decisorsWithEmails.length} pessoas
                </Badge>
              </div>

              <div className="space-y-4">
                {analysisData.decisorsWithEmails.map((decisor: any, idx: number) => {
                  // Gerar iniciais para avatar
                  const initials = decisor.name
                    .split(' ')
                    .filter((n: string) => n.length > 0)
                    .slice(0, 2)
                    .map((n: string) => n[0].toUpperCase())
                    .join('');
                  
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
                                <Badge variant="default" className="text-xs bg-emerald-600">🎯 Decision Maker</Badge>
                              )}
                              {decisor.buying_power === 'influencer' && (
                                <Badge variant="secondary" className="text-xs">💡 Influencer</Badge>
                              )}
                              {decisor.seniority_level && (
                                <Badge variant="outline" className="text-xs">{decisor.seniority_level}</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{decisor.title || decisor.position}</p>
                            {decisor.department && (
                              <p className="text-xs text-muted-foreground">📁 {decisor.department}</p>
                            )}
                            {decisor.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {decisor.city}, {decisor.state} - {decisor.country}
                              </p>
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
                      
                      {decisor.linkedin_url && (
                        <div className="flex items-center gap-2 text-sm">
                          <Linkedin className="w-4 h-4 text-muted-foreground" />
                          <a href={decisor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            Ver perfil LinkedIn
                          </a>
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
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

