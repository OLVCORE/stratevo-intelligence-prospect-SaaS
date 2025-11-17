import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Users, CheckCircle2, Building2, MapPin, Phone, Mail, TrendingUp } from "lucide-react";
import { searchCompaniesByPartner, type CompanyResult } from '@/services/partnerSearch';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { consultarReceitaFederal } from '@/services/receitaFederal';

interface PartnerSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompanies?: (companies: any[]) => void;
}

const BRAZIL_STATES = [
  'TODOS', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function PartnerSearchModal({ open, onOpenChange, onImportCompanies }: PartnerSearchModalProps) {
  const [searchType, setSearchType] = useState<'exato' | 'semelhante'>('semelhante');
  const [entityType, setEntityType] = useState<'fisica' | 'juridica'>('fisica');
  const [partnerName, setPartnerName] = useState('');
  const [cpf, setCpf] = useState('');
  const [qualification, setQualification] = useState('TODAS');
  const [ageRange, setAgeRange] = useState('TODAS');
  const [situation, setSituation] = useState('TODAS');
  const [uf, setUf] = useState('TODOS');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!partnerName && !cpf) {
      toast.error('Preencha pelo menos o nome ou CPF do sócio');
      return;
    }

    try {
      setSearching(true);
      setResults([]);
      setSelectedCompanies(new Set());
      setShowResults(false);
      
      toast.info('🔍 Buscando empresas do sócio...', {
        description: 'Analisando quadro societário das empresas cadastradas'
      });

      const searchResult = await searchCompaniesByPartner({
        partnerName: partnerName.trim() || undefined,
        cpf: cpf.trim() || undefined,
        searchType,
        entityType,
        qualification: qualification !== 'TODAS' ? qualification : undefined,
        situation: situation !== 'TODAS' ? situation : undefined,
        uf: uf !== 'TODOS' ? uf : undefined
      });

      if (!searchResult.success) {
        throw new Error(searchResult.error || 'Erro ao buscar empresas');
      }

      setResults(searchResult.companies);
      setShowResults(true);

      if (searchResult.companies.length === 0) {
        toast.warning('Nenhuma empresa encontrada', {
          description: 'Tente ajustar os filtros de busca'
        });
      } else {
        toast.success(`✅ ${searchResult.companies.length} empresa(s) encontrada(s)!`, {
          description: 'Selecione as empresas que deseja importar'
        });
        // Selecionar todas por padrão
        setSelectedCompanies(new Set(searchResult.companies.map(c => c.cnpj)));
      }
      
    } catch (error: any) {
      console.error('Erro ao buscar sócios:', error);
      toast.error('Erro na busca', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleToggleCompany = (cnpj: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(cnpj)) {
      newSelected.delete(cnpj);
    } else {
      newSelected.add(cnpj);
    }
    setSelectedCompanies(newSelected);
  };

  const handleImportSelected = async () => {
    if (selectedCompanies.size === 0) {
      toast.error('Selecione pelo menos uma empresa para importar');
      return;
    }

    try {
      setImporting(true);
      
      const companiesToImport = results.filter(c => selectedCompanies.has(c.cnpj));
      
      toast.info('📦 Importando empresas...', {
        description: `${companiesToImport.length} empresa(s) selecionada(s)`
      });

      // Verificar quais empresas já existem
      const { data: existingCompanies } = await supabase
        .from('companies')
        .select('cnpj')
        .in('cnpj', companiesToImport.map(c => c.cnpj.replace(/\D/g, '')));

      const existingCnpjs = new Set(existingCompanies?.map(c => c.cnpj) || []);
      const newCompanies = companiesToImport.filter(c => {
        const cnpjClean = c.cnpj.replace(/\D/g, '');
        return !existingCnpjs.has(cnpjClean);
      });

      if (newCompanies.length === 0) {
        toast.warning('Todas as empresas selecionadas já estão cadastradas');
        setImporting(false);
        return;
      }

      // Preparar dados para importação
      const companiesData = await Promise.all(newCompanies.map(async (company) => {
        const cnpjClean = company.cnpj.replace(/\D/g, '');
        
        // Buscar dados completos da Receita Federal se não tiver
        let receitaData = company.raw_data?.receita_federal;
        if (!receitaData && cnpjClean.length === 14) {
          try {
            const result = await consultarReceitaFederal(cnpjClean);
            if (result.success) {
              receitaData = result.data;
            }
          } catch (e) {
            console.warn(`Erro ao buscar Receita Federal para ${cnpjClean}:`, e);
          }
        }

        return {
          cnpj: cnpjClean,
          company_name: company.company_name,
          fantasy_name: company.fantasy_name || company.company_name,
          city: company.city || receitaData?.municipio || '',
          state: company.state || receitaData?.uf || '',
          industry: company.raw_data?.industry || '',
          employees: null,
          website: null,
          domain: null,
          raw_data: {
            receita_federal: receitaData || company.raw_data?.receita_federal,
            partner_search: {
              partner_name: company.partner_name,
              partner_qualification: company.partner_qualification,
              searched_at: new Date().toISOString()
            }
          },
          source_name: 'partner_search',
          source_type: 'discovery',
          import_batch_id: `partner_${Date.now()}`
        };
      }));

      // Importar via Edge Function (similar ao BulkUpload)
      const { data, error } = await supabase.functions.invoke('bulk-upload-companies', {
        body: {
          companies: companiesData,
          source: 'partner_search',
          destination: 'companies'
        }
      });

      if (error) throw error;

      const imported = data?.inserted?.length || 0;
      
      toast.success(`✅ Importação concluída!`, {
        description: `${imported} empresa(s) importada(s) com sucesso`
      });

      if (onImportCompanies) {
        onImportCompanies(data?.inserted || []);
      }

      // Resetar e fechar
      setResults([]);
      setSelectedCompanies(new Set());
      setShowResults(false);
      setPartnerName('');
      setCpf('');
      onOpenChange(false);

    } catch (error: any) {
      console.error('Erro ao importar empresas:', error);
      toast.error('Erro ao importar empresas', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Descobrir Empresas por Sócio
          </DialogTitle>
          <DialogDescription>
            Encontre empresas através dos sócios/proprietários cadastrados
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6 flex-1 overflow-y-auto">
            {/* Nome */}
            <div className="space-y-3">
              <Label>Nome do Sócio</Label>
              <RadioGroup value={searchType} onValueChange={(v: any) => setSearchType(v)} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="exato" id="exato" />
                  <Label htmlFor="exato" className="cursor-pointer">Exato</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="semelhante" id="semelhante" />
                  <Label htmlFor="semelhante" className="cursor-pointer">Semelhante</Label>
                </div>
              </RadioGroup>
              <Input
                placeholder="Ex: Marcos Francisco de Oliveira"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Tipo e CPF */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Tipo de Pessoa</Label>
                <RadioGroup value={entityType} onValueChange={(v: any) => setEntityType(v)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica" className="cursor-pointer">Física</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="juridica" id="juridica" />
                    <Label htmlFor="juridica" className="cursor-pointer">Jurídica</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <Label>CPF (Opcional - 6 dígitos do meio)</Label>
                <Input
                  placeholder="222.333"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Qualificação</Label>
                <Select value={qualification} onValueChange={setQualification}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">TODAS</SelectItem>
                    <SelectItem value="ACIONISTA">ACIONISTA</SelectItem>
                    <SelectItem value="DIRETOR">DIRETOR</SelectItem>
                    <SelectItem value="SOCIO-ADMINISTRADOR">SÓCIO-ADMINISTRADOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZIL_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Situação</Label>
                <Select value={situation} onValueChange={setSituation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">TODAS</SelectItem>
                    <SelectItem value="ATIVAS">ATIVAS</SelectItem>
                    <SelectItem value="BAIXADAS">BAIXADAS</SelectItem>
                    <SelectItem value="SUSPENSAS">SUSPENSAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{results.length} empresa(s) encontrada(s)</Badge>
                <Badge variant="outline">{selectedCompanies.size} selecionada(s)</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  setResults([]);
                }}
              >
                Nova Busca
              </Button>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {results.map((company, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedCompanies.has(company.cnpj)
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggleCompany(company.cnpj)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.has(company.cnpj)}
                            onChange={() => handleToggleCompany(company.cnpj)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {company.company_name}
                              </CardTitle>
                              {company.fantasy_name && (
                                <CardDescription className="mt-1">
                                  {company.fantasy_name}
                                </CardDescription>
                              )}
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">
                              {company.cnpj}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            {(company.city || company.state) && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[company.city, company.state].filter(Boolean).join(' - ')}
                              </div>
                            )}
                            {company.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {company.phone}
                              </div>
                            )}
                            {company.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {company.email}
                              </div>
                            )}
                            {company.porte && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {company.porte}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">Sócio:</span>
                              <span>{company.partner_name}</span>
                              {company.partner_qualification && (
                                <>
                                  <span>•</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {company.partner_qualification}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                {selectedCompanies.size > 0
                  ? `${selectedCompanies.size} empresa(s) selecionada(s) para importar`
                  : 'Selecione as empresas que deseja importar'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImportSelected}
                  disabled={selectedCompanies.size === 0 || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Importar {selectedCompanies.size > 0 && `(${selectedCompanies.size})`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

