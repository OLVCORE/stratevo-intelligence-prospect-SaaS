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
import { X, Plus, CheckCircle2, Info, Lightbulb, Clock, Sparkles, Loader2, Building2, Check, Target } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { consultarReceitaFederal } from '@/services/receitaFederal';

// =============================================================================
// 🎯 FUNÇÕES DE MAPEAMENTO CNAE → SETOR (Inteligente)
// =============================================================================

/**
 * Extrai o setor a partir da DESCRIÇÃO do CNAE (mais preciso que o código)
 * Usa palavras-chave para identificar o setor corretamente
 */
function extrairSetorDaDescricao(descricao: string): string {
  if (!descricao) return '';
  
  const desc = descricao.toLowerCase();
  
  // 🔥 Mapeamento por palavras-chave na descrição (ordem de prioridade)
  const mapeamentoPorPalavra: Array<{ palavras: string[]; setor: string }> = [
    // Mineração e Extração
    { palavras: ['minério', 'minerio', 'minérios', 'minerios', 'extração de minério', 'mineração', 'mina', 'minas'], setor: 'Mineração' },
    { palavras: ['petróleo', 'petroleo', 'gás natural', 'gas natural', 'exploração de petróleo'], setor: 'Óleo & Gás' },
    
    // Indústria Pesada
    { palavras: ['aeronave', 'aeronaves', 'aviões', 'avioes', 'avião', 'aviao', 'aeronaval', 'aeroespacial', 'helicóptero'], setor: 'Aeronáutico' },
    { palavras: ['siderurgia', 'siderúrgica', 'siderurgica', 'aço', 'aco', 'ferro', 'laminados', 'fundição', 'fundicao'], setor: 'Siderurgia' },
    { palavras: ['motor', 'motores', 'bomba', 'bombas', 'elétrico', 'eletrico', 'gerador', 'geradores', 'transformador'], setor: 'Eletromecânico' },
    { palavras: ['metalurgia', 'metalúrgica', 'metalurgica', 'metal', 'metais', 'alumínio', 'aluminio', 'cobre', 'zinco'], setor: 'Metalurgia' },
    { palavras: ['automóvel', 'automovel', 'automóveis', 'automoveis', 'veículo', 'veiculo', 'caminhão', 'caminhao', 'ônibus', 'onibus'], setor: 'Automotivo' },
    { palavras: ['naval', 'navio', 'navios', 'embarcação', 'embarcacao', 'estaleiro'], setor: 'Naval' },
    
    // Alimentos e Bebidas
    { palavras: ['frigorífico', 'frigorifico', 'abate', 'carne', 'carnes', 'bovino', 'suíno', 'suino', 'aves', 'frango'], setor: 'Frigorífico' },
    { palavras: ['alimento', 'alimentos', 'alimentícia', 'alimenticia', 'alimentício', 'alimenticio'], setor: 'Alimentícia' },
    { palavras: ['bebida', 'bebidas', 'cerveja', 'refrigerante', 'suco', 'sucos'], setor: 'Bebidas' },
    
    // Papel e Celulose
    { palavras: ['celulose', 'papel', 'papéis', 'papeis', 'papelão', 'papelao', 'embalagem', 'embalagens'], setor: 'Celulose & Papel' },
    
    // Química e Petroquímica
    { palavras: ['química', 'quimica', 'químico', 'quimico', 'petroquímica', 'petroquimica'], setor: 'Química' },
    { palavras: ['farmacêutica', 'farmaceutica', 'medicamento', 'medicamentos', 'fármaco', 'farmaco'], setor: 'Farmacêutica' },
    { palavras: ['fertilizante', 'fertilizantes', 'adubo', 'adubos', 'agroquímico', 'agroquimico'], setor: 'Agroquímica' },
    
    // Energia
    { palavras: ['energia', 'elétrica', 'eletrica', 'usina', 'hidrelétrica', 'hidreletrica', 'termelétrica', 'termeletrica'], setor: 'Energia' },
    { palavras: ['eólica', 'eolica', 'solar', 'renovável', 'renovavel'], setor: 'Energia Renovável' },
    
    // Construção
    { palavras: ['construção', 'construcao', 'construtora', 'engenharia civil', 'edificação', 'edificacao', 'obra', 'obras'], setor: 'Construção' },
    { palavras: ['cimento', 'concreto', 'argamassa', 'calcário', 'calcario'], setor: 'Cimento' },
    
    // Tecnologia
    { palavras: ['software', 'tecnologia da informação', 'ti', 'desenvolvimento de sistemas', 'programação', 'programacao'], setor: 'TI' },
    { palavras: ['telecomunicação', 'telecomunicacao', 'telefonia', 'internet', 'rede', 'redes'], setor: 'Telecom' },
    
    // Varejo e Comércio
    { palavras: ['varejo', 'atacado', 'comércio', 'comercio', 'loja', 'lojas', 'supermercado'], setor: 'Comércio' },
    
    // Têxtil e Vestuário
    { palavras: ['têxtil', 'textil', 'tecido', 'tecidos', 'tecelagem', 'fiação', 'fiacao'], setor: 'Têxtil' },
    { palavras: ['vestuário', 'vestuario', 'roupa', 'roupas', 'confecção', 'confeccao'], setor: 'Vestuário' },
    { palavras: ['calçado', 'calcado', 'calçados', 'calcados', 'sapato', 'sapatos', 'couro'], setor: 'Calçados' },
    { palavras: ['luva', 'luvas', 'epi', 'equipamento de proteção', 'segurança do trabalho'], setor: 'EPIs' },
    
    // Agro
    { palavras: ['agrícola', 'agricola', 'agricultura', 'agropecuária', 'agropecuaria', 'plantação', 'plantacao', 'grão', 'grao'], setor: 'Agronegócio' },
    { palavras: ['pecuária', 'pecuaria', 'gado', 'bovinos', 'criação', 'criacao'], setor: 'Pecuária' },
    
    // Transporte e Logística
    { palavras: ['transporte', 'logística', 'logistica', 'frete', 'carga', 'cargas', 'rodoviário', 'rodoviario'], setor: 'Logística' },
    { palavras: ['porto', 'portos', 'portuário', 'portuario', 'terminal', 'terminais'], setor: 'Portuário' },
    
    // Saúde
    { palavras: ['hospital', 'hospitalar', 'saúde', 'saude', 'médico', 'medico', 'clínica', 'clinica'], setor: 'Saúde' },
    
    // Educação
    { palavras: ['educação', 'educacao', 'ensino', 'escola', 'universidade', 'faculdade'], setor: 'Educação' },
    
    // Serviços Financeiros
    { palavras: ['banco', 'bancos', 'bancário', 'bancario', 'financeira', 'crédito', 'credito'], setor: 'Financeiro' },
    { palavras: ['seguro', 'seguros', 'seguradora', 'previdência', 'previdencia'], setor: 'Seguros' },
    
    // Holdings (tratamento especial - verificar atividade real)
    { palavras: ['holding', 'holdings', 'participações', 'participacoes'], setor: 'Holding/Conglomerado' },
    
    // Máquinas e Equipamentos
    { palavras: ['máquina', 'maquina', 'máquinas', 'maquinas', 'equipamento', 'equipamentos', 'industrial'], setor: 'Máquinas & Equipamentos' },
    
    // Móveis
    { palavras: ['móvel', 'movel', 'móveis', 'moveis', 'mobiliário', 'mobiliario', 'marcenaria'], setor: 'Móveis' },
  ];
  
  // Buscar match por palavra-chave
  for (const { palavras, setor } of mapeamentoPorPalavra) {
    for (const palavra of palavras) {
      if (desc.includes(palavra)) {
        return setor;
      }
    }
  }
  
  return '';
}

