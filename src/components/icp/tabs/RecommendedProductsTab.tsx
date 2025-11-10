import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { toast } from 'sonner';
import { 
  Package, Sparkles, TrendingUp, CheckCircle, ArrowRight, Loader2, AlertCircle,
  ExternalLink, Target, Flame, Mail, Phone, MessageSquare, Copy, Check,
  DollarSign, Clock, Award, Lightbulb
} from 'lucide-react';
import { useProductGaps } from '@/hooks/useProductGaps';
import { useEffect, useState } from 'react';
import { registerTab, unregisterTab } from './tabsRegistry';

interface RecommendedProductsTabProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  stcResult?: any;
  similarCompanies?: any[];
  savedData?: any;
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
}

export function RecommendedProductsTab({ 
  companyId,
  companyName, 
  cnpj,
  sector,
  cnae,
  size,
  employees,
  stcResult,
  similarCompanies,
  savedData,
  stcHistoryId,
  onDataChange
}: RecommendedProductsTabProps) {
  
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Buscar produtos recomendados REAIS via Edge Function EVOLUÍDA
  const { data: productGapsData, isLoading, error } = useProductGaps({
    companyId,
    companyName: companyName || '',
    cnpj,
    sector,
    cnae,
    size,
    employees,
    detectedProducts: stcResult?.detected_products || [],
    competitors: stcResult?.competitors || [],
    similarCompanies: similarCompanies || []
  });

  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: products');
    
    registerTab('products', {
      flushSave: async () => {
        console.log('[PRODUCTS] 📤 Registry: flushSave() chamado');
        const dataToSave = productGapsData || { skipped: true, reason: 'Análise opcional não executada' };
        onDataChange?.(dataToSave);
        toast.success('✅ Produtos & Oportunidades Salvos!');
      },
      getStatus: () => 'completed', // ✅ SEMPRE completed (aba opcional)
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry
  }, [productGapsData, onDataChange]);
  
  // 🔄 RESET
  const handleReset = () => {
    toast.info('Retornando ao início');
  };

  // 💾 SALVAR
  const handleSave = () => {
    onDataChange?.(productGapsData);
    toast.success('✅ Produtos & Oportunidades Salvos!');
  };

  // 📋 COPIAR TEXTO
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
      toast.success('Copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de produtos
        </p>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analisando produtos e oportunidades...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>Erro ao carregar análise de produtos</span>
        </div>
      </Card>
    );
  }

  const {
    strategy,
    segment,
    products_in_use = [],
    primary_opportunities = [],
    relevant_opportunities = [],
    estimated_potential,
    sales_approach,
    stack_suggestion,
    total_estimated_value,
    insights = []
  } = productGapsData || {};

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-6 pb-20">
        {/* 🎯 NAVEGAÇÃO FLUTUANTE */}
        {productGapsData && (
          <FloatingNavigation
            onBack={handleReset}
            onHome={handleReset}
            onSave={handleSave}
            showSaveButton={true}
            saveDisabled={!productGapsData}
            hasUnsavedChanges={false}
          />
        )}
        
        {/* ========================================
            HEADER
        ======================================== */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                Produtos & Oportunidades
                <Badge variant={strategy === 'cross-sell' ? 'default' : 'secondary'}>
                  {strategy === 'cross-sell' ? 'Cross-Sell' : 'New Sale'}
                </Badge>
                {segment && (
                  <Badge variant="outline" className="text-xs">
                    {segment}
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {strategy === 'cross-sell' 
                  ? `Cliente TOTVS: ${products_in_use.length} produtos em uso. Oportunidades de expansão.` 
                  : `Prospect: Stack inicial recomendado com ${primary_opportunities.length + relevant_opportunities.length} produtos.`}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3" />
                IA
              </Badge>
              <div className="text-sm font-semibold">{total_estimated_value || 'N/A'}</div>
            </div>
          </div>
        </Card>

        {/* Insights Estratégicos */}
        {insights.length > 0 && (
          <Card className="p-4 bg-muted/30">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Insights Estratégicos
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ========================================
            1️⃣ PRODUTOS EM USO (CONFIRMADOS)
        ======================================== */}
        {products_in_use.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                1️⃣ Produtos em Uso (Confirmados)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos TOTVS detectados com evidências em vagas, notícias e documentos públicos.
              </p>
              <div className="grid gap-3">
                {products_in_use.map((product: any, index: number) => (
                  <Card key={index} className="p-4 bg-green-50/50 dark:bg-green-950/20 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          {product.category}
                        </Badge>
                        <span className="font-semibold">{product.product}</span>
                      </div>
                      <Badge variant="outline">
                        {product.evidenceCount} evidências
                      </Badge>
                    </div>
                    {product.sources && product.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {product.sources.map((source: any, idx: number) => (
                          <a 
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">{source.title}</span>
                            <Badge variant="outline" className="text-[10px]">{source.source_name}</Badge>
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            2️⃣ OPORTUNIDADES PRIMÁRIAS (NUCLEARES)
        ======================================== */}
        {primary_opportunities.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                2️⃣ Oportunidades Primárias (Nucleares)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos essenciais para o segmento <strong>{segment}</strong> que NÃO foram detectados. Alta prioridade de abordagem.
              </p>
              <div className="space-y-4">
                {primary_opportunities.map((product: any, index: number) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-all border-2 border-orange-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{product.name}</h4>
                          <Badge variant="secondary">{product.category}</Badge>
                          <Badge variant="destructive" className="text-xs">
                            <Flame className="w-3 h-3 mr-1" />
                            ALTA PRIORIDADE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                              style={{ width: `${product.fit_score}%` }}
                            />
                          </div>
                          <Badge variant="default" className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {product.fit_score}% fit
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Caso de Uso */}
                    {product.use_case && (
                      <div className="mb-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-md">
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300 block mb-1">💡 CASO DE USO:</span>
                        <p className="text-sm">{product.use_case}</p>
                      </div>
                    )}

                    {/* Razão */}
                    <div className="mb-4">
                      <span className="text-sm font-medium mb-2 block">Por que recomendamos:</span>
                      <p className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        {product.reason}
                      </p>
                    </div>

                    {/* Benefícios */}
                    {product.benefits && product.benefits.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium mb-2 block">Benefícios principais:</span>
                        <ul className="space-y-1">
                          {product.benefits.map((benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Case Study */}
                    {product.case_study && (
                      <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                          <Award className="w-3 h-3" />
                          CASE DE SUCESSO:
                        </span>
                        <p className="text-sm">{product.case_study}</p>
                      </div>
                    )}

                    {/* Informações adicionais */}
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor estimado:</span>
                          <p className="font-semibold">{product.value}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI esperado:</span>
                          <p className="font-semibold">{product.roi_months} meses</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timing:</span>
                          <p className="font-semibold capitalize">{product.timing?.replace('_', ' ')}</p>
                        </div>
                        {product.competitor_displacement && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Substitui:</span>
                            <p className="font-semibold text-orange-600">{product.competitor_displacement}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" className="flex-1">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Adicionar à Proposta
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Ver Ficha Técnica
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            3️⃣ OPORTUNIDADES RELEVANTES (COMPLEMENTARES)
        ======================================== */}
        {relevant_opportunities.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                3️⃣ Oportunidades Relevantes (Complementares)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Produtos que agregam valor mas não são nucleares. Segunda prioridade de abordagem.
              </p>
              <div className="space-y-3">
                {relevant_opportunities.map((product: any, index: number) => (
                  <Card key={index} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold">{product.name}</h4>
                          <Badge variant="outline">{product.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            MÉDIA PRIORIDADE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                              style={{ width: `${product.fit_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{product.fit_score}% fit</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{product.reason}</p>
                    
                    {product.benefits && product.benefits.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.benefits.map((benefit: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {product.value}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ROI {product.roi_months}m
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================
            4️⃣ POTENCIAL ESTIMADO
        ======================================== */}
        {estimated_potential && (
          <>
            <Separator className="my-6" />
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                4️⃣ Potencial Estimado
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">Receita Mín.</span>
                  <p className="text-2xl font-bold text-green-600">{estimated_potential.min_revenue}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">Receita Máx.</span>
                  <p className="text-2xl font-bold text-green-600">{estimated_potential.max_revenue}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">Probabilidade</span>
                  <p className="text-2xl font-bold text-blue-600">{estimated_potential.close_probability}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-1">Timeline</span>
                  <p className="text-2xl font-bold text-purple-600">{estimated_potential.timeline_months}</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ========================================
            5️⃣ ABORDAGEM SUGERIDA (SCRIPTS IA)
        ======================================== */}
        {sales_approach && (
          <>
            <Separator className="my-6" />
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                5️⃣ Abordagem Sugerida
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scripts gerados por IA personalizados para esta oportunidade.
              </p>

              {/* Script de Email */}
              {sales_approach.email_script && (
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Script de Email
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(sales_approach.email_script.body, 'email')}
                    >
                      {copiedText === 'email' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Assunto:</span>
                      <p className="text-sm font-semibold">{sales_approach.email_script.subject}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Corpo:</span>
                      <div 
                        className="text-sm mt-2 p-3 bg-muted/30 rounded-md whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: sales_approach.email_script.body }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Script de Ligação */}
              {sales_approach.call_script && (
                <Card className="p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      Script de Ligação
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(sales_approach.call_script, null, 2), 'call')}
                    >
                      {copiedText === 'call' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    {sales_approach.call_script.opening && (
                      <div>
                        <span className="text-xs font-medium text-green-600">ABERTURA:</span>
                        <p className="mt-1 p-2 bg-green-50/50 dark:bg-green-950/20 rounded">{sales_approach.call_script.opening}</p>
                      </div>
                    )}
                    {sales_approach.call_script.discovery && (
                      <div>
                        <span className="text-xs font-medium text-blue-600">DESCOBERTA:</span>
                        <p className="mt-1 p-2 bg-blue-50/50 dark:bg-blue-950/20 rounded">{sales_approach.call_script.discovery}</p>
                      </div>
                    )}
                    {sales_approach.call_script.pitch && (
                      <div>
                        <span className="text-xs font-medium text-purple-600">PITCH:</span>
                        <p className="mt-1 p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded">{sales_approach.call_script.pitch}</p>
                      </div>
                    )}
                    {sales_approach.call_script.objections && Array.isArray(sales_approach.call_script.objections) && (
                      <div>
                        <span className="text-xs font-medium text-orange-600">OBJEÇÕES:</span>
                        <ul className="mt-1 space-y-1">
                          {sales_approach.call_script.objections.map((obj: string, idx: number) => (
                            <li key={idx} className="text-xs p-2 bg-orange-50/50 dark:bg-orange-950/20 rounded">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {sales_approach.call_script.closing && (
                      <div>
                        <span className="text-xs font-medium text-red-600">FECHAMENTO:</span>
                        <p className="mt-1 p-2 bg-red-50/50 dark:bg-red-950/20 rounded">{sales_approach.call_script.closing}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Talking Points */}
              {sales_approach.talking_points && Array.isArray(sales_approach.talking_points) && (
                <Card className="p-5">
                  <h4 className="font-semibold mb-3">Talking Points</h4>
                  <ul className="space-y-2">
                    {sales_approach.talking_points.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </>
        )}

        {/* ========================================
            6️⃣ STACK SUGERIDO
        ======================================== */}
        {stack_suggestion && (
          <>
            <Separator className="my-6" />
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                6️⃣ Stack TOTVS Sugerido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Core */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Core (Essencial)
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.core?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="default" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Complementares */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Complementares
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.complementary?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Expansão Futura */}
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase block mb-2">
                    Expansão Futura
                  </span>
                  <div className="space-y-1">
                    {stack_suggestion.future_expansion?.map((product: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="mr-1 mb-1">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
