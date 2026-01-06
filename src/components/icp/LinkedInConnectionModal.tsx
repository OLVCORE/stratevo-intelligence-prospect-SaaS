// src/components/icp/LinkedInConnectionModal.tsx
// Modal de Conexão LinkedIn - Estilo Summitfy

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Linkedin, Rocket, Loader2, AlertCircle, CheckCircle2, ExternalLink, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkLinkedInAuth } from '@/services/linkedinOAuth';

interface LinkedInConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisor?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    linkedin_url?: string;
    company_name?: string;
  };
  onConnectionSent?: () => void;
  onOpenAuthDialog?: () => void; // ✅ NOVO: Callback para abrir modal de autenticação
}

// Templates de mensagens validadas
const MESSAGE_TEMPLATES = [
  {
    id: 'template-1',
    name: 'Template Profissional',
    message: 'Olá {firstName}!\n\nTudo bem? Sou {seuNome}, {seuCargo} na {suaEmpresa}.\n\nVi que você trabalha como {cargoDecisor} na {empresaDecisor} e gostaria de conectar para trocarmos experiências sobre o setor.\n\nAguardo sua conexão!\n\nAtenciosamente,\n{seuNome}'
  },
  {
    id: 'template-2',
    name: 'Template Direto',
    message: 'Olá {firstName}!\n\nGostaria de conectar com você para trocarmos experiências sobre {setor}.\n\nAguardo sua conexão!\n\nAbraços,\n{seuNome}'
  },
  {
    id: 'template-3',
    name: 'Template Consultivo',
    message: 'Olá {firstName}!\n\nTudo bem?\n\nVi seu perfil e notei que você atua como {cargoDecisor} na {empresaDecisor}. Gostaria de conectar para compartilharmos insights sobre o mercado.\n\nAguardo sua conexão!\n\nAtenciosamente,\n{seuNome}'
  }
];

// Limites de segurança (estilo Summitfy)
const DAILY_CONNECTION_LIMIT = 25; // Máximo 25 conexões por dia (seguro)
const MAX_URL_LEADS = 50; // Máximo 50 leads por URL

