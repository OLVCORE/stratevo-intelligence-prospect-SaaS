import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import StrategicActionPlan from '@/components/icp/StrategicActionPlan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StrategicPlanPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [loading, setLoading] = useState(true);
  const [tenantData, setTenantData] = useState<any>(null);
  const [mainIcpId, setMainIcpId] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadTenantData();
    }
  }, [tenantId]);

  const loadTenantData = async () => {
    setLoading(true);
    try {
      // Buscar dados do tenant
      const { data: tData, error: tError } = await (supabase as any)
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tError) throw tError;
      setTenantData(tData);

      // Buscar ICP principal
      const { data: icpData, error: icpError } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_main_icp', true)
        .maybeSingle();

      if (!icpError && icpData) {
        setMainIcpId(icpData.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (!tenantId || !tenantData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma empresa selecionada</h3>
          <p className="text-muted-foreground mb-4">
            Selecione uma empresa no menu superior para acessar o plano estratégico.
          </p>
          <Button onClick={() => navigate('/my-companies')}>
            Ir para Minhas Empresas
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            Plano Estratégico de Ação
          </h1>
          <p className="text-muted-foreground">
            {tenantData?.razao_social || tenantData?.nome_fantasia || 'Sua Empresa'}
          </p>
        </div>
      </div>

      {/* Componente principal */}
      <StrategicActionPlan
        tenantId={tenantId}
        icpId={mainIcpId || undefined}
        companyName={tenantData?.razao_social || tenantData?.nome_fantasia || 'Sua Empresa'}
        companyCapitalSocial={tenantData?.capital_social || 0}
      />
    </div>
  );
}

