import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mic, Volume2, MessageSquare, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAgent {
  id: string;
  tenant_id: string;
  agent_name: string;
  agent_personality: string;
  agent_language: string;
  voice_id: string;
  voice_stability: number;
  voice_similarity_boost: number;
  greeting_script: string;
  qualification_questions: string[];
  objection_handling: Record<string, string>;
  closing_script: string;
  max_call_duration_seconds: number;
  auto_hangup_on_silence: boolean;
  silence_threshold_seconds: number;
  auto_create_activity: boolean;
  auto_transcribe: boolean;
  auto_sentiment_analysis: boolean;
  is_active: boolean;
}

const PERSONALITIES = [
  { value: 'profissional', label: '👔 Profissional', description: 'Formal, objetivo e direto' },
  { value: 'amigável', label: '😊 Amigável', description: 'Caloroso, empático e acessível' },
  { value: 'técnico', label: '🔧 Técnico', description: 'Especializado, preciso e detalhista' },
  { value: 'consultivo', label: '🎯 Consultivo', description: 'Conselheiro, estratégico e orientador' },
  { value: 'energético', label: '⚡ Energético', description: 'Dinâmico, motivador e entusiasta' },
];

const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Feminina - BR)', accent: 'pt-BR' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Feminina - US)', accent: 'en-US' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculina - US)', accent: 'en-US' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam (Masculina - US)', accent: 'en-US' },
];

