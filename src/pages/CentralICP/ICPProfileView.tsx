import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Target, 
  Building2, 
  MapPin, 
  Users, 
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Award
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ICPProfile {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  setor_foco?: string;
  nicho_foco?: string;
  setores_alvo?: string[];
  cnaes_alvo?: string[];
  porte_alvo?: string[];
  estados_alvo?: string[];
  regioes_alvo?: string[];
  faturamento_min?: number;
  faturamento_max?: number;
  funcionarios_min?: number;
  funcionarios_max?: number;
  caracteristicas_buscar?: string[];
  icp_principal: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function ICPProfileView() {
  const { icpId } = useParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [profile, setProfile] = useState<ICPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (icpId && tenant?.id) {
      loadProfile();
    }
  }, [icpId, tenant?.id]);

  const loadProfile = async () => {
    if (!icpId || !tenant?.id) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('id', icpId)
        .eq('tenant_id', tenant.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Erro ao carregar ICP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil do ICP.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não especificado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando perfil do ICP...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">ICP não encontrado</h3>
            <Button onClick={() => navigate('/central-icp/profiles')}>
              Voltar para ICPs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/central-icp/profiles')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{profile.nome}</h1>
              {profile.icp_principal && (
                <Badge variant="default" className="bg-emerald-600">
                  <Award className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
              {profile.ativo ? (
                <Badge variant="default" className="bg-sky-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            {profile.descricao && (
              <p className="text-muted-foreground mt-1">{profile.descricao}</p>
            )}
          </div>
        </div>

        <Button onClick={() => navigate(`/central-icp/reports/${icpId}`)}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Ver Relatórios
        </Button>
      </div>

      {/* Resumo Executivo */}
      <Card className="border-l-4 border-l-emerald-600 shadow-md">
        <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-900/40 dark:to-emerald-800/20">
          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100">
            <Sparkles className="h-5 w-5" />
            Resumo do Perfil de Cliente Ideal
          </CardTitle>
          <CardDescription>
            Este é o perfil completo usado pelo Motor de Qualificação para pontuar prospects
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Setor e Nichos */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              SETOR E NICHOS
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Setor Principal</p>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700">
                  {profile.setor_foco || 'Não especificado'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nicho Foco</p>
                <Badge variant="outline" className="bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-700">
                  {profile.nicho_foco || 'Não especificado'}
                </Badge>
              </div>
            </div>
            
            {profile.setores_alvo && profile.setores_alvo.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Setores Alvo</p>
                <div className="flex flex-wrap gap-2">
                  {profile.setores_alvo.map((setor, idx) => (
                    <Badge key={idx} variant="secondary">
                      {setor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.cnaes_alvo && profile.cnaes_alvo.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">CNAEs Alvo</p>
                <div className="flex flex-wrap gap-2">
                  {profile.cnaes_alvo.map((cnae, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono text-xs">
                      {cnae}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Localização */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              LOCALIZAÇÃO
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {profile.estados_alvo && profile.estados_alvo.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estados Alvo</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.estados_alvo.map((estado, idx) => (
                      <Badge key={idx} variant="secondary">
                        {estado}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.regioes_alvo && profile.regioes_alvo.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Regiões Alvo</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.regioes_alvo.map((regiao, idx) => (
                      <Badge key={idx} variant="secondary">
                        {regiao}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Porte e Faturamento */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              PORTE E FATURAMENTO
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {profile.porte_alvo && profile.porte_alvo.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Porte Alvo</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.porte_alvo.map((porte, idx) => (
                      <Badge key={idx} variant="secondary">
                        {porte}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Faturamento</p>
                <div className="space-y-1">
                  <p className="text-sm">Mínimo: <span className="font-semibold">{formatCurrency(profile.faturamento_min)}</span></p>
                  <p className="text-sm">Máximo: <span className="font-semibold">{formatCurrency(profile.faturamento_max)}</span></p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Funcionários</p>
                <div className="space-y-1">
                  <p className="text-sm">Mínimo: <span className="font-semibold">{profile.funcionarios_min || 'Não especificado'}</span></p>
                  <p className="text-sm">Máximo: <span className="font-semibold">{profile.funcionarios_max || 'Não especificado'}</span></p>
                </div>
              </div>
            </div>
          </div>

          {profile.caracteristicas_buscar && profile.caracteristicas_buscar.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  CARACTERÍSTICAS ESPECIAIS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.caracteristicas_buscar.map((caracteristica, idx) => (
                    <Badge key={idx} variant="default" className="bg-indigo-600">
                      {caracteristica}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Como Funciona a Qualificação */}
      <Card className="border-l-4 border-l-indigo-600 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 dark:from-indigo-900/40 dark:to-indigo-800/20">
          <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100">
            <BarChart3 className="h-5 w-5" />
            Como o Motor de Qualificação Funciona
          </CardTitle>
          <CardDescription>
            O sistema calcula um FIT Score (0-100%) baseado em 5 dimensões
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900 rounded-full p-2">
                <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">1. Similaridade de Setor (Peso: 30%)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Compara o setor e CNAE da empresa com os setores alvo definidos acima
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-sky-100 dark:bg-sky-900 rounded-full p-2">
                <MapPin className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">2. Fit Geográfico (Peso: 15%)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifica se a empresa está nos estados/regiões alvo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-2">
                <TrendingUp className="h-4 w-4 text-purple-700 dark:text-purple-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">3. Fit de Porte (Peso: 25%)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Analisa faturamento e número de funcionários vs faixas definidas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-orange-100 dark:bg-orange-900 rounded-full p-2">
                <Sparkles className="h-4 w-4 text-orange-700 dark:text-orange-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">4. Maturidade Digital (Peso: 10%)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Avalia presença digital e uso de tecnologias
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-rose-100 dark:bg-rose-900 rounded-full p-2">
                <Target className="h-4 w-4 text-rose-700 dark:text-rose-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">5. Similaridade de Produtos (Peso: 20%)</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Compara produtos/serviços da empresa com seu catálogo
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Classificação Final</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span><Badge className="bg-emerald-600 mr-2">A+</Badge> FIT Score ≥ 90%</span>
                <span className="text-muted-foreground">Aprovação automática</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge className="bg-emerald-500 mr-2">A</Badge> FIT Score 75-89%</span>
                <span className="text-muted-foreground">Aprovação automática</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge className="bg-sky-500 mr-2">B</Badge> FIT Score 60-74%</span>
                <span className="text-muted-foreground">Revisão manual</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge className="bg-orange-500 mr-2">C</Badge> FIT Score 40-59%</span>
                <span className="text-muted-foreground">Revisão manual</span>
              </div>
              <div className="flex items-center justify-between">
                <span><Badge className="bg-rose-500 mr-2">D</Badge> FIT Score {'<'} 40%</span>
                <span className="text-muted-foreground">Descarte sugerido</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-semibold capitalize">{profile.tipo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-semibold">
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Última atualização</p>
              <p className="font-semibold">
                {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

