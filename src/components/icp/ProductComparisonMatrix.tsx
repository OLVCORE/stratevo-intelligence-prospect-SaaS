/**
 * Matriz Comparativa de Produtos
 * Compara produtos do tenant vs produtos dos concorrentes
 * Exibido na aba de Análise Competitiva do ICP
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Package, Building2, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  ticket_medio?: number;
}

interface CompetitorProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  competitor_name: string;
  competitor_cnpj: string;
  confianca_extracao?: number;
}

interface ProductMatch {
  tenantProduct: TenantProduct;
  competitorProducts: CompetitorProduct[];
  matchScore: number;
  matchType: 'exact' | 'similar' | 'unique';
}

interface Props {
  icpId?: string;
}

export function ProductComparisonMatrix({ icpId }: Props) {
  const { tenant } = useTenant();
  const [tenantProducts, setTenantProducts] = useState<TenantProduct[]>([]);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar produtos do tenant
  useEffect(() => {
    if (!tenant?.id) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        // Produtos do tenant
        const { data: tenantProds, error: tenantError } = await supabase
          .from('tenant_products' as any)
          .select('id, nome, descricao, categoria, ticket_medio')
          .eq('tenant_id', tenant.id)
          .order('nome');

        if (tenantError) throw tenantError;

        // Produtos dos concorrentes
        const { data: compProds, error: compError } = await (supabase
          .from('tenant_competitor_products' as any)
          .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj, confianca_extracao')
          .eq('tenant_id', tenant.id)
          .order('competitor_name', { ascending: true }) as any);

        if (compError) throw compError;

        setTenantProducts(tenantProds || []);
        setCompetitorProducts(compProds || []);

        // Calcular matches
        const calculatedMatches = calculateMatches(tenantProds || [], compProds || []);
        setMatches(calculatedMatches);
      } catch (error: any) {
        console.error('Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar produtos', { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [tenant?.id, icpId]);

  // Função para calcular matches entre produtos
  const calculateMatches = (
    tenantProds: TenantProduct[],
    compProds: CompetitorProduct[]
  ): ProductMatch[] => {
    return tenantProds.map(tenantProd => {
      const matches: CompetitorProduct[] = [];
      
      compProds.forEach(compProd => {
        const similarity = calculateSimilarity(tenantProd.nome, compProd.nome);
        if (similarity > 0.6) { // Threshold de similaridade
          matches.push(compProd);
        }
      });

      let matchType: 'exact' | 'similar' | 'unique' = 'unique';
      let matchScore = 0;

      if (matches.length > 0) {
        const maxSimilarity = Math.max(
          ...matches.map(m => calculateSimilarity(tenantProd.nome, m.nome))
        );
        matchScore = maxSimilarity;
        matchType = maxSimilarity > 0.9 ? 'exact' : 'similar';
      }

      return {
        tenantProduct: tenantProd,
        competitorProducts: matches,
        matchScore,
        matchType,
      };
    });
  };

  // Função de similaridade simples (Levenshtein simplificado)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Similaridade por palavras comuns
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    if (commonWords.length > 0) {
      return Math.min(0.7, commonWords.length / Math.max(words1.length, words2.length));
    }
    
    return 0;
  };

  // Filtrar matches por termo de busca
  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      match.tenantProduct.nome.toLowerCase().includes(term) ||
      match.tenantProduct.categoria?.toLowerCase().includes(term) ||
      match.competitorProducts.some(cp => 
        cp.nome.toLowerCase().includes(term) ||
        cp.competitor_name.toLowerCase().includes(term)
      )
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Package className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando produtos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Tenant</p>
                <p className="text-2xl font-bold">{tenantProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Concorrentes</p>
                <p className="text-2xl font-bold">{competitorProducts.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matches Encontrados</p>
                <p className="text-2xl font-bold">
                  {matches.filter(m => m.matchType !== 'unique').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Únicos</p>
                <p className="text-2xl font-bold">
                  {matches.filter(m => m.matchType === 'unique').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz Comparativa de Produtos</CardTitle>
          <CardDescription>
            Compare seus produtos com os produtos dos concorrentes identificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por produto, categoria ou concorrente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          {/* Tabela Comparativa */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Produto Tenant</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produtos Concorrentes</TableHead>
                  <TableHead className="w-[150px]">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatches.map((match, idx) => (
                    <TableRow key={match.tenantProduct.id || idx}>
                      <TableCell>
                        <div className="font-medium">{match.tenantProduct.nome}</div>
                        {match.tenantProduct.descricao && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {match.tenantProduct.descricao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.tenantProduct.categoria ? (
                          <Badge variant="outline">{match.tenantProduct.categoria}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.matchType === 'exact' && (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Concorrência Direta
                          </Badge>
                        )}
                        {match.matchType === 'similar' && (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Target className="h-3 w-3" />
                            Similar
                          </Badge>
                        )}
                        {match.matchType === 'unique' && (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Diferencial
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.competitorProducts.length > 0 ? (
                          <div className="space-y-1">
                            {match.competitorProducts.map((cp, cpIdx) => (
                              <div key={cp.id || cpIdx} className="text-sm">
                                <span className="font-medium">{cp.nome}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({cp.competitor_name})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhum match</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.matchScore > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${match.matchScore * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10">
                              {Math.round(match.matchScore * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

