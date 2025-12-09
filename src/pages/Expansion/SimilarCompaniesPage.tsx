/**
 * Similar Companies Engine: Página dedicada para buscar empresas similares
 * 
 * Permite buscar empresas com perfil semelhante a uma empresa base
 * para expansão acelerada de mercado
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Loader2, Search, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { fetchSimilarCompanies } from '@/services/similarCompanies.service';
import type { SimilarCompaniesResult } from '@/types/prospecting';
import { supabase } from '@/integrations/supabase/client';

export default function SimilarCompaniesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const [searchMode, setSearchMode] = useState<'cnpj' | 'company'>('cnpj');
  const [cnpjInput, setCnpjInput] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [similarResult, setSimilarResult] = useState<SimilarCompaniesResult | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [minScore, setMinScore] = useState(0.3);

  // Carregar lista de empresas para o select
  const loadCompanies = async () => {
    if (!tenantId) return;

    setLoadingCompanies(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, razao_social, nome_fantasia, cnpj')
        .eq('tenant_id', tenantId)
        .order('razao_social')
        .limit(100);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de empresas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Buscar empresas similares
  const handleSearchSimilar = async () => {
    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não identificado.',
        variant: 'destructive',
      });
      return;
    }

    if (searchMode === 'cnpj' && !cnpjInput.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe um CNPJ para buscar.',
        variant: 'destructive',
      });
      return;
    }

    if (searchMode === 'company' && !selectedCompanyId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma empresa para buscar similares.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingSimilar(true);
    try {
      const result = await fetchSimilarCompanies({
        tenantId,
        baseCompanyId: searchMode === 'company' ? selectedCompanyId : undefined,
        cnpj: searchMode === 'cnpj' ? cnpjInput.trim() : undefined,
        limit: 50,
      });

      // Filtrar por score mínimo
      const filteredMatches = result.topMatches.filter(m => m.score >= minScore);
      setSimilarResult({
        ...result,
        topMatches: filteredMatches,
      });

      toast({
        title: '✅ Empresas similares encontradas',
        description: `${filteredMatches.length} empresas com perfil semelhante encontradas.`,
      });
    } catch (error: any) {
      console.error('[SimilarCompanies] Erro ao buscar similares:', error);
      toast({
        title: 'Erro ao buscar empresas similares',
        description: error.message || 'Não foi possível buscar empresas similares. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Carregar empresas quando mudar para modo "company"
  useEffect(() => {
    if (searchMode === 'company' && companies.length === 0) {
      loadCompanies();
    }
  }, [searchMode]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <CardTitle>Empresas Similares (MC9)</CardTitle>
          <CardDescription>
            Busque empresas com perfil semelhante para expansão acelerada de mercado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Busca */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Buscar por:</Label>
              <Select value={searchMode} onValueChange={(v) => setSearchMode(v as 'cnpj' | 'company')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="company">Empresa da base</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchMode === 'cnpj' ? (
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpjInput}
                  onChange={(e) => setCnpjInput(e.target.value.replace(/\D/g, ''))}
                  maxLength={14}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.razao_social || company.nome_fantasia} {company.cnpj && `(${company.cnpj})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Score mínimo de similaridade</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value) || 0.3)}
              />
              <p className="text-xs text-muted-foreground">
                Mostrar apenas empresas com score de similaridade maior ou igual a {(minScore * 100).toFixed(0)}%
              </p>
            </div>

            <Button
              onClick={handleSearchSimilar}
              disabled={loadingSimilar || !tenantId}
              className="w-full"
            >
              {loadingSimilar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando empresas similares...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Gerar mapa de similares
                </>
              )}
            </Button>
          </div>

          {/* Resultados */}
          {similarResult && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm font-medium mb-1">Empresa base:</p>
                <p className="text-lg font-semibold">{similarResult.baseCompany.companyName}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {similarResult.baseCompany.cnpj && (
                    <span>CNPJ: {similarResult.baseCompany.cnpj}</span>
                  )}
                  {similarResult.baseCompany.uf && (
                    <span>UF: {similarResult.baseCompany.uf}</span>
                  )}
                  {similarResult.baseCompany.sector && (
                    <span>Setor: {similarResult.baseCompany.sector}</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">
                  {similarResult.topMatches.length} empresas similares encontradas:
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Empresa</TableHead>
                        <TableHead className="w-[150px]">CNPJ</TableHead>
                        <TableHead className="w-[80px]">UF</TableHead>
                        <TableHead className="w-[150px]">Setor</TableHead>
                        <TableHead className="w-[120px] text-center">Score</TableHead>
                        <TableHead>Motivos</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {similarResult.topMatches.map((match, idx) => (
                        <TableRow key={idx} className="h-[3.25rem] align-middle">
                          <TableCell className="w-[300px] max-w-[300px] truncate font-medium">
                            {match.candidate.companyName}
                          </TableCell>
                          <TableCell className="w-[150px] font-mono text-xs">
                            {match.candidate.cnpj || '-'}
                          </TableCell>
                          <TableCell className="w-[80px]">{match.candidate.uf || '-'}</TableCell>
                          <TableCell className="w-[150px] max-w-[150px] truncate text-sm text-muted-foreground">
                            {match.candidate.sector || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {(match.score * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {match.reasons.slice(0, 2).map((reason, rIdx) => (
                                <Badge key={rIdx} variant="secondary" className="text-[10px]">
                                  {reason}
                                </Badge>
                              ))}
                              {match.reasons.length > 2 && (
                                <Badge variant="secondary" className="text-[10px]">
                                  +{match.reasons.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: Implementar ação "Ver detalhes"
                                  toast({
                                    title: 'Em desenvolvimento',
                                    description: 'Ação "Ver detalhes" será implementada em breve.',
                                  });
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: Implementar ação "Enviar pro Hunter"
                                  toast({
                                    title: 'Em desenvolvimento',
                                    description: 'Ação "Enviar pro Hunter" será implementada em breve.',
                                  });
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

