// src/pages/CentralICP/BatchUsageAnalysis.tsx
// Página de análise em lote de verificação de uso (genérico, multi-tenant)

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Download, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useBatchUsageAnalysis } from '@/hooks/useBatchUsageAnalysis';
import { toast } from 'sonner';

export default function BatchUsageAnalysis() {
  const [companies, setCompanies] = useState<any[]>([]);
  const { processBatch, isProcessing, progress } = useBatchUsageAnalysis();

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      const parsed = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          cnpj: values[0]?.trim(),
          razao_social: values[1]?.trim(),
          nome_fantasia: values[2]?.trim(),
          domain: values[3]?.trim(),
        };
      }).filter(c => c.cnpj && c.razao_social);

      setCompanies(parsed);
      toast.success(`✅ ${parsed.length} empresas carregadas!`);
    };
    reader.readAsText(file);
  };

  const handleStartBatch = async () => {
    if (companies.length === 0) {
      toast.error('Nenhuma empresa carregada!');
      return;
    }

    const confirmacao = window.confirm(
      `⚠️ CONFIRMAÇÃO DE CUSTO\n\n` +
      `Você vai processar ${companies.length} empresas.\n\n` +
      `Custo estimado:\n` +
      `- Créditos: ~${companies.length * 150}\n` +
      `- Valor: ~R$ ${companies.length}\n` +
      `- Tempo: ~${Math.round(companies.length * 35 / 60)} minutos\n\n` +
      `Continuar?`
    );

    if (!confirmacao) return;

    const result = await processBatch(companies);
    
    toast.success('🎉 Processamento em lote concluído!', {
      description: `${result.summary.go} GO | ${result.summary.noGo} NO-GO | ${result.summary.errors} erros`,
      duration: 10000,
    });
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Análise de Verificação em Massa</h1>
        <p className="text-muted-foreground">
          Processe 10, 100, ou 200 empresas automaticamente
        </p>
      </div>

      {/* CARD: Upload CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            1. Upload de Empresas
          </CardTitle>
          <CardDescription>
            Faça upload de um CSV com: CNPJ, Razão Social, Nome Fantasia, Website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            
            {companies.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold">{companies.length} empresas carregadas</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CARD: Processamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            2. Processar Análise
          </CardTitle>
          <CardDescription>
            Execute verificação de uso, extração de decisores e análise digital para todas as empresas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando: {progress.currentCompany}</span>
                  <span>{progress.processed}/{progress.total}</span>
                </div>
                <Progress value={progressPercent} />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>✅ GO: {progress.go}</span>
                  <span>❌ NO-GO: {progress.noGo}</span>
                  <span>⚠️ Erros: {progress.errors}</span>
                  <span>⏱️ Tempo restante: ~{Math.round(progress.estimatedTimeRemaining / 60)}min</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleStartBatch}
              disabled={companies.length === 0 || isProcessing}
              size="lg"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Processamento em Lote
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CARD: Resultados */}
      {progress.processed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{progress.go}</div>
                <div className="text-sm text-muted-foreground">GO (Qualificados)</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{progress.noGo}</div>
                <div className="text-sm text-muted-foreground">NO-GO (Descartados)</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{progress.errors}</div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

