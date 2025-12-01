// src/components/onboarding/steps/Step6ResumoReview.tsx
// Step 6: Resumo e Review do Onboarding

'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Building2, 
  Target, 
  MapPin, 
  DollarSign, 
  Users, 
  TrendingUp,
  FileText,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { OnboardingData } from '../OnboardingWizard';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
  initialData: any;
  isSubmitting?: boolean;
  isGenerating?: boolean;
  onGenerate?: () => void;
  generatedCount?: number;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  createdIcpId?: string | null;
  icpResult?: any;
}

export function Step6ResumoReview({ onNext, onBack, onSave, initialData, isSubmitting, isGenerating = false, onGenerate, generatedCount = 0, isSaving = false, hasUnsavedChanges = false, createdIcpId, icpResult }: Props) {
  const navigate = useNavigate();
  
  // Debug: log quando createdIcpId mudar
  useEffect(() => {
    if (createdIcpId) {
      console.log('[Step6ResumoReview] ✅ createdIcpId recebido:', createdIcpId);
    } else {
      console.log('[Step6ResumoReview] ⚠️ createdIcpId é null/undefined');
    }
  }, [createdIcpId]);
  const formatCurrency = (value?: number) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value?: number) => {
    if (!value) return 'Não definido';
    return value.toLocaleString('pt-BR');
  };

  const isButtonEnabled = typeof onGenerate === 'function';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-primary" />
          Revisão e Confirmação
        </h2>
        <p className="text-muted-foreground">
          Revise e confirme todas as informações antes de finalizar o onboarding
        </p>
      </div>

      {/* Alerta Informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Última Chance de Revisar</AlertTitle>
        <AlertDescription>
          Verifique todos os dados abaixo. Você poderá editar algumas informações depois nas configurações, 
          mas recomendamos revisar tudo agora.
        </AlertDescription>
      </Alert>

      {/* Step 1: Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <span className="text-lg">1. Dados Básicos da Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Razão Social:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.razaoSocial || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Nome Fantasia:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.nomeFantasia || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">CNPJ:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.cnpj || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">E-mail:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.email || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Telefone:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.telefone || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Website:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.website || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Setor Principal:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.setorPrincipal || 'Não informado'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Porte:</span>
              <p className="text-base">{initialData.step1_DadosBasicos?.porteEmpresa || 'Não informado'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Setores e Nichos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-lg">2. Setores e Nichos Alvo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Setores Selecionados ({initialData.step2_SetoresNichos?.setoresAlvo?.length || 0}):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {initialData.step2_SetoresNichos?.setoresAlvo && initialData.step2_SetoresNichos.setoresAlvo.length > 0 ? (
                initialData.step2_SetoresNichos.setoresAlvo.map((setor, idx) => (
                  <Badge key={idx} variant="secondary">{setor}</Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Nenhum setor selecionado</span>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Nichos Selecionados ({initialData.step2_SetoresNichos?.nichosAlvo?.length || 0}):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {initialData.step2_SetoresNichos?.nichosAlvo && initialData.step2_SetoresNichos.nichosAlvo.length > 0 ? (
                initialData.step2_SetoresNichos.nichosAlvo.slice(0, 10).map((nicho, idx) => (
                  <Badge key={idx} variant="outline">{nicho}</Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Nenhum nicho selecionado</span>
              )}
              {initialData.step2_SetoresNichos?.nichosAlvo && initialData.step2_SetoresNichos.nichosAlvo.length > 10 && (
                <Badge variant="outline">+{initialData.step2_SetoresNichos.nichosAlvo.length - 10} mais</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Perfil Cliente Ideal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <span className="text-lg">3. Perfil do Cliente Ideal (ICP)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Localização:
              </span>
              <div className="mt-1 space-y-1">
                {initialData.step3_PerfilClienteIdeal?.localizacaoAlvo?.regioes && initialData.step3_PerfilClienteIdeal.localizacaoAlvo.regioes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Regiões:</p>
                    <div className="flex flex-wrap gap-1">
                      {initialData.step3_PerfilClienteIdeal.localizacaoAlvo.regioes.map((regiao, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{regiao}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {initialData.step3_PerfilClienteIdeal?.localizacaoAlvo?.estados && initialData.step3_PerfilClienteIdeal.localizacaoAlvo.estados.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Estados:</p>
                    <div className="flex flex-wrap gap-1">
                      {initialData.step3_PerfilClienteIdeal.localizacaoAlvo.estados.map((estado, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{estado}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {initialData.step3_PerfilClienteIdeal?.localizacaoAlvo?.municipios && initialData.step3_PerfilClienteIdeal.localizacaoAlvo.municipios.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Municípios ({initialData.step3_PerfilClienteIdeal.localizacaoAlvo.municipios.length}):</p>
                    <p className="text-xs text-muted-foreground italic">{initialData.step3_PerfilClienteIdeal.localizacaoAlvo.municipios.length} município(s) selecionado(s)</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="w-4 h-4" />
                Funcionários:
              </span>
              <p className="text-base mt-1">
                {initialData.step3_PerfilClienteIdeal?.funcionariosAlvo?.minimo || initialData.step3_PerfilClienteIdeal?.funcionariosAlvo?.maximo
                  ? `${formatNumber(initialData.step3_PerfilClienteIdeal.funcionariosAlvo.minimo)} - ${formatNumber(initialData.step3_PerfilClienteIdeal.funcionariosAlvo.maximo)}`
                  : 'Não definido'}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Faturamento:
              </span>
              <p className="text-base mt-1">
                {initialData.step3_PerfilClienteIdeal?.faturamentoAlvo?.minimo || initialData.step3_PerfilClienteIdeal?.faturamentoAlvo?.maximo
                  ? `${formatCurrency(initialData.step3_PerfilClienteIdeal.faturamentoAlvo.minimo)} - ${formatCurrency(initialData.step3_PerfilClienteIdeal.faturamentoAlvo.maximo)}`
                  : 'Não definido'}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Porte Alvo:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {initialData.step3_PerfilClienteIdeal?.porteAlvo && initialData.step3_PerfilClienteIdeal.porteAlvo.length > 0 ? (
                  initialData.step3_PerfilClienteIdeal.porteAlvo.map((porte, idx) => (
                    <Badge key={idx} variant="secondary">{porte}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Não definido</span>
                )}
              </div>
            </div>
          </div>
          {(initialData.step3_PerfilClienteIdeal?.cnaesAlvo && initialData.step3_PerfilClienteIdeal.cnaesAlvo.length > 0) || 
           (initialData.step3_PerfilClienteIdeal?.ncmsAlvo && initialData.step3_PerfilClienteIdeal.ncmsAlvo.length > 0) || 
           (initialData.step3_PerfilClienteIdeal?.caracteristicasEspeciais && initialData.step3_PerfilClienteIdeal.caracteristicasEspeciais.length > 0) ? (
            <>
              <Separator />
              <div className="space-y-2">
                {initialData.step3_PerfilClienteIdeal?.cnaesAlvo && initialData.step3_PerfilClienteIdeal.cnaesAlvo.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">CNAEs Alvo ({initialData.step3_PerfilClienteIdeal.cnaesAlvo.length}):</span>
                    <p className="text-xs text-muted-foreground mt-1">{initialData.step3_PerfilClienteIdeal.cnaesAlvo.length} CNAE(s) selecionado(s)</p>
                  </div>
                )}
                {initialData.step3_PerfilClienteIdeal?.ncmsAlvo && initialData.step3_PerfilClienteIdeal.ncmsAlvo.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">NCMs Alvo ({initialData.step3_PerfilClienteIdeal.ncmsAlvo.length}):</span>
                    <p className="text-xs text-muted-foreground mt-1">{initialData.step3_PerfilClienteIdeal.ncmsAlvo.length} NCM(s) selecionado(s)</p>
                  </div>
                )}
                {initialData.step3_PerfilClienteIdeal?.caracteristicasEspeciais && initialData.step3_PerfilClienteIdeal.caracteristicasEspeciais.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-muted-foreground">Características Especiais:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {initialData.step3_PerfilClienteIdeal.caracteristicasEspeciais.map((caracteristica, idx) => (
                        <Badge key={idx} variant="default">{caracteristica}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Step 4: Diferenciais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="text-lg">4. Diferenciais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Categoria da Solução:</span>
              <p className="text-base">{initialData.step4_SituacaoAtual?.categoriaSolucao || 'Não informado'}</p>
            </div>
            {/* Tickets e Ciclos - Tabela */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Tickets Médios e Ciclos de Venda:</span>
              {initialData.step4_SituacaoAtual?.ticketsECiclos && initialData.step4_SituacaoAtual.ticketsECiclos.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {/* Cabeçalho da tabela */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
                    <div className="col-span-4">Ticket Médio</div>
                    <div className="col-span-3">Ciclo (dias)</div>
                    <div className="col-span-5">Critério</div>
                  </div>
                  
                  {/* Linhas da tabela */}
                  {initialData.step4_SituacaoAtual.ticketsECiclos.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-b-0">
                      <div className="col-span-4">
                        <span className="font-semibold">{formatCurrency(item.ticketMedio)}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="font-semibold">{item.cicloVenda} dias</span>
                      </div>
                      <div className="col-span-5 text-sm text-muted-foreground">
                        {item.criterio}
                      </div>
                    </div>
                  ))}
                </div>
              ) : initialData.step4_SituacaoAtual?.ticketMedio || initialData.step4_SituacaoAtual?.cicloVendaMedia ? (
                // 🔥 Compatibilidade com dados antigos
                <div className="mt-2 space-y-1">
                  {initialData.step4_SituacaoAtual.ticketMedio && (
                    <p className="text-base">
                      Ticket: {formatCurrency(initialData.step4_SituacaoAtual.ticketMedio)}
                      {initialData.step4_SituacaoAtual.criterioTicketMedio && (
                        <span className="text-sm text-muted-foreground ml-2">({initialData.step4_SituacaoAtual.criterioTicketMedio})</span>
                      )}
                    </p>
                  )}
                  {initialData.step4_SituacaoAtual.cicloVendaMedia && (
                    <p className="text-base">
                      Ciclo: {initialData.step4_SituacaoAtual.cicloVendaMedia} dias
                      {initialData.step4_SituacaoAtual.criterioCicloVenda && (
                        <span className="text-sm text-muted-foreground ml-2">({initialData.step4_SituacaoAtual.criterioCicloVenda})</span>
                      )}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-base mt-2">Não informado</p>
              )}
            </div>
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Concorrentes Diretos:</span>
              <p className="text-base">
                {initialData.step4_SituacaoAtual?.concorrentesDiretos?.length || 0} cadastrado(s)
              </p>
            </div>
          </div>
          
          {/* Concorrentes Diretos - Exibir todos os campos */}
          {initialData.step4_SituacaoAtual?.concorrentesDiretos && initialData.step4_SituacaoAtual.concorrentesDiretos.length > 0 && (
            <div className="mt-4 space-y-3">
              <span className="text-sm font-semibold text-muted-foreground">Concorrentes Diretos:</span>
              {initialData.step4_SituacaoAtual.concorrentesDiretos.map((concorrente: any, idx: number) => (
                <Card key={idx} className="p-3 border-l-4 border-l-blue-500">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <div className="font-semibold">{concorrente.razaoSocial || concorrente.nome}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {concorrente.cnpj && (
                        <div>
                          <span className="text-muted-foreground">CNPJ:</span>
                          <div className="font-mono text-xs">{concorrente.cnpj}</div>
                        </div>
                      )}
                      {concorrente.nomeFantasia && (
                        <div>
                          <span className="text-muted-foreground">Nome Fantasia:</span>
                          <div>{concorrente.nomeFantasia}</div>
                        </div>
                      )}
                      {concorrente.setor && (
                        <div>
                          <span className="text-muted-foreground">Setor:</span>
                          <div>{concorrente.setor}</div>
                        </div>
                      )}
                      {(concorrente.cidade || concorrente.estado) && (
                        <div>
                          <span className="text-muted-foreground">Localização:</span>
                          <div>{concorrente.cidade}{concorrente.cidade && concorrente.estado ? ', ' : ''}{concorrente.estado}</div>
                        </div>
                      )}
                      {concorrente.capitalSocial > 0 && (
                        <div>
                          <span className="text-muted-foreground">Capital Social:</span>
                          <div>R$ {concorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                      {concorrente.cnaePrincipal && (
                        <div>
                          <span className="text-muted-foreground">CNAE Principal:</span>
                          <div className="font-mono text-xs">{concorrente.cnaePrincipal}</div>
                        </div>
                      )}
                      {concorrente.cnaePrincipalDescricao && (
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-muted-foreground">Descrição CNAE:</span>
                          <div className="text-xs">{concorrente.cnaePrincipalDescricao}</div>
                        </div>
                      )}
                      {concorrente.website && (
                        <div>
                          <span className="text-muted-foreground">Website:</span>
                          <div className="text-blue-600">{concorrente.website}</div>
                        </div>
                      )}
                      {concorrente.diferencialDeles && (
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-muted-foreground">Diferencial:</span>
                          <div>{concorrente.diferencialDeles}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {initialData.step4_SituacaoAtual?.diferenciais && initialData.step4_SituacaoAtual.diferenciais.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-muted-foreground">Diferenciais:</span>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {initialData.step4_SituacaoAtual.diferenciais.map((diferencial, idx) => (
                  <li key={idx} className="text-sm">{diferencial}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 5: ICP Benchmarking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-lg">5. ICP Benchmarking</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clientes Atuais */}
          {initialData.step5_HistoricoEEnriquecimento?.clientesAtuais && initialData.step5_HistoricoEEnriquecimento.clientesAtuais.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Clientes Atuais Cadastrados:
                </span>
                <Badge variant="secondary">
                  {initialData.step5_HistoricoEEnriquecimento.clientesAtuais.length} cliente{initialData.step5_HistoricoEEnriquecimento.clientesAtuais.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2">
                {initialData.step5_HistoricoEEnriquecimento.clientesAtuais.map((cliente: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-md border border-border">
                    <div className="font-semibold text-foreground mb-2">{cliente.razaoSocial || cliente.nome}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {cliente.cnpj && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">CNPJ:</span>
                          <span className="text-foreground font-mono">{cliente.cnpj}</span>
                        </div>
                      )}
                      {cliente.setor && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Setor:</span>
                          <Badge variant="secondary" className="text-xs">{cliente.setor}</Badge>
                        </div>
                      )}
                      {cliente.cidade && cliente.estado && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Localização:</span>
                          <span className="text-foreground">{cliente.cidade}, {cliente.estado}</span>
                        </div>
                      )}
                      {cliente.cnaePrincipal && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">CNAE:</span>
                          <span className="text-foreground font-mono text-xs">{cliente.cnaePrincipal}</span>
                        </div>
                      )}
                      {cliente.capitalSocial && cliente.capitalSocial > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Capital:</span>
                          <span className="text-foreground">R$ {cliente.capitalSocial.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {cliente.ticketMedio && cliente.ticketMedio > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Ticket Médio:</span>
                          <Badge variant="outline" className="text-xs">R$ {cliente.ticketMedio.toLocaleString('pt-BR')}</Badge>
                        </div>
                      )}
                    </div>
                    {cliente.cnaePrincipalDescricao && (
                      <p className="text-xs text-muted-foreground italic mt-2">{cliente.cnaePrincipalDescricao}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 🔥 UNIFICADO: Empresas de Benchmarking */}
          {initialData.step5_HistoricoEEnriquecimento?.empresasBenchmarking && initialData.step5_HistoricoEEnriquecimento.empresasBenchmarking.length > 0 && (
            <div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Empresas Alvo para ICP Benchmarking:
                </span>
                <Badge variant="secondary">
                  {initialData.step5_HistoricoEEnriquecimento.empresasBenchmarking.length} empresa{initialData.step5_HistoricoEEnriquecimento.empresasBenchmarking.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2">
                {initialData.step5_HistoricoEEnriquecimento.empresasBenchmarking.map((empresa: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-md border border-border">
                    <div className="font-semibold text-foreground mb-2">{empresa.razaoSocial}</div>
                    {empresa.nomeFantasia && (
                      <div className="text-sm text-muted-foreground mb-2">{empresa.nomeFantasia}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {empresa.cnpj && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">CNPJ:</span>
                          <span className="text-foreground font-mono">{empresa.cnpj}</span>
                        </div>
                      )}
                      {empresa.setor && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Setor:</span>
                          <Badge variant="secondary" className="text-xs">{empresa.setor}</Badge>
                        </div>
                      )}
                      {empresa.cidade && empresa.estado && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Localização:</span>
                          <span className="text-foreground">{empresa.cidade}, {empresa.estado}</span>
                        </div>
                      )}
                      {empresa.cnaePrincipal && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">CNAE:</span>
                          <span className="text-foreground font-mono text-xs">{empresa.cnaePrincipal}</span>
                        </div>
                      )}
                      {empresa.capitalSocial && empresa.capitalSocial > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium">Capital:</span>
                          <span className="text-foreground">R$ {empresa.capitalSocial.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                    {empresa.cnaePrincipalDescricao && (
                      <p className="text-xs text-muted-foreground italic mt-2">{empresa.cnaePrincipalDescricao}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Explicativo sobre ICP */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            O que é ICP?
          </CardTitle>
          <CardDescription>
            ICP (Ideal Customer Profile) = Perfil de Cliente Ideal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O ICP é o perfil consolidado do seu cliente ideal, gerado com base em todas as informações coletadas nas 5 etapas anteriores. 
            Ele será usado para:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Qualificar e pontuar empresas automaticamente nas 10 abas da plataforma</li>
            <li>Identificar oportunidades de negócio mais assertivas</li>
            <li>Priorizar leads com maior potencial de conversão</li>
            <li>Gerar insights e recomendações estratégicas com IA</li>
          </ul>
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs">
              <strong>Importante:</strong> O ICP será gerado com base nos dados preenchidos nas etapas anteriores. 
              Quanto mais completo e objetivo for o preenchimento, mais assertivo será o ICP gerado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Botão para Gerar ICP */}
      <Card>
        <CardContent className="pt-6">
          {!createdIcpId ? (
            <div className="space-y-4">
              {/* Info sobre o que será gerado */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Gerar ICP Estratégico com IA
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O ICP será gerado com análise de CEO/Estrategista de Mercado, incluindo:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                    <li>Análise Macroeconômica (PIB, inflação, crescimento setorial)</li>
                    <li>Análise de Setores e CNAEs alvo</li>
                    <li>Análise Estatística dos clientes atuais</li>
                    <li>Análise Competitiva e posicionamento</li>
                    <li>Tendências de Mercado e projeções</li>
                    <li>Estratégias de expansão de Market Share</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    💡 Você poderá configurar critérios adicionais depois em "Central ICP → Critérios de Análise"
                  </p>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={async () => {
                    if (onGenerate) {
                      await onGenerate();
                    }
                  }}
                  disabled={!isButtonEnabled || isGenerating}
                  className="flex items-center gap-2 min-w-[160px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando ICP...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar ICP
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">ICP gerado com sucesso!</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Seu ICP foi criado e está pronto para uso. Você pode visualizar os detalhes ou gerar relatórios.
                  </p>
                </div>
              </div>
              
              {/* Linha 1: Ações principais do ICP */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (onGenerate) {
                      await onGenerate();
                    }
                  }}
                  disabled={isGenerating}
                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerar ICP
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  onClick={() => navigate(`/central-icp/profile/${createdIcpId}`)}
                  className="flex-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Ver Detalhes do ICP
                </Button>
              </div>

              {/* Linha 2: Relatórios (após gerar ICP) */}
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  📊 Gere relatórios estratégicos com análise de CEO/Estrategista de Mercado:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/central-icp/reports/${createdIcpId}?type=completo`)}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Relatório Completo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/central-icp/reports/${createdIcpId}?type=resumo`)}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Resumo
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              ICPs gerados até agora: <span className="font-semibold text-primary">{generatedCount ?? 0}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={onBack}
        onNext={() => onNext({})}
        onSave={onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Finalizar Onboarding"
        nextLoading={isSubmitting}
        isSubmit={false}
      />
    </div>
  );
}

