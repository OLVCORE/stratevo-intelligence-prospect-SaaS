/**
 * Configuração de Pesos para Motor de Qualificação
 * Permite personalizar os critérios de qualificação por tenant
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings2, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  Factory,
  DollarSign,
  Users,
  MapPin,
  FileText,
  Target,
  Loader2,
  Info,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from '@/services/icpQualificationEngine';

interface WeightsConfig {
  weight_cnae: number;
  weight_capital_social: number;
  weight_porte: number;
  weight_localizacao: number;
  weight_situacao: number;
  weight_setor: number;
  threshold_hot: number;
  threshold_warm: number;
  auto_approve_hot: boolean;
  auto_discard_cold: boolean;
}

export default function QualificationWeightsConfig() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<WeightsConfig>({
    weight_cnae: DEFAULT_WEIGHTS.cnae,
    weight_capital_social: DEFAULT_WEIGHTS.capital_social,
    weight_porte: DEFAULT_WEIGHTS.porte,
    weight_localizacao: DEFAULT_WEIGHTS.localizacao,
    weight_situacao: DEFAULT_WEIGHTS.situacao,
    weight_setor: DEFAULT_WEIGHTS.setor,
    threshold_hot: DEFAULT_THRESHOLDS.hot_min,
    threshold_warm: DEFAULT_THRESHOLDS.warm_min,
    auto_approve_hot: DEFAULT_THRESHOLDS.auto_approve,
    auto_discard_cold: DEFAULT_THRESHOLDS.auto_discard
  });
  
  const totalWeight = 
    config.weight_cnae + 
    config.weight_capital_social + 
    config.weight_porte + 
    config.weight_localizacao + 
    config.weight_situacao + 
    config.weight_setor;

  useEffect(() => {
    if (tenantId) {
      loadConfig();
    }
  }, [tenantId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('qualification_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (!error && data) {
        setConfig({
          weight_cnae: data.weight_cnae ?? DEFAULT_WEIGHTS.cnae,
          weight_capital_social: data.weight_capital_social ?? DEFAULT_WEIGHTS.capital_social,
          weight_porte: data.weight_porte ?? DEFAULT_WEIGHTS.porte,
          weight_localizacao: data.weight_localizacao ?? DEFAULT_WEIGHTS.localizacao,
          weight_situacao: data.weight_situacao ?? DEFAULT_WEIGHTS.situacao,
          weight_setor: data.weight_setor ?? DEFAULT_WEIGHTS.setor,
          threshold_hot: data.threshold_hot ?? DEFAULT_THRESHOLDS.hot_min,
          threshold_warm: data.threshold_warm ?? DEFAULT_THRESHOLDS.warm_min,
          auto_approve_hot: data.auto_approve_hot ?? DEFAULT_THRESHOLDS.auto_approve,
          auto_discard_cold: data.auto_discard_cold ?? DEFAULT_THRESHOLDS.auto_discard
        });
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!tenantId) return;
    
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('qualification_config')
        .upsert({
          tenant_id: tenantId,
          ...config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' });

      if (error) throw error;

      toast({
        title: '✅ Configuração Salva',
        description: 'Os pesos de qualificação foram atualizados.'
      });
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      weight_cnae: DEFAULT_WEIGHTS.cnae,
      weight_capital_social: DEFAULT_WEIGHTS.capital_social,
      weight_porte: DEFAULT_WEIGHTS.porte,
      weight_localizacao: DEFAULT_WEIGHTS.localizacao,
      weight_situacao: DEFAULT_WEIGHTS.situacao,
      weight_setor: DEFAULT_WEIGHTS.setor,
      threshold_hot: DEFAULT_THRESHOLDS.hot_min,
      threshold_warm: DEFAULT_THRESHOLDS.warm_min,
      auto_approve_hot: DEFAULT_THRESHOLDS.auto_approve,
      auto_discard_cold: DEFAULT_THRESHOLDS.auto_discard
    });
    toast({
      title: 'Valores resetados',
      description: 'Configuração restaurada para os valores padrão.'
    });
  };

  if (loading) {
    return (
      <Card className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                Configuração de Qualificação
              </CardTitle>
              <CardDescription>
                Defina os pesos e thresholds para o motor de qualificação automática
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              <Button onClick={saveConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerta de peso total */}
      {totalWeight !== 100 && (
        <Alert variant={totalWeight > 100 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A soma dos pesos é <strong>{totalWeight}</strong>. 
            {totalWeight > 100 
              ? ' Reduza alguns pesos para o total não exceder 100.'
              : ' O ideal é que a soma seja próxima de 100 para scores mais precisos.'
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pesos dos Critérios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pesos dos Critérios
            </CardTitle>
            <CardDescription>
              Ajuste a importância de cada critério na qualificação (soma ideal: 100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CNAE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-blue-500" />
                  CNAE (Atividade Econômica)
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_cnae} pts</Badge>
              </div>
              <Slider
                value={[config.weight_cnae]}
                onValueChange={([v]) => setConfig({ ...config, weight_cnae: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Match do código CNAE com os setores alvo do ICP
              </p>
            </div>

            <Separator />

            {/* Capital Social */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Capital Social
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_capital_social} pts</Badge>
              </div>
              <Slider
                value={[config.weight_capital_social]}
                onValueChange={([v]) => setConfig({ ...config, weight_capital_social: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Verificação se o capital está dentro do range definido no ICP
              </p>
            </div>

            <Separator />

            {/* Porte */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Porte (Funcionários)
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_porte} pts</Badge>
              </div>
              <Slider
                value={[config.weight_porte]}
                onValueChange={([v]) => setConfig({ ...config, weight_porte: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Tamanho da empresa baseado em número de funcionários
              </p>
            </div>

            <Separator />

            {/* Localização */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Localização (UF/Cidade)
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_localizacao} pts</Badge>
              </div>
              <Slider
                value={[config.weight_localizacao]}
                onValueChange={([v]) => setConfig({ ...config, weight_localizacao: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Match com estados e cidades alvo do ICP
              </p>
            </div>

            <Separator />

            {/* Situação Cadastral */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Situação Cadastral
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_situacao} pts</Badge>
              </div>
              <Slider
                value={[config.weight_situacao]}
                onValueChange={([v]) => setConfig({ ...config, weight_situacao: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Status ATIVA vs BAIXADA/INAPTA/SUSPENSA
              </p>
            </div>

            <Separator />

            {/* Setor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  Setor/Nicho
                </Label>
                <Badge variant="outline" className="font-mono">{config.weight_setor} pts</Badge>
              </div>
              <Slider
                value={[config.weight_setor]}
                onValueChange={([v]) => setConfig({ ...config, weight_setor: v })}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Match com setores e nichos prioritários
              </p>
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total dos Pesos:</span>
                <Badge 
                  variant={totalWeight === 100 ? 'default' : totalWeight > 100 ? 'destructive' : 'secondary'}
                  className="text-lg px-4 py-1"
                >
                  {totalWeight} / 100
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thresholds e Comportamento */}
        <div className="space-y-6">
          {/* Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Thresholds de Temperatura
              </CardTitle>
              <CardDescription>
                Defina os limites para classificar leads como HOT, WARM ou COLD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hot Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    🔥 HOT (Score mínimo)
                  </Label>
                  <Badge className="bg-red-500 font-mono">{config.threshold_hot} pts</Badge>
                </div>
                <Slider
                  value={[config.threshold_hot]}
                  onValueChange={([v]) => setConfig({ ...config, threshold_hot: Math.max(v, config.threshold_warm + 10) })}
                  min={50}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Leads com score ≥ {config.threshold_hot} são classificados como HOT
                </p>
              </div>

              <Separator />

              {/* Warm Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    🟡 WARM (Score mínimo)
                  </Label>
                  <Badge className="bg-amber-500 font-mono">{config.threshold_warm} pts</Badge>
                </div>
                <Slider
                  value={[config.threshold_warm]}
                  onValueChange={([v]) => setConfig({ ...config, threshold_warm: Math.min(v, config.threshold_hot - 10) })}
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Leads com score {config.threshold_warm}-{config.threshold_hot - 1} são classificados como WARM
                </p>
              </div>

              {/* Cold info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  ❄️ <strong>COLD:</strong> Score abaixo de {config.threshold_warm}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comportamento Automático */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Comportamento Automático
              </CardTitle>
              <CardDescription>
                Configure ações automáticas baseadas na qualificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Approve Hot */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="font-semibold">Auto-aprovar HOT Leads</Label>
                  <p className="text-xs text-muted-foreground">
                    Leads HOT vão direto para o pipeline, sem quarentena
                  </p>
                </div>
                <Switch
                  checked={config.auto_approve_hot}
                  onCheckedChange={(v) => setConfig({ ...config, auto_approve_hot: v })}
                />
              </div>

              {/* Auto Discard Cold */}
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="font-semibold">Auto-descartar COLD Leads</Label>
                  <p className="text-xs text-muted-foreground">
                    Leads COLD são descartados automaticamente (não recomendado)
                  </p>
                </div>
                <Switch
                  checked={config.auto_discard_cold}
                  onCheckedChange={(v) => setConfig({ ...config, auto_discard_cold: v })}
                />
              </div>

              {config.auto_discard_cold && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cuidado: Leads COLD serão descartados automaticamente sem revisão manual.
                    Considere enviar para Nurturing ao invés de descartar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview da Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <span className="font-medium">🔥 HOT</span>
                  <span>Score ≥ {config.threshold_hot}</span>
                  <Badge className="bg-green-500">
                    {config.auto_approve_hot ? 'Auto-aprova' : 'Quarentena'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <span className="font-medium">🟡 WARM</span>
                  <span>Score {config.threshold_warm} - {config.threshold_hot - 1}</span>
                  <Badge className="bg-amber-500">Quarentena</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <span className="font-medium">❄️ COLD</span>
                  <span>Score &lt; {config.threshold_warm}</span>
                  <Badge className={config.auto_discard_cold ? 'bg-red-500' : 'bg-blue-500'}>
                    {config.auto_discard_cold ? 'Auto-descarta' : 'Nurturing'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

