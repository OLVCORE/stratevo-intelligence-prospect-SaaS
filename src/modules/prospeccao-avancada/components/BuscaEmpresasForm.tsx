/**
 * Formulário de Busca Avançada de Empresas
 * 
 * Permite filtrar empresas por:
 * - Segmento
 * - Porte
 * - Faturamento
 * - Número de funcionários
 * - Localização
 * - CNAEs-Alvo (igual Aba 3 do onboarding)
 * - NCMs-Alvo (igual Aba 3 do onboarding)
 * - Características Especiais (igual Aba 3 do onboarding)
 * 
 * ⚠️ IMPORTANTE: Não usa CNAEs do ICP do tenant!
 * O tenant pode buscar empresas de setores diferentes do seu próprio CNAE.
 */

import { useState, useEffect, useMemo } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Loader2, X, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FiltrosBusca } from '../types';
import { searchCNAE, getCNAEByCode, type CNAEInfo, searchNCM, getNCMByCode, type NCMInfo } from '@/services/brasilApiComplete';

// Características especiais (igual Step3)
const CARACTERISTICAS_ESPECIAIS = [
  { code: 'ISO_9001', label: 'ISO 9001', description: 'Certificação de qualidade' },
  { code: 'ISO_14001', label: 'ISO 14001', description: 'Gestão ambiental' },
  { code: 'ISO_27001', label: 'ISO 27001', description: 'Segurança da informação' },
  { code: 'ISO_45001', label: 'ISO 45001', description: 'Segurança e saúde ocupacional' },
  { code: 'EXPORTADOR', label: 'Exportador', description: 'Empresa que exporta produtos' },
  { code: 'IMPORTADOR', label: 'Importador', description: 'Empresa que importa produtos' },
  { code: 'FABRICANTE', label: 'Fabricante', description: 'Produz produtos próprios' },
  { code: 'DISTRIBUIDOR', label: 'Distribuidor', description: 'Distribui produtos de terceiros' },
  { code: 'REVENDA', label: 'Revenda', description: 'Revende produtos' },
  { code: 'ATACADISTA', label: 'Atacadista', description: 'Venda no atacado' },
  { code: 'VAREJISTA', label: 'Varejista', description: 'Venda no varejo' },
  { code: 'FRANQUIA', label: 'Franquia', description: 'Opera como franquia' },
  { code: 'FRANQUEADOR', label: 'Franqueador', description: 'Oferece franquias' },
  { code: 'FROTA_PROPRIA', label: 'Frota Própria', description: 'Possui frota de veículos' },
  { code: 'E_COMMERCE', label: 'E-commerce', description: 'Vendas online' },
  { code: 'MARKETPLACE', label: 'Marketplace', description: 'Plataforma marketplace' },
  { code: 'B2B', label: 'B2B', description: 'Negócios B2B' },
  { code: 'B2C', label: 'B2C', description: 'Negócios B2C' },
  { code: 'B2G', label: 'B2G', description: 'Negócios com governo' },
  { code: 'CERTIFICADO_ORGANICO', label: 'Certificado Orgânico', description: 'Produtos orgânicos certificados' },
  { code: 'INOVACAO', label: 'Inovação', description: 'Empresa inovadora' },
  { code: 'STARTUP', label: 'Startup', description: 'Empresa startup' },
  { code: 'MULTINACIONAL', label: 'Multinacional', description: 'Empresa multinacional' },
];

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
    cnaesAlvo: [],
    ncmsAlvo: [],
    caracteristicasEspeciais: [],
  });

  // Estados para busca CNAE
  const [cnaeSearchQuery, setCnaeSearchQuery] = useState('');
  const [cnaeSearchResults, setCnaeSearchResults] = useState<CNAEInfo[]>([]);
  const [cnaeSearchOpen, setCnaeSearchOpen] = useState(false);
  const [cnaeSearchLoading, setCnaeSearchLoading] = useState(false);
  const [cnaesCompletos, setCnaesCompletos] = useState<Map<string, CNAEInfo>>(new Map());

  // Estados para busca NCM
  const [ncmSearchQuery, setNcmSearchQuery] = useState('');
  const [ncmSearchResults, setNcmSearchResults] = useState<NCMInfo[]>([]);
  const [ncmSearchOpen, setNcmSearchOpen] = useState(false);
  const [ncmSearchLoading, setNcmSearchLoading] = useState(false);
  const [ncmsCompletos, setNcmsCompletos] = useState<Map<string, NCMInfo>>(new Map());

  // Estados para características
  const [caracteristicasDropdownOpen, setCaracteristicasDropdownOpen] = useState(false);
  const [novaCaracteristicaCustom, setNovaCaracteristicaCustom] = useState('');
  const [caracteristicasCustom, setCaracteristicasCustom] = useState<Array<{ code: string; label: string; description: string }>>([]);

  // Buscar CNAEs na API IBGE
  useEffect(() => {
    if (cnaeSearchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setCnaeSearchLoading(true);
        try {
          let results: CNAEInfo[] = [];
          const isCode = /^\d{4,7}$/.test(cnaeSearchQuery.replace(/[.\-\/]/g, ''));
          
          if (isCode) {
            const cnaeByCode = await getCNAEByCode(cnaeSearchQuery);
            if (cnaeByCode) {
              results = [cnaeByCode];
            }
          }
          
          const searchResults = await searchCNAE(cnaeSearchQuery);
          results = [...results, ...searchResults];
          
          const uniqueResults = results.filter((cnae, index, self) =>
            index === self.findIndex(c => c.codigo === cnae.codigo)
          );
          
          const resultadosValidos = uniqueResults.filter(c => 
            c && c.codigo && c.descricao && 
            c.codigo.trim() !== '' && c.descricao.trim() !== ''
          );
          
          setCnaeSearchResults(resultadosValidos.slice(0, 30));
        } catch (error) {
          console.error('[BuscaEmpresasForm] Erro ao buscar CNAEs:', error);
          setCnaeSearchResults([]);
        } finally {
          setCnaeSearchLoading(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setCnaeSearchResults([]);
    }
  }, [cnaeSearchQuery]);

  // Buscar NCMs na API Brasil
  useEffect(() => {
    if (ncmSearchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setNcmSearchLoading(true);
        try {
          let results: NCMInfo[] = [];
          const isCode = /^\d{4,8}$/.test(ncmSearchQuery.replace(/[.\-]/g, ''));
          
          if (isCode) {
            const cleanCode = ncmSearchQuery.replace(/[.\-]/g, '').substring(0, 8);
            const ncmByCode = await getNCMByCode(cleanCode);
            if (ncmByCode) {
              results = [ncmByCode];
            }
          }
          
          const searchResults = await searchNCM(ncmSearchQuery);
          results = [...results, ...searchResults];
          
          const uniqueResults = results.filter((ncm, index, self) =>
            index === self.findIndex(n => n.codigo === ncm.codigo)
          );
          
          setNcmSearchResults(uniqueResults.slice(0, 30));
        } catch (error) {
          console.error('[BuscaEmpresasForm] Erro ao buscar NCMs:', error);
          setNcmSearchResults([]);
        } finally {
          setNcmSearchLoading(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setNcmSearchResults([]);
    }
  }, [ncmSearchQuery]);

  const handleAddCNAE = (cnae?: CNAEInfo) => {
    if (cnae) {
      const cnaeCode = cnae.codigo || '';
      
      if ((filtros.cnaesAlvo?.length || 0) >= 10) {
        alert('Limite máximo de 10 CNAEs principais. Remova um CNAE antes de adicionar outro.');
        setCnaeSearchOpen(false);
        return;
      }
      
      if (!filtros.cnaesAlvo?.includes(cnaeCode)) {
        const cnaeCompleto: CNAEInfo = {
          ...cnae,
          codigo: cnaeCode,
          descricao: cnae.descricao || 'CNAE sem descrição'
        };
        
        setCnaesCompletos(prev => new Map(prev).set(cnaeCode, cnaeCompleto));
        setFiltros({
          ...filtros,
          cnaesAlvo: [...(filtros.cnaesAlvo || []), cnaeCode],
        });
        setCnaeSearchOpen(false);
        setCnaeSearchQuery('');
      }
    }
  };

  const handleAddNCM = (ncm?: NCMInfo) => {
    if (ncm) {
      const ncmCode = ncm.codigo;
      
      if ((filtros.ncmsAlvo?.length || 0) >= 10) {
        alert('Limite máximo de 10 NCMs principais. Remova um NCM antes de adicionar outro.');
        setNcmSearchOpen(false);
        return;
      }
      
      if (!filtros.ncmsAlvo?.includes(ncmCode)) {
        setNcmsCompletos(prev => new Map(prev).set(ncmCode, ncm));
        setFiltros({
          ...filtros,
          ncmsAlvo: [...(filtros.ncmsAlvo || []), ncmCode],
        });
        setNcmSearchOpen(false);
        setNcmSearchQuery('');
      }
    }
  };

  const toggleCaracteristica = (code: string) => {
    const current = filtros.caracteristicasEspeciais || [];
    if (current.includes(code)) {
      setFiltros({
        ...filtros,
        caracteristicasEspeciais: current.filter(c => c !== code),
      });
    } else {
      setFiltros({
        ...filtros,
        caracteristicasEspeciais: [...current, code],
      });
    }
  };

  const adicionarCaracteristicaCustom = () => {
    if (novaCaracteristicaCustom.trim()) {
      const code = `CUSTOM_${Date.now()}`;
      const novaCarac = {
        code,
        label: novaCaracteristicaCustom.trim(),
        description: 'Característica customizada'
      };
      setCaracteristicasCustom(prev => [...prev, novaCarac]);
      setFiltros({
        ...filtros,
        caracteristicasEspeciais: [...(filtros.caracteristicasEspeciais || []), code],
      });
      setNovaCaracteristicaCustom('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBuscar(filtros);
  };

  // Todas as características disponíveis (padrão + customizadas)
  const todasCaracteristicas = useMemo(() => {
    return [...CARACTERISTICAS_ESPECIAIS, ...caracteristicasCustom];
  }, [caracteristicasCustom]);

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Filtros Básicos */}
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
                onValueChange={(value) => setFiltros({ ...filtros, porte: value as any })}
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

          {/* CNAEs-Alvo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CNAEs-Alvo (opcional)</CardTitle>
              <CardDescription className="text-xs">
                Busque CNAEs por código ou descrição usando API do IBGE. Digite código (ex: 6201-5/00) ou descrição (ex: desenvolvimento de software)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover 
                open={cnaeSearchOpen} 
                onOpenChange={(open) => {
                  if (!open && cnaeSearchQuery.length < 2) {
                    setCnaeSearchOpen(false);
                  } else if (open) {
                    setCnaeSearchOpen(true);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Input
                    type="text"
                    value={cnaeSearchQuery}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setCnaeSearchQuery(newValue);
                      if (newValue.length >= 2) {
                        setCnaeSearchOpen(true);
                      }
                    }}
                    placeholder="Digite código CNAE (ex: 0134 ou desenvolvimento)..."
                    onFocus={() => {
                      if (cnaeSearchQuery.length >= 2) {
                        setCnaeSearchOpen(true);
                      }
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar CNAE..." 
                      value={cnaeSearchQuery}
                      onValueChange={(value) => {
                        setCnaeSearchQuery(value);
                        if (value.length >= 2) {
                          setCnaeSearchOpen(true);
                        }
                      }}
                    />
                    <CommandList className="max-h-[300px]">
                      {cnaeSearchLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : cnaeSearchResults.length === 0 ? (
                        <CommandEmpty>
                          {cnaeSearchQuery.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum CNAE encontrado'}
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {cnaeSearchResults.map((cnae) => (
                            <CommandItem
                              key={cnae.id || cnae.codigo}
                              value={`${cnae.codigo} ${cnae.descricao}`}
                              onSelect={() => handleAddCNAE(cnae)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filtros.cnaesAlvo?.includes(cnae.codigo || '') ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-semibold text-foreground">{cnae.codigo || 'Sem código'}</span>
                                <span className="text-xs text-muted-foreground">{cnae.descricao || 'Sem descrição'}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {filtros.cnaesAlvo && filtros.cnaesAlvo.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 w-full">
                  {filtros.cnaesAlvo.map((cnaeCode, index) => {
                    const cnaeCompleto = cnaesCompletos.get(cnaeCode);
                    const codigoExibir = cnaeCompleto?.codigo || cnaeCode;
                    const descricaoExibir = cnaeCompleto?.descricao || 'CNAE sem descrição';
                    
                    return (
                      <div
                        key={`${cnaeCode}-${index}`}
                        className="flex items-start justify-between gap-2 p-2 rounded border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setFiltros({
                            ...filtros,
                            cnaesAlvo: filtros.cnaesAlvo?.filter((_, i) => i !== index) || [],
                          });
                          setCnaesCompletos(prev => {
                            const novo = new Map(prev);
                            novo.delete(cnaeCode);
                            return novo;
                          });
                        }}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-xs text-foreground whitespace-nowrap flex-shrink-0">
                            {codigoExibir}
                          </span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="text-xs text-muted-foreground leading-tight break-words flex-1">
                            {descricaoExibir}
                          </span>
                        </div>
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              )}
              {filtros.cnaesAlvo && filtros.cnaesAlvo.length >= 10 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  ⚠️ Limite máximo de 10 CNAEs principais atingido.
                </p>
              )}
            </CardContent>
          </Card>

          {/* NCMs-Alvo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">NCMs-Alvo (opcional)</CardTitle>
              <CardDescription className="text-xs">
                Busque NCMs por código ou descrição. Digite código (ex: 8471) ou descrição (ex: computador)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Popover 
                open={ncmSearchOpen} 
                onOpenChange={(open) => {
                  if (!open && ncmSearchQuery.length < 2) {
                    setNcmSearchOpen(false);
                  } else if (open) {
                    setNcmSearchOpen(true);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Input
                    type="text"
                    value={ncmSearchQuery}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setNcmSearchQuery(newValue);
                      if (newValue.length >= 2) {
                        setNcmSearchOpen(true);
                      }
                    }}
                    placeholder="Digite código NCM (ex: 8471) ou descrição (ex: computador)..."
                    onFocus={() => {
                      if (ncmSearchQuery.length >= 2) {
                        setNcmSearchOpen(true);
                      }
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar NCM..." 
                      value={ncmSearchQuery}
                      onValueChange={(value) => {
                        setNcmSearchQuery(value);
                        if (value.length >= 2) {
                          setNcmSearchOpen(true);
                        }
                      }}
                    />
                    <CommandList className="max-h-[300px]">
                      {ncmSearchLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : ncmSearchResults.length === 0 ? (
                        <CommandEmpty>
                          {ncmSearchQuery.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum NCM encontrado'}
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {ncmSearchResults.map((ncm) => (
                            <CommandItem
                              key={ncm.codigo}
                              value={`${ncm.codigo} ${ncm.descricao}`}
                              onSelect={() => handleAddNCM(ncm)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filtros.ncmsAlvo?.includes(ncm.codigo) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-semibold text-foreground">{ncm.codigo}</span>
                                <span className="text-xs text-muted-foreground">{ncm.descricao}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {filtros.ncmsAlvo && filtros.ncmsAlvo.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 w-full">
                  {filtros.ncmsAlvo.map((ncmCode, index) => {
                    const ncmCompleto = ncmsCompletos.get(ncmCode);
                    return (
                      <div
                        key={`${ncmCode}-${index}`}
                        className="flex items-start justify-between gap-2 p-2 rounded border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                        onClick={() => {
                          setFiltros({
                            ...filtros,
                            ncmsAlvo: filtros.ncmsAlvo?.filter((_, i) => i !== index) || [],
                          });
                          setNcmsCompletos(prev => {
                            const novo = new Map(prev);
                            novo.delete(ncmCode);
                            return novo;
                          });
                        }}
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-xs text-foreground whitespace-nowrap flex-shrink-0">
                            {ncmCompleto?.codigo || ncmCode}
                          </span>
                          <span className="text-xs text-muted-foreground">-</span>
                          {ncmCompleto?.descricao ? (
                            <span className="text-xs text-muted-foreground leading-tight break-words flex-1">
                              {ncmCompleto.descricao}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic flex-1">NCM adicionado manualmente</span>
                          )}
                        </div>
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              )}
              {filtros.ncmsAlvo && filtros.ncmsAlvo.length >= 10 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  ⚠️ Limite máximo de 10 NCMs principais atingido.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Características Especiais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Características Especiais (opcional)</CardTitle>
              <CardDescription className="text-xs">
                Selecione características que as empresas ideais devem ter
                {filtros.caracteristicasEspeciais && filtros.caracteristicasEspeciais.length > 0 && 
                  ` (${filtros.caracteristicasEspeciais.length} selecionada${filtros.caracteristicasEspeciais.length > 1 ? 's' : ''})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover open={caracteristicasDropdownOpen} onOpenChange={setCaracteristicasDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    Selecionar características...
                    <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar característica..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhuma característica encontrada.</CommandEmpty>
                      <CommandGroup>
                        {todasCaracteristicas.map((carac) => (
                          <CommandItem
                            key={carac.code}
                            value={`${carac.label} ${carac.description}`}
                            onSelect={() => {
                              toggleCaracteristica(carac.code);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filtros.caracteristicasEspeciais?.includes(carac.code) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="text-foreground">{carac.label}</span>
                              <span className="text-xs text-muted-foreground">{carac.description}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Adicionar característica customizada */}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar característica customizada..."
                  value={novaCaracteristicaCustom}
                  onChange={(e) => setNovaCaracteristicaCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarCaracteristicaCustom();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={adicionarCaracteristicaCustom}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lista de características selecionadas */}
              {filtros.caracteristicasEspeciais && filtros.caracteristicasEspeciais.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filtros.caracteristicasEspeciais.map((code) => {
                    const carac = todasCaracteristicas.find(c => c.code === code);
                    if (!carac) return null;
                    
                    return (
                      <div
                        key={code}
                        className="flex items-center gap-1 px-2 py-1 rounded border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                        onClick={() => toggleCaracteristica(code)}
                      >
                        <span className="text-xs text-foreground">{carac.label}</span>
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

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
