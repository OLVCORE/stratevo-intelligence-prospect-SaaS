// src/components/public/EnhancedPublicChatWidget.tsx
// Chat unificado e inteligente com VOZ + TEXTO + Captura automática de leads

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Loader2, MessageSquare, Sparkles, Mic, MicOff, Volume2 } from "lucide-react";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { useTextLeadCapture } from "@/hooks/useTextLeadCapture";
import { useVoiceLeadCapture } from "@/hooks/useVoiceLeadCapture";
import { extractLeadDataLocally, mergeLeadData, hasEssentialData } from "@/utils/localLeadExtractor";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

type ChatMode = 'text' | 'voice';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string; // Para respostas de voz
}

interface EnhancedPublicChatWidgetProps {
  className?: string;
}

export function EnhancedPublicChatWidget({ className }: EnhancedPublicChatWidgetProps) {
  // ==========================================
  // ESTADOS
  // ==========================================
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('text');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual da STRATEVO. Como posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Estados para modo voz
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { captureLead } = useLeadCapture();
  const { tenant } = useTenant();

  // ==========================================
  // HOOKS DE CAPTURA
  // ==========================================
  const textCapture = useTextLeadCapture({ 
    sessionId: sessionId || undefined, 
    source: 'website_chat' 
  });
  const voiceCapture = useVoiceLeadCapture({ 
    sessionId: sessionId || undefined, 
    source: 'website_chat_voice' 
  });

  // ==========================================
  // INICIALIZAÇÃO DA SESSÃO
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      if (!isOpen || sessionId) return; // Evitar criar múltiplas sessões

      try {
        // Tentar criar sessão (pode falhar se tabela não existir)
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            tenant_id: tenant?.id || null,
            status: 'active',
            session_data: {
              user_agent: navigator.userAgent,
              referrer: document.referrer,
              source: 'public_website',
              mode: 'text',
            },
          })
          .select()
          .single();

        if (data && !error) {
          setSessionId(data.id);
        } else if (error) {
          // Se a tabela não existir, usar sessionId local (UUID)
          console.warn('Tabela chat_sessions não encontrada, usando sessão local:', error.message);
          const localSessionId = crypto.randomUUID();
          setSessionId(localSessionId);
        }
      } catch (err: any) {
        // Fallback: usar sessionId local
        console.warn('Erro ao criar sessão, usando sessão local:', err.message);
        const localSessionId = crypto.randomUUID();
        setSessionId(localSessionId);
      }
    };

    initSession();
  }, [isOpen, tenant, sessionId]);

  // ==========================================
  // AUTO-SCROLL
  // ==========================================
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ==========================================
  // GRAVAÇÃO DE ÁUDIO (MODO VOZ)
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        await processAudioRecording();
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('🎤 Gravando... Fale agora!');
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // ==========================================
  // PROCESSAR ÁUDIO GRAVADO
  // ==========================================
  const processAudioRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessingVoice(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Usar Edge Function para processar (Whisper + Chat-ai + ElevenLabs TTS)
        await processWithElevenLabs(base64Audio);
      };
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar áudio. Tente novamente.');
    } finally {
      setIsProcessingVoice(false);
      audioChunksRef.current = [];
    }
  };

  // ==========================================
  // PROCESSAR COM BACKEND (Whisper + Chat-ai + ElevenLabs TTS)
  // ==========================================
  const processWithElevenLabs = async (base64Audio: string) => {
    try {
      // Usar versão melhorada que suporta múltiplas abordagens
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-v2', {
        body: {
          audio: base64Audio,
          sessionId: sessionId,
        },
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        throw error;
      }

      // Adicionar mensagem do usuário (transcrição)
      if (data.userTranscript) {
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: data.userTranscript,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Salvar mensagem (se tabela existir)
        if (sessionId) {
          try {
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'user',
              content: data.userTranscript,
            });
          } catch (err) {
            // Ignorar erro se tabela não existir
            console.warn('Não foi possível salvar mensagem:', err);
          }
        }

        // Processar com hook de captura
        await voiceCapture.processTranscript(data.userTranscript, data.entities);
      }

      // Adicionar resposta do assistente
      if (data.assistantResponse) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.assistantResponse,
          timestamp: new Date(),
          audioUrl: data.assistantAudioUrl || undefined,
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Salvar resposta
        let assistantMessageId: string | null = null;
        if (sessionId) {
          const { data: savedMessage, error: saveError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: data.assistantResponse,
            })
            .select()
            .single();
          
          if (!saveError && savedMessage) {
            assistantMessageId = savedMessage.id;
            
            // 🔥 RAG: Gerar embedding da resposta (em background)
            supabase.functions.invoke('generate-embeddings', {
              body: {
                sessionId,
                messageId: assistantMessageId,
                content: data.assistantResponse,
              }
            }).catch(err => console.warn('[EnhancedPublicChatWidget] Failed to generate embedding for assistant response:', err));
          }
        }

        // Processar resposta também
        await voiceCapture.processTranscript(data.assistantResponse);

        // Reproduzir áudio se disponível (gerado por ElevenLabs TTS)
        if (data.assistantAudioUrl && data.assistantAudioUrl !== 'generated') {
          const audio = new Audio(data.assistantAudioUrl);
          audio.play().catch(err => console.error('Erro ao reproduzir:', err));
        }

        // Verificar se precisa mostrar formulário
        const localData = extractLeadDataLocally(data.userTranscript + ' ' + data.assistantResponse);
        if (hasEssentialData(localData)) {
          setShowForm(true);
          setFormData(prev => ({
            ...prev,
            name: localData.name || prev.name,
            email: localData.email || prev.email,
            phone: localData.phone || prev.phone,
            message: prev.message || data.userTranscript,
          }));
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar com backend:', error);
      toast.error('Erro ao processar áudio. Tente novamente ou use o modo texto.');
    }
  };

  // ==========================================
  // OBTER RESPOSTA DO ASSISTENTE
  // ==========================================
  const getAssistantResponse = async (userMessage: string, messageMode: 'text' | 'voice') => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: userMessage,
          sessionId: sessionId,
          mode: messageMode,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Salvar resposta (se tabela existir)
      let assistantMessageId: string | null = null;
      if (sessionId) {
        try {
          const { data: savedMessage, error: saveError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: assistantMessage.content,
            })
            .select()
            .single();
          
          if (!saveError && savedMessage) {
            assistantMessageId = savedMessage.id;
            
            // 🔥 RAG: Gerar embedding da resposta (em background)
            supabase.functions.invoke('generate-embeddings', {
              body: {
                sessionId,
                messageId: assistantMessageId,
                content: assistantMessage.content,
              }
            }).catch(err => console.warn('[EnhancedPublicChatWidget] Failed to generate embedding for assistant response:', err));
          }
        } catch (err) {
          // Ignorar erro se tabela não existir
          console.warn('Não foi possível salvar resposta:', err);
        }
      }

      // Processar resposta também (pode conter dados adicionais)
      if (messageMode === 'text') {
        await textCapture.processMessage(assistantMessage.content);
      } else {
        await voiceCapture.processTranscript(assistantMessage.content);
      }

      // Verificar se precisa mostrar formulário
      const localData = extractLeadDataLocally(userMessage + ' ' + assistantMessage.content);
      if (hasEssentialData(localData) || userMessage.length > 20) {
        setShowForm(true);
        setFormData(prev => ({
          ...prev,
          name: localData.name || prev.name,
          email: localData.email || prev.email,
          phone: localData.phone || prev.phone,
          message: prev.message || userMessage,
        }));
      }
    } catch (error: any) {
      console.error('Erro ao obter resposta:', error);
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Nossa equipe entrará em contato em breve!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ENVIO DE MENSAGEM (MODO TEXTO)
  // ==========================================
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Salvar mensagem (se tabela existir)
    let userMessageId: string | null = null;
    if (sessionId) {
      try {
        const { data: savedMessage, error: saveError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: userMessage,
          })
          .select()
          .single();
        
        if (!saveError && savedMessage) {
          userMessageId = savedMessage.id;
          
          // 🔥 RAG: Gerar embedding da mensagem do usuário (em background)
          supabase.functions.invoke('generate-embeddings', {
            body: {
              sessionId,
              messageId: userMessageId,
              content: userMessage,
            }
          }).catch(err => console.warn('[EnhancedPublicChatWidget] Failed to generate embedding for user message:', err));
        }
      } catch (err) {
        // Ignorar erro se tabela não existir
        console.warn('Não foi possível salvar mensagem:', err);
      }
    }

    // Processar com hook de captura
    await textCapture.processMessage(userMessage);

    // Obter resposta
    await getAssistantResponse(userMessage, 'text');
  };

  // ==========================================
  // MICROFONE NO MODO TEXTO (TRANSCRIÇÃO PARA INPUT)
  // ==========================================
  const recognitionRef = useRef<any>(null);

  const handleTextModeVoiceInput = () => {
    // Parar reconhecimento anterior se estiver ativo
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Seu navegador não suporta reconhecimento de voz');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false; // IMPORTANTE: false para não repetir
    recognition.interimResults = false; // IMPORTANTE: false para não repetir
    recognition.maxAlternatives = 1; // Apenas 1 resultado

    let hasResult = false; // Flag para evitar múltiplos resultados

    recognition.onresult = (event: any) => {
      if (hasResult) return; // Evitar processar múltiplas vezes
      hasResult = true;

      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      toast.success('✅ Transcrição adicionada');
      
      // Limpar referência
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento:', event.error);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('Erro ao transcrever. Tente novamente.');
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    toast.info('🎤 Fale agora...');
  };

  // ==========================================
  // MUDANÇA DE MODO
  // ==========================================
  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    
    // Parar gravação se estiver ativa
    if (isRecording && mediaRecorder) {
      stopRecording();
    }

    // Atualizar sessão
    if (sessionId) {
      supabase
        .from('chat_sessions')
        .update({ mode: newMode })
        .eq('id', sessionId);
    }
  };

  // ==========================================
  // SUBMIT DO FORMULÁRIO
  // ==========================================
  const handleSubmitForm = async () => {
    if (!formData.name.trim() || (!formData.email && !formData.phone)) {
      toast.error("Por favor, preencha pelo menos nome e email ou telefone");
      return;
    }

    setIsLoading(true);

    try {
      const localData = extractLeadDataLocally(
        `${formData.name} ${formData.email} ${formData.phone} ${formData.message}`
      );

      const formLeadData = {
        name: formData.name.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        message: formData.message?.trim(),
      };

      const merged = mergeLeadData(formLeadData, localData);

      await captureLead.mutateAsync({
        ...merged,
        source: "website_chat",
        referrer: window.location.href,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "✅ Obrigado! Seus dados foram enviados com sucesso. Nossa equipe entrará em contato em breve!",
          timestamp: new Date(),
        },
      ]);

      setFormData({ name: "", email: "", phone: "", message: "" });
      setShowForm(false);
    } catch (error: any) {
      console.error("Erro ao capturar lead:", error);
      toast.error("Erro ao enviar dados. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // FECHAR CHAT
  // ==========================================
  const handleClose = async () => {
    if (isRecording && mediaRecorder) {
      stopRecording();
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }

    // Parar reconhecimento se estiver ativo
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Atualizar sessão (se tabela existir)
    if (sessionId) {
      try {
        await supabase
          .from('chat_sessions')
          .update({
            status: 'ended',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (err) {
        // Ignorar erro se tabela não existir
        console.warn('Não foi possível atualizar sessão:', err);
      }
    }

    setIsOpen(false);
    setShowForm(false);
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/50 hover:scale-110 transition-all duration-300 group animate-pulse ${className}`}
          aria-label="Abrir chat"
        >
          <div className="relative">
            <MessageSquare className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-background" />
          </div>
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          <div className="absolute bottom-20 right-0 bg-card text-card-foreground px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm border">
            Fale conosco! 💬
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-96 shadow-2xl">
          <Card className="border-2 border-primary/20 bg-card">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">STRATEVO Assistant</h3>
                  <p className="text-xs opacity-90">
                    {mode === 'voice' ? '🎤 Modo Voz' : '⌨️ Modo Texto'} • Online agora
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Toggle VOZ/TEXTO */}
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <div className="flex gap-2">
                <Button
                  variant={mode === 'voice' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('voice')}
                  className={`flex-1 ${mode === 'voice' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Mic className="h-4 w-4 mr-2" />
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

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.audioUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const audio = new Audio(message.audioUrl);
                          audio.play();
                        }}
                        className="mt-2"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Ouvir resposta
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {(isLoading || isProcessingVoice) && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {/* Formulário de Captura */}
              {showForm && (
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    📝 Complete seus dados para continuarmos:
                  </p>
                  <Input
                    placeholder="Nome completo *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background"
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background"
                  />
                  <Input
                    type="tel"
                    placeholder="Telefone (opcional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-background"
                  />
                  <Textarea
                    placeholder="Mensagem (opcional)"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-background min-h-[60px]"
                  />
                  <Button
                    onClick={handleSubmitForm}
                    disabled={isLoading || !formData.name.trim() || (!formData.email && !formData.phone)}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Contato
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {!showForm && (
              <div className="p-4 border-t bg-background">
                {mode === 'text' ? (
                  // MODO TEXTO: Input + Microfone + Send
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Digite sua mensagem..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleTextModeVoiceInput}
                      disabled={isLoading}
                      size="icon"
                      variant="outline"
                      title="Falar para preencher o campo"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  // MODO VOZ: Botão de gravação grande
                  <div className="flex flex-col items-center gap-4">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessingVoice}
                      size="lg"
                      variant={isRecording ? 'destructive' : 'default'}
                      className={`rounded-full w-20 h-20 ${
                        isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {isProcessingVoice ? (
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      ) : isRecording ? (
                        <MicOff className="h-8 w-8 text-white" />
                      ) : (
                        <Mic className="h-8 w-8 text-white" />
                      )}
                    </Button>
                    {isRecording && (
                      <p className="text-sm text-muted-foreground animate-pulse">
                        🎤 Gravando... Fale agora!
                      </p>
                    )}
                    {isProcessingVoice && (
                      <p className="text-sm text-muted-foreground">
                        ⏳ Processando áudio...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

