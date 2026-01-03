/**
 * Formulário de Busca Avançada de Empresas
 * 
 * Permite filtrar empresas por:
 * - Segmento
 * - Porte
 * - Faturamento
 * - Número de funcionários
 * - Localização
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { type FiltrosBusca } from '../services/enrichmentService';

interface BuscaEmpresasFormProps {
  onBuscar: (filtros: FiltrosBusca) => Promise<void>;
  isLoading?: boolean;
}

export function BuscaEmpresasForm({ onBuscar, isLoading = false }: BuscaEmpresasFormProps) {
  const [filtros, setFiltros] = useState<FiltrosBusca>({
    segmento: '',
    porte: undefined,
    faturamentoMin: undefined,
    faturamentoMax: undefined,
    funcionariosMin: undefined,
    funcionariosMax: undefined,
    localizacao: '',
    quantidadeDesejada: 20,
    page: 1,
    pageSize: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBuscar(filtros);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Busca Avançada de Empresas
        </CardTitle>
        <CardDescription>
          Use filtros específicos para encontrar empresas ideais para seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Segmento */}
            <div className="space-y-2">
              <Label htmlFor="segmento">Segmento/Indústria</Label>
              <Input
                id="segmento"
                placeholder="Ex: Tecnologia, Manufatura, Serviços"
                value={filtros.segmento || ''}
                onChange={(e) => setFiltros({ ...filtros, segmento: e.target.value })}
              />
            </div>

            {/* Porte */}
            <div className="space-y-2">
              <Label htmlFor="porte">Porte da Empresa</Label>
              <Select
                value={filtros.porte || ''}
                onValueChange={(value) => setFiltros({ ...filtros, porte: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o porte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro">Micro Empresa</SelectItem>
                  <SelectItem value="pequena">Pequena</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Faturamento Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="faturamentoMin">Faturamento Mínimo (R$)</Label>
              <Input
                id="faturamentoMin"
                type="number"
                placeholder="Ex: 1000000"
                value={filtros.faturamentoMin || ''}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    faturamentoMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Faturamento Máximo */}
            <div className="space-y-2">
              <Label htmlFor="faturamentoMax">Faturamento Máximo (R$)</Label>
              <Input
                id="faturamentoMax"
                type="number"
                placeholder="Ex: 10000000"
                value={filtros.faturamentoMax || ''}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    faturamentoMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Funcionários Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="funcionariosMin">Funcionários Mínimo</Label>
              <Input
                id="funcionariosMin"
                type="number"
                placeholder="Ex: 10"
                value={filtros.funcionariosMin || ''}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    funcionariosMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Funcionários Máximo */}
            <div className="space-y-2">
              <Label htmlFor="funcionariosMax">Funcionários Máximo</Label>
              <Input
                id="funcionariosMax"
                type="number"
                placeholder="Ex: 500"
                value={filtros.funcionariosMax || ''}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    funcionariosMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Localização */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                placeholder="Ex: São Paulo, SP ou deixe em branco para Brasil"
                value={filtros.localizacao || ''}
                onChange={(e) => setFiltros({ ...filtros, localizacao: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                💡 Deixe em branco para buscar em todo o Brasil
              </p>
            </div>

            {/* Quantidade Desejada */}
            <div className="space-y-2">
              <Label htmlFor="quantidadeDesejada">Quantidade Desejada</Label>
              <Input
                id="quantidadeDesejada"
                type="number"
                min="1"
                max="100"
                placeholder="20"
                value={filtros.quantidadeDesejada || 20}
                onChange={(e) => {
                  const value = e.target.value ? Math.min(Math.max(parseInt(e.target.value), 1), 100) : 20;
                  setFiltros({ ...filtros, quantidadeDesejada: value });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de empresas a buscar (1-100)
              </p>
            </div>

            {/* Page Size */}
            <div className="space-y-2">
              <Label htmlFor="pageSize">Resultados por Página</Label>
              <Input
                id="pageSize"
                type="number"
                min="1"
                max="50"
                placeholder="20"
                value={filtros.pageSize || 20}
                onChange={(e) => {
                  const value = e.target.value ? Math.min(Math.max(parseInt(e.target.value), 1), 50) : 20;
                  setFiltros({ ...filtros, pageSize: value });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Quantidade de resultados por página (1-50)
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Empresas
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

