/**
 * 🔧 Componente para configurar critérios de análise adicionais do ICP
 * Permite ao usuário selecionar quais análises devem ser incluídas na geração
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface CustomCriterion {
  name: string;
  enabled: boolean;
  description: string;
}

interface AnalysisCriteria {
  id?: string;
  icp_profile_metadata_id: string;
  include_macroeconomic: boolean;
  include_sector_analysis: boolean;
  include_cnae_analysis: boolean;
  include_foreign_trade: boolean;
  include_statistical_analysis: boolean;
  include_competitive_analysis: boolean;
  include_market_trends: boolean;
  include_predictions: boolean;
  custom_criteria: CustomCriterion[];
}

interface Props {
  icpId: string;
  onSave?: () => void;
}

export default function ICPAnalysisCriteriaConfig({ icpId, onSave }: Props) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [criteria, setCriteria] = useState<AnalysisCriteria>({
    icp_profile_metadata_id: icpId,
    include_macroeconomic: true,
    include_sector_analysis: true,
    include_cnae_analysis: true,
    include_foreign_trade: false,
    include_statistical_analysis: true,
    include_competitive_analysis: true,
    include_market_trends: true,
    include_predictions: true,
    custom_criteria: [],
  });

  const [newCustomCriterion, setNewCustomCriterion] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (tenantId && icpId) {
      loadCriteria();
    }
  }, [tenantId, icpId]);

  const loadCriteria = async () => {
    if (!tenantId || !icpId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('icp_analysis_criteria')
        .select('*')
        .eq('icp_profile_metadata_id', icpId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCriteria({
          ...data,
          custom_criteria: data.custom_criteria || [],
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar critérios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os critérios de análise.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId || !icpId) return;

    setSaving(true);
    try {
      const criteriaData = {
        ...criteria,
        tenant_id: tenantId,
        icp_profile_metadata_id: icpId,
      };

      const { error } = await supabase
        .from('icp_analysis_criteria')
        .upsert(criteriaData, {
          onConflict: 'icp_profile_metadata_id',
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Critérios de análise salvos com sucesso!',
      });

      if (onSave) onSave();
    } catch (error: any) {
      console.error('Erro ao salvar critérios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os critérios de análise.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomCriterion = () => {
    if (!newCustomCriterion.name.trim()) {
      toast({
        title: 'Aviso',
        description: 'Digite um nome para o critério personalizado.',
        variant: 'destructive',
      });
      return;
    }

    setCriteria({
      ...criteria,
      custom_criteria: [
        ...criteria.custom_criteria,
        {
          name: newCustomCriterion.name,
          description: newCustomCriterion.description,
          enabled: true,
        },
      ],
    });

    setNewCustomCriterion({ name: '', description: '' });
  };

  const handleRemoveCustomCriterion = (index: number) => {
    setCriteria({
      ...criteria,
      custom_criteria: criteria.custom_criteria.filter((_, i) => i !== index),
    });
  };

  const handleToggleCustomCriterion = (index: number) => {
    const updated = [...criteria.custom_criteria];
    updated[index].enabled = !updated[index].enabled;
    setCriteria({
      ...criteria,
      custom_criteria: updated,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Carregando critérios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critérios de Análise Adicionais</CardTitle>
        <CardDescription>
          Configure quais análises devem ser incluídas na geração do ICP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critérios Básicos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Análises Básicas</h3>
          
          <div className="space-y-3">
            {[
              { 
                key: 'include_macroeconomic', 
                label: 'Análise Macroeconômica', 
                description: 'Dados macroeconômicos do Brasil (PIB, inflação, crescimento setorial), projeções futuras baseadas em dados do IBGE e ABDI, análise de tendências econômicas nacionais e regionais' 
              },
              { 
                key: 'include_sector_analysis', 
                label: 'Análise de Setores', 
                description: 'Análise detalhada dos setores alvo: crescimento histórico, projeções futuras, tamanho de mercado, oportunidades de negócio, barreiras de entrada, análise de cadeia de valor' 
              },
              { 
                key: 'include_cnae_analysis', 
                label: 'Análise de CNAEs', 
                description: 'Análise de CNAEs (Código Nacional de Atividades Econômicas): potencial de mercado, número de empresas por CNAE, correlação com clientes atuais, crescimento setorial, oportunidades não exploradas' 
              },
              { 
                key: 'include_statistical_analysis', 
                label: 'Análise Estatística', 
                description: 'Análise estatística dos clientes atuais: padrões identificados, correlações entre variáveis, características dos melhores clientes vs médios, análise de ticket médio, ciclo de venda, motivos de compra' 
              },
              { 
                key: 'include_competitive_analysis', 
                label: 'Análise Competitiva', 
                description: 'Análise de concorrentes e posicionamento: principais players do mercado, diferenciais competitivos, análise de pricing, estratégias de mercado, oportunidades de diferenciação' 
              },
              { 
                key: 'include_market_trends', 
                label: 'Tendências de Mercado', 
                description: 'Tendências e projeções futuras: mudanças no mercado, novas tecnologias, transformações setoriais, comportamento do consumidor, oportunidades emergentes' 
              },
              { 
                key: 'include_predictions', 
                label: 'Previsões e Projeções', 
                description: 'Previsões baseadas em dados históricos: análise preditiva usando padrões dos clientes atuais, projeções de crescimento, identificação de tendências, análise de correlações para prever comportamento futuro' 
              },
              { 
                key: 'include_foreign_trade', 
                label: 'Comércio Exterior', 
                description: 'Análise de importação/exportação: NCMs mais promissores, países-alvo com maior potencial, análise alfandegária e regulatória, oportunidades de supply chain internacional, análise de comércio exterior brasileiro' 
              },
            ].map((item) => (
              <div key={item.key} className="flex items-start space-x-3">
                <Checkbox
                  id={item.key}
                  checked={criteria[item.key as keyof AnalysisCriteria] as boolean}
                  onCheckedChange={(checked) => {
                    setCriteria({
                      ...criteria,
                      [item.key]: checked,
                    });
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={item.key} className="cursor-pointer font-medium">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critérios Personalizados */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Critérios Personalizados</h3>
          
          {criteria.custom_criteria.length > 0 && (
            <div className="space-y-2">
              {criteria.custom_criteria.map((criterion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={criterion.enabled}
                    onCheckedChange={() => handleToggleCustomCriterion(index)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={criterion.enabled ? 'default' : 'secondary'}>
                        {criterion.name}
                      </Badge>
                    </div>
                    {criterion.description && (
                      <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCustomCriterion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nome do critério personalizado"
                value={newCustomCriterion.name}
                onChange={(e) => setNewCustomCriterion({ ...newCustomCriterion, name: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Descrição (opcional)"
              value={newCustomCriterion.description}
              onChange={(e) => setNewCustomCriterion({ ...newCustomCriterion, description: e.target.value })}
              rows={2}
            />
            <Button
              variant="outline"
              onClick={handleAddCustomCriterion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Critério Personalizado
            </Button>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Critérios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