export function VoiceAgentConfig() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  // Buscar configuração do agente
  const { data: agent, isLoading } = useQuery({
    queryKey: ['voice-agent', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_voice_agents')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as VoiceAgent | null;
    },
    enabled: !!tenant?.id,
  });

  // Mutation para criar/atualizar agente
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<VoiceAgent>) => {
      if (agent?.id) {
        // Atualizar existente
        const { error } = await supabase
          .from('ai_voice_agents')
          .update(data)
          .eq('id', agent.id);
        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('ai_voice_agents')
          .insert({
            tenant_id: tenant?.id,
            ...data,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-agent', tenant?.id] });
      toast.success('Agente de voz configurado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar configuração: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!formData.agent_name || !formData.greeting_script) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleTestVoice = async () => {
    setIsTesting(true);
    try {
      // TODO: Integrar com ElevenLabs para testar voz
      toast.info('Teste de voz em desenvolvimento...');
    } catch (error) {
      toast.error('Erro ao testar voz');
    } finally {
      setIsTesting(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState<Partial<VoiceAgent>>({
    agent_name: agent?.agent_name || `Assistente Virtual ${tenant?.name || ''}`,
    agent_personality: agent?.agent_personality || 'profissional',
    agent_language: agent?.agent_language || 'pt-BR',
    voice_id: agent?.voice_id || ELEVENLABS_VOICES[0].id,
    voice_stability: agent?.voice_stability || 0.75,
    voice_similarity_boost: agent?.voice_similarity_boost || 0.75,
    greeting_script: agent?.greeting_script || `Olá! Sou o assistente virtual da ${tenant?.name}. Como posso ajudá-lo hoje?`,
    closing_script: agent?.closing_script || 'Foi um prazer conversar com você. Tenha um ótimo dia!',
    max_call_duration_seconds: agent?.max_call_duration_seconds || 300,
    auto_hangup_on_silence: agent?.auto_hangup_on_silence ?? true,
    silence_threshold_seconds: agent?.silence_threshold_seconds || 10,
    auto_create_activity: agent?.auto_create_activity ?? true,
    auto_transcribe: agent?.auto_transcribe ?? true,
    auto_sentiment_analysis: agent?.auto_sentiment_analysis ?? true,
  });

  React.useEffect(() => {
    if (agent) {
      setFormData(agent);
    }
  }, [agent]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando configuração...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Configuração do Agente de Voz IA
              </CardTitle>
              <CardDescription>
                Configure seu assistente virtual personalizado para ligações automáticas 24/7
              </CardDescription>
            </div>
            {agent?.is_active && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Informação Importante */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Multi-Tenant:</strong> Este agente de voz é exclusivo do seu tenant "{tenant?.name}". 
          Cada empresa tem seu próprio assistente com nome, personalidade e scripts personalizados.
        </AlertDescription>
      </Alert>

      {/* Configuração Básica */}
      <Card>
        <CardHeader>
          <CardTitle>1. Identificação do Agente</CardTitle>
          <CardDescription>Como seu agente se apresentará nas chamadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent_name">Nome do Agente *</Label>
            <Input
              id="agent_name"
              value={formData.agent_name}
              onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
              placeholder="Ex: Assistente Virtual Acme Corp"
            />
            <p className="text-xs text-muted-foreground">
              O agente se apresentará com este nome ao iniciar a chamada
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Personalidade</Label>
            <Select 
              value={formData.agent_personality} 
              onValueChange={(value) => setFormData({ ...formData, agent_personality: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONALITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Voz */}
      <Card>
        <CardHeader>
          <CardTitle>2. Voz & Áudio</CardTitle>
          <CardDescription>Escolha a voz e ajuste parâmetros de naturalidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="voice">Voz do ElevenLabs</Label>
            <Select 
              value={formData.voice_id} 
              onValueChange={(value) => setFormData({ ...formData, voice_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEVENLABS_VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <span>{v.name}</span>
                      <Badge variant="outline" className="text-xs">{v.accent}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestVoice} 
              disabled={isTesting}
              className="mt-2"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
              Testar Voz
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Estabilidade ({Math.round((formData.voice_stability || 0.75) * 100)}%)</Label>
                <span className="text-xs text-muted-foreground">Consistência da voz</span>
              </div>
              <Slider
                value={[formData.voice_stability || 0.75]}
                onValueChange={([value]) => setFormData({ ...formData, voice_stability: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Similaridade ({Math.round((formData.voice_similarity_boost || 0.75) * 100)}%)</Label>
                <span className="text-xs text-muted-foreground">Naturalidade</span>
              </div>
              <Slider
                value={[formData.voice_similarity_boost || 0.75]}
                onValueChange={([value]) => setFormData({ ...formData, voice_similarity_boost: value })}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scripts */}
      <Card>
        <CardHeader>
          <CardTitle>3. Scripts de Conversação</CardTitle>
          <CardDescription>Defina como o agente iniciará e encerrará as chamadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="greeting">Script de Saudação *</Label>
            <Textarea
              id="greeting"
              value={formData.greeting_script}
              onChange={(e) => setFormData({ ...formData, greeting_script: e.target.value })}
              placeholder="Ex: Olá! Sou o assistente virtual da Acme Corp. Como posso ajudá-lo?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing">Script de Encerramento</Label>
            <Textarea
              id="closing"
              value={formData.closing_script}
              onChange={(e) => setFormData({ ...formData, closing_script: e.target.value })}
              placeholder="Ex: Foi um prazer conversar com você. Tenha um ótimo dia!"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Automações */}
      <Card>
        <CardHeader>
          <CardTitle>4. Automações & Integrações</CardTitle>
          <CardDescription>Configure comportamentos automáticos do agente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transcrição Automática</Label>
              <p className="text-xs text-muted-foreground">Transcrever todas as chamadas automaticamente</p>
            </div>
            <Switch
              checked={formData.auto_transcribe}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_transcribe: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Análise de Sentimento</Label>
              <p className="text-xs text-muted-foreground">Detectar emoções e sentimentos do prospect</p>
            </div>
            <Switch
              checked={formData.auto_sentiment_analysis}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_sentiment_analysis: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Criar Atividade no CRM</Label>
              <p className="text-xs text-muted-foreground">Registrar chamada automaticamente no CRM</p>
            </div>
            <Switch
              checked={formData.auto_create_activity}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_create_activity: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          size="lg"
          className="flex-1"
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configuração
            </>
          )}
        </Button>

        <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>
    </div>
  );
}


