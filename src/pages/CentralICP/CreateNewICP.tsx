import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Building2, MapPin, FileText, Info, Target, Sparkles } from 'lucide-react';
import { Step2SetoresNichos } from '@/components/onboarding/steps/Step2SetoresNichos';
import { Step3PerfilClienteIdeal } from '@/components/onboarding/steps/Step3PerfilClienteIdeal';
import { Step4SituacaoAtual } from '@/components/onboarding/steps/Step4SituacaoAtual';
import { Step5HistoricoEnriquecimento } from '@/components/onboarding/steps/Step5HistoricoEnriquecimento';
import { StepNavigation } from '@/components/onboarding/StepNavigation';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ICPFormData = {
  icpName?: string;
  icpNumber?: string;
  step2_SetoresNichos?: any;
  step3_PerfilClienteIdeal?: any;
  step4_SituacaoAtual?: any;
  step5_HistoricoEEnriquecimento?: any;
};

interface CompanyData {
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  setor?: string;
  anoFundacao?: number;
}

export default function CreateNewICP() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [currentStep, setCurrentStep] = useState(0); // Step 0 = Nome do ICP
  const [formData, setFormData] = useState<ICPFormData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [icpNumber, setIcpNumber] = useState<string>('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [existingICPCount, setExistingICPCount] = useState(0);

  const totalSteps = 5; // 0 = Nome, 1 = Step2, 2 = Step3, 3 = Step4, 4 = Step5

  // Buscar dados da empresa e próximo número de ICP ao carregar
  useEffect(() => {
    if (tenantId) {
      loadNextICPNumber();
      loadCompanyData();
    }
  }, [tenantId]);

  // Carregar dados da empresa do onboarding existente
  const loadCompanyData = async () => {
    if (!tenantId) return;
    
    try {
      const { data: session, error } = await (supabase as any)
        .from('onboarding_sessions')
        .select('step1_data')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && session?.step1_data) {
        const step1 = session.step1_data;
        setCompanyData({
          razaoSocial: step1.razaoSocial,
          nomeFantasia: step1.nomeFantasia,
          cnpj: step1.cnpj,
          cidade: step1.cidade,
          estado: step1.estado,
          setor: step1.setor,
          anoFundacao: step1.anoFundacao,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const loadNextICPNumber = async () => {
    if (!tenantId) return;
    
    try {
      const { count, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (error) throw error;
      
      const currentCount = count || 0;
      setExistingICPCount(currentCount);
      
      const nextNumber = currentCount + 1;
      const formattedNumber = String(nextNumber).padStart(3, '0');
      setIcpNumber(`ICP-${formattedNumber}`);
      setFormData(prev => ({ ...prev, icpNumber: `ICP-${formattedNumber}` }));
    } catch (error: any) {
      console.error('Erro ao buscar número do ICP:', error);
      const fallbackNumber = `ICP-${new Date().getTime().toString().slice(-3)}`;
      setIcpNumber(fallbackNumber);
      setFormData(prev => ({ ...prev, icpNumber: fallbackNumber }));
    }
  };

  const handleNext = async (stepData?: any) => {
    if (currentStep === 0) {
      // Step 0: Validar nome do ICP
      if (!formData.icpName || !formData.icpName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Por favor, informe um nome para o ICP.',
          variant: 'destructive',
        });
        return;
      }
      setCurrentStep(1);
      return;
    }

    // Steps 1-4: Etapas 2, 3, 4, 5 do onboarding
    const stepNumber = currentStep; // 1 = Step2, 2 = Step3, 3 = Step4, 4 = Step5
    const stepKey = `step${stepNumber + 1}_${getStepName(stepNumber + 1)}` as keyof ICPFormData;
    const updatedFormData = {
      ...formData,
      [stepKey]: stepData,
    };
    
    setFormData(updatedFormData);
    setHasUnsavedChanges(false);

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Último step - salvar ICP
      await saveICP(updatedFormData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/central-icp/profiles');
    }
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Salvar como rascunho (não implementado ainda - precisa criar tabela de rascunhos)
      toast({
        title: 'Rascunho salvo',
        description: 'Seus dados foram salvos como rascunho.',
      });
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Erro ao salvar rascunho:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o rascunho.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveICP = async (data: ICPFormData) => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Usuário não autenticado');

      const step2 = data.step2_SetoresNichos || {};
      const step3 = data.step3_PerfilClienteIdeal || {};
      
      // Chamar função para criar ICP
      // Supabase converte arrays automaticamente para JSONB
      const { data: result, error } = await (supabase as any).rpc('create_icp_profile', {
        p_tenant_id: tenantId,
        p_nome: `${formData.icpNumber} - ${formData.icpName}`,
        p_descricao: `ICP criado manualmente: ${formData.icpName}`,
        p_tipo: 'core',
        p_setor_foco: step2.setoresAlvo?.[0] || step3.setoresAlvo?.[0] || null,
        p_nicho_foco: step2.nichosAlvo?.[0] || step3.nichosAlvo?.[0] || null,
        p_setores_alvo: step2.setoresAlvo || step3.setoresAlvo || [],
        p_cnaes_alvo: step2.cnaesAlvo || step3.cnaesAlvo || [],
        p_porte_alvo: step3.porteAlvo || [],
        p_estados_alvo: step3.localizacaoAlvo?.estados || [],
        p_regioes_alvo: step3.localizacaoAlvo?.regioes || [],
        p_faturamento_min: step3.faturamentoAlvo?.minimo || null,
        p_faturamento_max: step3.faturamentoAlvo?.maximo || null,
        p_funcionarios_min: step3.funcionariosAlvo?.minimo || null,
        p_funcionarios_max: step3.funcionariosAlvo?.maximo || null,
        p_caracteristicas_buscar: step3.caracteristicasEspeciais || [],
        p_icp_principal: false, // Novo ICP não é principal
      });

      if (error) throw error;

      toast({
        title: 'ICP criado com sucesso!',
        description: 'Seu novo ICP foi salvo e está pronto para uso.',
      });

      setTimeout(() => {
        navigate('/central-icp/profiles');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao criar ICP:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o ICP.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStepName = (step: number): string => {
    const names: Record<number, string> = {
      2: 'SetoresNichos',
      3: 'PerfilClienteIdeal',
      4: 'SituacaoAtual',
      5: 'HistoricoEEnriquecimento',
    };
    return names[step] || '';
  };

  const renderStep = () => {
    // Step 0: Nome do ICP
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          {/* Card da Empresa (Step 1 Base) */}
          {companyData && (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Empresa Base
                </CardTitle>
                <CardDescription>
                  Este ICP será criado para a empresa abaixo (dados do Step 1)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Razão Social</p>
                    <p className="font-semibold text-sm">{companyData.razaoSocial || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="font-mono text-sm">{companyData.cnpj || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {companyData.cidade}, {companyData.estado}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Setor</p>
                    <Badge variant="outline">{companyData.setor || 'N/A'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta informativo */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Criando ICP #{existingICPCount + 1}</strong> - Os dados da empresa (Step 1) serão mantidos.
              Você configurará novos setores, nichos e perfis a partir da Step 2.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="icpNumber">Número do ICP (Automático)</Label>
            <Input
              id="icpNumber"
              value={icpNumber}
              disabled
              className="bg-muted font-mono"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icpName">Nome do ICP *</Label>
            <Input
              id="icpName"
              value={formData.icpName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, icpName: e.target.value }))}
              placeholder="Ex: ICP Manufatura SP, ICP Agronegócio MG, ICP Exportação..."
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground">
              Dê um nome descritivo para identificar este perfil de cliente ideal.
              Sugestão: inclua o setor ou nicho alvo no nome.
            </p>
          </div>

          {/* Sugestões de nomes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Sugestões de nomes:</p>
            <div className="flex flex-wrap gap-2">
              {['Manufatura Nacional', 'Indústria Automotiva', 'Agronegócio Sul', 'Tech Startups', 'Varejo Premium'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, icpName: suggestion }))}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleBack}>
              Cancelar
            </Button>
            <Button onClick={() => handleNext()}>
              <Target className="h-4 w-4 mr-2" />
              Continuar para Step 2
            </Button>
          </div>
        </div>
      );
    }

    // Steps 1-4: Etapas 2, 3, 4, 5
    const stepNumber = currentStep; // 1 = Step2, 2 = Step3, 3 = Step4, 4 = Step5
    const actualStepNumber = stepNumber + 1; // Step 2, 3, 4, 5
    const stepKey = `step${actualStepNumber}_${getStepName(actualStepNumber)}` as keyof ICPFormData;
    const initialData = formData[stepKey];

    switch (actualStepNumber) {
      case 2:
        return (
          <Step2SetoresNichos
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleSave}
            initialData={initialData}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        );
      case 3:
        // Step3 precisa dos setores/nichos do Step2
        const step3InitialData = {
          ...initialData,
          setoresAlvo: formData.step2_SetoresNichos?.setoresAlvo || [],
          nichosAlvo: formData.step2_SetoresNichos?.nichosAlvo || [],
        };
        return (
          <Step3PerfilClienteIdeal
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleSave}
            initialData={step3InitialData}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        );
      case 4:
        return (
          <Step4SituacaoAtual
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleSave}
            initialData={initialData}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        );
      case 5:
        return (
          <Step5HistoricoEnriquecimento
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleSave}
            initialData={initialData}
            isSubmitting={false}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/central-icp/profiles')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Criar Novo ICP</h1>
          <p className="text-muted-foreground">
            Configure um novo perfil de cliente ideal para buscar empresas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 0 ? 'Nome do ICP' : `Etapa ${currentStep} de ${totalSteps - 1}`}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Dê um nome para identificar este perfil de cliente ideal'}
            {currentStep === 1 && 'Defina setores e nichos que você quer prospectar'}
            {currentStep === 2 && 'Defina o perfil do cliente ideal'}
            {currentStep === 3 && 'Conte-nos sobre sua solução e mercado'}
            {currentStep === 4 && 'Adicione informações sobre clientes atuais (opcional)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}

