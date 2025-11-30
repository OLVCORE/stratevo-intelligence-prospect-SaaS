// src/pages/FitAnalysisPage.tsx
// Página de análise de fit de produtos (genérico, multi-tenant)

import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, CheckCircle2, AlertCircle, Sparkles, Clock, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";
import { CompanySelectDialog } from "@/components/common/CompanySelectDialog";
import { ExplainabilityButton } from "@/components/common/ExplainabilityButton";

export default function FitAnalysisPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectMode, setSelectMode] = useState<'single' | 'multiple'>('single');
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['fit-analysis-companies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select(`
          *,
          digital_maturity (*),
          governance_signals (*)
        `)
        .not('digital_maturity_score', 'is', null)
        .order('digital_maturity_score', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const companyIds = useMemo(() => (companies?.map((c: any) => c.id) ?? []), [companies]);

  const { data: analyses, isLoading: isAnalysesLoading, refetch: refetchAnalyses } = useQuery({
    queryKey: ['fit-analysis-analyses', companyIds],
    enabled: companyIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('governance_signals')
        .select('*')
        .in('company_id', companyIds)
        .eq('signal_type', 'product_fit_analysis') // Atualizado
        .order('detected_at', { ascending: false });
      return data || [];
    }
  });

  const analysisByCompany = useMemo(() => {
    const map = new Map<string, any>();
    analyses?.forEach((rec: any) => {
      if (!map.has(rec.company_id)) map.set(rec.company_id, rec);
    });
    return map;
  }, [analyses]);

  const analyzeMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-product-fit', {
        body: { companyId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "✅ Análise concluída",
        description: "Recomendações de produtos geradas com IA",
      });
      refetch();
      refetchAnalyses();
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleConfirm = async (selectedIds: string[]) => {
    if (!selectedIds || selectedIds.length === 0) return;
    if (selectMode === 'single') {
      return new Promise<void>((resolve, reject) => {
        analyzeMutation.mutate(selectedIds[0], {
          onSuccess: () => resolve(),
          onError: (err) => reject(err)
        });
      });
    }
    setIsBulkRunning(true);
    let success = 0;
    let failed = 0;
    
    for (const id of selectedIds) {
      try {
        await analyzeMutation.mutateAsync(id);
        success++;
      } catch (error) {
        failed++;
      }
    }
    
    setIsBulkRunning(false);
    toast({
      title: `Processamento concluído`,
      description: `${success} sucesso(s), ${failed} erro(s)`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise de Fit de Produtos</h1>
          <p className="text-muted-foreground">
            Analise o fit de produtos/serviços com empresas usando IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectMode('single');
              setDialogOpen(true);
            }}
            disabled={isBulkRunning}
          >
            <Target className="w-4 h-4 mr-2" />
            Analisar Empresa
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setSelectMode('multiple');
              setDialogOpen(true);
            }}
            disabled={isBulkRunning}
          >
            <Zap className="w-4 h-4 mr-2" />
            Análise em Lote
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies?.map((company: any) => {
            const analysis = analysisByCompany.get(company.id);
            const fitScore = analysis?.metadata?.fit_score || 0;
            const fitTier = analysis?.metadata?.fit_tier || 'unknown';
            
            return (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{company.company_name || company.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {company.city}, {company.state}
                      </CardDescription>
                    </div>
                    <Badge variant={fitTier === 'high' ? 'default' : fitTier === 'medium' ? 'secondary' : 'outline'}>
                      {fitScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Fit Score</span>
                        <span className="font-semibold">{fitScore}%</span>
                      </div>
                      <Progress value={fitScore} className="h-2" />
                    </div>
                    
                    {analysis && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Analisado em: {new Date(analysis.detected_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => analyzeMutation.mutate(company.id)}
                        disabled={analyzeMutation.isPending}
                        className="flex-1"
                      >
                        {analyzeMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Target className="w-3 h-3 mr-1" />
                            Analisar
                          </>
                        )}
                      </Button>
                      {analysis && (
                        <ExplainabilityButton
                          analysisId={analysis.id}
                          signalType="product_fit_analysis"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CompanySelectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={selectMode}
        onConfirm={handleConfirm}
        title={selectMode === 'single' ? 'Selecionar Empresa' : 'Selecionar Empresas'}
        description={selectMode === 'single' 
          ? 'Escolha uma empresa para análise de fit'
          : 'Escolha múltiplas empresas para análise em lote'}
      />
    </div>
  );
}