/**
 * Mapeia CNAE para setor usando código (divisão de 2-4 dígitos)
 * Fallback quando a descrição não é suficiente
 */
function mapearCnaePorCodigo(cnaeCode: string): string {
  if (!cnaeCode || cnaeCode.length < 2) return '';
  
  const divisao2 = cnaeCode.substring(0, 2);
  const divisao3 = cnaeCode.substring(0, 3);
  const divisao4 = cnaeCode.substring(0, 4);
  const divisao5 = cnaeCode.substring(0, 5);
  
  // 🎯 Mapeamento por 5 dígitos (mais específico)
  const mapeamento5: Record<string, string> = {
    '30415': 'Aeronáutico', // Fabricação de aeronaves
    '30423': 'Aeronáutico', // Fabricação de peças para aeronaves
    '07103': 'Mineração', // Extração de minério de ferro
    '07219': 'Mineração', // Extração de minério de alumínio
    '27101': 'Eletromecânico', // Fabricação de motores elétricos
    '27102': 'Eletromecânico', // Fabricação de geradores elétricos
    '27103': 'Eletromecânico', // Fabricação de transformadores
    '28110': 'Máquinas & Equipamentos', // Fabricação de motores e bombas
    '10112': 'Frigorífico', // Frigorífico bovinos
    '10121': 'Frigorífico', // Frigorífico suínos
    '17109': 'Celulose & Papel', // Fabricação de celulose
    '24237': 'Siderurgia', // Produção de laminados de aço
  };
  
  if (mapeamento5[divisao5]) return mapeamento5[divisao5];
  
  // 🎯 Mapeamento por 4 dígitos
  const mapeamento4: Record<string, string> = {
    '0710': 'Mineração',
    '0721': 'Mineração',
    '0723': 'Mineração',
    '0724': 'Mineração',
    '0725': 'Mineração',
    '0729': 'Mineração',
    '0810': 'Mineração',
    '0891': 'Mineração',
    '0892': 'Mineração',
    '0893': 'Mineração',
    '0899': 'Mineração',
    '0600': 'Óleo & Gás',
    '0610': 'Óleo & Gás',
    '0620': 'Óleo & Gás',
    '1011': 'Frigorífico',
    '1012': 'Frigorífico',
    '1013': 'Frigorífico',
    '2423': 'Siderurgia',
    '2424': 'Siderurgia',
    '2422': 'Siderurgia',
    '2421': 'Siderurgia',
    '2710': 'Eletromecânico',
    '2711': 'Eletromecânico',
    '2732': 'Eletromecânico',
    '2733': 'Eletromecânico',
    '3041': 'Aeronáutico',
    '3042': 'Aeronáutico',
    '3099': 'Aeronáutico',
    '3011': 'Naval',
    '3012': 'Naval',
    '1710': 'Celulose & Papel',
    '1721': 'Celulose & Papel',
    '1722': 'Celulose & Papel',
    '6462': 'Holding/Conglomerado',
    '6463': 'Holding/Conglomerado',
    '6110': 'Telecom',
    '6120': 'Telecom',
    '6130': 'Telecom',
    '6190': 'Telecom',
    '6201': 'TI',
    '6202': 'TI',
    '6203': 'TI',
    '6204': 'TI',
  };
  
  if (mapeamento4[divisao4]) return mapeamento4[divisao4];
  
  // 🎯 Mapeamento por 2 dígitos (fallback)
  const mapeamento2: Record<string, string> = {
    '01': 'Agronegócio',
    '02': 'Agronegócio',
    '03': 'Pesca',
    '05': 'Mineração',
    '06': 'Óleo & Gás',
    '07': 'Mineração',
    '08': 'Mineração',
    '09': 'Óleo & Gás',
    '10': 'Alimentícia',
    '11': 'Bebidas',
    '12': 'Tabaco',
    '13': 'Têxtil',
    '14': 'Vestuário',
    '15': 'Calçados',
    '16': 'Madeira',
    '17': 'Celulose & Papel',
    '18': 'Gráfica',
    '19': 'Petroquímica',
    '20': 'Química',
    '21': 'Farmacêutica',
    '22': 'Plástico & Borracha',
    '23': 'Minerais',
    '24': 'Metalurgia',
    '25': 'Metalurgia',
    '26': 'Eletrônica',
    '27': 'Eletromecânico',
    '28': 'Máquinas & Equipamentos',
    '29': 'Automotivo',
    '30': 'Outros Equipamentos',
    '31': 'Móveis',
    '32': 'Manufatura',
    '33': 'Manutenção Industrial',
    '35': 'Energia',
    '36': 'Saneamento',
    '37': 'Saneamento',
    '38': 'Resíduos',
    '39': 'Ambiental',
    '41': 'Construção',
    '42': 'Infraestrutura',
    '43': 'Construção',
    '45': 'Automotivo',
    '46': 'Atacado',
    '47': 'Varejo',
    '49': 'Transporte',
    '50': 'Transporte',
    '51': 'Aéreo',
    '52': 'Logística',
    '53': 'Correios',
    '55': 'Hotelaria',
    '56': 'Alimentação',
    '58': 'Editorial',
    '59': 'Audiovisual',
    '60': 'Mídia',
    '61': 'Telecom',
    '62': 'TI',
    '63': 'TI',
    '64': 'Financeiro',
    '65': 'Seguros',
    '66': 'Financeiro',
    '68': 'Imobiliário',
    '69': 'Jurídico',
    '70': 'Consultoria',
    '71': 'Engenharia',
    '72': 'P&D',
    '73': 'Publicidade',
    '74': 'Design',
    '75': 'Veterinária',
    '77': 'Locação',
    '78': 'RH',
    '79': 'Turismo',
    '80': 'Segurança',
    '81': 'Facilities',
    '82': 'Administrativo',
    '84': 'Público',
    '85': 'Educação',
    '86': 'Saúde',
    '87': 'Saúde',
    '88': 'Assistência Social',
    '90': 'Cultura',
    '91': 'Cultura',
    '92': 'Entretenimento',
    '93': 'Esportes',
    '94': 'Associações',
    '95': 'Manutenção',
    '96': 'Serviços Pessoais',
    '97': 'Doméstico',
    '99': 'Internacional',
  };
  
  return mapeamento2[divisao2] || '';
}

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: (data?: any) => void | Promise<void>; // Auto-save silencioso
  onSaveExplicit?: (data?: any) => void | Promise<void>; // Botão "Salvar" explícito (com toast)
  initialData: any;
  isSubmitting?: boolean;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  isNewTenant?: boolean; // 🔥 NOVO: Flag para indicar se é novo tenant (não carregar dados)
}

