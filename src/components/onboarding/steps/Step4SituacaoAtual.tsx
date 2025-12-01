// src/components/onboarding/steps/Step4SituacaoAtual.tsx
// VERSÃO MELHORADA: Visual moderno e profissional, padronizado com outras páginas

'use client';

import { useState, useEffect, useRef } from 'react';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, CheckCircle2, Info, Lightbulb, Loader2, Building2, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { consultarReceitaFederal } from '@/services/receitaFederal';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: (data?: any) => void | Promise<void>; // 🔥 CORRIGIDO: Aceita dados opcionais
  initialData: any;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

// 🔥 REMOVIDO: Interface ConcorrenteDireto movida para Step1

interface TicketECiclo {
  ticketMedio: number;
  ticketMin?: number;    // 🆕 Valor mínimo do ticket
  ticketMax?: number;    // 🆕 Valor máximo do ticket
  cicloVenda: number;
  cicloMin?: number;     // 🆕 Prazo mínimo em dias
  cicloMax?: number;     // 🆕 Prazo máximo em dias
  criterio: string; // Critério/Enquadramento (ex: "Spot", "Projetos", "Contratos", "Licitações", etc.)
}

export function Step4SituacaoAtual({ onNext, onBack, onSave, initialData, isSaving = false, hasUnsavedChanges = false }: Props) {
  const [formData, setFormData] = useState({
    categoriaSolucao: initialData?.categoriaSolucao || '',
    diferenciais: initialData?.diferenciais || [],
    casosDeUso: initialData?.casosDeUso || [],
    ticketsECiclos: initialData?.ticketsECiclos || (initialData?.ticketMedio || initialData?.cicloVendaMedia ? [{
      ticketMedio: initialData.ticketMedio || 0,
      cicloVenda: initialData.cicloVendaMedia || 0,
      criterio: initialData.criterioTicketMedio || initialData.criterioCicloVenda || 'Geral'
    }] : []), // 🔥 NOVO: Array de tickets e ciclos na mesma linha
    // 🔥 REMOVIDO: concorrentesDiretos movidos para Step 1
  });

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa)
  useEffect(() => {
    if (initialData) {
      console.log('[Step4] 🔄 Atualizando dados do initialData:', initialData);
      setFormData({
        categoriaSolucao: initialData.categoriaSolucao || '',
        diferenciais: initialData.diferenciais || [],
        casosDeUso: initialData.casosDeUso || [],
        ticketsECiclos: initialData.ticketsECiclos || (initialData.ticketMedio || initialData.cicloVendaMedia ? [{
          ticketMedio: initialData.ticketMedio || 0,
          cicloVenda: initialData.cicloVendaMedia || 0,
          criterio: initialData.criterioTicketMedio || initialData.criterioCicloVenda || 'Geral'
        }] : []), // 🔥 NOVO: Migração de dados antigos
        // 🔥 REMOVIDO: concorrentesDiretos movidos para Step 1
      });
    }
  }, [initialData]);

  const [novoDiferencial, setNovoDiferencial] = useState('');
  const [novoCasoUso, setNovoCasoUso] = useState('');
  
  // 🔥 NOVO: Estados para ticket e ciclo na mesma linha
  const [novoTicketECiclo, setNovoTicketECiclo] = useState<TicketECiclo>({
    ticketMedio: 0,
    cicloVenda: 0,
    criterio: '',
  });
  
  // 🆕 Estados para entrada manual com suporte a ranges (texto)
  const [ticketInput, setTicketInput] = useState('');
  const [cicloInput, setCicloInput] = useState('');
  
  // 🔥 REMOVIDO: Estados de concorrentes movidos para Step 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoriaSolucao.trim()) {
      alert('Por favor, informe a categoria da solução');
      return;
    }

    // 🔥 CRÍTICO: Salvar ANTES de avançar - PASSAR DADOS ATUAIS
    if (onSave) {
      try {
        await onSave(formData); // 🔥 CRÍTICO: Passar formData atual
      } catch (error) {
        console.error('[Step4] Erro ao salvar:', error);
        alert('Erro ao salvar dados. Tente novamente.');
        return;
      }
    }
    
    onNext(formData);
  };

  // 🆕 Função para processar texto colado (detecta lista com quebras de linha)
  const processarTextoColado = (texto: string): string[] => {
    // Separar por quebras de linha, vírgulas ou ponto e vírgula
    const itens = texto
      .split(/[\n\r]+|[;]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    return itens;
  };

  const adicionarDiferencial = () => {
    if (novoDiferencial.trim()) {
      setFormData({
        ...formData,
        diferenciais: [...formData.diferenciais, novoDiferencial.trim()],
      });
      setNovoDiferencial('');
    }
  };

  // 🆕 Adicionar múltiplos diferenciais (colar em massa)
  const adicionarDiferenciaisEmMassa = (texto: string) => {
    const itens = processarTextoColado(texto);
    if (itens.length > 0) {
      // Filtrar itens que já existem para evitar duplicatas
      const novosItens = itens.filter(item => !formData.diferenciais.includes(item));
      if (novosItens.length > 0) {
        setFormData({
          ...formData,
          diferenciais: [...formData.diferenciais, ...novosItens],
        });
        setNovoDiferencial('');
        console.log(`[Step4] ✅ Adicionados ${novosItens.length} diferenciais em massa`);
      }
    }
  };

  // 🆕 Handler para paste de diferenciais
  const handlePasteDiferencial = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const texto = e.clipboardData.getData('text');
    const itens = processarTextoColado(texto);
    
    // Se tiver mais de 1 item, é uma lista - processar em massa
    if (itens.length > 1) {
      e.preventDefault(); // Impedir paste normal
      adicionarDiferenciaisEmMassa(texto);
    }
    // Se for só 1 item, deixar o paste normal acontecer
  };

  const removerDiferencial = (index: number) => {
    setFormData({
      ...formData,
      diferenciais: formData.diferenciais.filter((_, i) => i !== index),
    });
  };

  const adicionarCasoUso = () => {
    if (novoCasoUso.trim()) {
      setFormData({
        ...formData,
        casosDeUso: [...formData.casosDeUso, novoCasoUso.trim()],
      });
      setNovoCasoUso('');
    }
  };

  // 🆕 Adicionar múltiplos casos de uso (colar em massa)
  const adicionarCasosDeUsoEmMassa = (texto: string) => {
    const itens = processarTextoColado(texto);
    if (itens.length > 0) {
      // Filtrar itens que já existem para evitar duplicatas
      const novosItens = itens.filter(item => !formData.casosDeUso.includes(item));
      if (novosItens.length > 0) {
        setFormData({
          ...formData,
          casosDeUso: [...formData.casosDeUso, ...novosItens],
        });
        setNovoCasoUso('');
        console.log(`[Step4] ✅ Adicionados ${novosItens.length} casos de uso em massa`);
      }
    }
  };

  // 🆕 Handler para paste de casos de uso
  const handlePasteCasoUso = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const texto = e.clipboardData.getData('text');
    const itens = processarTextoColado(texto);
    
    // Se tiver mais de 1 item, é uma lista - processar em massa
    if (itens.length > 1) {
      e.preventDefault(); // Impedir paste normal
      adicionarCasosDeUsoEmMassa(texto);
    }
    // Se for só 1 item, deixar o paste normal acontecer
  };

  const removerCasoUso = (index: number) => {
    setFormData({
      ...formData,
      casosDeUso: formData.casosDeUso.filter((_, i) => i !== index),
    });
  };

  // 🆕 Parser inteligente para extrair valores monetários (R$ 10.000 a R$ 80.000)
  const parseValorMonetario = (texto: string): { min: number; max: number; media: number } => {
    // Remove "R$", pontos de milhar, e normaliza
    const limpo = texto.replace(/R\$\s*/gi, '').replace(/\./g, '').replace(/,/g, '.');
    
    // Tenta encontrar padrão "X a Y" ou "X - Y"
    const matchRange = limpo.match(/([\d]+)\s*(?:a|até|-|–)\s*([\d]+)/i);
    if (matchRange) {
      const min = parseFloat(matchRange[1]) || 0;
      const max = parseFloat(matchRange[2]) || 0;
      return { min, max, media: Math.round((min + max) / 2) };
    }
    
    // Se não encontrar range, tenta valor único
    const matchSingle = limpo.match(/([\d]+)/);
    if (matchSingle) {
      const valor = parseFloat(matchSingle[1]) || 0;
      return { min: valor, max: valor, media: valor };
    }
    
    return { min: 0, max: 0, media: 0 };
  };

  // 🆕 Parser para extrair dias (15 a 45 dias)
  const parseDias = (texto: string): { min: number; max: number; media: number } => {
    // Caso especial para "Ciclo mensal"
    if (texto.toLowerCase().includes('mensal')) {
      return { min: 30, max: 30, media: 30 };
    }
    
    // Remove "dias", "mensal", etc.
    const limpo = texto.replace(/dias?|mensal|meses?/gi, '').trim();
    
    // Tenta encontrar padrão "X a Y"
    const matchRange = limpo.match(/(\d+)\s*(?:a|até|-|–)\s*(\d+)/i);
    if (matchRange) {
      const min = parseInt(matchRange[1]) || 0;
      const max = parseInt(matchRange[2]) || 0;
      return { min, max, media: Math.round((min + max) / 2) };
    }
    
    // Valor único
    const matchSingle = limpo.match(/(\d+)/);
    if (matchSingle) {
      const valor = parseInt(matchSingle[1]) || 0;
      return { min: valor, max: valor, media: valor };
    }
    
    return { min: 0, max: 0, media: 0 };
  };

  // 🆕 Parser de tabela colada (detecta tabs, pipes, ou múltiplas linhas)
  const parseTicketsColados = (texto: string): TicketECiclo[] => {
    const linhas = texto.split(/[\n\r]+/).filter(l => l.trim());
    const resultados: TicketECiclo[] = [];
    
    for (const linha of linhas) {
      // Separar por tab, pipe, ou múltiplos espaços
      const colunas = linha.split(/[\t|]|(?:\s{2,})/).map(c => c.trim()).filter(c => c);
      
      if (colunas.length >= 3) {
        // Formato esperado: Critério | Valor | Prazo | Enquadramento(opcional)
        const criterio = colunas[0];
        const valorInfo = parseValorMonetario(colunas[1]);
        const diasInfo = parseDias(colunas[2]);
        const enquadramento = colunas[3] || criterio;
        
        if (valorInfo.media > 0 || diasInfo.media > 0) {
          resultados.push({
            criterio: enquadramento || criterio,
            ticketMedio: valorInfo.media,
            ticketMin: valorInfo.min,
            ticketMax: valorInfo.max,
            cicloVenda: diasInfo.media,
            cicloMin: diasInfo.min,
            cicloMax: diasInfo.max,
          });
        }
      } else if (colunas.length === 2) {
        // Formato simples: Critério | Valor
        const criterio = colunas[0];
        const valorInfo = parseValorMonetario(colunas[1]);
        
        if (valorInfo.media > 0) {
          resultados.push({
            criterio,
            ticketMedio: valorInfo.media,
            ticketMin: valorInfo.min,
            ticketMax: valorInfo.max,
            cicloVenda: 30,
            cicloMin: 30,
            cicloMax: 30,
          });
        }
      }
    }
    
    console.log('[Step4] 📋 Tickets parseados:', resultados);
    return resultados;
  };

  // 🆕 Handler para paste em massa de tickets
  const handlePasteTickets = (e: React.ClipboardEvent) => {
    const texto = e.clipboardData.getData('text');
    const linhas = texto.split(/[\n\r]+/).filter(l => l.trim());
    
    // Se tiver mais de 1 linha ou tiver tabs/pipes, é uma tabela
    if (linhas.length > 1 || texto.includes('\t') || texto.includes('|')) {
      e.preventDefault();
      
      const novosTickets = parseTicketsColados(texto);
      if (novosTickets.length > 0) {
        const updatedTickets = [...formData.ticketsECiclos, ...novosTickets];
        setFormData({
          ...formData,
          ticketsECiclos: updatedTickets,
        });
        console.log(`[Step4] ✅ Adicionados ${novosTickets.length} tickets em massa`);
        
        if (onSave) {
          onSave({ ...formData, ticketsECiclos: updatedTickets });
        }
      }
    }
  };

  // 🔥 NOVO: Funções para gerenciar tickets e ciclos na mesma linha
  const adicionarTicketECiclo = () => {
    // 🆕 Parsear os inputs de texto para suportar ranges
    const ticketInfo = parseValorMonetario(ticketInput || String(novoTicketECiclo.ticketMedio));
    const cicloInfo = parseDias(cicloInput || String(novoTicketECiclo.cicloVenda));
    const criterio = novoTicketECiclo.criterio.trim();
    
    if (ticketInfo.media > 0 && cicloInfo.media > 0 && criterio) {
      const novoItem: TicketECiclo = {
        ticketMedio: ticketInfo.media,
        ticketMin: ticketInfo.min,
        ticketMax: ticketInfo.max,
        cicloVenda: cicloInfo.media,
        cicloMin: cicloInfo.min,
        cicloMax: cicloInfo.max,
        criterio,
      };
      
      const updatedTickets = [...formData.ticketsECiclos, novoItem];
      setFormData({
        ...formData,
        ticketsECiclos: updatedTickets,
      });
      
      // Limpar inputs
      setNovoTicketECiclo({ ticketMedio: 0, cicloVenda: 0, criterio: '' });
      setTicketInput('');
      setCicloInput('');
      
      // 🔥 CRÍTICO: Salvar após adicionar
      if (onSave) {
        onSave({ ...formData, ticketsECiclos: updatedTickets });
      }
    } else {
      alert('Por favor, preencha todos os campos: Ticket Médio, Ciclo de Venda e Critério.');
    }
  };

  const removerTicketECiclo = (index: number) => {
    setFormData({
      ...formData,
      ticketsECiclos: formData.ticketsECiclos.filter((_, i) => i !== index),
    });
    
    // 🔥 CRÍTICO: Salvar após remover
    if (onSave) {
      const updatedFormData = {
        ...formData,
        ticketsECiclos: formData.ticketsECiclos.filter((_, i) => i !== index),
      };
      onSave(updatedFormData);
    }
  };

  // 🔥 REMOVIDO: Funções de concorrentes movidas para Step 1

  // 🔥 REMOVIDO: handleCNPJConcorrenteChange movido para Step 1


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Diferenciais
        </h2>
        <p className="text-muted-foreground">
          Conte-nos sobre seus diferenciais e o que destaca sua solução no mercado
        </p>
      </div>

      {/* Seção de Dicas */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">Dicas</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-1">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Seus diferenciais são usados para análise competitiva e recomendações personalizadas</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Os casos de uso ajudam a identificar oportunidades de cross-sell</span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Alerta Importante */}
      <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Importante</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-1">
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Essas informações são usadas para gerar recomendações personalizadas</span>
          </div>
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>Você pode atualizar essas informações a qualquer momento</span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Diferenciais</CardTitle>
          <CardDescription className="text-muted-foreground">
            Conte-nos sobre sua solução e mercado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Categoria da Solução */}
          <div className="space-y-2">
            <Label htmlFor="categoriaSolucao" className="text-foreground">
              Categoria da Solução *
            </Label>
            <Input
              id="categoriaSolucao"
              type="text"
              value={formData.categoriaSolucao}
              onChange={(e) => setFormData({ ...formData, categoriaSolucao: e.target.value })}
              placeholder="Ex: Software de Gestão, Consultoria, SaaS, etc."
              className="w-full"
              required
            />
          </div>

          {/* Diferenciais */}
          <div className="space-y-2">
            <Label className="text-foreground">
              Diferenciais
              {formData.diferenciais.length > 0 && (
                <span className="text-muted-foreground ml-2">({formData.diferenciais.length} adicionado{formData.diferenciais.length !== 1 ? 's' : ''})</span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={novoDiferencial}
                onChange={(e) => setNovoDiferencial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarDiferencial();
                  }
                }}
                onPaste={handlePasteDiferencial}
                placeholder="Ex: Preço competitivo, Suporte 24/7 (cole uma lista para adicionar vários)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={adicionarDiferencial}
                variant="outline"
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Dica: Cole uma lista com quebras de linha para adicionar vários de uma vez!
            </p>
            {formData.diferenciais.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.diferenciais.map((diferencial, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => removerDiferencial(index)}
                  >
                    {diferencial}
                    <X className="ml-2 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Casos de Uso */}
          <div className="space-y-2">
            <Label className="text-foreground">
              Casos de Uso
              {formData.casosDeUso.length > 0 && (
                <span className="text-muted-foreground ml-2">({formData.casosDeUso.length} adicionado{formData.casosDeUso.length !== 1 ? 's' : ''})</span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={novoCasoUso}
                onChange={(e) => setNovoCasoUso(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarCasoUso();
                  }
                }}
                onPaste={handlePasteCasoUso}
                placeholder="Ex: Automação de processos, Análise de dados (cole uma lista para adicionar vários)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={adicionarCasoUso}
                variant="outline"
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Dica: Cole uma lista com quebras de linha para adicionar vários de uma vez!
            </p>
            {formData.casosDeUso.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.casosDeUso.map((casoUso, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => removerCasoUso(index)}
                  >
                    {casoUso}
                    <X className="ml-2 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tickets Médios e Ciclos de Venda - Tabela (mesma linha) */}
          <div className="space-y-2" onPaste={handlePasteTickets}>
            <Label className="text-foreground">
              Tickets Médios e Ciclos de Venda
              {formData.ticketsECiclos.length > 0 && (
                <span className="text-muted-foreground ml-2">({formData.ticketsECiclos.length} linha{formData.ticketsECiclos.length !== 1 ? 's' : ''} adicionada{formData.ticketsECiclos.length !== 1 ? 's' : ''})</span>
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              💡 Dica: Cole uma tabela (Critério | Valor | Prazo) para adicionar vários de uma vez!
            </p>
            
            {/* Tabela de entrada - Nova linha */}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs text-muted-foreground">Ticket Médio (R$)</Label>
                <Input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Ex: 50000 ou 10000-80000"
                  className="w-full"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Ciclo (dias)</Label>
                <Input
                  type="text"
                  value={cicloInput}
                  onChange={(e) => setCicloInput(e.target.value)}
                  placeholder="Ex: 30 ou 15-45"
                  className="w-full"
                />
              </div>
              <div className="col-span-4 space-y-1">
                <Label className="text-xs text-muted-foreground">Critério</Label>
                <Input
                  type="text"
                  value={novoTicketECiclo.criterio}
                  onChange={(e) => setNovoTicketECiclo({ ...novoTicketECiclo, criterio: e.target.value })}
                  placeholder="Ex: Spot, Projetos, Contratos, Licitações..."
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarTicketECiclo();
                    }
                  }}
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  onClick={adicionarTicketECiclo}
                  variant="default"
                  className="w-full"
                  size="default"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Tabela de linhas adicionadas */}
            {formData.ticketsECiclos.length > 0 && (
              <div className="mt-4 space-y-2">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
                  <div className="col-span-4">Ticket Médio</div>
                  <div className="col-span-3">Ciclo (dias)</div>
                  <div className="col-span-4">Critério</div>
                  <div className="col-span-1"></div>
                </div>
                
                {/* Linhas da tabela */}
                {formData.ticketsECiclos.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-b-0">
                    <div className="col-span-4">
                      {/* Mostrar min-max se disponível, senão só o valor médio */}
                      {item.ticketMin && item.ticketMax && item.ticketMin !== item.ticketMax ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            R$ {item.ticketMin.toLocaleString('pt-BR')} - R$ {item.ticketMax.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (média: R$ {item.ticketMedio.toLocaleString('pt-BR')})
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold">
                          R$ {item.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3">
                      {/* Mostrar min-max de dias se disponível */}
                      {item.cicloMin && item.cicloMax && item.cicloMin !== item.cicloMax ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{item.cicloMin} - {item.cicloMax} dias</span>
                          <span className="text-xs text-muted-foreground">(média: {item.cicloVenda})</span>
                        </div>
                      ) : (
                        <span className="font-semibold">{item.cicloVenda} dias</span>
                      )}
                    </div>
                    <div className="col-span-4 text-sm text-muted-foreground">
                      {item.criterio}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerTicketECiclo(index)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔥 REMOVIDO: Concorrentes movidos para Step 1 */}

        </CardContent>
      </Card>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={onBack}
        onNext={() => {}}
        onSave={() => onSave?.(formData)} // 🔥 CRÍTICO: Passar formData ao salvar
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Próximo"
        isSubmit={true}
      />
    </form>
  );
}
