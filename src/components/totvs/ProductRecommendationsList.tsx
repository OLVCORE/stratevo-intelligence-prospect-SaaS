// src/components/totvs/ProductRecommendationsList.tsx
// Lista de recomendações de produtos (world class)

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductRecommendationItem } from './ProductRecommendationItem';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Package,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProductRecommendation {
  product_id: string;
  product_name: string;
  fit_score: number;
  recommendation: 'high' | 'medium' | 'low';
  justification: string;
  strengths: string[];
  weaknesses: string[];
}

interface ProductRecommendationsListProps {
  recommendations: ProductRecommendation[];
  onProductSelect?: (productId: string) => void;
  selectedProducts?: string[];
  className?: string;
}

export function ProductRecommendationsList({
  recommendations,
  onProductSelect,
  selectedProducts = [],
  className
}: ProductRecommendationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filtrar recomendações
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;

    // Filtro por nível
    if (filterLevel !== 'all') {
      filtered = filtered.filter(r => r.recommendation === filterLevel);
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.product_name.toLowerCase().includes(query) ||
        r.justification.toLowerCase().includes(query) ||
        r.strengths.some(s => s.toLowerCase().includes(query)) ||
        r.weaknesses.some(w => w.toLowerCase().includes(query))
      );
    }

    // Ordenar: high primeiro, depois por score
    return filtered.sort((a, b) => {
      if (a.recommendation === 'high' && b.recommendation !== 'high') return -1;
      if (a.recommendation !== 'high' && b.recommendation === 'high') return 1;
      return b.fit_score - a.fit_score;
    });
  }, [recommendations, searchQuery, filterLevel]);

  // Estatísticas
  const stats = useMemo(() => {
    const high = recommendations.filter(r => r.recommendation === 'high').length;
    const medium = recommendations.filter(r => r.recommendation === 'medium').length;
    const low = recommendations.filter(r => r.recommendation === 'low').length;
    const avgScore = recommendations.reduce((sum, r) => sum + r.fit_score, 0) / recommendations.length;

    return { high, medium, low, avgScore, total: recommendations.length };
  }, [recommendations]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com Estatísticas */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Produtos Recomendados
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.total} produto{stats.total !== 1 ? 's' : ''} analisado{stats.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Score Médio */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.avgScore.toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Score Médio</p>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.high}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Alta</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
              {stats.medium}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Média</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
              {stats.low}
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-400">Baixa</div>
          </div>
        </div>
      </Card>

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros por Nível */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterLevel === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterLevel('all')}
            >
              Todos ({stats.total})
            </Button>
            <Button
              variant={filterLevel === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterLevel('high')}
              className={filterLevel === 'high' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Alta ({stats.high})
            </Button>
            <Button
              variant={filterLevel === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterLevel('medium')}
              className={filterLevel === 'medium' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              Média ({stats.medium})
            </Button>
            <Button
              variant={filterLevel === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterLevel('low')}
              className={filterLevel === 'low' ? 'bg-rose-600 hover:bg-rose-700' : ''}
            >
              Baixa ({stats.low})
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Recomendações */}
      {filteredRecommendations.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nenhum produto encontrado
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || filterLevel !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Nenhuma recomendação disponível'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecommendations.map((rec) => (
            <ProductRecommendationItem
              key={rec.product_id}
              productId={rec.product_id}
              productName={rec.product_name}
              fitScore={rec.fit_score}
              recommendation={rec.recommendation}
              justification={rec.justification}
              strengths={rec.strengths}
              weaknesses={rec.weaknesses}
              onSelect={onProductSelect}
              isSelected={selectedProducts.includes(rec.product_id)}
            />
          ))}
        </div>
      )}

      {/* Ação Rápida - Se houver produtos de alta recomendação */}
      {stats.high > 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {stats.high} oportunidade{stats.high !== 1 ? 's' : ''} prioritária{stats.high !== 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Produtos com alta aderência detectados
                </p>
              </div>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Ver Todos
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