interface ClienteAtual {
  cnpj: string;
  razaoSocial: string;
  nome?: string; // Alias para compatibilidade com o formulário
  setor: string;
  ticketMedio: number;
  faturamentoAtual: number; // 🔥 NOVO: Faturamento atual que este cliente gera para a empresa
  cidade: string;
  estado: string;
  capitalSocial: number;
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
  // 🔥 NOVO: Campos para classificação BCG
  tipoRelacionamento?: 'Vaca Leiteira' | 'Estrela' | 'Interrogação' | 'Abacaxi'; // Classificação BCG sugerida
  potencialCrescimento?: 'Alto' | 'Médio' | 'Baixo';
  estabilidade?: 'Estável' | 'Crescendo' | 'Declinando';
  cicloVenda?: number; // Ciclo de venda em dias (já existe em alguns lugares, garantir que está aqui)
}

interface EmpresaBenchmarking {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  setor: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  expectativaFaturamento: number; // 🔥 NOVO: Expectativa de faturamento se esta empresa se tornar cliente
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
  // 🔥 NOVO: Campos para classificação BCG (empresas desejadas = Interrogações)
  prioridade?: 'Alta' | 'Média' | 'Baixa';
  potencialConversao?: 'Alto' | 'Médio' | 'Baixo';
  alinhamentoICP?: 'Alto' | 'Médio' | 'Baixo';
}

