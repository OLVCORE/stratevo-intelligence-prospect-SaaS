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

interface ConcorrenteDireto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  setor: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
  website?: string;
  diferencialDeles?: string;
}

interface TicketECiclo {
  ticketMedio: number;
  cicloVenda: number;
  criterio: string; // Critério comum para ticket e ciclo (ex: "compra única", "projeto", "contrato", "licitações", etc.)
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
    concorrentesDiretos: initialData?.concorrentesDiretos || [],
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
        concorrentesDiretos: initialData.concorrentesDiretos || [],
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
  
  // 🔥 NOVO: Estados para concorrentes com busca por CNPJ
  const [novoConcorrente, setNovoConcorrente] = useState<ConcorrenteDireto>({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    setor: '',
    cidade: '',
    estado: '',
    capitalSocial: 0,
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
    website: '',
    diferencialDeles: '',
  });
  const [buscandoCNPJConcorrente, setBuscandoCNPJConcorrente] = useState(false);
  const [cnpjConcorrenteEncontrado, setCnpjConcorrenteEncontrado] = useState(false);
  const [erroCNPJConcorrente, setErroCNPJConcorrente] = useState<string | null>(null);
  const cnpjConcorrenteUltimoBuscadoRef = useRef<string>(''); // 🔥 CRÍTICO: useRef evita loops infinitos

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

