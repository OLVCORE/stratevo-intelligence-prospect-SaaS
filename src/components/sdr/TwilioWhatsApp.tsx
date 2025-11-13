/**
 * TWILIO WHATSAPP COMPONENT
 * 
 * Send WhatsApp messages via Twilio API
 * Integrated with STRATEVO CRM
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TwilioWhatsAppProps {
  defaultNumber?: string;
  dealId?: string;
  companyId?: string;
}

export function TwilioWhatsApp({ defaultNumber, dealId, companyId }: TwilioWhatsAppProps) {
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = async () => {
    if (!phoneNumber || !message) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o número e a mensagem',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate phone number format
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      toast({
        title: 'Número inválido',
        description: 'Digite um número válido com DDD',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('twilio-send-whatsapp', {
        body: {
          to: `+55${cleanNumber}`,
          body: message
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }
      
      toast({
        title: '✅ WhatsApp enviado!',
        description: `Mensagem enviada para +55${cleanNumber}`,
      });
      
      // Log activity in deal (if dealId provided)
      if (dealId) {
        await supabase
          .from('sdr_deal_activities')
          .insert({
            deal_id: dealId,
            activity_type: 'whatsapp',
            description: `WhatsApp enviado para +55${cleanNumber}`,
            new_value: {
              message: message,
              message_sid: data.messageSid,
              status: data.status
            }
          });
      }
      
      // Clear form
      setMessage('');
      
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Templates rápidos
  const templates = [
    {
      label: 'Apresentação',
      text: `Olá! Sou [SEU NOME] da STRATEVO. Vi que sua empresa está crescendo e gostaria de apresentar nossa solução de gestão empresarial. Quando podemos conversar?`
    },
    {
      label: 'Follow-up',
      text: `Olá! Conforme combinado, estou enviando a proposta. Podemos agendar uma call para tirar dúvidas?`
    },
    {
      label: 'Agendamento',
      text: `Olá! Gostaria de agendar uma reunião para apresentar nossa solução. Qual dia e horário funciona melhor para você?`
    }
  ];
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5 text-green-500" />
          WhatsApp via Twilio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            <Phone className="h-4 w-4 inline mr-1" />
            Número WhatsApp
          </Label>
          <Input
            id="phone"
            placeholder="(11) 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">
            Digite com DDD. Ex: (11) 99999-9999
          </p>
        </div>
        
        {/* Quick Templates */}
        <div className="space-y-2">
          <Label>Templates Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(template.text)}
                className="text-xs"
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="bg-gray-900 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-500">
            {message.length} caracteres
          </p>
        </div>
        
        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={isSending || !phoneNumber || !message}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </>
          )}
        </Button>
        
        {/* Info */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <p className="text-xs text-blue-300">
            <strong>💡 Dica:</strong> Mensagens enviadas via Twilio API oficial. 
            O destinatário recebe como mensagem normal do WhatsApp Business.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

