import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Download, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useBatchUsageAnalysis } from '@/hooks/useBatchUsageAnalysis';
import { toast } from 'sonner';

export default function BatchTOTVSAnalysis() {
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

      {/* CARD: Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            2. Processar em Lote
          </CardTitle>
          <CardDescription>
            Cada empresa será processada automaticamente com 3 abas: Verificação + Decisores + Digital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estimativa de Custos */}
          {companies.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-muted-foreground">Empresas</div>
                <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-sm text-muted-foreground">Créditos</div>
                <div className="text-2xl font-bold text-amber-600">~{companies.length * 150}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-sm text-muted-foreground">Custo</div>
                <div className="text-2xl font-bold text-green-600">~R$ {companies.length}</div>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartBatch}
            disabled={isProcessing || companies.length === 0}
            size="lg"
            className="w-full gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando... {progress.processed}/{progress.total}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Iniciar Processamento em Lote
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* CARD: Progresso */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso do Processamento</CardTitle>
            <CardDescription>
              Processando: {progress.currentCompany}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso Geral</span>
                <span className="font-bold">{progress.processed}/{progress.total} ({progressPercent}%)</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{progress.processed}</div>
                <div className="text-xs text-muted-foreground">Processadas</div>
              </div>
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.go}</div>
                <div className="text-xs text-muted-foreground">GO (Prospects)</div>
              </div>
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{progress.noGo}</div>
                <div className="text-xs text-muted-foreground">NO-GO (Clientes)</div>
              </div>
              <div className="text-center p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{progress.errors}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              ⏱️ Tempo restante estimado: ~{Math.round(progress.estimatedTimeRemaining / 60)} minutos
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