  const adicionarDiferencial = () => {
    if (novoDiferencial.trim()) {
      setFormData({
        ...formData,
        diferenciais: [...formData.diferenciais, novoDiferencial.trim()],
      });
      setNovoDiferencial('');
    }
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

  const removerCasoUso = (index: number) => {
    setFormData({
      ...formData,
      casosDeUso: formData.casosDeUso.filter((_, i) => i !== index),
    });
  };

  // 🔥 NOVO: Funções para gerenciar tickets e ciclos na mesma linha
  const adicionarTicketECiclo = () => {
    if (novoTicketECiclo.ticketMedio > 0 && novoTicketECiclo.cicloVenda > 0 && novoTicketECiclo.criterio.trim()) {
      setFormData({
        ...formData,
        ticketsECiclos: [...formData.ticketsECiclos, { ...novoTicketECiclo }],
      });
      setNovoTicketECiclo({
        ticketMedio: 0,
        cicloVenda: 0,
        criterio: '',
      });
      
      // 🔥 CRÍTICO: Salvar após adicionar
      if (onSave) {
        const updatedFormData = {
          ...formData,
          ticketsECiclos: [...formData.ticketsECiclos, { ...novoTicketECiclo }],
        };
        onSave(updatedFormData);
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

  const adicionarConcorrente = () => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    const razaoSocial = novoConcorrente.razaoSocial || '';
    
    if (!cnpjClean || cnpjClean.length !== 14 || !razaoSocial.trim()) {
      alert('Por favor, preencha o CNPJ e aguarde a busca automática dos dados da Receita Federal.');
      return;
    }

    // Verificar se já existe concorrente com mesmo CNPJ
    if (formData.concorrentesDiretos.some((c: ConcorrenteDireto) => c.cnpj.replace(/\D/g, '') === cnpjClean)) {
      alert('Este concorrente já foi adicionado.');
      return;
    }

    // Garantir que razaoSocial está preenchido
    const concorrenteParaAdicionar: ConcorrenteDireto = {
      ...novoConcorrente,
      razaoSocial: razaoSocial,
    };

    setFormData({
      ...formData,
      concorrentesDiretos: [...formData.concorrentesDiretos, concorrenteParaAdicionar],
    });
    
    // Limpar formulário
    setNovoConcorrente({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      setor: '',
      cidade: '',
      estado: '',
      capitalSocial: 0,
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
      website: '',
      diferencialDeles: '',
    });
    setCnpjConcorrenteEncontrado(false);
    cnpjConcorrenteUltimoBuscadoRef.current = '';
    
    // 🔥 CRÍTICO: Salvar após adicionar
    if (onSave) {
      const updatedFormData = {
        ...formData,
        concorrentesDiretos: [...formData.concorrentesDiretos, concorrenteParaAdicionar],
      };
      onSave(updatedFormData);
    }
  };

  const removerConcorrente = (index: number) => {
    setFormData({
      ...formData,
      concorrentesDiretos: formData.concorrentesDiretos.filter((_, i) => i !== index),
    });
    
    // 🔥 CRÍTICO: Salvar após remover
    if (onSave) {
      onSave({
        ...formData,
        concorrentesDiretos: formData.concorrentesDiretos.filter((_, i) => i !== index),
      });
    }
  };

  // 🔥 NOVO: Buscar dados automaticamente quando CNPJ é digitado (14 dígitos)
  useEffect(() => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    
    // Se CNPJ tem 14 dígitos, não está buscando, e é diferente do último buscado
    if (cnpjClean.length === 14 && !buscandoCNPJConcorrente && cnpjClean !== cnpjConcorrenteUltimoBuscadoRef.current) {
      console.log('[Step4] 🔍 CNPJ completo detectado para concorrente, iniciando busca automática:', cnpjClean);
      cnpjConcorrenteUltimoBuscadoRef.current = cnpjClean; // Marcar como buscado ANTES da busca
      buscarDadosCNPJConcorrente(cnpjClean);
    } else if (cnpjClean.length < 14) {
      // Resetar quando CNPJ é apagado ou incompleto
      setCnpjConcorrenteEncontrado(false);
      cnpjConcorrenteUltimoBuscadoRef.current = '';
      setErroCNPJConcorrente(null);
      setNovoConcorrente(prev => ({
        ...prev,
        cnpj: prev.cnpj, // Manter formato digitado
        razaoSocial: '',
        nomeFantasia: '',
        setor: '',
        cidade: '',
        estado: '',
        capitalSocial: 0,
        cnaePrincipal: '',
        cnaePrincipalDescricao: '',
      }));
    }
  }, [novoConcorrente.cnpj, buscandoCNPJConcorrente]);

  const buscarDadosCNPJConcorrente = async (cnpjClean: string) => {
    console.log('[Step4] 🚀 Iniciando busca automática de dados para CNPJ do concorrente:', cnpjClean);
    setBuscandoCNPJConcorrente(true);
    setErroCNPJConcorrente(null);
    setCnpjConcorrenteEncontrado(false);

    try {
      console.log('[Step4] 🔍 Buscando dados do CNPJ do concorrente:', cnpjClean);
      const result = await consultarReceitaFederal(cnpjClean);
      
      if (!result.success || !result.data) {
        setErroCNPJConcorrente(result.error || 'Erro ao buscar dados do CNPJ');
        setBuscandoCNPJConcorrente(false);
        return;
      }

      const data = result.data;
      console.log('[Step4] ✅ Dados encontrados para concorrente:', {
        nome: data.nome || data.fantasia,
        cnae: data.atividade_principal?.[0]?.code,
        cidade: data.municipio,
        estado: data.uf,
      });

      // Extrair setor do CNAE principal (primeiros 2 dígitos indicam seção)
      let setorExtraido = '';
      if (data.atividade_principal?.[0]?.code) {
        const cnaeCode = data.atividade_principal[0].code.replace(/\D/g, '');
        const secao = cnaeCode.substring(0, 2);
        // Mapear seções CNAE para setores comuns (mesmo mapeamento do Step5)
        const setoresPorSecao: Record<string, string> = {
          '01': 'Agricultura', '02': 'Pecuária', '03': 'Pesca', '05': 'Extrativa',
          '10': 'Alimentícia', '11': 'Bebidas', '13': 'Têxtil', '14': 'Vestuário',
          '15': 'Couro', '16': 'Madeira', '17': 'Celulose', '18': 'Gráfica',
          '19': 'Química', '20': 'Farmacêutica', '21': 'Petroquímica', '22': 'Plástico',
          '23': 'Mineral', '24': 'Metalurgia', '25': 'Máquinas', '26': 'Eletrônica',
          '27': 'Equipamentos', '28': 'Automotiva', '29': 'Outros Equipamentos',
          '30': 'Móveis', '31': 'Manufatura', '32': 'Manufatura', '33': 'Manufatura',
          '35': 'Energia', '36': 'Água', '37': 'Saneamento', '38': 'Resíduos',
          '39': 'Remediação', '41': 'Construção', '42': 'Construção', '43': 'Construção',
          '45': 'Automotiva', '46': 'Comércio', '47': 'Comércio', '49': 'Transporte',
          '50': 'Transporte', '51': 'Transporte', '52': 'Armazenagem', '53': 'Correios',
          '55': 'Hospedagem', '56': 'Alimentação', '58': 'Editorial', '59': 'Audiovisual',
          '60': 'Rádio', '61': 'Telecomunicações', '62': 'TI', '63': 'TI',
          '64': 'Financeiro', '65': 'Seguros', '66': 'Financeiro', '68': 'Imobiliário',
          '69': 'Jurídico', '70': 'Consultoria', '71': 'Arquitetura', '72': 'Pesquisa',
          '73': 'Publicidade', '74': 'Design', '75': 'Veterinária', '77': 'Aluguel',
          '78': 'RH', '79': 'Viagens', '80': 'Segurança', '81': 'Serviços',
          '82': 'Administrativo', '85': 'Educacional', '86': 'Saúde', '87': 'Saúde',
          '88': 'Assistência', '90': 'Criativo', '91': 'Bibliotecas', '92': 'Entretenimento',
          '93': 'Esportes', '94': 'Associações', '95': 'Manutenção', '96': 'Serviços',
          '97': 'Doméstico', '98': 'Internacional', '99': 'Público',
        };
        setorExtraido = setoresPorSecao[secao] || data.atividade_principal[0].text?.split(' - ')[0] || '';
      }

      // Preencher campos automaticamente
      const razaoSocial = data.nome || data.fantasia || '';
      setNovoConcorrente({
        cnpj: novoConcorrente.cnpj, // Manter formato digitado
        razaoSocial: razaoSocial,
        nomeFantasia: data.fantasia || data.nome_fantasia || '',
        setor: setorExtraido || novoConcorrente.setor,
        cidade: data.municipio || '',
        estado: data.uf || '',
        capitalSocial: (data as any).capital_social ? parseFloat(String((data as any).capital_social).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        cnaePrincipal: data.atividade_principal?.[0]?.code || '',
        cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
        website: novoConcorrente.website || '', // Manter website se já digitado
        diferencialDeles: novoConcorrente.diferencialDeles || '', // Manter diferencial se já digitado
      });

      setCnpjConcorrenteEncontrado(true);
      setErroCNPJConcorrente(null);
    } catch (error: any) {
      console.error('[Step4] ❌ Erro ao buscar CNPJ do concorrente:', error);
      setErroCNPJConcorrente(error.message || 'Erro ao buscar dados do CNPJ');
      setCnpjConcorrenteEncontrado(false);
    } finally {
      setBuscandoCNPJConcorrente(false);
    }
  };

  const handleCNPJConcorrenteChange = (value: string) => {
    // Formatar CNPJ enquanto digita
    const clean = value.replace(/\D/g, '');
    let formatted = clean;
    
    if (clean.length > 2) {
      formatted = clean.substring(0, 2) + '.' + clean.substring(2);
    }
    if (clean.length > 5) {
      formatted = formatted.substring(0, 6) + '.' + clean.substring(5);
    }
    if (clean.length > 8) {
      formatted = formatted.substring(0, 10) + '/' + clean.substring(8);
    }
    if (clean.length > 12) {
      formatted = formatted.substring(0, 15) + '-' + clean.substring(12);
    }

    // Resetar estado quando CNPJ muda ou é apagado
    if (clean.length < 14) {
      setCnpjConcorrenteEncontrado(false);
      setErroCNPJConcorrente(null);
      cnpjConcorrenteUltimoBuscadoRef.current = '';
    }

    setNovoConcorrente({ ...novoConcorrente, cnpj: formatted });
  };


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
            <span>Liste seus principais concorrentes para melhorar a análise competitiva</span>
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
                placeholder="Ex: Preço competitivo, Suporte 24/7, Implementação rápida"
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
                placeholder="Ex: Automação de processos, Análise de dados, Gestão de equipes"
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
          <div className="space-y-2">
            <Label className="text-foreground">
              Tickets Médios e Ciclos de Venda
              {formData.ticketsECiclos.length > 0 && (
                <span className="text-muted-foreground ml-2">({formData.ticketsECiclos.length} linha{formData.ticketsECiclos.length !== 1 ? 's' : ''} adicionada{formData.ticketsECiclos.length !== 1 ? 's' : ''})</span>
              )}
            </Label>
            
            {/* Tabela de entrada - Nova linha */}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs text-muted-foreground">Ticket Médio (R$)</Label>
                <Input
                  type="number"
                  value={novoTicketECiclo.ticketMedio || ''}
                  onChange={(e) => setNovoTicketECiclo({ ...novoTicketECiclo, ticketMedio: Number(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs text-muted-foreground">Ciclo (dias)</Label>
                <Input
                  type="number"
                  value={novoTicketECiclo.cicloVenda || ''}
                  onChange={(e) => setNovoTicketECiclo({ ...novoTicketECiclo, cicloVenda: Number(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full"
                />
              </div>
              <div className="col-span-4 space-y-1">
                <Label className="text-xs text-muted-foreground">Critério</Label>
                <Input
                  type="text"
                  value={novoTicketECiclo.criterio}
                  onChange={(e) => setNovoTicketECiclo({ ...novoTicketECiclo, criterio: e.target.value })}
                  placeholder="Ex: compra única, projeto, contrato, licitações..."
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
                      <span className="font-semibold">
                        R$ {item.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className="font-semibold">{item.cicloVenda} dias</span>
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

          {/* Concorrentes Diretos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">
                Concorrentes Diretos
              </Label>
              <Badge variant="default" className="text-base px-3 py-1">
                {formData.concorrentesDiretos.length} {formData.concorrentesDiretos.length === 1 ? 'concorrente' : 'concorrentes'}
              </Badge>
            </div>
            
            {/* Campo CNPJ com busca automática */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="text"
                  value={novoConcorrente.cnpj}
                  onChange={(e) => handleCNPJConcorrenteChange(e.target.value)}
                  placeholder="CNPJ (busca automática ao digitar 14 dígitos)"
                  className="w-full pr-10"
                  maxLength={18}
                />
                {buscandoCNPJConcorrente && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {cnpjConcorrenteEncontrado && !buscandoCNPJConcorrente && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
              </div>
              
              {erroCNPJConcorrente && (
                <p className="text-sm text-destructive">{erroCNPJConcorrente}</p>
              )}
              
              {cnpjConcorrenteEncontrado && (
                <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Dados encontrados! Preencha os campos opcionais e clique em "Adicionar".
                  </AlertDescription>
                </Alert>
              )}

              {/* Campos opcionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={novoConcorrente.website || ''}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, website: e.target.value })}
                  placeholder="Website (opcional)"
                />
                <Input
                  type="text"
                  value={novoConcorrente.diferencialDeles || ''}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, diferencialDeles: e.target.value })}
                  placeholder="Diferencial deles (opcional)"
                />
              </div>
              
              <Button
                type="button"
                onClick={adicionarConcorrente}
                variant="default"
                className="w-full"
                disabled={!cnpjConcorrenteEncontrado || buscandoCNPJConcorrente}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Concorrente
              </Button>
            </div>
            
            {/* Lista de concorrentes adicionados */}
            {formData.concorrentesDiretos.length > 0 && (
              <div className="space-y-3 mt-4">
                {formData.concorrentesDiretos.map((concorrente: ConcorrenteDireto, index: number) => (
                  <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold text-foreground text-lg">
                              {concorrente.razaoSocial}
                            </div>
                            {concorrente.nomeFantasia && (
                              <div className="text-sm text-muted-foreground">{concorrente.nomeFantasia}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">CNPJ:</span>
                            <div className="font-mono">{concorrente.cnpj}</div>
                          </div>
                          {concorrente.setor && (
                            <div>
                              <span className="font-medium text-muted-foreground">Setor:</span>
                              <div>{concorrente.setor}</div>
                            </div>
                          )}
                          {(concorrente.cidade || concorrente.estado) && (
                            <div>
                              <span className="font-medium text-muted-foreground">Localização:</span>
                              <div>{concorrente.cidade}{concorrente.cidade && concorrente.estado ? ', ' : ''}{concorrente.estado}</div>
                            </div>
                          )}
                          {concorrente.capitalSocial > 0 && (
                            <div>
                              <span className="font-medium text-muted-foreground">Capital Social:</span>
                              <div>R$ {concorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                          )}
                          {concorrente.cnaePrincipal && (
                            <div>
                              <span className="font-medium text-muted-foreground">CNAE Principal:</span>
                              <div className="font-mono text-xs">{concorrente.cnaePrincipal}</div>
                            </div>
                          )}
                          {concorrente.cnaePrincipalDescricao && (
                            <div className="col-span-2 md:col-span-3">
                              <span className="font-medium text-muted-foreground">Descrição CNAE:</span>
                              <div className="text-xs">{concorrente.cnaePrincipalDescricao}</div>
                            </div>
                          )}
                          {concorrente.website && (
                            <div>
                              <span className="font-medium text-muted-foreground">Website:</span>
                              <div className="text-blue-600 hover:underline">{concorrente.website}</div>
                            </div>
                          )}
                          {concorrente.diferencialDeles && (
                            <div className="col-span-2 md:col-span-3">
                              <span className="font-medium text-muted-foreground">Diferencial:</span>
                              <div>{concorrente.diferencialDeles}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerConcorrente(index)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
