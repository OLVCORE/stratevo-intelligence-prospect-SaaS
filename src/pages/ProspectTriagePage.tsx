import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Filter,
  Search,
  Target,
  Building2,
  MapPin,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ProspectTriagePage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string[]>([]);

  useEffect(() => {
    if (tenant?.id) {
      loadProspects();
    }
  }, [tenant?.id]);

  const loadProspects = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qualified_prospects')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('pipeline_status', 'new')
        .order('fit_score', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar prospects:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os prospects.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (prospectIds: string[]) => {
    try {
      const { error } = await supabase
        .from('qualified_prospects')
        .update({ 
          pipeline_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .in('id', prospectIds);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `${prospectIds.length} prospect(s) aprovado(s)`,
      });

      loadProspects();
      setSelectedProspects([]);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDiscard = async (prospectIds: string[], reason: string) => {
    try {
      const { error } = await supabase
        .from('qualified_prospects')
        .update({ 
          pipeline_status: 'discarded',
          discarded_at: new Date().toISOString(),
          discard_reason: reason
        })
        .in('id', prospectIds);

      if (error) throw error;

      toast({
        title: 'Descartado',
        description: `${prospectIds.length} prospect(s) descartado(s)`,
      });

      loadProspects();
      setSelectedProspects([]);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getGradeBadge = (grade: string) => {
    const config = {
      'A+': { bg: 'bg-emerald-600', label: 'A+' },
      'A': { bg: 'bg-emerald-500', label: 'A' },
      'B': { bg: 'bg-sky-500', label: 'B' },
      'C': { bg: 'bg-orange-500', label: 'C' },
      'D': { bg: 'bg-rose-500', label: 'D' },
    }[grade] || { bg: 'bg-gray-500', label: 'N/A' };

    return <Badge className={config.bg}>{config.label}</Badge>;
  };

  const filteredProspects = prospects.filter(p => {
    const matchSearch = !searchTerm || 
      p.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cnpj?.includes(searchTerm);
    
    const matchGrade = filterGrade.length === 0 || filterGrade.includes(p.grade);
    
    return matchSearch && matchGrade;
  });

  const stats = {
    total: prospects.length,
    aPlus: prospects.filter(p => p.grade === 'A+').length,
    a: prospects.filter(p => p.grade === 'A').length,
    b: prospects.filter(p => p.grade === 'B').length,
    c: prospects.filter(p => p.grade === 'C').length,
    d: prospects.filter(p => p.grade === 'D').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/search')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">⚡ Triagem de Prospects</h1>
            <p className="text-muted-foreground mt-1">
              Revise e aprove prospects qualificados pelo Motor de Qualificação
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            disabled={selectedProspects.length === 0}
            onClick={() => handleApprove(selectedProspects)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Aprovar Selecionados ({selectedProspects.length})
          </Button>
          <Button
            variant="destructive"
            disabled={selectedProspects.length === 0}
            onClick={() => handleDiscard(selectedProspects, 'Descarte em massa')}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Descartar ({selectedProspects.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription>A+ (≥90%)</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.aPlus}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription>A (75-89%)</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{stats.a}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardDescription>B (60-74%)</CardDescription>
            <CardTitle className="text-3xl text-sky-500">{stats.b}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription>C (40-59%)</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{stats.c}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardDescription>D ({'<'}40%)</CardDescription>
            <CardTitle className="text-3xl text-rose-500">{stats.d}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['A+', 'A', 'B', 'C', 'D'].map(grade => (
                <Button
                  key={grade}
                  variant={filterGrade.includes(grade) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (filterGrade.includes(grade)) {
                      setFilterGrade(filterGrade.filter(g => g !== grade));
                    } else {
                      setFilterGrade([...filterGrade, grade]);
                    }
                  }}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Carregando prospects...</p>
            </CardContent>
          </Card>
        ) : filteredProspects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum prospect para triagem</h3>
              <p className="text-muted-foreground mb-4">
                Faça upload de CNPJs no Motor de Qualificação
              </p>
              <Button onClick={() => navigate('/search')}>
                <Sparkles className="w-4 h-4 mr-2" />
                Ir para Motor de Qualificação
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProspects.map(prospect => (
            <Card key={prospect.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedProspects.includes(prospect.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProspects([...selectedProspects, prospect.id]);
                        } else {
                          setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{prospect.razao_social}</h3>
                          <p className="text-sm text-muted-foreground">{prospect.cnpj}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getGradeBadge(prospect.grade)}
                          <Badge variant="outline" className="font-mono">
                            {prospect.fit_score?.toFixed(0)}% FIT
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        {prospect.setor && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                            <span className="truncate">{prospect.setor}</span>
                          </div>
                        )}
                        {prospect.cidade && prospect.estado && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-600" />
                            <span>{prospect.cidade}, {prospect.estado}</span>
                          </div>
                        )}
                        {prospect.porte && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span>{prospect.porte}</span>
                          </div>
                        )}
                      </div>

                      {/* Scores Breakdown */}
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Setor</p>
                          <Progress value={prospect.sector_fit_score || 0} className="h-2" />
                          <p className="text-xs font-semibold mt-1">{prospect.sector_fit_score?.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Geo</p>
                          <Progress value={prospect.geo_fit_score || 0} className="h-2" />
                          <p className="text-xs font-semibold mt-1">{prospect.geo_fit_score?.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Porte</p>
                          <Progress value={prospect.capital_fit_score || 0} className="h-2" />
                          <p className="text-xs font-semibold mt-1">{prospect.capital_fit_score?.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Digital</p>
                          <Progress value={prospect.maturity_score || 0} className="h-2" />
                          <p className="text-xs font-semibold mt-1">{prospect.maturity_score?.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Produtos</p>
                          <Progress value={prospect.product_similarity_score || 0} className="h-2" />
                          <p className="text-xs font-semibold mt-1">{prospect.product_similarity_score?.toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove([prospect.id])}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDiscard([prospect.id], 'Não adequado ao ICP')}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

