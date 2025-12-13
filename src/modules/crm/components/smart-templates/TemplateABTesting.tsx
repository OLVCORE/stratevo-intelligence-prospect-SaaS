/**
 * 🧪 TEMPLATE A/B TESTING - Teste A/B Automático de Templates
 * 
 * Testa diferentes versões de templates e analisa performance
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TestTube, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ABTestResult {
  variant: 'A' | 'B';
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  conversion_rate: number;
}

interface TemplateABTestingProps {
  templateA: string;
  templateB: string;
  onTestComplete?: (results: ABTestResult[]) => void;
}

export function TemplateABTesting({ templateA, templateB, onTestComplete }: TemplateABTestingProps) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ABTestResult[] | null>(null);

  const handleStartTest = async () => {
    setIsRunning(true);
    
    try {
      // 🔥 PROIBIDO: Dados mockados removidos
      // Em produção, criar duas versões do template e enviar para grupos diferentes
      // Por enquanto, buscar resultados de testes A/B anteriores do banco
      const { data: abTests, error } = await (supabase as any)
        .from('ab_tests')
        .select('variant, sent_count, opened_count, clicked_count, replied_count')
        .eq('template_a', templateA)
        .eq('template_b', templateB)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = tabela não existe

      if (abTests && abTests.length >= 2) {
        // Usar resultados reais de teste anterior
        const realResults: ABTestResult[] = abTests.map((test: any) => {
          const sent = test.sent_count || 0;
          const replied = test.replied_count || 0;
          const conversionRate = sent > 0 ? (replied / sent) * 100 : 0;

          return {
            variant: test.variant === 'A' ? 'A' : 'B',
            sent,
            opened: test.opened_count || 0,
            clicked: test.clicked_count || 0,
            replied,
            conversion_rate: Math.round(conversionRate * 10) / 10,
          };
        });

        setResults(realResults);
        setIsRunning(false);
        
        if (onTestComplete) {
          onTestComplete(realResults);
        }
      } else {
        // Se não houver teste anterior, mostrar mensagem que precisa executar teste real
        toast({
          title: "Teste A/B não encontrado",
          description: "Execute o teste enviando as duas versões para grupos diferentes",
          variant: "default",
        });
        setResults([]);
        setIsRunning(false);
      }
    } catch (error: any) {
      console.error('Erro ao buscar resultados de teste A/B:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar resultados. Execute um teste real primeiro.",
        variant: "destructive",
      });
      setResults([]);
      setIsRunning(false);
    }
  };

  const getWinner = () => {
    if (!results) return null;
    return results[0].conversion_rate > results[1].conversion_rate ? 'A' : 'B';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste A/B de Templates
        </CardTitle>
        <CardDescription>
          Teste diferentes versões e descubra qual performa melhor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge>Variante A</Badge>
              <span className="text-xs text-muted-foreground">{templateA.length} caracteres</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{templateA}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Badge>Variante B</Badge>
              <span className="text-xs text-muted-foreground">{templateB.length} caracteres</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{templateB}</p>
          </div>
        </div>

        <Button
          onClick={handleStartTest}
          disabled={isRunning || !templateA || !templateB}
          className="w-full"
        >
          {isRunning ? (
            <>
              <BarChart3 className="mr-2 h-4 w-4 animate-spin" />
              Executando teste...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Iniciar Teste A/B
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Resultados:</h4>
              {getWinner() && (
                <Badge variant="default" className="bg-green-500">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Vencedor: Variante {getWinner()}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {results.map((result) => (
                <div key={result.variant} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={result.variant === getWinner() ? 'default' : 'secondary'}>
                      Variante {result.variant}
                    </Badge>
                    <span className="text-sm font-semibold">{result.conversion_rate}% conversão</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Enviados:</span>
                      <span>{result.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abertos:</span>
                      <span>{result.opened} ({(result.opened / result.sent * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliques:</span>
                      <span>{result.clicked} ({(result.clicked / result.sent * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Respostas:</span>
                      <span>{result.replied} ({(result.replied / result.sent * 100).toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <Progress value={result.conversion_rate} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

