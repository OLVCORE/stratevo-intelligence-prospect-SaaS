import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Users,
  Target,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  Shield,
  DollarSign,
  Briefcase,
  FileText,
} from 'lucide-react';
import { TOTVSStatusBadge } from '@/components/totvs/TOTVSStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';

// ============================================================================
// TYPES
// ============================================================================

interface ExpandableCompaniesTableBRProps {
  companies: any[];
  selectedCompanies?: string[];
  onToggleSelect?: (companyId: string) => void;
  onToggleSelectAll?: () => void;
  onRowClick?: (company: any) => void;
  showCheckboxes?: boolean;
  showActions?: boolean;
  actionsComponent?: (company: any) => React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExpandableCompaniesTableBR({ 
  companies, 
  selectedCompanies = [],
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  showCheckboxes = true,
  showActions = true,
  actionsComponent
}: ExpandableCompaniesTableBRProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (companyId: string) => {
    setExpandedRow(expandedRow === companyId ? null : companyId);
  };

  const getICPScore = (company: any): number => {
    return company.icp_score || 0;
  };

  const getDecisionMakers = (company: any): any[] => {
    return company.decision_makers || [];
  };

  const getReceitaData = (company: any) => {
    return company.raw_data?.receita_federal || company.raw_data?.receita || {};
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCompanies.length === companies.length && companies.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-center">Score ICP</TableHead>
            <TableHead className="text-center">Status TOTVS</TableHead>
            <TableHead className="text-center">Análise</TableHead>
            {showActions && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const icpScore = getICPScore(company);
            const decisores = getDecisionMakers(company);
            const receitaData = getReceitaData(company);
            
            return (
              <>
                {/* ========== LINHA PRINCIPAL ========== */}
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleRow(company.id)}
                >
                  {showCheckboxes && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => onToggleSelect?.(company.id)}
                      />
                    </TableCell>
                  )}
                  
                  {/* Botão Expandir */}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {expandedRow === company.id ? (
                        <ChevronUp className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  
                  {/* Nome + Website */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">{company.name || company.razao_social}</span>
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" />
                          {company.website.replace('https://', '').replace('http://', '').substring(0, 25)}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* CNPJ */}
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {company.cnpj || 'N/A'}
                    </span>
                  </TableCell>
                  
                  {/* Localização */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {(receitaData.municipio || company.city) && (
                        <span className="text-xs font-medium">
                          {receitaData.municipio || company.city}
                        </span>
                      )}
                      {(receitaData.uf || company.state) && (
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                          {receitaData.uf || company.state}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  {/* Setor */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {company.industry || receitaData.setor_amigavel || 'N/A'}
                    </span>
                  </TableCell>
                  
                  {/* Score ICP */}
                  <TableCell className="text-center">
                    {icpScore > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-primary">{icpScore}</span>
                        <Progress value={icpScore} className="h-1 w-12" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  {/* Status TOTVS */}
                  <TableCell className="text-center">
                    <TOTVSStatusBadge
                      status={company.totvs_status}
                      confidence={company.totvs_confidence}
                      size="sm"
                    />
                  </TableCell>
                  
                  {/* Status Análise */}
                  <TableCell className="text-center">
                    <QuarantineEnrichmentStatusBadge
                      rawAnalysis={company.raw_data || {}}
                      totvsStatus={company.totvs_status}
                      showProgress={false}
                    />
                  </TableCell>
                  
                  {/* Ações */}
                  {showActions && (
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        {actionsComponent?.(company)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>

                {/* ========== LINHA EXPANDIDA (CARD COMPLETO) ========== */}
                {expandedRow === company.id && (
                  <TableRow>
                    <TableCell colSpan={showCheckboxes ? (showActions ? 10 : 9) : (showActions ? 9 : 8)} className="bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 p-0">
                      <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* ========== COLUNA ESQUERDA ========== */}
                            <div className="space-y-4">
                              
                              {/* 1️⃣ IDENTIFICAÇÃO CADASTRAL */}
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                  <Shield className="h-4 w-4" />
                                  Identificação Cadastral
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground text-xs">Razão Social:</span>
                                    <p className="font-medium">{receitaData.razao_social || company.name}</p>
                                  </div>
                                  {receitaData.fantasia && (
                                    <div>
                                      <span className="text-muted-foreground text-xs">Nome Fantasia:</span>
                                      <p className="font-medium">{receitaData.fantasia}</p>
                                    </div>
                                  )}
                                  {company.cnpj && (
                                    <div>
                                      <span className="text-muted-foreground text-xs">CNPJ:</span>
                                      <p className="font-mono text-xs">{company.cnpj}</p>
                                    </div>
                                  )}
                                  {receitaData.situacao && (
                                    <div>
                                      <span className="text-muted-foreground text-xs">Situação:</span>
                                      <Badge variant={receitaData.situacao === 'ATIVA' ? 'default' : 'destructive'} className="text-xs">
                                        {receitaData.situacao}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 2️⃣ LOCALIZAÇÃO COMPLETA */}
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                  <MapPin className="h-4 w-4" />
                                  Localização Completa
                                </h4>
                                <div className="space-y-2 text-sm">
                                  {receitaData.logradouro && (
                                    <p className="text-muted-foreground">
                                      {receitaData.logradouro}, {receitaData.numero || 'S/N'}
                                      {receitaData.complemento && ` - ${receitaData.complemento}`}
                                    </p>
                                  )}
                                  {receitaData.bairro && (
                                    <p className="text-muted-foreground">{receitaData.bairro}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {receitaData.municipio && (
                                      <span className="font-medium">{receitaData.municipio}</span>
                                    )}
                                    {receitaData.uf && (
                                      <Badge variant="outline">{receitaData.uf}</Badge>
                                    )}
                                    {receitaData.cep && (
                                      <span className="text-xs font-mono text-muted-foreground">
                                        CEP: {receitaData.cep}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 3️⃣ ATIVIDADE ECONÔMICA */}
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                  <Briefcase className="h-4 w-4" />
                                  Atividade Econômica
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Setor:</span>
                                    <span className="font-medium">{company.industry || 'N/A'}</span>
                                  </div>
                                  {receitaData.cnae_fiscal && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNAE:</span>
                                      <span className="font-mono text-xs">{receitaData.cnae_fiscal}</span>
                                    </div>
                                  )}
                                  {receitaData.porte && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Porte:</span>
                                      <Badge variant="secondary">{receitaData.porte}</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ========== COLUNA DIREITA ========== */}
                            <div className="space-y-4">
                              
                              {/* 4️⃣ SCORE ICP */}
                              {icpScore > 0 && (
                                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-400">
                                    <Target className="h-4 w-4" />
                                    Score ICP
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <Progress value={icpScore} className="h-3" />
                                    </div>
                                    <span className="text-3xl font-bold text-blue-400">{icpScore}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {icpScore >= 80 && '🟢 Fit excelente para ICP'}
                                    {icpScore >= 60 && icpScore < 80 && '🟡 Bom fit para ICP'}
                                    {icpScore < 60 && '🟠 Fit moderado'}
                                  </p>
                                </div>
                              )}

                              {/* 5️⃣ STATUS TOTVS EXPANDIDO */}
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                  <FileText className="h-4 w-4" />
                                  Verificação TOTVS
                                </h4>
                                <div className="flex items-center justify-center">
                                  <TOTVSStatusBadge
                                    status={company.totvs_status}
                                    confidence={company.totvs_confidence}
                                    size="lg"
                                    showDetails
                                  />
                                </div>
                              </div>

                              {/* 6️⃣ LINKS EXTERNOS */}
                              <div className="p-4 bg-muted/30 rounded-lg border">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                  <Globe className="h-4 w-4" />
                                  Links Externos
                                </h4>
                                <div className="space-y-2">
                                  {company.website && (
                                    <a
                                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Globe className="h-4 w-4" />
                                      Website
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                  {company.raw_data?.digital_presence?.linkedin && (
                                    <a
                                      href={company.raw_data.digital_presence.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src="https://cdn.simpleicons.org/linkedin" className="h-4 w-4" alt="LinkedIn" />
                                      LinkedIn
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                  {company.apollo_organization_id && (
                                    <a
                                      href={`https://app.apollo.io/#/organizations/${company.apollo_organization_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img src="https://www.apollo.io/favicon.ico" className="h-4 w-4" alt="Apollo" />
                                      Apollo.io
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* 7️⃣ DECISORES */}
                              {decisores.length > 0 && (
                                <div className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/30">
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-400">
                                    <Users className="h-4 w-4" />
                                    Decisores ({decisores.length})
                                  </h4>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {decisores.slice(0, 5).map((dm: any, idx: number) => (
                                      <div key={idx} className="p-3 bg-slate-800/60 rounded border border-slate-700/50">
                                        <div className="font-medium text-sm text-white">{dm.name || dm.full_name}</div>
                                        <div className="text-xs text-slate-400">{dm.title || dm.position}</div>
                                        <div className="flex gap-3 mt-2">
                                          {dm.email && (
                                            <a
                                              href={`mailto:${dm.email}`}
                                              className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Mail className="h-3 w-3" />
                                              Email
                                            </a>
                                          )}
                                          {dm.phone && (
                                            <a
                                              href={`tel:${dm.phone}`}
                                              className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Phone className="h-3 w-3" />
                                              Telefone
                                            </a>
                                          )}
                                          {dm.linkedin_url && (
                                            <a
                                              href={dm.linkedin_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <img src="https://cdn.simpleicons.org/linkedin" className="h-3 w-3" alt="LinkedIn" />
                                              LinkedIn
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {decisores.length > 5 && (
                                      <p className="text-xs text-center text-muted-foreground mt-2">
                                        + {decisores.length - 5} decisores • Clique na empresa para ver todos
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 8️⃣ INFORMAÇÕES FINANCEIRAS */}
                              {receitaData.capital_social && (
                                <div className="p-4 bg-muted/30 rounded-lg border">
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                    <DollarSign className="h-4 w-4" />
                                    Informações Financeiras
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <span className="text-muted-foreground text-xs">Capital Social:</span>
                                      <p className="font-bold text-green-400">
                                        R$ {parseFloat(receitaData.capital_social).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                    {receitaData.porte && (
                                      <div>
                                        <span className="text-muted-foreground text-xs">Porte:</span>
                                        <Badge variant="secondary">{receitaData.porte}</Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ========== AÇÃO RÁPIDA (RODAPÉ) ========== */}
                            <div className="lg:col-span-2 flex justify-center gap-3 pt-4 border-t">
                              <Button
                                variant="default"
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRowClick?.(company);
                                }}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Building2 className="h-4 w-4 mr-2" />
                                Ver Detalhes Completos
                              </Button>
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/account-strategy?company=${company.id}`, '_blank');
                                }}
                              >
                                <Target className="h-4 w-4 mr-2" />
                                Criar Estratégia
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>

      {companies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma empresa encontrada</p>
        </div>
      )}
    </div>
  );
}

