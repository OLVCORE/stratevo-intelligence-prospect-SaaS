// src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx
// VERSÃO MELHORADA: Visual moderno e profissional, padronizado com outras páginas

'use client';

import { useState, useEffect, useRef } from 'react';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, CheckCircle2, Info, Lightbulb, Clock, Sparkles, Loader2, Building2, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { consultarReceitaFederal } from '@/services/receitaFederal';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: (data?: any) => void | Promise<void>;
  initialData: any;
  isSubmitting?: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

interface ClienteAtual {
  cnpj: string;
  razaoSocial: string;
  nome?: string; // Alias para compatibilidade com o formulário
  setor: string;
  ticketMedio: number;
  cidade: string;
  estado: string;
  capitalSocial: number;
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
}

interface EmpresaBenchmarking {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  setor: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
}

export function Step5HistoricoEnriquecimento({ onNext, onBack, onSave, initialData, isSubmitting, isSaving = false, hasUnsavedChanges = false }: Props) {
  const [formData, setFormData] = useState({
    clientesAtuais: initialData?.clientesAtuais || [],
    empresasBenchmarking: initialData?.empresasBenchmarking || [], // 🔥 UNIFICADO: Empresas para ICP Benchmarking
  });

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa)
  useEffect(() => {
    console.log('[Step5] 🔄 Verificando initialData:', initialData);
    const clientesAtuais = initialData?.clientesAtuais || [];
    const empresasBenchmarking = initialData?.empresasBenchmarking || [];
    
    console.log('[Step5] 📊 Dados encontrados:', {
      clientes: clientesAtuais.length,
      benchmarking: empresasBenchmarking.length,
      clientesDetalhes: clientesAtuais,
      benchmarkingDetalhes: empresasBenchmarking,
    });
    
    // 🔥 SEMPRE atualizar quando initialData existir (mesmo que vazio)
    if (initialData !== null && initialData !== undefined) {
      console.log('[Step5] ✅ Atualizando formData com dados do initialData');
      setFormData({
        clientesAtuais: clientesAtuais,
        empresasBenchmarking: empresasBenchmarking,
      });
    }
  }, [initialData]);

  const [novoCliente, setNovoCliente] = useState<ClienteAtual>({ 
    cnpj: '',
    razaoSocial: '',
    nome: '', // Alias para o formulário
    setor: '', 
    ticketMedio: 0,
    cidade: '',
    estado: '',
    capitalSocial: 0,
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
  });

  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [cnpjEncontrado, setCnpjEncontrado] = useState(false);
  const [erroCNPJ, setErroCNPJ] = useState<string | null>(null);
  const [cnpjUltimoBuscado, setCnpjUltimoBuscado] = useState<string>(''); // Guardar último CNPJ buscado

  // 🔥 UNIFICADO: Estados para empresas de benchmarking
  const [novoBenchmarking, setNovoBenchmarking] = useState<EmpresaBenchmarking>({ 
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    setor: '',
    cidade: '',
    estado: '',
    capitalSocial: 0,
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
  });
  const [loadingBenchmarking, setLoadingBenchmarking] = useState<boolean>(false);
  const [cnpjBenchmarkingEncontrado, setCnpjBenchmarkingEncontrado] = useState<boolean>(false);
  const cnpjBenchmarkingUltimoBuscadoRef = useRef<string>(''); // 🔥 CRÍTICO: useRef evita loops infinitos

  // Buscar dados automaticamente quando CNPJ é digitado (14 dígitos)
  useEffect(() => {
    const cnpjClean = novoCliente.cnpj.replace(/\D/g, '');
    
    // Se CNPJ tem 14 dígitos, não está buscando, e é diferente do último buscado
    if (cnpjClean.length === 14 && !buscandoCNPJ && cnpjClean !== cnpjUltimoBuscado) {
      console.log('[Step5] 🔍 CNPJ completo detectado, iniciando busca automática:', cnpjClean);
      setCnpjUltimoBuscado(cnpjClean); // Marcar como buscado ANTES da busca (evita múltiplas chamadas)
      buscarDadosCNPJ(cnpjClean);
        } else if (cnpjClean.length < 14) {
      // Resetar quando CNPJ é apagado ou incompleto
      setCnpjEncontrado(false);
      setCnpjUltimoBuscado('');
      setErroCNPJ(null);
      setNovoCliente(prev => ({
        ...prev,
        razaoSocial: '',
        nome: '',
        setor: '',
        cidade: '',
        estado: '',
        capitalSocial: 0,
        cnaePrincipal: '',
        cnaePrincipalDescricao: '',
      }));
    }
  }, [novoCliente.cnpj, buscandoCNPJ, cnpjUltimoBuscado]);

  const buscarDadosCNPJ = async (cnpjClean: string) => {
    console.log('[Step5] 🚀 Iniciando busca automática de dados para CNPJ:', cnpjClean);
    setBuscandoCNPJ(true);
    setErroCNPJ(null);
    setCnpjEncontrado(false);

    try {
      console.log('[Step5] 🔍 Buscando dados do CNPJ:', cnpjClean);
      const result = await consultarReceitaFederal(cnpjClean);
      
      if (!result.success || !result.data) {
        setErroCNPJ(result.error || 'Erro ao buscar dados do CNPJ');
        setBuscandoCNPJ(false);
        return;
      }

      const data = result.data;
      console.log('[Step5] ✅ Dados encontrados:', {
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
        // Mapear seções CNAE para setores comuns
        const setoresPorSecao: Record<string, string> = {
          '01': 'Agricultura',
          '02': 'Pecuária',
          '03': 'Pesca',
          '05': 'Extrativa',
          '10': 'Alimentícia',
          '11': 'Bebidas',
          '13': 'Têxtil',
          '14': 'Vestuário',
          '15': 'Couro',
          '16': 'Madeira',
          '17': 'Celulose',
          '18': 'Gráfica',
          '19': 'Química',
          '20': 'Farmacêutica',
          '21': 'Petroquímica',
          '22': 'Plástico',
          '23': 'Mineral',
          '24': 'Metalurgia',
          '25': 'Máquinas',
          '26': 'Eletrônica',
          '27': 'Equipamentos',
          '28': 'Automotiva',
          '29': 'Outros Equipamentos',
          '30': 'Móveis',
          '31': 'Manufatura',
          '32': 'Manufatura',
          '33': 'Manufatura',
          '35': 'Energia',
          '36': 'Água',
          '37': 'Saneamento',
          '38': 'Resíduos',
          '39': 'Remediação',
          '41': 'Construção',
          '42': 'Construção',
          '43': 'Construção',
          '45': 'Automotiva',
          '46': 'Comércio',
          '47': 'Comércio',
          '49': 'Transporte',
          '50': 'Transporte',
          '51': 'Transporte',
          '52': 'Armazenagem',
          '53': 'Correios',
          '55': 'Hospedagem',
          '56': 'Alimentação',
          '58': 'Editorial',
          '59': 'Audiovisual',
          '60': 'Rádio',
          '61': 'Telecomunicações',
          '62': 'TI',
          '63': 'TI',
          '64': 'Financeiro',
          '65': 'Seguros',
          '66': 'Financeiro',
          '68': 'Imobiliário',
          '69': 'Jurídico',
          '70': 'Consultoria',
          '71': 'Arquitetura',
          '72': 'Pesquisa',
          '73': 'Publicidade',
          '74': 'Design',
          '75': 'Veterinária',
          '77': 'Aluguel',
          '78': 'RH',
          '79': 'Viagens',
          '80': 'Segurança',
          '81': 'Serviços',
          '82': 'Administrativo',
          '85': 'Educacional',
          '86': 'Saúde',
          '87': 'Saúde',
          '88': 'Assistência',
          '90': 'Criativo',
          '91': 'Bibliotecas',
          '92': 'Entretenimento',
          '93': 'Esportes',
          '94': 'Associações',
          '95': 'Manutenção',
          '96': 'Serviços',
          '97': 'Doméstico',
          '98': 'Internacional',
          '99': 'Público',
        };
        setorExtraido = setoresPorSecao[secao] || data.atividade_principal[0].text?.split(' - ')[0] || '';
      }

      // Preencher campos automaticamente
      const razaoSocial = data.nome || data.fantasia || '';
      setNovoCliente({
        cnpj: novoCliente.cnpj, // Manter formato digitado
        razaoSocial: razaoSocial,
        nome: razaoSocial, // Alias para o formulário
        setor: setorExtraido || novoCliente.setor,
        ticketMedio: novoCliente.ticketMedio || 0, // Manter valor manual
        cidade: data.municipio || '',
        estado: data.uf || '',
        capitalSocial: (data as any).capital_social ? parseFloat(String((data as any).capital_social).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        cnaePrincipal: data.atividade_principal?.[0]?.code || '',
        cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
      });

      setCnpjEncontrado(true);
      setErroCNPJ(null);
    } catch (error: any) {
      console.error('[Step5] ❌ Erro ao buscar CNPJ:', error);
      setErroCNPJ(error.message || 'Erro ao buscar dados do CNPJ');
      setCnpjEncontrado(false);
    } finally {
      setBuscandoCNPJ(false);
    }
  };

  const handleCNPJChange = (value: string) => {
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
      setCnpjEncontrado(false);
      setErroCNPJ(null);
      setCnpjUltimoBuscado(''); // Permitir nova busca quando CNPJ mudar
    }

    setNovoCliente({ ...novoCliente, cnpj: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 CRÍTICO: Salvar ANTES de avançar
    if (onSave) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('[Step5] Erro ao salvar:', error);
        alert('Erro ao salvar dados. Tente novamente.');
        return;
      }
    }

    onNext(formData);
  };

  const adicionarCliente = async () => {
    const cnpjClean = novoCliente.cnpj.replace(/\D/g, '');
    const razaoSocial = novoCliente.razaoSocial || novoCliente.nome || '';
    if (!cnpjClean || cnpjClean.length !== 14 || !razaoSocial.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios e aguarde a busca automática do CNPJ.');
      return;
    }

    if (formData.clientesAtuais.some((c: ClienteAtual) => c.cnpj.replace(/\D/g, '') === cnpjClean)) {
      alert('Este cliente já foi adicionado.');
      return;
    }

    // Garantir que razaoSocial está preenchido
    const clienteParaAdicionar: ClienteAtual = {
      ...novoCliente,
      razaoSocial: razaoSocial,
    };

    const updatedClientes = [...formData.clientesAtuais, clienteParaAdicionar];
    const updatedFormData = { ...formData, clientesAtuais: updatedClientes };
    setFormData(updatedFormData);
    
    // Resetar formulário
    setNovoCliente({ 
      cnpj: '',
      razaoSocial: '',
      nome: '',
      setor: '', 
      ticketMedio: 0,
      cidade: '',
      estado: '',
      capitalSocial: 0,
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
    });
    setCnpjEncontrado(false);
    setCnpjUltimoBuscado(''); // Resetar para permitir nova busca
    setErroCNPJ(null);
    
    console.log('[Step5] ✅ Cliente adicionado:', updatedClientes[updatedClientes.length - 1]);

    // 🔥 CRÍTICO: Salvar automaticamente após adicionar cliente
    if (onSave) {
      try {
        await onSave(updatedFormData);
      } catch (error) {
        console.error('[Step5] Erro ao salvar após adicionar cliente:', error);
      }
    }
  };

  const removerCliente = async (index: number) => {
    const updatedClientes = formData.clientesAtuais.filter((_, i) => i !== index);
    const updatedFormData = { ...formData, clientesAtuais: updatedClientes };
    setFormData(updatedFormData);
    
    // 🔥 CRÍTICO: Salvar automaticamente após remover cliente
    if (onSave) {
      try {
        await onSave(updatedFormData);
      } catch (error) {
        console.error('[Step5] Erro ao salvar após remover cliente:', error);
      }
    }
  };

  // 🔥 UNIFICADO: Funções para empresas de benchmarking
  const buscarCNPJBenchmarking = async (cnpjClean: string) => {
    setLoadingBenchmarking(true);
    setCnpjBenchmarkingEncontrado(false);
    try {
      console.log('[Step5] 🔍 Buscando dados do CNPJ para benchmarking:', cnpjClean);
      const result = await consultarReceitaFederal(cnpjClean);
      
      if (!result.success || !result.data) {
        alert(result.error || 'Erro ao buscar dados do CNPJ');
        return;
      }

      const data = result.data as any;
      
      // Extrair setor do CNAE principal (igual à função buscarDadosCNPJ)
      let setorExtraido = '';
      if (data.atividade_principal?.[0]?.code) {
        const cnaeCode = data.atividade_principal[0].code.replace(/\D/g, '');
        const secao = cnaeCode.substring(0, 2);
        // Usar o mesmo mapeamento de setores que está em buscarDadosCNPJ
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

      setNovoBenchmarking({
        cnpj: novoBenchmarking.cnpj, // Manter formato digitado
        razaoSocial: data.nome || '',
        nomeFantasia: data.fantasia || '',
        setor: setorExtraido,
        cidade: data.municipio || '',
        estado: data.uf || '',
        capitalSocial: (data as any).capital_social ? parseFloat(String((data as any).capital_social).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        cnaePrincipal: data.atividade_principal?.[0]?.code || '',
        cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
      });
      setCnpjBenchmarkingEncontrado(true);
      console.log('[Step5] ✅ Dados encontrados para benchmarking:', {
        nome: data.nome,
        setor: setorExtraido,
        cidade: data.municipio,
        estado: data.uf,
      });
    } catch (error: any) {
      alert(error.message || 'Erro ao buscar dados do CNPJ');
      setCnpjBenchmarkingEncontrado(false);
    } finally {
      setLoadingBenchmarking(false);
    }
  };

  const adicionarBenchmarking = async () => {
    const cnpjClean = novoBenchmarking.cnpj.replace(/\D/g, '');
    if (!cnpjClean || cnpjClean.length !== 14 || !novoBenchmarking.razaoSocial.trim()) {
      alert('Por favor, aguarde a busca automática do CNPJ ou busque manualmente');
      return;
    }

    if (formData.empresasBenchmarking.some(e => e.cnpj.replace(/\D/g, '') === cnpjClean)) {
      alert('Esta empresa já foi adicionada');
      return;
    }

    const updatedBenchmarking = [...formData.empresasBenchmarking, { ...novoBenchmarking }];
    const updatedFormData = { ...formData, empresasBenchmarking: updatedBenchmarking };
    setFormData(updatedFormData);
    
    // Resetar formulário completo
    setNovoBenchmarking({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      setor: '',
      cidade: '',
      estado: '',
      capitalSocial: 0,
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
    });
    setCnpjBenchmarkingEncontrado(false);
    cnpjBenchmarkingUltimoBuscadoRef.current = '';
    console.log('[Step5] ✅ Empresa de benchmarking adicionada:', updatedBenchmarking[updatedBenchmarking.length - 1]);

    if (onSave) {
      await onSave(updatedFormData);
    }
  };

  const removerBenchmarking = async (index: number) => {
    const updatedBenchmarking = formData.empresasBenchmarking.filter((_, i) => i !== index);
    const updatedFormData = { ...formData, empresasBenchmarking: updatedBenchmarking };
    setFormData(updatedFormData);
    
    if (onSave) {
      await onSave(updatedFormData);
    }
  };

  const handleCNPJBenchmarkingChange = (value: string) => {
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

    setNovoBenchmarking({ ...novoBenchmarking, cnpj: formatted });
  };

  // 🔥 CRÍTICO: Buscar automaticamente quando CNPJ de benchmarking tem 14 dígitos
  useEffect(() => {
    const cnpjClean = novoBenchmarking.cnpj.replace(/\D/g, '');
    
    if (cnpjClean.length === 14 && !loadingBenchmarking && cnpjClean !== cnpjBenchmarkingUltimoBuscadoRef.current) {
      cnpjBenchmarkingUltimoBuscadoRef.current = cnpjClean;
      console.log('[Step5] 🔍 CNPJ completo detectado, iniciando busca automática para benchmarking:', cnpjClean);
      buscarCNPJBenchmarking(cnpjClean);
    } else if (cnpjClean.length < 14) {
      setCnpjBenchmarkingEncontrado(false);
      cnpjBenchmarkingUltimoBuscadoRef.current = '';
      setNovoBenchmarking(prev => ({
        ...prev,
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
  }, [novoBenchmarking.cnpj, loadingBenchmarking]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          ICP Benchmarking
        </h2>
        <p className="text-muted-foreground">
          Eleja empresas alvo para oferecer seus serviços e produtos. Adicione clientes atuais e empresas de referência para análise comparativa
        </p>
      </div>

      {/* Card de Informações */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-blue-900 dark:text-blue-100">ICP Benchmarking</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Clock className="h-4 w-4" />
              <span>5 minutos</span>
            </div>
          </div>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Eleja empresas alvo para oferecer seus serviços e produtos. Adicione clientes atuais e empresas de referência para análise comparativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seção de Dicas */}
          <Alert className="bg-transparent border-blue-300 dark:border-blue-700 p-0">
            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Dicas</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Clientes atuais ajudam a identificar padrões e melhorar o ICP</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Empresas de benchmarking servem como referência para análise comparativa</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Quanto mais empresas você adicionar, mais robusta será a análise</span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Alerta Importante */}
          <Alert className="bg-transparent border-amber-300 dark:border-amber-700 p-0">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">Importante</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-start gap-2">
                <span>•</span>
                <span>Este passo é importante para criar um ICP mais assertivo</span>
              </div>
              <div className="flex items-start gap-2">
                <span>•</span>
                <span>As empresas adicionadas serão usadas para identificar oportunidades similares</span>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">
                Clientes Atuais
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Adicione informações sobre seus clientes atuais para identificar padrões e melhorar o ICP
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-3 py-1">
              {formData.clientesAtuais.length} {formData.clientesAtuais.length === 1 ? 'cliente' : 'clientes'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clientes Atuais */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">
                Clientes Atuais
              </Label>
              <Badge variant="secondary" className="text-sm">
                {formData.clientesAtuais.length} cadastrado{formData.clientesAtuais.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-3">
              {/* CNPJ com busca automática */}
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-sm font-medium">
                  CNPJ <span className="text-muted-foreground font-normal">(digite para buscar automaticamente)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    type="text"
                    value={novoCliente.cnpj}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full pr-10"
                    maxLength={18}
                  />
                  {buscandoCNPJ && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                  {cnpjEncontrado && !buscandoCNPJ && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
                {erroCNPJ && (
                  <p className="text-xs text-destructive">{erroCNPJ}</p>
                )}
                {cnpjEncontrado && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Dados encontrados! Campos preenchidos automaticamente.
                  </p>
                )}
              </div>

              {/* Nome da Empresa */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome da Empresa {cnpjEncontrado && <span className="text-green-600 dark:text-green-400">✓</span>}
                </Label>
                <Input
                  id="nome"
                  type="text"
                  value={novoCliente.razaoSocial || novoCliente.nome || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNovoCliente({ ...novoCliente, razaoSocial: value, nome: value });
                  }}
                  placeholder="Nome da empresa cliente"
                  className="w-full"
                />
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Setor */}
                <div className="space-y-2">
                  <Label htmlFor="setor" className="text-sm font-medium">
                    Setor {cnpjEncontrado && novoCliente.setor && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="setor"
                    type="text"
                    value={novoCliente.setor}
                    onChange={(e) => setNovoCliente({ ...novoCliente, setor: e.target.value })}
                    placeholder="Setor (detectado automaticamente)"
                    className="w-full"
                  />
                </div>

                {/* Ticket Médio */}
                <div className="space-y-2">
                  <Label htmlFor="ticketMedio" className="text-sm font-medium">
                    Ticket Médio R$ <span className="text-muted-foreground font-normal">(manual)</span>
                  </Label>
                  <Input
                    id="ticketMedio"
                    type="text"
                    value={novoCliente.ticketMedio || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNovoCliente({ ...novoCliente, ticketMedio: value ? parseFloat(value) : 0 });
                    }}
                    placeholder="Ex: 25000"
                    className="w-full"
                  />
                </div>

                {/* Cidade */}
                <div className="space-y-2">
                  <Label htmlFor="cidade" className="text-sm font-medium">
                    Cidade {cnpjEncontrado && novoCliente.cidade && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="cidade"
                    type="text"
                    value={novoCliente.cidade}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cidade: e.target.value })}
                    placeholder="Cidade"
                    className="w-full"
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estado" className="text-sm font-medium">
                    Estado {cnpjEncontrado && novoCliente.estado && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="estado"
                    type="text"
                    value={novoCliente.estado}
                    onChange={(e) => setNovoCliente({ ...novoCliente, estado: e.target.value })}
                    placeholder="UF"
                    className="w-full"
                    maxLength={2}
                  />
                </div>

                {/* Capital Social */}
                <div className="space-y-2">
                  <Label htmlFor="capitalSocial" className="text-sm font-medium">
                    Capital Social R$ {cnpjEncontrado && novoCliente.capitalSocial && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="capitalSocial"
                    type="text"
                    value={novoCliente.capitalSocial ? novoCliente.capitalSocial.toLocaleString('pt-BR') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNovoCliente({ ...novoCliente, capitalSocial: value ? parseFloat(value) : undefined });
                    }}
                    placeholder="Capital social"
                    className="w-full"
                  />
                </div>

                {/* CNAE Principal */}
                <div className="space-y-2">
                  <Label htmlFor="cnaePrincipal" className="text-sm font-medium">
                    CNAE Principal {cnpjEncontrado && novoCliente.cnaePrincipal && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="cnaePrincipal"
                    type="text"
                    value={novoCliente.cnaePrincipal || ''}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cnaePrincipal: e.target.value })}
                    placeholder="CNAE Principal"
                    className="w-full"
                  />
                  {novoCliente.cnaePrincipalDescricao && (
                    <p className="text-xs text-muted-foreground">{novoCliente.cnaePrincipalDescricao}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={adicionarCliente}
                variant="outline"
                className="w-full md:w-auto"
                disabled={!novoCliente.razaoSocial?.trim() && !novoCliente.nome?.trim() && !novoCliente.cnpj.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </div>
            {formData.clientesAtuais.length > 0 && (
              <div className="space-y-2 mt-3">
                {formData.clientesAtuais.map((cliente: ClienteAtual, index) => (
                  <Card key={index} className="p-4 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div className="font-semibold text-foreground text-lg">{cliente.razaoSocial || cliente.nome || 'Sem nome'}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {cliente.cnpj && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">CNPJ:</span>
                              <span className="text-foreground font-mono">{cliente.cnpj}</span>
                            </div>
                          )}
                          {cliente.setor && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Setor:</span>
                              <Badge variant="secondary" className="text-xs">{cliente.setor}</Badge>
                            </div>
                          )}
                          {cliente.cidade && cliente.estado && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Localização:</span>
                              <span className="text-foreground">{cliente.cidade}, {cliente.estado}</span>
                            </div>
                          )}
                          {cliente.cnaePrincipal && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">CNAE:</span>
                              <span className="text-foreground font-mono text-xs">{cliente.cnaePrincipal}</span>
                            </div>
                          )}
                          {cliente.capitalSocial && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Capital:</span>
                              <span className="text-foreground">R$ {cliente.capitalSocial.toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          {cliente.ticketMedio && cliente.ticketMedio > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Ticket Médio:</span>
                              <Badge variant="outline" className="text-xs font-semibold">R$ {cliente.ticketMedio.toLocaleString('pt-BR')}</Badge>
                            </div>
                          )}
                        </div>
                        {cliente.cnaePrincipalDescricao && (
                          <p className="text-xs text-muted-foreground italic">{cliente.cnaePrincipalDescricao}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerCliente(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* 🔥 UNIFICADO: Empresas Alvo para ICP Benchmarking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">
                Empresas Alvo para ICP Benchmarking
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Adicione empresas que você deseja usar como referência para análise comparativa (ex: Vale do Rio Doce, Klabin)
              </CardDescription>
            </div>
            <Badge variant="default" className="text-base px-3 py-1">
              {formData.empresasBenchmarking.length} {formData.empresasBenchmarking.length === 1 ? 'empresa' : 'empresas'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpjBenchmarking" className="text-sm font-medium">
              CNPJ <span className="text-muted-foreground font-normal">(digite para buscar automaticamente)</span>
            </Label>
            <div className="relative">
              <Input
                id="cnpjBenchmarking"
                type="text"
                value={novoBenchmarking.cnpj}
                onChange={(e) => handleCNPJBenchmarkingChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full pr-10"
                maxLength={18}
              />
              {loadingBenchmarking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {cnpjBenchmarkingEncontrado && !loadingBenchmarking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              )}
            </div>
            {cnpjBenchmarkingEncontrado && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Dados encontrados! Campos preenchidos automaticamente.
              </p>
            )}
          </div>

          {novoBenchmarking.razaoSocial && (
            <>
              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="razaoSocialBenchmarking" className="text-sm font-medium">
                  Razão Social {cnpjBenchmarkingEncontrado && <span className="text-green-600 dark:text-green-400">✓</span>}
                </Label>
                <Input
                  id="razaoSocialBenchmarking"
                  type="text"
                  value={novoBenchmarking.razaoSocial}
                  onChange={(e) => setNovoBenchmarking({ ...novoBenchmarking, razaoSocial: e.target.value })}
                  placeholder="Razão Social"
                  className="w-full"
                  readOnly
                />
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Setor */}
                <div className="space-y-2">
                  <Label htmlFor="setorBenchmarking" className="text-sm font-medium">
                    Setor {cnpjBenchmarkingEncontrado && novoBenchmarking.setor && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="setorBenchmarking"
                    type="text"
                    value={novoBenchmarking.setor}
                    onChange={(e) => setNovoBenchmarking({ ...novoBenchmarking, setor: e.target.value })}
                    placeholder="Setor (detectado automaticamente)"
                    className="w-full"
                  />
                </div>

                {/* Cidade */}
                <div className="space-y-2">
                  <Label htmlFor="cidadeBenchmarking" className="text-sm font-medium">
                    Cidade {cnpjBenchmarkingEncontrado && novoBenchmarking.cidade && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="cidadeBenchmarking"
                    type="text"
                    value={novoBenchmarking.cidade}
                    onChange={(e) => setNovoBenchmarking({ ...novoBenchmarking, cidade: e.target.value })}
                    placeholder="Cidade"
                    className="w-full"
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estadoBenchmarking" className="text-sm font-medium">
                    Estado {cnpjBenchmarkingEncontrado && novoBenchmarking.estado && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="estadoBenchmarking"
                    type="text"
                    value={novoBenchmarking.estado}
                    onChange={(e) => setNovoBenchmarking({ ...novoBenchmarking, estado: e.target.value })}
                    placeholder="UF"
                    className="w-full"
                    maxLength={2}
                  />
                </div>

                {/* Capital Social */}
                <div className="space-y-2">
                  <Label htmlFor="capitalSocialBenchmarking" className="text-sm font-medium">
                    Capital Social R$ {cnpjBenchmarkingEncontrado && novoBenchmarking.capitalSocial && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="capitalSocialBenchmarking"
                    type="text"
                    value={novoBenchmarking.capitalSocial ? novoBenchmarking.capitalSocial.toLocaleString('pt-BR') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNovoBenchmarking({ ...novoBenchmarking, capitalSocial: value ? parseFloat(value) : 0 });
                    }}
                    placeholder="Capital social"
                    className="w-full"
                  />
                </div>

                {/* CNAE Principal */}
                <div className="space-y-2">
                  <Label htmlFor="cnaePrincipalBenchmarking" className="text-sm font-medium">
                    CNAE Principal {cnpjBenchmarkingEncontrado && novoBenchmarking.cnaePrincipal && <span className="text-green-600 dark:text-green-400">✓</span>}
                  </Label>
                  <Input
                    id="cnaePrincipalBenchmarking"
                    type="text"
                    value={novoBenchmarking.cnaePrincipal || ''}
                    onChange={(e) => setNovoBenchmarking({ ...novoBenchmarking, cnaePrincipal: e.target.value })}
                    placeholder="CNAE Principal"
                    className="w-full"
                  />
                  {novoBenchmarking.cnaePrincipalDescricao && (
                    <p className="text-xs text-muted-foreground">{novoBenchmarking.cnaePrincipalDescricao}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={adicionarBenchmarking}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Empresa
              </Button>
            </>
          )}

          {formData.empresasBenchmarking.length > 0 && (
            <div className="space-y-2 mt-3">
              {formData.empresasBenchmarking.map((empresa, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div className="font-semibold text-foreground text-lg">{empresa.razaoSocial}</div>
                      </div>
                      {empresa.nomeFantasia && (
                        <div className="text-sm text-muted-foreground">{empresa.nomeFantasia}</div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {empresa.cnpj && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">CNPJ:</span>
                            <span className="text-foreground font-mono">{empresa.cnpj}</span>
                          </div>
                        )}
                        {empresa.setor && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Setor:</span>
                            <Badge variant="secondary" className="text-xs">{empresa.setor}</Badge>
                          </div>
                        )}
                        {empresa.cidade && empresa.estado && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Localização:</span>
                            <span className="text-foreground">{empresa.cidade}, {empresa.estado}</span>
                          </div>
                        )}
                        {empresa.cnaePrincipal && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">CNAE:</span>
                            <span className="text-foreground font-mono text-xs">{empresa.cnaePrincipal}</span>
                          </div>
                        )}
                        {empresa.capitalSocial && empresa.capitalSocial > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Capital:</span>
                            <span className="text-foreground">R$ {empresa.capitalSocial.toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                      {empresa.cnaePrincipalDescricao && (
                        <p className="text-xs text-muted-foreground italic">{empresa.cnaePrincipalDescricao}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerBenchmarking(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={onBack}
        onNext={() => onNext(formData)}
        onSave={onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Próximo: Revisar"
        isSubmit={false}
      />
    </form>
  );
}
