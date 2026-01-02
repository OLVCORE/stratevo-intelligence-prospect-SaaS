/**
 * 🔍 Descoberta Automática de Concorrentes via SERPER
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, ExternalLink, Plus, Sparkles, AlertCircle, Eye, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompetitorCandidate {
  nome: string;
  website: string;
  descricao: string;
  relevancia: number;
  fonte: 'serper';
  similarityScore?: number; // Score de similaridade de website (0-100)
  businessType?: 'empresa' | 'vaga' | 'artigo' | 'perfil' | 'associacao' | 'educacional' | 'outro';
}

interface Props {
  industry: string;
  products: string[];
  location?: string;
  excludeWebsites?: string[];
  onCompetitorSelected?: (candidate: CompetitorCandidate) => void;
}

// Marketplaces a serem excluídos automaticamente
const EXCLUDED_MARKETPLACES = [
  'mercadolivre.com.br',
  'mercadolivre.com',
  'shopee.com.br',
  'shopee.com',
  'amazon.com.br',
  'amazon.com',
  'alibaba.com',
  'aliexpress.com',
  'magazineluiza.com.br',
  'americanas.com.br',
  'casasbahia.com.br',
  'extra.com.br',
  'pontofrio.com.br',
  'submarino.com.br',
  'shoptime.com.br',
  'walmart.com.br',
  'carrefour.com.br',
  'casasbahia.com.br',
];

export default function CompetitorDiscovery({
  industry,
  products,
  location: initialLocation,
  excludeWebsites = [],
  onCompetitorSelected,
}: Props) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CompetitorCandidate[]>([]);
  // 🔥 CORRIGIDO: Inicializar customQuery com industry, mas permitir apagar completamente
  const [customQuery, setCustomQuery] = useState(industry || '');
  const [maxResults, setMaxResults] = useState(10);
  // 🔥 CORRIGIDO: State controlado para location (editável)
  const [location, setLocation] = useState(initialLocation ?? '');
  const [showPreview, setShowPreview] = useState(false);

  // 🔥 CORRIGIDO: Sincronizar initialLocation apenas uma vez (primeiro preenchimento)
  useEffect(() => {
    if (initialLocation && location.trim() === '') {
      setLocation(initialLocation);
    }
  }, [initialLocation]); // Só roda quando initialLocation muda, não sobrescreve se usuário já digitou

  // 🔥 CORRIGIDO: Sincronizar industry apenas na primeira renderização (se customQuery estiver vazio)
  useEffect(() => {
    if (industry && customQuery === '') {
      setCustomQuery(industry);
    }
  }, []); // Só roda uma vez na montagem

  // Função para gerar preview da query
  const generateQueryPreview = () => {
    const queryParts: string[] = [];
    
    // Setor/Indústria
    const industryQuery = customQuery.trim();
    if (industryQuery) {
      queryParts.push(industryQuery);
    }
    
    // Produtos com aspas para busca exata (usar até 10 para preview)
    const productsToUse = products.slice(0, 10);
    if (productsToUse.length > 0) {
      const productsQuoted = productsToUse.map(p => `"${p}"`).join(' OR ');
      queryParts.push(`(${productsQuoted}${products.length > 10 ? ' ...' : ''})`);
    }
    
    // Localização
    const locationQuery = location.trim() || 'Brasil';
    queryParts.push(locationQuery);
    
    return queryParts.join(' ');
  };

  const handleSearch = async () => {
    const queryToUse = customQuery.trim();
    if (!queryToUse) {
      toast({
        title: 'Erro',
        description: 'Informe o setor ou uma busca customizada',
        variant: 'destructive',
      });
      return;
    }

    // 🔥 CRÍTICO: Limpar candidatos ANTES de iniciar busca (forçar atualização imediata)
    setCandidates([]);
    setSearching(true);
    
    // 🔥 NOVO: Forçar re-render imediato limpando estado
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      console.log('[CompetitorDiscovery] 🔍 Iniciando busca SERPER');
      console.log('[CompetitorDiscovery] 📦 Produtos sendo usados:', products.length, products.slice(0, 5));

      // 🔥 MELHORADO: Combinar excludeWebsites com marketplaces padrão
      const allExcludedDomains = [
        ...new Set([
          ...excludeWebsites,
          ...EXCLUDED_MARKETPLACES,
        ])
      ];

      const { data, error } = await supabase.functions.invoke('search-competitors-serper', {
        body: {
          industry: customQuery.trim(), // 🔥 CORRIGIDO: Usar apenas customQuery (não fallback para industry)
          products: products, // 🔥 MELHORADO: Passar TODOS os produtos do tenant (não apenas 5)
          location: location.trim() || 'Brasil', // Se vazio, busca Brasil sem filtro de cidade/UF
          excludeDomains: allExcludedDomains,
          maxResults,
        },
      });

      if (error) throw error;

      // 🔥 CRÍTICO: Sempre limpar e atualizar, mesmo se não houver candidatos
      if (data.success && data.candidates) {
        console.log('[CompetitorDiscovery] ✅ Candidatos encontrados:', data.candidates.length);
        console.log('[CompetitorDiscovery] 📋 Primeiros candidatos:', data.candidates.slice(0, 3).map(c => c.nome));
        
        // 🔥 CRÍTICO: Forçar atualização com nova referência de array
        setCandidates([...data.candidates]);
        
        // 🔥 MELHORADO: Calcular relevância média
        const avgRelevancia = data.candidates.length > 0
          ? Math.round(data.candidates.reduce((sum: number, c: CompetitorCandidate) => sum + c.relevancia, 0) / data.candidates.length)
          : 0;
        
        toast({
          title: 'Busca concluída',
          description: `${data.candidates.length} concorrentes encontrados (relevância média: ${avgRelevancia}%)`,
        });
      } else {
        // 🔥 CRÍTICO: Garantir que está vazio se não houver resultados
        setCandidates([]);
        toast({
          title: 'Nenhum resultado',
          description: 'Tente ajustar os termos de busca ou adicionar mais produtos',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('[CompetitorDiscovery] ❌ Erro:', error);
      // 🔥 CRÍTICO: Limpar candidatos em caso de erro também
      setCandidates([]);
      toast({
        title: 'Erro na busca',
        description: error.message || 'Não foi possível buscar concorrentes',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  // Calcular relevância média dos resultados
  const avgRelevancia = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + c.relevancia, 0) / candidates.length)
    : 0;

  return (
    <div className="space-y-6" data-testid="competitor-discovery-v2">
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
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ex: Fabricante de EPIs"
                disabled={searching}
              />
            </div>
            <div className="space-y-2">
              <Label>Localização (opcional)</Label>
              <Input 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP ou deixe em branco para Brasil"
                disabled={searching}
              />
              <p className="text-xs text-muted-foreground">
                💡 Deixe em branco para buscar em todo o Brasil
              </p>
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

          {/* 🔥 MELHORADO: Badges de produtos mais visíveis com scroll para 100% dos produtos */}
          {products.length > 0 ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Produtos usados na busca ({products.length}):
              </Label>
              {/* ✅ NOVO: Container com scroll para mostrar 100% dos produtos */}
              <div className="max-h-32 overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2">
                  {products.map((prod, idx) => (
                    <Badge key={idx} variant="default" className="bg-blue-600 text-white text-xs px-2 py-1">
                      {prod}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Aviso:</strong> Nenhum produto cadastrado. Adicione produtos para refinar a busca e obter resultados mais precisos.
                </p>
              </div>
            </div>
          )}

          {/* 🔥 NOVO: Preview da Query */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview da Query
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-6 px-2 text-xs"
              >
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {showPreview && (
              <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border border-blue-300 dark:border-blue-700">
                <code className="text-xs text-blue-900 dark:text-blue-100 font-mono break-all">
                  {generateQueryPreview()}
                </code>
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  <p>• Excluindo automaticamente: {EXCLUDED_MARKETPLACES.slice(0, 5).join(', ')}...</p>
                  {location.trim() ? (
                    <p>• Localização: {location}</p>
                  ) : (
                    <p>• Localização: Brasil (sem filtro de cidade/UF)</p>
                  )}
                </div>
              </div>
            )}
          </div>

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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800 dark:text-slate-100">
                  Candidatos Encontrados ({candidates.length})
                </CardTitle>
                <CardDescription>
                  Relevância média: <strong>{avgRelevancia}%</strong> • Clique em "Adicionar" para incluir na lista de concorrentes
                </CardDescription>
              </div>
            </div>
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{candidate.nome}</p>
                        <Badge 
                          className={`text-xs shrink-0 ${
                            candidate.relevancia >= 80 ? 'bg-green-600 text-white' :
                            candidate.relevancia >= 60 ? 'bg-blue-600 text-white' :
                            candidate.relevancia >= 40 ? 'bg-yellow-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}
                        >
                          {Math.round(candidate.relevancia)}% match
                        </Badge>
                        {candidate.similarityScore !== undefined && (
                          <Badge 
                            variant="outline"
                            className="text-xs shrink-0 border-purple-500 text-purple-700 dark:text-purple-400"
                            title="Score de similaridade de website (estilo Semrush/SimilarWeb)"
                          >
                            Similaridade: {Math.round(candidate.similarityScore)}%
                          </Badge>
                        )}
                        {candidate.businessType === 'empresa' && (
                          <Badge 
                            variant="outline"
                            className="text-xs shrink-0 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          >
                            ✓ Empresa
                          </Badge>
                        )}
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
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    📊 Critérios de Similaridade (estilo Semrush/SimilarWeb):
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
                    <li>• <strong>Similaridade Semântica (50%):</strong> Análise de serviços/produtos similares</li>
                    <li>• <strong>Posição no Google (25%):</strong> Base (1º = 97%, 2º = 94%, etc.)</li>
                    <li>• <strong>Palavras-chave no título (15%):</strong> Setor + produtos</li>
                    <li>• <strong>Palavras-chave no snippet (10%):</strong> Consultoria, soluções, comércio exterior</li>
                    <li>• <strong>Filtros inteligentes:</strong> Exclui vagas, artigos, perfis, associações</li>
                    <li>• <strong>Múltiplas queries:</strong> Busca em diferentes variações para melhor cobertura</li>
                  </ul>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    💡 <strong>Melhorias:</strong> Sistema agora filtra automaticamente resultados genéricos (vagas, artigos, perfis) e foca apenas em empresas reais com serviços similares.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

