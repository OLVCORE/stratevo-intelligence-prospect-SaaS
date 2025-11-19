/**
 * 📋 LISTA VIRTUALIZADA DE EVIDÊNCIAS
 * 
 * Usa @tanstack/react-virtual para renderizar apenas evidências visíveis
 * Melhora performance significativamente com muitas evidências (100+)
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Search, 
  Sparkles, 
  CheckCircle, 
  Package, 
  Copy, 
  Check, 
  ExternalLink,
  Flame
} from 'lucide-react';

interface Evidence {
  url: string;
  title: string;
  snippet?: string;
  content?: string;
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  intent_keywords?: string[];
  validation_method?: 'ai' | 'basic';
  has_intent?: boolean;
  weight?: number;
}

interface EvidencesVirtualListProps {
  evidences: Evidence[];
  companyName?: string;
  onCopyUrl?: (url: string, id: string) => void;
  onCopyTerms?: (terms: string, id: string) => void;
  copiedUrl?: string | null;
  copiedTerms?: string | null;
}

export function EvidencesVirtualList({
  evidences,
  companyName = '',
  onCopyUrl,
  onCopyTerms,
  copiedUrl,
  copiedTerms,
}: EvidencesVirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: evidences.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Altura estimada de cada evidência
    overscan: 5, // Renderizar 5 itens extras acima/abaixo
  });

  const highlightTerms = (text: string, products: string[] = []) => {
    if (!text) return '';
    let highlighted = text;
    products.forEach(product => {
      const regex = new RegExp(`(${product})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
    });
    return highlighted;
  };

  if (evidences.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma evidência encontrada</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const evidence = evidences[virtualItem.index];
          const evidenceId = `${evidence.source}-${virtualItem.index}`;
          const allTerms = [
            companyName,
            'TOTVS',
            ...(evidence.detected_products || []),
            ...(evidence.intent_keywords || [])
          ].filter(Boolean).join(' | ');

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card className="m-2 p-4 hover:bg-accent/50 transition-colors h-full">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge 
                      variant={evidence.match_type === 'triple' ? 'default' : 'secondary'} 
                      className="text-sm flex items-center gap-1"
                    >
                      {evidence.match_type === 'triple' ? (
                        <>
                          <Target className="w-3 h-3" />
                          TRIPLE MATCH
                        </>
                      ) : (
                        <>
                          <Search className="w-3 h-3" />
                          DOUBLE MATCH
                        </>
                      )}
                    </Badge>
                    {evidence.validation_method && (
                      <Badge 
                        variant={evidence.validation_method === 'ai' ? 'default' : 'outline'} 
                        className={`text-xs flex items-center gap-1 ${
                          evidence.validation_method === 'ai' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gray-500/20 hover:bg-gray-500/30'
                        }`}
                        title={evidence.validation_method === 'ai' 
                          ? 'Validado com Inteligência Artificial' 
                          : 'Validação básica'}
                      >
                        {evidence.validation_method === 'ai' ? (
                          <>
                            <Sparkles className="w-3 h-3" />
                            IA Validada
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Validação Básica
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {evidence.source_name || evidence.source} ({evidence.weight || 0} pts)
                  </Badge>
                </div>
                
                {evidence.has_intent && evidence.intent_keywords?.length > 0 && (
                  <div className="mb-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                    <Badge variant="destructive" className="text-xs mb-1 flex items-center gap-1 w-fit">
                      <Flame className="w-3 h-3" />
                      INTENÇÃO DE COMPRA DETECTADA
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      <strong>Keywords:</strong> {evidence.intent_keywords.join(', ')}
                    </div>
                  </div>
                )}
                
                <h4 
                  className="text-sm font-semibold mb-2" 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightTerms(evidence.title, evidence.detected_products) 
                  }}
                />
                
                <p 
                  className="text-sm text-muted-foreground mb-3 line-clamp-3"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightTerms(evidence.content || evidence.snippet || '', evidence.detected_products) 
                  }}
                />
                
                {evidence.detected_products?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3 items-center">
                    <span className="text-xs font-medium mr-2">Produtos:</span>
                    {evidence.detected_products.map((product: string) => (
                      <Badge key={product} variant="outline" className="text-xs flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {product}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {onCopyUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onCopyUrl(evidence.url, evidenceId)}
                    >
                      {copiedUrl === evidenceId ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar URL
                        </>
                      )}
                    </Button>
                  )}
                  
                  {onCopyTerms && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onCopyTerms(allTerms, evidenceId)}
                    >
                      {copiedTerms === evidenceId ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar Termos
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs h-7"
                    asChild
                  >
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver Fonte
                    </a>
                  </Button>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

