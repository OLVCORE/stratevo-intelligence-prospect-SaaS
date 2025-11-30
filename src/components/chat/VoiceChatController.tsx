// src/components/chat/VoiceChatController.tsx
// Componente para controle de chat por voz usando ElevenLabs Conversational AI

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceLeadCapture } from '@/hooks/useVoiceLeadCapture';
import { toast } from 'sonner';

interface VoiceChatControllerProps {
  sessionId: string | null;
  onNewMessage?: (message: string, role: 'user' | 'assistant') => void;
  onTranscript?: (transcript: string) => void; // Para enviar transcrição ao input de texto
  compact?: boolean;
}

export function VoiceChatController({
  sessionId,
  onNewMessage,
  onTranscript, // Callback para enviar transcrição ao input
  compact = false,
}: VoiceChatControllerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const voiceCapture = useVoiceLeadCapture({ sessionId, source: 'voice_chat' });

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

  const startRecording = async () => {
    try {
      // Solicitar permissão de microfone
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
        // Processar áudio quando parar de gravar
        await processAudio();
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

      // Parar todas as tracks de áudio
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);

    try {
      // Criar blob do áudio
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Converter para base64 para enviar ao backend
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Chamar Edge Function para processar com ElevenLabs
        const { data, error } = await supabase.functions.invoke('elevenlabs-conversation', {
          body: {
            audio: base64Audio,
            sessionId: sessionId,
            action: 'conversation', // ou 'transcribe' para apenas transcrever
          },
        });

        if (error) throw error;

        // Salvar mensagem do usuário (transcrição)
        if (data.userTranscript && sessionId) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: data.userTranscript,
            metadata: {
              audio_url: data.audioUrl,
              duration: data.duration,
            },
          });

          // Processar com hook de captura
          await voiceCapture.processTranscript(data.userTranscript, data.entities);

          // Se for modo compacto (texto), enviar transcrição ao input
          if (compact && onTranscript) {
            onTranscript(data.userTranscript);
          } else {
            // Se for modo voz, adicionar como mensagem
            onNewMessage?.(data.userTranscript, 'user');
          }
        }

        // Salvar resposta do assistente
        if (data.assistantResponse && sessionId) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: data.assistantResponse,
            metadata: {
              audio_url: data.assistantAudioUrl,
            },
          });

          // Processar resposta também (pode conter dados adicionais)
          await voiceCapture.processTranscript(data.assistantResponse);

          // Callback para UI
          onNewMessage?.(data.assistantResponse, 'assistant');

          // Reproduzir áudio da resposta (se disponível)
          if (data.assistantAudioUrl) {
            const audio = new Audio(data.assistantAudioUrl);
            audio.play().catch(err => console.error('Erro ao reproduzir áudio:', err));
          }
        }

        toast.success('✅ Mensagem processada!');
      };
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar áudio. Tente novamente.');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  if (compact) {
    return (
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !sessionId}
        size="icon"
        variant={isRecording ? 'destructive' : 'default'}
        className="rounded-full"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing || !sessionId}
        size="lg"
        variant={isRecording ? 'destructive' : 'default'}
        className={`rounded-full w-20 h-20 ${
          isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isProcessing ? (
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
      
      {isProcessing && (
        <p className="text-sm text-muted-foreground">
          ⏳ Processando áudio...
        </p>
      )}
    </div>
  );
}

