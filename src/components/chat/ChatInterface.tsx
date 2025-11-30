// src/components/chat/ChatInterface.tsx
// Interface de chat com toggle VOZ/TEXTO para plataforma STRATEVO
// Suporta modo texto (com microfone opcional) e modo voz (ElevenLabs)

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { useTextLeadCapture } from '@/hooks/useTextLeadCapture';
import { VoiceChatController } from './VoiceChatController';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

type ChatMode = 'voice' | 'text';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  assistantName?: string;
  companyName?: string;
  onClose?: () => void;
}

export function ChatInterface({ 
  assistantName = 'Assistente Virtual',
  companyName = 'STRATEVO',
  onClose 
}: ChatInterfaceProps) {
  // ==========================================
  // ESTADOS
  // ==========================================
  const [mode, setMode] = useState<ChatMode>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { tenant } = useTenant();

  // ==========================================
  // HOOKS DE CAPTURA DE LEADS
  // ==========================================
  const textCapture = useTextLeadCapture({ 
    sessionId: sessionId || undefined, 
    source: 'website_chat' 
  });

  // ==========================================
  // INICIALIZAÇÃO DA SESSÃO
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      if (!tenant) {
        console.warn('Tenant não disponível - criando sessão sem tenant');
      }

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          tenant_id: tenant?.id || null,
          status: 'ativo',
          mode: 'text',
          session_data: {
            user_agent: navigator.userAgent,
            referrer: document.referrer,
            mode: 'text',
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar sessão:', error);
        toast.error('Erro ao iniciar chat');
        return;
      }

      if (data) {
        setSessionId(data.id);

        // Mensagem inicial do assistente
        const welcomeMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Olá! 👋 Sou o ${assistantName} da ${companyName}. Como posso ajudar você hoje?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);

        // Salvar mensagem inicial
        await supabase.from('chat_messages').insert({
          session_id: data.id,
          role: 'assistant',
          content: welcomeMsg.content,
        });
      }
    };

    initSession();
  }, [tenant, assistantName, companyName]);

  // ==========================================
  // AUTO-SCROLL
  // ==========================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ==========================================
  // ENVIO DE MENSAGEM (MODO TEXTO)
  // ==========================================
  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Salvar mensagem do usuário
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userMessage.content,
    });

    // Processar com hook de captura
    await textCapture.processMessage(currentInput);

    // Chamar IA (substitua pela sua edge function)
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: currentInput,
          sessionId,
          mode: 'text',
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Salvar resposta do assistente
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantMessage.content,
      });

      // Processar resposta também (pode conter dados adicionais)
      await textCapture.processMessage(assistantMessage.content);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Mensagem de fallback
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Nossa equipe entrará em contato em breve!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      
      toast.error('Erro ao processar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // MUDANÇA DE MODO (VOZ ↔ TEXTO)
  // ==========================================
  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);

    // Atualizar sessão no banco
    if (sessionId) {
      supabase
        .from('chat_sessions')
        .update({
          mode: newMode,
          session_data: {
            mode: newMode,
            last_mode_change: new Date().toISOString(),
          },
        })
        .eq('id', sessionId)
        .then(() => {
          console.log(`Modo alterado para: ${newMode}`);
        });
    }
  };

  // ==========================================
  // CALLBACK DE NOVA MENSAGEM (MODO VOZ)
  // ==========================================
  const handleVoiceMessage = (message: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // ==========================================
  // FINALIZAR SESSÃO
  // ==========================================
  const handleClose = async () => {
    if (sessionId) {
      await supabase
        .from('chat_sessions')
        .update({
          status: 'finalizado',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }
    onClose?.();
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all duration-300 group"
        aria-label="Abrir chat"
      >
        <div className="relative">
          <MessageSquare className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-background" />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-card rounded-lg shadow-2xl flex flex-col border border-border">
      {/* HEADER COM CORES DA PLATAFORMA */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{assistantName} - Assistente Virtual</h3>
          <p className="text-xs opacity-80">{companyName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {msg.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* TOGGLE VOZ/TEXTO */}
      <div className="px-4 py-2 border-t border-border bg-card">
        <div className="flex gap-2 justify-center">
          <Button
            variant={mode === 'voice' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('voice')}
            className={`flex-1 ${mode === 'voice' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            VOZ
          </Button>
          <Button
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('text')}
            className={`flex-1 ${mode === 'text' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            TEXTO
          </Button>
        </div>
      </div>

      {/* INPUT ÁREA */}
      <div className="p-4 border-t border-border bg-card">
        {mode === 'text' ? (
          // MODO TEXTO (com microfone opcional)
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              {/* Botão de microfone no modo texto */}
              <VoiceChatController
                sessionId={sessionId}
                onNewMessage={handleVoiceMessage}
                onTranscript={(transcript) => {
                  // Enviar transcrição para o input de texto
                  setInputText(transcript);
                }}
                compact={true}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              size="icon"
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // MODO VOZ
          <div className="flex justify-center">
            <VoiceChatController
              sessionId={sessionId}
              onNewMessage={handleVoiceMessage}
              compact={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

