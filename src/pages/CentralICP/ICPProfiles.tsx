import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Plus, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ICPProfiles() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      loadProfiles();
    }
  }, [tenantId]);

  const loadProfiles = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar ICPs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os ICPs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Meus ICPs</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os ICPs configurados para seu tenant
          </p>
        </div>
        <Button onClick={() => navigate('/central-icp/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo ICP
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando ICPs...</p>
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ICP configurado</h3>
            <p className="text-muted-foreground mb-4">
              Configure seu primeiro ICP através do onboarding para começar a buscar empresas.
            </p>
            <Button onClick={() => navigate('/central-icp/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro ICP
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {profile.nome || `ICP ${profile.tipo || 'Principal'}`}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {profile.descricao || 'Perfil de Cliente Ideal'}
                    </CardDescription>
                  </div>
                  {profile.icp_principal && (
                    <Badge variant="default">Principal</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={profile.ativo ? 'default' : 'secondary'}>
                    {profile.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">
                    {profile.tipo || 'Geral'}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/central-icp/batch-analysis?icp=${profile.id}`)}
                  >
                    Análise em Massa
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/central-icp/individual?icp=${profile.id}`)}
                  >
                    Análise Individual
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/central-icp/profile/${profile.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

