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
  const [analysisData, setAnalysisData] = useState<any>(savedData || null);
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState(linkedinUrl || '');
  const [customApolloUrl, setCustomApolloUrl] = useState('');
  
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

  // 🚀 Enriquecimento Apollo (Emails + Telefones)
  const apolloMutation = useMutation({
    mutationFn: async () => {
      if (!companyName) throw new Error('Nome da empresa não disponível');
      if (!analysisData?.decisors) throw new Error('Extraia decisores primeiro');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-apollo-decisores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          companyName,
          domain,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enriquecer com Apollo');
      }

      return await response.json();
    },
    onSuccess: (apolloData) => {
      // Merge Apollo data com dados existentes
      const enrichedDecisors = analysisData.decisors.map((decisor: any) => {
        const apolloMatch = apolloData.find((a: any) => 
          a.name.toLowerCase().includes(decisor.name.toLowerCase()) ||
          decisor.name.toLowerCase().includes(a.name.toLowerCase())
        );

        if (apolloMatch) {
          return {
            ...decisor,
            email: apolloMatch.email || decisor.email,
            phone: apolloMatch.phone_numbers?.[0] || decisor.phone,
            enriched_with_apollo: true,
          };
        }

        return decisor;
      });

      const updatedData = {
        ...analysisData,
        decisors: enrichedDecisors,
        apollo_enriched: true,
      };

      setAnalysisData(updatedData);
      onDataChange?.(updatedData);

      const emailsFound = enrichedDecisors.filter((d: any) => d.email).length;
      const phonesFound = enrichedDecisors.filter((d: any) => d.phone).length;

      toast({
        title: '✅ Enriquecimento Apollo concluído!',
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
      
      const emailsFound = data.decisorsWithEmails.filter(d => d.email).length;
      
      toast({
        title: '✅ Análise LinkedIn concluída!',
        description: `${data.decisors.length} decisores | ${emailsFound} emails | ${data.insights.length} insights`,
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
                  <Mail className="h-4 w-4" />
                )}
                Enriquecer com Apollo (Emails + Telefones)
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
              <div className="text-2xl font-bold">{analysisData.decisors.length}</div>
              <Badge variant="outline" className="text-xs mt-1">identificados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Emails</span>
              </div>
              <div className="text-2xl font-bold">
                {analysisData.decisorsWithEmails.filter((d: any) => d.email).length}
              </div>
              <Badge variant="outline" className="text-xs mt-1">encontrados</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Taxa Sucesso</span>
              </div>
              <div className="text-2xl font-bold">
                {analysisData.decisors.length > 0
                  ? Math.round((analysisData.decisorsWithEmails.filter((d: any) => d.email).length / analysisData.decisors.length) * 100)
                  : 0}%
              </div>
              <Badge variant="outline" className="text-xs mt-1">emails/decisores</Badge>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Insights</span>
              </div>
              <div className="text-2xl font-bold">{analysisData.insights.length}</div>
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
                  <p className="text-xl font-bold">{analysisData.companyData.followers?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Funcionários</span>
                  <p className="text-xl font-bold">{analysisData.companyData.employees?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Posts Recentes</span>
                  <p className="text-xl font-bold">{analysisData.companyData.recentPosts?.length || 0}</p>
                </div>
              </div>

              {/* Menções de concorrentes */}
              {analysisData.companyData.competitorMentions && analysisData.companyData.competitorMentions.length > 0 && (
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
          {analysisData.decisorsWithEmails.length > 0 && (
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
                {analysisData.decisorsWithEmails.map((decisor: any, idx: number) => (
                  <div key={idx} className="border border-slate-600 rounded-lg p-4 bg-slate-800 hover:border-border transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-lg">{decisor.name}</h5>
                          {decisor.buying_power === 'decision-maker' && (
                            <Badge variant="default" className="text-xs">Decision Maker</Badge>
                          )}
                          {decisor.buying_power === 'influencer' && (
                            <Badge variant="secondary" className="text-xs">Influencer</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{decisor.title || decisor.position}</p>
                        {decisor.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {decisor.city}, {decisor.state} - {decisor.country}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">Apollo</Badge>
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
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          <span className="text-amber-200 text-sm font-medium">
                            Email bloqueado - Clique em "Enriquecer com Apollo"
                          </span>
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
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            Telefone não disponível - Enriquecer com Apollo
                          </span>
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
                ))}
              </div>
            </Card>
          )}

          {/* Insights Estratégicos */}
          {analysisData.insights.length > 0 && (
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

