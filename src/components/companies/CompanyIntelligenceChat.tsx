import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Loader2, Sparkles, Minimize2, Maximize2, X, Maximize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyIntelligenceChatProps {
  company: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type ViewMode = 'minimized' | 'normal' | 'fullscreen';

export function CompanyIntelligenceChat({ company }: CompanyIntelligenceChatProps) {
  const [isOpen, setIsOpen] = useState(true); // Iniciar aberto quando renderizado
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('company-intelligence-chat', {
        body: {
          companyId: company.id,
          question: userMessage,
          companyData: {
            name: company.name,
            cnpj: company.cnpj,
            domain: company.domain || company.website,
            linkedin_url: company.linkedin_url,
            employees: company.employees_count,
            sic_codes: company.sic_codes,
            naics_codes: company.naics_codes,
            founded_year: company.founded_year,
            keywords: company.keywords,
            phone: company.phone,
            social_links: company.social_links,
            raw_data: company.raw_data
          }
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Erro ao consultar IA:', error);
      toast.error("Erro ao processar pergunta", { description: error.message });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, não consegui processar sua pergunta. Tente novamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current && viewMode !== 'minimized') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, viewMode]);

  const suggestedQuestions = [
    "Qual o perfil de decisor ideal para essa empresa?",
    "Quais são os principais concorrentes desta empresa?",
    "Qual a estratégia de abordagem recomendada?",
    "Quais produtos TOTVS fazem sentido para esta empresa?",
    "Qual o potencial de negócio desta empresa?"
  ];

  const handleToggleView = () => {
    if (viewMode === 'normal') {
      setViewMode('minimized');
    } else if (viewMode === 'minimized') {
      setViewMode('normal');
    }
  };

  const handleFullscreen = () => {
    if (viewMode === 'fullscreen') {
      setViewMode('normal');
    } else {
      setViewMode('fullscreen');
    }
  };

  if (!isOpen) {
    // Não mostrar botão flutuante - o chat é aberto via CompanyChatButton na tabela
    return null;
  }

  const getCardClasses = () => {
    const baseClasses = "fixed shadow-2xl border-2 border-primary/20 z-50";
    
    if (viewMode === 'fullscreen') {
      return `${baseClasses} inset-4`;
    } else if (viewMode === 'minimized') {
      // Quando minimizado, ficar à direita mas acima do TREVO
      return `${baseClasses} bottom-24 right-6 w-[350px] h-[100px]`;
    } else {
      // Quando aberto, ficar à esquerda para não sobrepor TREVO (bottom-right)
      return `${baseClasses} bottom-6 left-6 w-[450px]`;
    }
  };

  const getScrollAreaHeight = () => {
    if (viewMode === 'fullscreen') {
      return 'calc(100vh - 280px)';
    } else if (viewMode === 'minimized') {
      return '0px';
    } else {
      return '400px';
    }
  };

  if (viewMode === 'minimized') {
    return (
      <Card className={getCardClasses()}>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Intelligence Copilot</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleToggleView}
                title="Expandir"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
                title="Fechar"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={getCardClasses()}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Intelligence Copilot</CardTitle>
              <CardDescription className="text-xs">
                {company.name || 'Empresa'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleToggleView}
              title="Minimizar"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleFullscreen}
              title={viewMode === 'fullscreen' ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsOpen(false)}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col" style={{ height: viewMode === 'fullscreen' ? 'calc(100vh - 120px)' : 'auto' }}>
        <ScrollArea ref={scrollRef} className="flex-1 p-4" style={{ height: getScrollAreaHeight() }}>
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Sugestões de perguntas:
              </p>
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => {
                    setInput(q);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-xs">{q}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Faça uma pergunta sobre esta empresa..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
