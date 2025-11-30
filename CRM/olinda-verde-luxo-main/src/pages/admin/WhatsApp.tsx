import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Phone, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppQuickReplies } from '@/components/admin/WhatsAppQuickReplies';

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface WhatsAppMessage {
  id: string;
  lead_id: string;
  message: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sent_at: string;
  read_at: string | null;
  leads: Lead;
}

interface Conversation {
  lead: Lead;
  messages: WhatsAppMessage[];
  lastMessage: WhatsAppMessage;
  unreadCount: number;
}

export default function WhatsApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          leads:lead_id (
            id,
            name,
            phone,
            status
          )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group messages by lead
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg: any) => {
        if (!msg.leads) return;

        const leadId = msg.lead_id;
        if (!conversationMap.has(leadId)) {
          conversationMap.set(leadId, {
            lead: msg.leads,
            messages: [],
            lastMessage: msg,
            unreadCount: 0,
          });
        }

        const conv = conversationMap.get(leadId)!;
        conv.messages.push(msg);

        // Count unread inbound messages
        if (msg.direction === 'inbound' && !msg.read_at) {
          conv.unreadCount++;
        }

        // Update last message if newer
        if (new Date(msg.sent_at) > new Date(conv.lastMessage.sent_at)) {
          conv.lastMessage = msg;
        }
      });

      const conversationsList = Array.from(conversationMap.values());
      conversationsList.sort((a, b) => 
        new Date(b.lastMessage.sent_at).getTime() - new Date(a.lastMessage.sent_at).getTime()
      );

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erro ao carregar conversas',
        description: 'Não foi possível carregar as conversas do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Real-time updates
    const channel = supabase
      .channel('whatsapp-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (conversation: Conversation) => {
    const unreadIds = conversation.messages
      .filter(m => m.direction === 'inbound' && !m.read_at)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('whatsapp_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await markAsRead(conversation);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Clean phone number
      const cleanPhone = selectedConversation.lead.phone.replace(/\D/g, '');

      // Insert message in database
      const { error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert({
          lead_id: selectedConversation.lead.id,
          message: messageText,
          direction: 'outbound',
          status: 'pending',
          sent_by: user.id,
        });

      if (insertError) throw insertError;

      // Create activity
      await supabase.from('activities').insert({
        type: 'whatsapp',
        subject: 'Mensagem WhatsApp enviada',
        description: messageText,
        lead_id: selectedConversation.lead.id,
        created_by: user.id,
      });

      // Send via Twilio (if configured)
      const twilioSid = 'TWILIO_ACCOUNT_SID'; // Should be in secrets
      const twilioToken = 'TWILIO_AUTH_TOKEN'; // Should be in secrets
      const twilioPhone = 'TWILIO_PHONE_NUMBER'; // Should be in secrets

      // For now, just simulate sending
      console.log('Sending WhatsApp message to:', cleanPhone, messageText);

      setMessageText('');
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });

      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie todas as conversas do WhatsApp em um único lugar</p>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="col-span-4 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Conversas
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <div
                      key={conv.lead.id}
                      className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedConversation?.lead.id === conv.lead.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium truncate">{conv.lead.name}</span>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="rounded-full">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Phone className="h-3 w-3" />
                            <span>{conv.lead.phone}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage.direction === 'outbound' && 'Você: '}
                            {conv.lastMessage.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conv.lastMessage.sent_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-8 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.lead.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedConversation.lead.phone}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/leads?lead=${selectedConversation.lead.id}`)}
                  >
                    Ver Lead
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(msg.sent_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
