import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { extractLeadDataLocally, mergeLeadData, hasEssentialData } from "@/utils/localLeadExtractor";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PublicChatWidgetProps {
  className?: string;
}

export function PublicChatWidget({ className }: PublicChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! 👋 Sou o assistente virtual da STRATEVO. Como posso ajudar você hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { captureLead } = useLeadCapture();

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // 1. EXTRAÇÃO LOCAL (imediata)
    const localData = extractLeadDataLocally(userMessage);

    try {
      // 2. CHAMAR BACKEND (se houver chatbot Edge Function)
      // Por enquanto, resposta simples
      const response = "Obrigado pela sua mensagem! Para que eu possa te ajudar melhor, preciso de algumas informações. Clique em 'Enviar Contato' abaixo.";

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      
      // 3. Se extraiu dados essenciais, mostrar formulário
      if (hasEssentialData(localData) || userMessage.length > 20) {
        setShowForm(true);
        setFormData((prev) => ({
          ...prev,
          name: localData.name || prev.name,
          email: localData.email || prev.email,
          phone: localData.phone || prev.phone,
          message: prev.message || userMessage,
        }));
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Por favor, tente novamente ou use o formulário abaixo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForm = async () => {
    if (!formData.name.trim() || (!formData.email && !formData.phone)) {
      toast.error("Por favor, preencha pelo menos nome e email ou telefone");
      return;
    }

    setIsLoading(true);

    try {
      // 1. EXTRAÇÃO LOCAL (backup)
      const localData = extractLeadDataLocally(
        `${formData.name} ${formData.email} ${formData.phone} ${formData.message}`
      );

      // 2. DADOS DO FORMULÁRIO (primário)
      const formLeadData = {
        name: formData.name.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        message: formData.message?.trim(),
      };

      // 3. MERGE (form primeiro, local como fallback)
      const merged = mergeLeadData(formLeadData, localData);

      // 4. CAPTURAR LEAD (com retry interno)
      await captureLead.mutateAsync({
        ...merged,
        source: "website_chat",
        referrer: window.location.href,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "✅ Obrigado! Seus dados foram enviados com sucesso. Nossa equipe entrará em contato em breve!",
        },
      ]);

      // Reset form
      setFormData({ name: "", email: "", phone: "", message: "" });
      setShowForm(false);
    } catch (error: any) {
      console.error("Erro ao capturar lead:", error);
      toast.error("Erro ao enviar dados. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
          
          {/* Pulse effect */}
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          
          {/* Tooltip */}
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
                  <p className="text-xs opacity-90">Online agora</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setShowForm(false);
                  setFormData({ name: "", email: "", phone: "", message: "" });
                }}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {messages.map((message, index) => (
                <div
                  key={index}
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
                  </div>
                </div>
              ))}
              
              {isLoading && (
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

            {/* Input */}
            {!showForm && (
              <div className="p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="flex-1"
                  />
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
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}