export function LinkedInConnectionModal({
  open,
  onOpenChange,
  decisor,
  onConnectionSent,
  onOpenAuthDialog // ✅ NOVO: Receber callback
}: LinkedInConnectionModalProps) {
  const [linkedInPremium, setLinkedInPremium] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [connectionsToday, setConnectionsToday] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [linkedInConnected, setLinkedInConnected] = useState(false);

  // Carregar perfil do usuário e contador de conexões
  useEffect(() => {
    if (open) {
      loadUserData();
      loadConnectionsCount();
      checkLinkedInStatus();
    }
  }, [open]);

  // ✅ NOVO: Re-verificar status quando modal reabre (após conectar)
  // 🔥 REDUZIDO: Verificar apenas a cada 10 segundos (não 2s) para evitar spam
  useEffect(() => {
    if (open) {
      // Verificar status inicial
      checkLinkedInStatus();
      
      // Re-verificar status a cada 10 segundos enquanto modal estiver aberto
      // (apenas se ainda não estiver conectado, para detectar quando conectar)
      const interval = setInterval(() => {
        // Só verificar novamente se ainda não estiver conectado
        // (evita chamadas desnecessárias quando já está conectado)
        if (!linkedInConnected) {
          checkLinkedInStatus();
        }
      }, 10000); // 10 segundos ao invés de 2
      
      return () => clearInterval(interval);
    } else {
      // 🔥 NOVO: Quando modal fecha, verificar status uma última vez
      // Isso garante que o status seja atualizado mesmo após fechar
      checkLinkedInStatus();
    }
  }, [open, linkedInConnected]); // Adicionar linkedInConnected como dependência

  const checkLinkedInStatus = async () => {
    try {
      // ✅ USAR VALIDAÇÃO UNIFICADA (mesma função do Settings)
      const { validateLinkedInConnection } = await import('@/services/linkedinValidation');
      const validation = await validateLinkedInConnection();
      
      const wasConnected = linkedInConnected;
      const isNowConnected = validation.isConnected && validation.isValid;
      
      setLinkedInConnected(isNowConnected);
      
      // 🔥 Só logar se mudou de estado ou se é a primeira verificação
      if (!isNowConnected && validation.error) {
        // Só logar uma vez, não repetidamente
        if (!wasConnected) {
          console.warn('[LINKEDIN-CONNECTION] LinkedIn não conectado:', validation.error);
        }
      } else if (isNowConnected && !wasConnected) {
        console.log('[LINKEDIN-CONNECTION] ✅ LinkedIn conectado com sucesso!');
      }
    } catch (error) {
      // Silenciar erros repetidos
      console.error('[LINKEDIN-CONNECTION] Erro ao verificar status:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Buscar dados do perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          // Verificar se tem LinkedIn Premium (pode ser campo customizado)
          setLinkedInPremium(profile.linkedin_premium || false);
        }
      }
    } catch (error) {
      console.error('[LINKEDIN-MODAL] Erro ao carregar perfil:', error);
    }
  };

  const loadConnectionsCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error, count } = await supabase
        .from('linkedin_connections')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sent_date', today);
      
      if (error) {
        // Se a tabela não existe (404), retornar 0
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[LINKEDIN-MODAL] Tabela linkedin_connections não existe ainda');
          setConnectionsToday(0);
          return;
        }
        throw error;
      }
      
      setConnectionsToday(count || 0);
    } catch (error) {
      console.error('[LINKEDIN-MODAL] Erro ao carregar contador:', error);
      setConnectionsToday(0); // Fallback para 0 em caso de erro
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const allTemplates = [...MESSAGE_TEMPLATES, ...customTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    if (template && decisor) {
      let message = template.message;
      
      // ✅ CORRIGIDO: Substituir placeholders corretamente
      const firstName = decisor.first_name || decisor.name?.split(' ')[0] || '';
      const seuNome = userProfile?.full_name || userProfile?.name || 'Marcos Oliveira'; // Default se não tiver
      const seuCargo = userProfile?.title || 'Executivo de Vendas';
      const suaEmpresa = userProfile?.company || 'STRATEVO Intelligence';
      const cargoDecisor = decisor.title || 'Profissional';
      const empresaDecisor = decisor.company_name || 'sua empresa';
      
      message = message.replace(/{firstName}/g, firstName);
      message = message.replace(/{cargoDecisor}/g, cargoDecisor);
      message = message.replace(/{empresaDecisor}/g, empresaDecisor);
      message = message.replace(/{seuNome}/g, seuNome);
      message = message.replace(/{seuCargo}/g, seuCargo);
      message = message.replace(/{suaEmpresa}/g, suaEmpresa);
      message = message.replace(/{setor}/g, 'tecnologia'); // Pode ser dinâmico
      
      setCustomMessage(message);
      setSelectedTemplate(templateId);
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateMessage.trim()) {
      toast.error('Nome e mensagem são obrigatórios');
      return;
    }

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      message: newTemplateMessage
    };

    setCustomTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName('');
    setNewTemplateMessage('');
    setShowAddTemplate(false);
    
    toast.success('Template adicionado com sucesso!');
  };

  const handleInsertFirstName = () => {
    if (decisor?.first_name || decisor?.name) {
      const firstName = decisor.first_name || decisor.name?.split(' ')[0] || '';
      setCustomMessage(prev => prev + (prev ? ' ' : '') + firstName);
    }
  };

  const handleSendConnection = async () => {
    // ✅ Verificar se LinkedIn está conectado
    if (!linkedInConnected) {
      toast.error('LinkedIn não conectado!', {
        description: 'Conecte sua conta do LinkedIn antes de enviar conexões.',
        action: {
          label: 'Conectar',
          onClick: () => {
            onOpenChange(false); // Fechar modal de conexão
            // ✅ Abrir modal de autenticação via callback
            if (onOpenAuthDialog) {
              setTimeout(() => {
                onOpenAuthDialog();
              }, 300); // Pequeno delay para fechar primeiro modal
            } else {
              // Fallback: redirecionar para Settings
              window.location.href = '/settings';
            }
          }
        },
        duration: 5000 // Manter toast visível por mais tempo
      });
      return;
    }

    // Verificar limite diário
    if (connectionsToday >= DAILY_CONNECTION_LIMIT) {
      toast.error(`Limite diário atingido! Máximo de ${DAILY_CONNECTION_LIMIT} conexões por dia.`, {
        description: 'Aguarde até amanhã ou entre em contato com o suporte para aumentar o limite.'
      });
      return;
    }

    if (!decisor?.linkedin_url) {
      toast.error('URL do LinkedIn não disponível para este decisor.');
      return;
    }

    setIsSending(true);

    try {
      // ✅ OBTER USER_ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // ✅ PRIMEIRO: Salvar registro no banco (status: pending)
      const { data: connectionRecord, error: insertError } = await supabase
        .from('linkedin_connections')
        .insert({
          user_id: user.id,
          decisor_name: decisor.name,
          decisor_linkedin_url: decisor.linkedin_url,
          message: customMessage,
          sent_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          has_premium: linkedInPremium
        })
        .select()
        .single();

      if (insertError) {
        // Se tabela não existe, continuar mesmo assim (não é crítico)
        console.warn('[LINKEDIN-MODAL] Erro ao salvar registro (não crítico):', insertError);
      }

      // ✅ ENVIAR CONEXÃO REAL via PhantomBuster (Edge Function)
      toast.loading('Enviando conexão via PhantomBuster...', {
        description: 'Aguarde, estamos enviando a conexão real ao LinkedIn.',
        duration: 10000
      });

      console.log('[LINKEDIN-MODAL] 🚀 Enviando conexão via Edge Function:', {
        user_id: user.id,
        profile_url: decisor.linkedin_url,
        connection_id: connectionRecord?.id,
        has_premium: linkedInPremium,
        message_length: customMessage?.length || 0
      });

      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-linkedin-connection', {
        body: {
          user_id: user.id,
          profile_url: decisor.linkedin_url,
          message: linkedInPremium ? customMessage : undefined,
          has_premium: linkedInPremium,
          connection_id: connectionRecord?.id // 🔥 PASSAR connection_id para atualizar registro
        }
      });

      console.log('[LINKEDIN-MODAL] 📥 Resposta da Edge Function:', { sendResult, sendError });

      if (sendError || !sendResult?.success) {
        console.error('[LINKEDIN-MODAL] Erro ao enviar conexão:', sendError || sendResult);
        
        // Se falhou, pelo menos abrir o perfil para envio manual
        window.open(decisor.linkedin_url, '_blank');
        
        toast.error('Erro ao enviar conexão automaticamente', {
          description: sendResult?.message || sendError?.message || 'Abra o perfil e envie manualmente. O sistema tentará novamente.',
          duration: 8000,
          action: {
            label: 'Verificar no LinkedIn',
            onClick: () => {
              window.open('https://www.linkedin.com/mynetwork/invitation-manager/sent/', '_blank');
            }
          }
        });

        // Atualizar status para 'failed' se tiver registro
        if (connectionRecord?.id) {
          await supabase
            .from('linkedin_connections')
            .update({ status: 'failed', phantom_result: sendResult })
            .eq('id', connectionRecord.id);
        }

        return;
      }

      // ✅ SUCESSO: Conexão enviada via PhantomBuster
      toast.success('✅ Conexão enviada com sucesso!', {
        description: 'A conexão foi enviada via PhantomBuster. Verifique em https://www.linkedin.com/mynetwork/invitation-manager/sent/',
        duration: 8000,
        action: {
          label: 'Verificar no LinkedIn',
          onClick: () => {
            window.open('https://www.linkedin.com/mynetwork/invitation-manager/sent/', '_blank');
          }
        }
      });

      // Atualizar contador
      setConnectionsToday(prev => prev + 1);
      
      // Limpar formulário
      setCustomMessage('');
      setSelectedTemplate('');
      
      // Callback
      onConnectionSent?.();
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);

    } catch (error: any) {
      console.error('[LINKEDIN-MODAL] Erro geral:', error);
      toast.error('Erro ao enviar conexão', {
        description: error.message || 'Tente novamente mais tarde.',
        duration: 5000
      });
    } finally {
      setIsSending(false);
    }
  };

  const remainingConnections = DAILY_CONNECTION_LIMIT - connectionsToday;
  const canSend = remainingConnections > 0 && !isSending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-600" />
            Solicitar Conexão no LinkedIn
          </DialogTitle>
          <DialogDescription>
            {decisor?.name && (
              <span>Conectar com <strong>{decisor.name}</strong>{decisor.title && ` - ${decisor.title}`}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ✅ Status de Conexão LinkedIn */}
          {linkedInConnected ? (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  LinkedIn Conectado ✅ - Conexões serão enviadas pela sua conta pessoal
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  LinkedIn não conectado - Conecte sua conta para enviar conexões
                </span>
              </div>
            </div>
          )}

          {/* Status de Conexões Hoje */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Conexões hoje: {connectionsToday}/{DAILY_CONNECTION_LIMIT}</span>
              </div>
              {remainingConnections > 0 ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  {remainingConnections} restantes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                  Limite atingido
                </Badge>
              )}
            </div>
          </div>

          {/* LinkedIn Premium */}
          <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Checkbox
              id="linkedin-premium"
              checked={linkedInPremium}
              onCheckedChange={(checked) => setLinkedInPremium(checked as boolean)}
            />
            <Label htmlFor="linkedin-premium" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="font-medium">Tenho LinkedIn Premium</span>
                <Badge variant="outline" className="text-xs">Premium</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Apenas usuários do LinkedIn Premium podem enviar mensagens de conexão personalizadas
              </p>
            </Label>
          </div>

          {/* Personalizar Mensagem */}
          <div className="space-y-2">
            <Label>Personalize sua nota de conexão (opcional):</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleInsertFirstName}
                disabled={!decisor?.first_name && !decisor?.name}
              >
                <User className="w-4 h-4 mr-2" />
                Primeiro Nome
              </Button>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Templates de Notas Validadas" />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                  {customTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} (Personalizado)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddTemplate(!showAddTemplate)}
                title="Adicionar novo template"
              >
                <span className="text-lg font-bold">+</span>
              </Button>
            </div>
            
            {/* ✅ NOVO: Formulário para adicionar template */}
            {showAddTemplate && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Criar Novo Template</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddTemplate(false);
                      setNewTemplateName('');
                      setNewTemplateMessage('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
                <Input
                  placeholder="Nome do template (ex: Template Vendas B2B)"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
                <Textarea
                  placeholder="Escreva sua mensagem de conexão... Use {firstName}, {seuNome}, {cargoDecisor}, {empresaDecisor}, {seuCargo}, {suaEmpresa}, {setor}"
                  value={newTemplateMessage}
                  onChange={(e) => setNewTemplateMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTemplate}
                    disabled={!newTemplateName.trim() || !newTemplateMessage.trim()}
                  >
                    Salvar Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddTemplate(false);
                      setNewTemplateName('');
                      setNewTemplateMessage('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            <Textarea
              placeholder="Escreva sua mensagem de conexão personalizada aqui..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              maxLength={300}
              className="min-h-[120px]"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{customMessage.length}/300 caracteres</span>
              {linkedInPremium && (
                <span className="text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Premium: Mensagem personalizada disponível
                </span>
              )}
            </div>
          </div>

          {/* Aviso de Limite */}
          {remainingConnections <= 5 && remainingConnections > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Atenção: Restam apenas {remainingConnections} conexões hoje
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Para evitar bloqueio, recomendamos não exceder {DAILY_CONNECTION_LIMIT} conexões por dia.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendConnection}
            disabled={!canSend || isSending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