export function Step5HistoricoEnriquecimento({ onNext, onBack, onSave, onSaveExplicit, initialData, isSubmitting, isSaving = false, hasUnsavedChanges = false, isNewTenant = false }: Props) {
  // 🔥 CORRIGIDO: Se for novo tenant, SEMPRE começar vazio
  const [formData, setFormData] = useState(() => {
    // 🔥 CRÍTICO: Se for novo tenant, SEMPRE começar vazio
    if (isNewTenant) {
      console.log('[Step5] 🆕 Novo tenant - inicializando com dados vazios');
      return {
        clientesAtuais: [],
        empresasBenchmarking: [],
      };
    }
    
    return {
    clientesAtuais: initialData?.clientesAtuais || [],
    empresasBenchmarking: initialData?.empresasBenchmarking || [], // 🔥 UNIFICADO: Empresas para ICP Benchmarking
    };
  });

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa) - MERGE não-destrutivo
  // 🔥 CORRIGIDO: Se for novo tenant, NÃO atualizar com initialData
  useEffect(() => {
    // 🔥 CRÍTICO: Se for novo tenant, NÃO atualizar com initialData
    if (isNewTenant) {
      console.log('[Step5] 🆕 Novo tenant - não atualizando com initialData');
      return;
    }
    
    console.log('[Step5] 🔄 Verificando initialData:', initialData);
    const clientesAtuais = initialData?.clientesAtuais || [];
    const empresasBenchmarking = initialData?.empresasBenchmarking || [];
    
    console.log('[Step5] 📊 Dados encontrados:', {
      clientes: clientesAtuais.length,
      benchmarking: empresasBenchmarking.length,
      clientesDetalhes: clientesAtuais,
      benchmarkingDetalhes: empresasBenchmarking,
    });
    
    // 🔥 MERGE não-destrutivo: preservar dados existentes, complementar com initialData
    if (initialData !== null && initialData !== undefined) {
      console.log('[Step5] ✅ Atualizando formData com dados do initialData (merge)');
      setFormData(prev => ({
        clientesAtuais: Array.isArray(clientesAtuais) && clientesAtuais.length > 0
          ? clientesAtuais
          : (Array.isArray(prev.clientesAtuais) && prev.clientesAtuais.length > 0 ? prev.clientesAtuais : []),
        empresasBenchmarking: Array.isArray(empresasBenchmarking) && empresasBenchmarking.length > 0
          ? empresasBenchmarking
          : (Array.isArray(prev.empresasBenchmarking) && prev.empresasBenchmarking.length > 0 ? prev.empresasBenchmarking : []),
      }));
    }
  }, [initialData, isNewTenant]);

  // 🔥 BUG 4 FIX: Auto-save quando formData mudar - verificar se onSave está conectado
  useEffect(() => {
    // 🔥 CRÍTICO: Verificar se onSave existe e é uma função antes de chamar
    if (!onSave || typeof onSave !== 'function') {
      console.warn('[Step5] ⚠️ onSave não está disponível ou não é uma função - pulando auto-save');
      return;
    }
    
    // Só salvar se tiver dados relevantes
    if (formData.clientesAtuais.length > 0 || formData.empresasBenchmarking.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await onSave(formData);
          console.log('[Step5] ✅ Auto-save executado:', { 
            clientesAtuais: formData.clientesAtuais.length,
            empresasBenchmarking: formData.empresasBenchmarking.length,
          });
        } catch (err) {
          console.error('[Step5] ❌ Erro no auto-save:', err);
          // 🔥 CRÍTICO: Não silenciar erros - logar para debug
        }
      }, 1000); // Aguardar 1 segundo após última mudança
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.clientesAtuais, formData.empresasBenchmarking, onSave]);

  const [novoCliente, setNovoCliente] = useState<ClienteAtual>({ 
    cnpj: '',
    razaoSocial: '',
    nome: '', // Alias para o formulário
    setor: '', 
    ticketMedio: 0,
    faturamentoAtual: 0, // 🔥 NOVO: Faturamento atual
    cidade: '',
    estado: '',
    capitalSocial: 0,
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
    // 🔥 NOVO: Campos BCG
    tipoRelacionamento: undefined,
    potencialCrescimento: undefined,
    estabilidade: undefined,
    cicloVenda: 90, // Default 90 dias
  });

  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [cnpjEncontrado, setCnpjEncontrado] = useState(false);
  const [erroCNPJ, setErroCNPJ] = useState<string | null>(null);
  const [cnpjUltimoBuscado, setCnpjUltimoBuscado] = useState<string>(''); // Guardar último CNPJ buscado

  // 🔥 NOVO: Função para auto-sugerir classificação BCG baseada em faturamento e características
  const sugerirClassificacaoBCG = (
    faturamentoAtual: number,
    faturamentoTotal: number,
    ticketMedio: number,
    potencialCrescimento?: 'Alto' | 'Médio' | 'Baixo',
    estabilidade?: 'Estável' | 'Crescendo' | 'Declinando'
  ): 'Vaca Leiteira' | 'Estrela' | 'Interrogação' | 'Abacaxi' => {
    // Calcular participação de mercado (market share)
    const participacao = faturamentoTotal > 0 ? (faturamentoAtual / faturamentoTotal) * 100 : 0;
    
    // Determinar crescimento baseado em características
    let crescimento = 30; // Base
    if (potencialCrescimento === 'Alto') crescimento += 30;
    else if (potencialCrescimento === 'Médio') crescimento += 15;
    
    if (estabilidade === 'Crescendo') crescimento += 20;
    else if (estabilidade === 'Declinando') crescimento -= 20;
    
    if (ticketMedio > 50000) crescimento += 10;
    
    crescimento = Math.min(100, Math.max(0, crescimento));
    
    // Classificar BCG
    const altaParticipacao = participacao >= 30; // 30% ou mais do faturamento total
    const altoCrescimento = crescimento >= 50;
    
    if (altoCrescimento && altaParticipacao) return 'Estrela';
    if (altoCrescimento && !altaParticipacao) return 'Interrogação';
    if (!altoCrescimento && altaParticipacao) return 'Vaca Leiteira';
    return 'Abacaxi';
  };

  // 🔥 UNIFICADO: Estados para empresas de benchmarking
  const [novoBenchmarking, setNovoBenchmarking] = useState<EmpresaBenchmarking>({ 
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    setor: '',
    cidade: '',
    estado: '',
    capitalSocial: 0,
    expectativaFaturamento: 0, // 🔥 NOVO: Expectativa de faturamento
    cnaePrincipal: '',
    cnaePrincipalDescricao: '',
    // 🔥 NOVO: Campos BCG para benchmarking (empresas desejadas = Interrogações)
    prioridade: undefined,
    potencialConversao: undefined,
    alinhamentoICP: undefined,
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

      // 🔥 MELHORADO: Extrair setor do CNAE usando descrição + código
      let setorExtraido = '';
      if (data.atividade_principal?.[0]) {
        const cnaeCode = data.atividade_principal[0].code?.replace(/\D/g, '') || '';
        const cnaeDescricao = (data.atividade_principal[0].text || '').toLowerCase();
        
        // 🎯 PRIORIDADE 1: Extrair setor da DESCRIÇÃO do CNAE (mais preciso)
        setorExtraido = extrairSetorDaDescricao(cnaeDescricao);
        
        // 🎯 PRIORIDADE 2: Se não encontrou na descrição, usar mapeamento por código
        if (!setorExtraido && cnaeCode) {
          setorExtraido = mapearCnaePorCodigo(cnaeCode);
        }
        
        // 🎯 PRIORIDADE 3: Fallback genérico
        if (!setorExtraido) {
          setorExtraido = 'Industrial';
        }
        
        console.log('[Step5] 🏭 Setor extraído:', { cnaeCode, cnaeDescricao, setorExtraido });
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
      faturamentoAtual: 0, // 🔥 NOVO
      cidade: '',
      estado: '',
      capitalSocial: 0,
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
      // 🔥 NOVO: Campos BCG
      tipoRelacionamento: undefined,
      potencialCrescimento: undefined,
      estabilidade: undefined,
      cicloVenda: 90,
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
      
      // 🔥 MELHORADO: Extrair setor do CNAE usando descrição + código (mesma lógica dos clientes)
      let setorExtraido = '';
      if (data.atividade_principal?.[0]) {
        const cnaeCode = data.atividade_principal[0].code?.replace(/\D/g, '') || '';
        const cnaeDescricao = (data.atividade_principal[0].text || '').toLowerCase();
        
        // Prioridade 1: Descrição
        setorExtraido = extrairSetorDaDescricao(cnaeDescricao);
        
        // Prioridade 2: Código
        if (!setorExtraido && cnaeCode) {
          setorExtraido = mapearCnaePorCodigo(cnaeCode);
        }
        
        // Fallback
        if (!setorExtraido) {
          setorExtraido = 'Industrial';
        }
        
        console.log('[Step5] 🏭 Setor extraído (benchmarking):', { cnaeCode, cnaeDescricao, setorExtraido });
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
      expectativaFaturamento: 0, // 🔥 NOVO
      cnaePrincipal: '',
      cnaePrincipalDescricao: '',
      // 🔥 NOVO: Campos BCG
      prioridade: undefined,
      potencialConversao: undefined,
      alinhamentoICP: undefined,
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
        expectativaFaturamento: 0, // 🔥 NOVO
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

                {/* Faturamento Atual - CRÍTICO para BCG */}
                <div className="space-y-2">
                  <Label htmlFor="faturamentoAtual" className="text-sm font-medium">
                    Faturamento Atual R$ <span className="text-red-600 dark:text-red-400 font-semibold">*</span>
                    <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                  </Label>
                  <Input
                    id="faturamentoAtual"
                    type="text"
                    value={novoCliente.faturamentoAtual ? novoCliente.faturamentoAtual.toLocaleString('pt-BR') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNovoCliente({ ...novoCliente, faturamentoAtual: value ? parseFloat(value) : 0 });
                    }}
                    placeholder="Ex: 5000000"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Faturamento anual que este cliente gera para sua empresa. Essencial para cálculo da Matriz BCG.
                  </p>
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

                {/* 🔥 NOVO: Campos de Classificação BCG */}
                <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Classificação BCG (Matriz de Priorização)
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Potencial de Crescimento */}
                    <div className="space-y-2">
                      <Label htmlFor="potencialCrescimento" className="text-xs">
                        Potencial de Crescimento
                      </Label>
                      <Select
                        value={novoCliente.potencialCrescimento || ''}
                        onValueChange={(value: 'Alto' | 'Médio' | 'Baixo') => {
                          setNovoCliente({ ...novoCliente, potencialCrescimento: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alto">Alto</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Baixo">Baixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Estabilidade */}
                    <div className="space-y-2">
                      <Label htmlFor="estabilidade" className="text-xs">
                        Estabilidade
                      </Label>
                      <Select
                        value={novoCliente.estabilidade || ''}
                        onValueChange={(value: 'Estável' | 'Crescendo' | 'Declinando') => {
                          setNovoCliente({ ...novoCliente, estabilidade: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Crescendo">Crescendo</SelectItem>
                          <SelectItem value="Estável">Estável</SelectItem>
                          <SelectItem value="Declinando">Declinando</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo de Relacionamento (Classificação BCG) */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoRelacionamento" className="text-xs">
                        Classificação BCG <span className="text-muted-foreground">(Auto-sugerido)</span>
                      </Label>
                      <Select
                        value={novoCliente.tipoRelacionamento || ''}
                        onValueChange={(value: 'Vaca Leiteira' | 'Estrela' | 'Interrogação' | 'Abacaxi') => {
                          setNovoCliente({ ...novoCliente, tipoRelacionamento: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-sugerido baseado em faturamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Estrela">⭐ Estrela (Alto crescimento + Alta participação)</SelectItem>
                          <SelectItem value="Vaca Leiteira">💰 Vaca Leiteira (Baixo crescimento + Alta participação)</SelectItem>
                          <SelectItem value="Interrogação">❓ Interrogação (Alto crescimento + Baixa participação)</SelectItem>
                          <SelectItem value="Abacaxi">🐕 Abacaxi (Baixo crescimento + Baixa participação)</SelectItem>
                        </SelectContent>
                      </Select>
                      {novoCliente.faturamentoAtual > 0 && formData.clientesAtuais.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          💡 Sugestão: {sugerirClassificacaoBCG(
                            novoCliente.faturamentoAtual,
                            formData.clientesAtuais.reduce((acc, c) => acc + (c.faturamentoAtual || 0), 0) + novoCliente.faturamentoAtual,
                            novoCliente.ticketMedio,
                            novoCliente.potencialCrescimento,
                            novoCliente.estabilidade
                          )}
                        </p>
                      )}
                    </div>

                    {/* Ciclo de Venda */}
                    <div className="space-y-2">
                      <Label htmlFor="cicloVenda" className="text-xs">
                        Ciclo de Venda (dias)
                      </Label>
                      <Input
                        id="cicloVenda"
                        type="number"
                        value={novoCliente.cicloVenda || 90}
                        onChange={(e) => {
                          setNovoCliente({ ...novoCliente, cicloVenda: e.target.value ? parseInt(e.target.value) : 90 });
                        }}
                        placeholder="Ex: 90"
                        className="w-full"
                      />
                    </div>
                  </div>
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
                          {cliente.faturamentoAtual && cliente.faturamentoAtual > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Faturamento Atual:</span>
                              <Badge variant="default" className="text-xs font-semibold bg-green-600">R$ {cliente.faturamentoAtual.toLocaleString('pt-BR')}</Badge>
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

                {/* Expectativa de Faturamento - CRÍTICO para BCG */}
                <div className="space-y-2">
                  <Label htmlFor="expectativaFaturamento" className="text-sm font-medium">
                    Expectativa de Faturamento R$ <span className="text-red-600 dark:text-red-400 font-semibold">*</span>
                    <Info className="h-3 w-3 inline ml-1 text-muted-foreground" />
                  </Label>
                  <Input
                    id="expectativaFaturamento"
                    type="text"
                    value={novoBenchmarking.expectativaFaturamento ? novoBenchmarking.expectativaFaturamento.toLocaleString('pt-BR') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNovoBenchmarking({ ...novoBenchmarking, expectativaFaturamento: value ? parseFloat(value) : 0 });
                    }}
                    placeholder="Ex: 3000000"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expectativa de faturamento anual se esta empresa se tornar cliente. Essencial para cálculo da Matriz BCG.
                  </p>
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

                {/* 🔥 NOVO: Campos de Classificação BCG para Benchmarking (Empresas Desejadas = Interrogações) */}
                <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <Label className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      Classificação BCG (Empresas Desejadas = Interrogações)
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Prioridade */}
                    <div className="space-y-2">
                      <Label htmlFor="prioridade" className="text-xs">
                        Prioridade
                      </Label>
                      <Select
                        value={novoBenchmarking.prioridade || ''}
                        onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => {
                          setNovoBenchmarking({ ...novoBenchmarking, prioridade: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Potencial de Conversão */}
                    <div className="space-y-2">
                      <Label htmlFor="potencialConversao" className="text-xs">
                        Potencial de Conversão
                      </Label>
                      <Select
                        value={novoBenchmarking.potencialConversao || ''}
                        onValueChange={(value: 'Alto' | 'Médio' | 'Baixo') => {
                          setNovoBenchmarking({ ...novoBenchmarking, potencialConversao: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alto">Alto</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Baixo">Baixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Alinhamento com ICP */}
                    <div className="space-y-2">
                      <Label htmlFor="alinhamentoICP" className="text-xs">
                        Alinhamento com ICP
                      </Label>
                      <Select
                        value={novoBenchmarking.alinhamentoICP || ''}
                        onValueChange={(value: 'Alto' | 'Médio' | 'Baixo') => {
                          setNovoBenchmarking({ ...novoBenchmarking, alinhamentoICP: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Alto">Alto</SelectItem>
                          <SelectItem value="Médio">Médio</SelectItem>
                          <SelectItem value="Baixo">Baixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Empresas de benchmarking são classificadas como <strong>Interrogações</strong> na Matriz BCG (alto crescimento potencial, baixa participação atual).
                  </p>
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
                        {empresa.expectativaFaturamento && empresa.expectativaFaturamento > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Expectativa Faturamento:</span>
                            <Badge variant="default" className="text-xs font-semibold bg-purple-600">R$ {empresa.expectativaFaturamento.toLocaleString('pt-BR')}</Badge>
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
        onSave={onSaveExplicit || onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Próximo: Revisar"
        isSubmit={false}
      />
    </form>
  );
}
