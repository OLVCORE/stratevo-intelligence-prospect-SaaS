import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Target, TrendingUp, MapPin, Users, DollarSign, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';

interface ICPRecommendation {
  icp_profile: {
    setores_recomendados: string[];
    nichos_recomendados: string[];
    cnaes_recomendados: string[];
    porte_ideal: {
      minimo: number;
      maximo: number;
    };
    localizacao_ideal: {
      estados: string[];
      regioes: string[];
    };
    faturamento_ideal: {
      minimo: number;
      maximo: number;
    };
    funcionarios_ideal: {
      minimo: number;
      maximo: number;
    };
    caracteristicas_especiais: string[];
  };
  analise_detalhada: {
    resumo_executivo: string;
    padroes_identificados: string[];
    oportunidades_identificadas: string[];
    recomendacoes_estrategicas: string[];
    justificativa: string;
  };
  score_confianca: number;
}

export default function OnboardingICPRecommendations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recommendation, setRecommendation] = useState<ICPRecommendation | null>(
    location.state?.recommendation || null
  );
  const [loading, setLoading] = useState(!recommendation);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!recommendation) {
      loadRecommendation();
    }
  }, []);

  const loadRecommendation = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Buscar recomendação da sessão mais recente
      const { data: session, error } = await supabase
        .from('onboarding_sessions')
        .select('icp_recommendation')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (session?.icp_recommendation) {
        setRecommendation(session.icp_recommendation);
      } else {
        // Se não tem recomendação, tentar gerar agora
        await triggerAnalysis();
      }
    } catch (error: any) {
      console.error('Erro ao carregar recomendação:', error);
      toast.error('Erro ao carregar recomendações');
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-onboarding-icp', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.recommendation) {
        setRecommendation(data.recommendation);
        toast.success('✅ Análise concluída!');
      }
    } catch (error: any) {
      console.error('Erro ao analisar:', error);
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading || analyzing) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {analyzing ? 'Analisando dados do onboarding...' : 'Carregando recomendações...'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!recommendation) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de ICP</CardTitle>
              <CardDescription>
                Não encontramos uma análise de ICP. Deseja gerar agora?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={triggerAnalysis} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Análise com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              Recomendações de ICP
            </h1>
            <p className="text-muted-foreground mt-2">
              Análise baseada nos dados coletados durante o onboarding
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Confiança: {recommendation.score_confianca}%
          </Badge>
        </div>

        {/* Resumo Executivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{recommendation.analise_detalhada.resumo_executivo}</p>
          </CardContent>
        </Card>

        {/* ICP Profile */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Setores e Nichos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Setores e Nichos Recomendados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Setores ({recommendation.icp_profile.setores_recomendados.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.icp_profile.setores_recomendados.map((setor, i) => (
                    <Badge key={i} variant="secondary">{setor}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Nichos ({recommendation.icp_profile.nichos_recomendados.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.icp_profile.nichos_recomendados.slice(0, 10).map((nicho, i) => (
                    <Badge key={i} variant="outline">{nicho}</Badge>
                  ))}
                  {recommendation.icp_profile.nichos_recomendados.length > 10 && (
                    <Badge variant="outline">+{recommendation.icp_profile.nichos_recomendados.length - 10} mais</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Porte e Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Porte e Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Funcionários</h4>
                <p className="text-lg">
                  {recommendation.icp_profile.funcionarios_ideal.minimo.toLocaleString('pt-BR')} -{' '}
                  {recommendation.icp_profile.funcionarios_ideal.maximo.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Faturamento</h4>
                <p className="text-lg">
                  {formatCurrency(recommendation.icp_profile.faturamento_ideal.minimo)} -{' '}
                  {formatCurrency(recommendation.icp_profile.faturamento_ideal.maximo)}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localização
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.icp_profile.localizacao_ideal.estados.map((estado, i) => (
                    <Badge key={i} variant="secondary">{estado}</Badge>
                  ))}
                </div>
                {recommendation.icp_profile.localizacao_ideal.regioes.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Regiões: {recommendation.icp_profile.localizacao_ideal.regioes.join(', ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Características Especiais */}
        {recommendation.icp_profile.caracteristicas_especiais.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Características Especiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recommendation.icp_profile.caracteristicas_especiais.map((caracteristica, i) => (
                  <Badge key={i} variant="default">{caracteristica}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análise Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Padrões Identificados</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {recommendation.analise_detalhada.padroes_identificados.map((padrao, i) => (
                  <li key={i}>{padrao}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Oportunidades Identificadas</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {recommendation.analise_detalhada.oportunidades_identificadas.map((oportunidade, i) => (
                  <li key={i}>{oportunidade}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recomendações Estratégicas</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {recommendation.analise_detalhada.recomendacoes_estrategicas.map((recomendacao, i) => (
                  <li key={i}>{recomendacao}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Justificativa</h4>
              <p className="text-sm leading-relaxed">{recommendation.analise_detalhada.justificativa}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Ir para Dashboard
          </Button>
          <Button onClick={() => navigate('/central-icp/batch-analysis')}>
            Começar Busca de Empresas
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

