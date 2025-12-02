/**
 * 🔍 Descoberta Automática de Concorrentes via SERPER
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, ExternalLink, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompetitorCandidate {
  nome: string;
  website: string;
  descricao: string;
  relevancia: number;
  fonte: 'serper';
}

interface Props {
  industry: string;
  products: string[];
  location?: string;
  excludeWebsites?: string[];
  onCompetitorSelected?: (candidate: CompetitorCandidate) => void;
}

export default function CompetitorDiscovery({
  industry,
  products,
  location,
  excludeWebsites = [],
  onCompetitorSelected,
}: Props) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CompetitorCandidate[]>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);

  const handleSearch = async () => {
    if (!industry && !customQuery) {
      toast({
        title: 'Erro',
        description: 'Informe o setor ou uma busca customizada',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    setCandidates([]);

    try {
      console.log('[CompetitorDiscovery] 🔍 Iniciando busca SERPER');

      const { data, error } = await supabase.functions.invoke('search-competitors-serper', {
        body: {
          industry: customQuery || industry,
          products: products.slice(0, 5), // Top 5 produtos
          location,
          excludeDomains: excludeWebsites,
          maxResults,
        },
      });

      if (error) throw error;

      if (data.success && data.candidates) {
        console.log('[CompetitorDiscovery] ✅ Candidatos encontrados:', data.candidates.length);
        setCandidates(data.candidates);
        
        toast({
          title: 'Busca concluída',
          description: `${data.candidates.length} concorrentes potenciais encontrados`,
        });
      } else {
        toast({
          title: 'Nenhum resultado',
          description: 'Tente ajustar os termos de busca',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('[CompetitorDiscovery] ❌ Erro:', error);
      toast({
        title: 'Erro na busca',
        description: error.message || 'Não foi possível buscar concorrentes',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Painel de Busca */}
      <Card className="border-l-4 border-l-blue-600 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <Search className="h-5 w-5 text-blue-700 dark:text-blue-500" />
            </div>
            <span className="text-slate-800 dark:text-slate-100">Descobrir Concorrentes Automaticamente</span>
          </CardTitle>
          <CardDescription>
            Use IA e busca na web para encontrar concorrentes e fornecedores similares
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Setor/Indústria</Label>
              <Input 
                value={customQuery || industry}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ex: Fabricante de EPIs"
                disabled={searching}
              />
            </div>
            <div className="space-y-2">
              <Label>Localização (opcional)</Label>
              <Input 
                value={location || ''}
                placeholder="Ex: São Paulo"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. Resultados</Label>
              <Input 
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                min={5}
                max={20}
                disabled={searching}
              />
            </div>
          </div>

          {products.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Produtos para refinar busca ({products.length}):
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {products.slice(0, 5).map((prod, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {prod}
                  </Badge>
                ))}
                {products.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{products.length - 5} mais
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSearch}
            disabled={searching}
            className="w-full"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando concorrentes...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Buscar Concorrentes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {candidates.length > 0 && (
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
            <CardTitle className="text-slate-800 dark:text-slate-100">
              Candidatos Encontrados ({candidates.length})
            </CardTitle>
            <CardDescription>
              Clique em "Adicionar" para incluir na lista de concorrentes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {candidates.map((candidate, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm truncate">{candidate.nome}</p>
                        <Badge className="bg-blue-600 text-white text-xs shrink-0">
                          {Math.round(candidate.relevancia)}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {candidate.descricao}
                      </p>
                      <a 
                        href={candidate.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {new URL(candidate.website).hostname.replace('www.', '')}
                      </a>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onCompetitorSelected?.(candidate)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ajuda */}
      {!searching && candidates.length === 0 && (
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Como funciona a descoberta automática?
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Busca no Google usando sua indústria e produtos como referência</li>
                  <li>Filtra automaticamente marketplaces e sites genéricos</li>
                  <li>Calcula relevância baseada em múltiplos fatores</li>
                  <li>Retorna apenas websites oficiais de empresas</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                  💡 <strong>Dica:</strong> Quanto mais produtos você tiver cadastrados, mais precisos serão os resultados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

