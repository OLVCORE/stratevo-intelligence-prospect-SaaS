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
    
    // Simular teste A/B (em produção, executar envios reais)
    setTimeout(() => {
      const mockResults: ABTestResult[] = [
        {
          variant: 'A',
          sent: 100,
          opened: 45,
          clicked: 12,
          replied: 8,
          conversion_rate: 8.0,
        },
        {
          variant: 'B',
          sent: 100,
          opened: 52,
          clicked: 18,
          replied: 14,
          conversion_rate: 14.0,
        },
      ];
      
      setResults(mockResults);
      setIsRunning(false);
      
      if (onTestComplete) {
        onTestComplete(mockResults);
      }
      
      toast({
        title: "Teste A/B Concluído",
        description: "Resultados disponíveis",
      });
    }, 2000);
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

