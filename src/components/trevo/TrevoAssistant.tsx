import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Clover, X, Minimize2, Maximize2, Trash2, Send, Loader2, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { useTrevoAssistant, TrevoContext } from '@/hooks/useTrevoAssistant';
import ReactMarkdown from 'react-markdown';

interface TrevoAssistantProps {
  context: TrevoContext;
}

type ViewMode = 'minimized' | 'normal' | 'expanded';

export function TrevoAssistant({ context }: TrevoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  
  const { messages, isLoading, sendMessage, clearMessages } = useTrevoAssistant(context);

  // Função para extrair links sugeridos das mensagens
  const extractSuggestedLinks = (content: string): Array<{ label: string; url: string }> => {
    const links: Array<{ label: string; url: string }> = [];
    // Regex para capturar padrão: ➡️ **Label:** /rota
    const linkRegex = /➡️\s*\*\*([^:]+):\*\*\s*(\/[^\s\n]+)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        label: match[1].trim(),
        url: match[2].trim()
      });
    }
    
    return links;
  };

  // Função para navegar para uma rota
  const handleNavigate = (url: string) => {
    navigate(url);
    setIsOpen(false); // Fecha o assistente após navegação
  };

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
    
    // Focar no input novamente
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-28 sm:right-32 z-[60] group">
        {/* Botão principal com TREVO VERDE mais visível */}
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="h-10 w-10 rounded-xl shadow-xl bg-green-600 hover:bg-green-700 text-white border-2 border-green-500 relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:border-green-400"
          aria-label="Abrir TREVO, assistente inteligente"
        >
          {/* brilho suave ao passar o mouse */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-green-400/30 to-transparent" />
          
          {/* Ícone TREVO VERDE */}
          <div className="relative z-10">
            <Clover className="h-5 w-5 text-white fill-white" />
          </div>
          
          {/* Detalhe sutil verde brilhante */}
          <Sparkles className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-green-200 animate-pulse" />
          
          {/* Indicador de status verde */}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
            <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
          </span>
          
          {/* Tooltip melhorado */}
          <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-green-600 text-white rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap border-2 border-green-500 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Clover className="h-4 w-4 text-white fill-white" />
              <p className="text-sm font-bold">TREVO Assistente</p>
            </div>
            <p className="text-xs text-green-100 mt-1">Seu guia inteligente de vendas</p>
            <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-green-600 border-r-2 border-b-2 border-green-500" />
          </div>
        </Button>
        
        {/* Anel pulsante verde mais visível */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-green-500/40 animate-ping opacity-30" />
      </div>
    );
  }

  // TREVO sempre na DIREITA (bottom-right), respeitando sidebar, ScrollToTop e ScrollToBottom
  // Sidebar: expandido = 16rem (256px), colapsado = 4rem (64px)
  // ScrollToTop: bottom-4 right-4 (z-55) - 48px de largura
  // ScrollToBottom: bottom-4 right-20 (z-55) - 48px de largura
  // TREVO: precisa estar acima (z-60) mas não sobrepor - right-28 para não sobrepor ScrollToBottom
  // Modos: minimized (pequeno), normal (médio), expanded (até o meio da página)
  const getContainerClasses = () => {
    // ✅ CORRIGIDO: bottom-right mas com espaço para ScrollToTop e ScrollToBottom (right-28 para não sobrepor)
    const baseClasses = 'fixed bottom-4 right-28 sm:right-32 z-[60]';
    
    if (viewMode === 'minimized') {
      // Minimizado: pequeno (barra de título)
      // Responsivo: menor em mobile
      return `${baseClasses} w-[calc(100vw-2rem)] sm:w-[440px] h-[70px] max-w-[calc(100vw-20rem)]`;
    } else if (viewMode === 'expanded') {
      // Expandido: até o meio da página (50% da largura, menos sidebar e margens)
      // Responsivo: ajusta para mobile (tela cheia em mobile, 50vw em desktop)
      return `${baseClasses} w-[calc(100vw-2rem)] sm:w-[50vw] max-w-[calc((100vw-20rem)/2)] h-[calc(100vh-5rem)] min-w-[320px] sm:min-w-[600px]`;
    } else {
      // Normal: tamanho padrão (440px)
      // Responsivo: ajusta para mobile
      return `${baseClasses} w-[calc(100vw-2rem)] sm:w-[440px] h-[calc(100vh-5rem)] max-w-[calc(100vw-20rem)]`;
    }
  };
  
  const isMinimized = viewMode === 'minimized';

  return (
    <div 
      className={`${getContainerClasses()} transition-all duration-300 ease-in-out`}
    >
      <Card className="flex flex-col h-full shadow-2xl border border-border overflow-hidden bg-background/95">
        {/* Header neutro */}
        <div className="flex items-center justify-between p-4 border-b bg-card relative">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-11 w-11 rounded-xl bg-green-600 flex items-center justify-center border-2 border-green-500 shadow-lg">
              <Clover className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                TREVO
                <span className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Assistente Inteligente de Vendas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            {!isMinimized && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Ciclo: minimized -> normal -> expanded -> normal -> minimized
                if (viewMode === 'minimized') {
                  setViewMode('normal');
                } else if (viewMode === 'normal') {
                  setViewMode('expanded');
                } else {
                  setViewMode('normal');
                }
              }}
              className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
              title={viewMode === 'minimized' ? 'Ampliar' : viewMode === 'normal' ? 'Expandir' : 'Reduzir'}
            >
              {viewMode === 'minimized' ? <Maximize2 className="h-4 w-4" /> : viewMode === 'normal' ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            {!isMinimized && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('minimized')}
                className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
                title="Minimizar"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setViewMode('normal');
              }}
              className="h-9 w-9 hover:bg-accent rounded-lg transition-all duration-200"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const suggestedLinks = message.role === 'assistant' 
                    ? extractSuggestedLinks(message.content)
                    : [];
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} transition-opacity duration-300`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              // Customizar links para abrir em nova aba se forem externos
                              a: ({ node, href, children, ...props }) => {
                                const isExternal = href?.startsWith('http');
                                return (
                                  <a
                                    href={href}
                                    target={isExternal ? '_blank' : undefined}
                                    rel={isExternal ? 'noopener noreferrer' : undefined}
                                    className="text-primary hover:underline font-medium"
                                    {...props}
                                  >
                                    {children}
                                    {isExternal && <ExternalLink className="inline h-3 w-3 ml-1" />}
                                  </a>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Links sugeridos como botões clicáveis */}
                        {suggestedLinks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                              <Sparkles className="h-3 w-3" />
                              Ir para:
                            </p>
                            {suggestedLinks.map((link, linkIndex) => (
                              <Button
                                key={linkIndex}
                                variant="outline"
                                size="sm"
                                onClick={() => handleNavigate(link.url)}
                                className="w-full justify-between text-xs hover:bg-primary hover:text-primary-foreground transition-all duration-200 group"
                              >
                                <span className="font-medium">{link.label}</span>
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-[10px] mt-2 opacity-60">
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {isLoading && (
                  <div className="flex justify-start transition-opacity duration-300">
                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">TREVO está pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem... (Enter para enviar)"
                  className="min-h-[70px] max-h-[140px] resize-none border-border focus:border-primary focus:ring-primary/20 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-[70px] w-[70px] rounded-xl shadow-lg bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Send className="h-6 w-6" />
                  )}
                </Button>
              </div>
              
              {/* Sugestões rápidas */}
              {messages.length === 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { icon: '💡', text: 'Como qualificar um lead?' },
                    { icon: '📊', text: 'Onde faço upload de empresas?' },
                    { icon: '🎯', text: 'Como ver meus leads Hot?' },
                    { icon: '💼', text: 'Onde está o Sales Workspace?' }
                  ].map((suggestion) => (
                    <Button
                      key={suggestion.text}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(suggestion.text)}
                      className="text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                    >
                      <span className="mr-1">{suggestion.icon}</span>
                      {suggestion.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
