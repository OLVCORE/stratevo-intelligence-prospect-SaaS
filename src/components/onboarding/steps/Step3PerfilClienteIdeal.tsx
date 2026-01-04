// src/components/onboarding/steps/Step3PerfilClienteIdeal.tsx
// VERSÃO CORRIGIDA: Dropdowns como Step2 + Estados filtrados por região + NCM funcionando + Atualização automática

'use client';

import { useState, useEffect, useMemo } from 'react';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Check, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { searchNCM, getNCMByCode, type NCMInfo, searchCNAE, getCNAEByCode, type CNAEInfo, getIBGECities, type IBGECity } from '@/services/brasilApiComplete';
import { getCNAEClassification, type CNAEClassification } from '@/services/cnaeClassificationService';
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
import { cn } from '@/lib/utils';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>; // Auto-save silencioso
  onSaveExplicit?: () => void | Promise<void>; // Botão "Salvar" explícito (com toast)
  initialData: any;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  isNewTenant?: boolean; // 🔥 NOVO: Flag para indicar se é novo tenant (não carregar dados)
}

// Mapeamento Região → Estados
const REGIAO_ESTADOS: Record<string, string[]> = {
  'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
  'Sul': ['PR', 'RS', 'SC'],
};

const PORTE_OPCOES = ['Micro', 'Pequena', 'Média', 'Grande'];

// Características especiais COMPLETAS (igual Step2)
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

export function Step3PerfilClienteIdeal({ onNext, onBack, onSave, onSaveExplicit, initialData, isSaving = false, hasUnsavedChanges = false, isNewTenant = false }: Props) {
  // 🔥 FORÇAR ATUALIZAÇÃO: Sempre usar dados do Step2 diretamente, SEM fallback para dados antigos
  // 🔥 CORRIGIDO: Se for novo tenant, SEMPRE começar vazio
  const [formData, setFormData] = useState(() => {
    // 🔥 CRÍTICO: Se for novo tenant, SEMPRE começar vazio
    if (isNewTenant) {
      console.log('[Step3] 🆕 Novo tenant - inicializando com dados vazios');
      return {
        setoresAlvo: [],
        nichosAlvo: [],
        cnaesAlvo: [],
        ncmsAlvo: [],
        porteAlvo: [],
        localizacaoAlvo: {
          estados: [],
          regioes: [],
          municipios: [],
        },
        faturamentoAlvo: {
          minimo: null,
          maximo: null,
        },
        funcionariosAlvo: {
          minimo: null,
          maximo: null,
        },
        caracteristicasEspeciais: [],
      };
    }
    
    // Inicializar SEMPRE com dados do Step2 (sem fallback para dados antigos)
    const step2Setores = initialData?.setoresAlvo || [];
    const step2Nichos = initialData?.nichosAlvo || [];
    
    console.log('[Step3] 🚀 Inicializando com dados do Step2:', {
      setoresAlvo: step2Setores,
      nichosAlvo: step2Nichos,
      initialDataKeys: Object.keys(initialData || {}),
    });
    
    return {
      // Setores e nichos do Step 2 (SEMPRE do Step2, SEM dados antigos)
      setoresAlvo: step2Setores,
      nichosAlvo: step2Nichos,
      
      // Campos do Step 3 (manter se já existirem, senão vazio)
      cnaesAlvo: initialData?.cnaesAlvo || [],
      ncmsAlvo: initialData?.ncmsAlvo || [],
      porteAlvo: initialData?.porteAlvo || [],
      localizacaoAlvo: initialData?.localizacaoAlvo || {
        estados: [],
        regioes: [],
        municipios: [],
      },
      faturamentoAlvo: initialData?.faturamentoAlvo || {
        minimo: null,
        maximo: null,
      },
      funcionariosAlvo: initialData?.funcionariosAlvo || {
        minimo: null,
        maximo: null,
      },
      caracteristicasEspeciais: initialData?.caracteristicasEspeciais || [],
    };
  });

  // 🔥 ATUALIZAR AUTOMATICAMENTE quando initialData mudar (voltar do Step 2) - MERGE não-destrutivo
  // 🔥 CORRIGIDO: Se for novo tenant, NÃO atualizar com initialData
  useEffect(() => {
    // 🔥 CRÍTICO: Se for novo tenant, NÃO atualizar com initialData
    if (isNewTenant) {
      console.log('[Step3] 🆕 Novo tenant - não atualizando com initialData');
      return;
    }
    
    console.log('[Step3] 🔄 initialData mudou:', {
      setoresAlvo: initialData?.setoresAlvo,
      nichosAlvo: initialData?.nichosAlvo,
      fullInitialData: initialData,
    });
    
    // Atualizar setores e nichos do Step2 (só se houver dados válidos)
    const step2Setores = Array.isArray(initialData?.setoresAlvo) && initialData.setoresAlvo.length > 0
      ? initialData.setoresAlvo
      : null;
    const step2Nichos = Array.isArray(initialData?.nichosAlvo) && initialData.nichosAlvo.length > 0
      ? initialData.nichosAlvo
      : null;
    
    console.log('[Step3] ✅ Atualizando com dados do Step2 (merge não-destrutivo):', {
      setoresAlvo: step2Setores,
      nichosAlvo: step2Nichos,
    });
    
    setFormData(prev => ({
      ...prev,
      // Atualizar setores e nichos do Step2 (só se houver dados válidos, senão preservar)
      setoresAlvo: step2Setores || prev.setoresAlvo || [],
      nichosAlvo: step2Nichos || prev.nichosAlvo || [],
      // Manter outros dados do Step3 (prioridade: prev > initialData > default)
      cnaesAlvo: prev.cnaesAlvo.length > 0 
        ? prev.cnaesAlvo 
        : (Array.isArray(initialData?.cnaesAlvo) && initialData.cnaesAlvo.length > 0 ? initialData.cnaesAlvo : []),
      ncmsAlvo: prev.ncmsAlvo.length > 0 
        ? prev.ncmsAlvo 
        : (Array.isArray(initialData?.ncmsAlvo) && initialData.ncmsAlvo.length > 0 ? initialData.ncmsAlvo : []),
      porteAlvo: prev.porteAlvo.length > 0 
        ? prev.porteAlvo 
        : (Array.isArray(initialData?.porteAlvo) && initialData.porteAlvo.length > 0 ? initialData.porteAlvo : []),
      localizacaoAlvo: (prev.localizacaoAlvo.estados.length > 0 || prev.localizacaoAlvo.regioes.length > 0 || (prev.localizacaoAlvo.municipios && prev.localizacaoAlvo.municipios.length > 0))
        ? prev.localizacaoAlvo 
        : (initialData?.localizacaoAlvo && 
          (initialData.localizacaoAlvo.estados?.length > 0 || initialData.localizacaoAlvo.regioes?.length > 0 || initialData.localizacaoAlvo.municipios?.length > 0)
          ? initialData.localizacaoAlvo
          : { estados: [], regioes: [], municipios: [] }),
      faturamentoAlvo: (prev.faturamentoAlvo.minimo || prev.faturamentoAlvo.maximo)
        ? prev.faturamentoAlvo
        : (initialData?.faturamentoAlvo && (initialData.faturamentoAlvo.minimo || initialData.faturamentoAlvo.maximo)
          ? initialData.faturamentoAlvo
          : { minimo: null, maximo: null }),
      funcionariosAlvo: (prev.funcionariosAlvo.minimo || prev.funcionariosAlvo.maximo)
        ? prev.funcionariosAlvo
        : (initialData?.funcionariosAlvo && (initialData.funcionariosAlvo.minimo || initialData.funcionariosAlvo.maximo)
          ? initialData.funcionariosAlvo
          : { minimo: null, maximo: null }),
      caracteristicasEspeciais: prev.caracteristicasEspeciais.length > 0 
        ? prev.caracteristicasEspeciais 
        : (Array.isArray(initialData?.caracteristicasEspeciais) && initialData.caracteristicasEspeciais.length > 0
          ? initialData.caracteristicasEspeciais
          : []),
    }));
  }, [
    // 🔥 BUG 7 FIX: Adicionar todas as dependências que são acessadas dentro do useEffect
    initialData?.setoresAlvo, 
    initialData?.nichosAlvo,
    initialData?.cnaesAlvo,
    initialData?.ncmsAlvo,
    initialData?.porteAlvo,
    initialData?.localizacaoAlvo,
    initialData?.faturamentoAlvo,
    initialData?.funcionariosAlvo,
    initialData?.caracteristicasEspeciais,
    isNewTenant // 🔥 NOVO: Adicionar isNewTenant nas dependências
  ]);

  // Estados para inputs
  const [cnaeSearchQuery, setCnaeSearchQuery] = useState('');
  const [cnaeSearchResults, setCnaeSearchResults] = useState<CNAEInfo[]>([]);
  const [cnaeSearchOpen, setCnaeSearchOpen] = useState(false);
  const [cnaeSearchLoading, setCnaeSearchLoading] = useState(false);
  // Armazenar CNAEs completos (com descrição) para exibição
  const [cnaesCompletos, setCnaesCompletos] = useState<Map<string, CNAEInfo>>(new Map());
  // Armazenar classificações CNAE (Setor/Indústria e Categoria)
  const [cnaeClassifications, setCnaeClassifications] = useState<Map<string, CNAEClassification>>(new Map());
  
  const [ncmSearchQuery, setNcmSearchQuery] = useState('');
  const [ncmSearchResults, setNcmSearchResults] = useState<NCMInfo[]>([]);
  const [ncmSearchOpen, setNcmSearchOpen] = useState(false);
  const [ncmSearchLoading, setNcmSearchLoading] = useState(false);
  // Armazenar NCMs completos (com descrição) para exibição
  const [ncmsCompletos, setNcmsCompletos] = useState<Map<string, NCMInfo>>(new Map());
  
  // Estados para características customizadas
  const [novaCaracteristicaCustom, setNovaCaracteristicaCustom] = useState('');
  const [caracteristicasCustom, setCaracteristicasCustom] = useState<Array<{ code: string; label: string; description: string }>>([]);

  // Estados para dropdowns
  const [regioesDropdownOpen, setRegioesDropdownOpen] = useState(false);
  const [estadosDropdownOpen, setEstadosDropdownOpen] = useState(false);
  const [municipiosDropdownOpen, setMunicipiosDropdownOpen] = useState(false);
  const [porteDropdownOpen, setPorteDropdownOpen] = useState(false);
  const [caracteristicasDropdownOpen, setCaracteristicasDropdownOpen] = useState(false);
  
  // Estados para municípios (carregados via API) - armazenar com UF
  const [municipiosCarregados, setMunicipiosCarregados] = useState<Array<IBGECity & { uf: string }>>([]);
  const [municipiosLoading, setMunicipiosLoading] = useState(false);

  // 🔥 Estados filtrados por regiões selecionadas
  const estadosDisponiveis = useMemo(() => {
    if (formData.localizacaoAlvo.regioes.length === 0) {
      return []; // Se nenhuma região selecionada, não mostra estados
    }
    
    const estados: string[] = [];
    formData.localizacaoAlvo.regioes.forEach(regiao => {
      const estadosDaRegiao = REGIAO_ESTADOS[regiao] || [];
      estados.push(...estadosDaRegiao);
    });
    
    // Remover duplicatas e ordenar
    return [...new Set(estados)].sort();
  }, [formData.localizacaoAlvo.regioes]);

  // Buscar CNAEs na API IBGE (por código OU descrição)
  useEffect(() => {
    if (cnaeSearchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setCnaeSearchLoading(true);
        try {
          let results: CNAEInfo[] = [];
          
          // Se parece um código CNAE (4-7 dígitos), buscar por código primeiro
          const isCode = /^\d{4,7}$/.test(cnaeSearchQuery.replace(/[.\-\/]/g, ''));
          
          if (isCode) {
            const cnaeByCode = await getCNAEByCode(cnaeSearchQuery);
            if (cnaeByCode) {
              results = [cnaeByCode];
            }
          }
          
          // Sempre buscar por descrição também
          const searchResults = await searchCNAE(cnaeSearchQuery);
          results = [...results, ...searchResults];
          
          // Remover duplicatas
          const uniqueResults = results.filter((cnae, index, self) =>
            index === self.findIndex(c => c.codigo === cnae.codigo)
          );
          
          // Debug: verificar estrutura dos resultados
          console.log('[Step3] 📊 Resultados CNAE encontrados:', uniqueResults.length);
          if (uniqueResults.length > 0) {
            console.log('[Step3] 📋 Primeiro resultado completo:', JSON.stringify(uniqueResults[0], null, 2));
            uniqueResults.slice(0, 5).forEach((cnae, idx) => {
              console.log(`[Step3] CNAE ${idx + 1}:`, {
                codigo: cnae.codigo,
                codigoTipo: typeof cnae.codigo,
                codigoValido: !!cnae.codigo && cnae.codigo !== 'undefined' && cnae.codigo !== 'null',
                descricao: cnae.descricao,
                descricaoLength: cnae.descricao?.length,
                descricaoValida: !!cnae.descricao && cnae.descricao !== 'undefined' && cnae.descricao !== 'null',
                id: cnae.id,
                objetoCompleto: cnae
              });
            });
            
            // Verificar se algum resultado não tem código ou descrição
            const resultadosInvalidos = uniqueResults.filter(c => !c.codigo || !c.descricao || c.codigo === 'undefined' || c.descricao === 'undefined');
            if (resultadosInvalidos.length > 0) {
              console.error('[Step3] ❌ Resultados CNAE inválidos encontrados:', resultadosInvalidos);
            }
          }
          
          // Filtrar apenas resultados válidos (com código E descrição)
          const resultadosValidos = uniqueResults.filter(c => 
            c && 
            c.codigo && 
            c.codigo !== 'undefined' && 
            c.codigo !== 'null' && 
            c.codigo.trim() !== '' &&
            c.descricao && 
            c.descricao !== 'undefined' && 
            c.descricao !== 'null' && 
            c.descricao.trim() !== ''
          );
          
          console.log('[Step3] ✅ Resultados válidos (com código e descrição):', resultadosValidos.length);
          
          // Buscar classificações para os resultados encontrados
          const cnaeCodes = resultadosValidos.map(c => c.codigo).filter(Boolean);
          if (cnaeCodes.length > 0) {
            // Buscar classificações em paralelo (limitado a 30 para performance)
            const classificationPromises = cnaeCodes.slice(0, 30).map(async (code) => {
              const classification = await getCNAEClassification(code);
              return { code, classification };
            });
            
            const classificationResults = await Promise.all(classificationPromises);
            const newClassifications = new Map<string, CNAEClassification>();
            classificationResults.forEach(({ code, classification }) => {
              if (classification) {
                newClassifications.set(code, classification);
              }
            });
            
            setCnaeClassifications(prev => {
              const merged = new Map(prev);
              newClassifications.forEach((value, key) => merged.set(key, value));
              return merged;
            });
          }
          
          setCnaeSearchResults(resultadosValidos.slice(0, 30)); // Limitar a 30 resultados
        } catch (error) {
          console.error('[Step3] Erro ao buscar CNAEs:', error);
          setCnaeSearchResults([]);
        } finally {
          setCnaeSearchLoading(false);
        }
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setCnaeSearchResults([]);
    }
  }, [cnaeSearchQuery]);

  // Buscar NCMs na API Brasil (por código OU descrição)
  useEffect(() => {
    if (ncmSearchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setNcmSearchLoading(true);
        try {
          // Se parece um código NCM (4-8 dígitos), buscar por código também
          const isCode = /^\d{4,8}$/.test(ncmSearchQuery.replace(/[.\-]/g, ''));
          
          let results: NCMInfo[] = [];
          
          if (isCode) {
            // Tentar buscar por código primeiro
            const cleanCode = ncmSearchQuery.replace(/[.\-]/g, '').substring(0, 8);
            const ncmByCode = await getNCMByCode(cleanCode);
            if (ncmByCode) {
              results = [ncmByCode];
            }
          }
          
          // Sempre buscar por descrição também
          const searchResults = await searchNCM(ncmSearchQuery);
          results = [...results, ...searchResults];
          
          // Remover duplicatas
          const uniqueResults = results.filter((ncm, index, self) =>
            index === self.findIndex(n => n.codigo === ncm.codigo)
          );
          
          setNcmSearchResults(uniqueResults.slice(0, 30)); // Limitar a 30 resultados
        } catch (error) {
          console.error('[Step3] Erro ao buscar NCMs:', error);
          setNcmSearchResults([]);
        } finally {
          setNcmSearchLoading(false);
        }
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setNcmSearchResults([]);
    }
  }, [ncmSearchQuery]);

  const handleAddCNAE = async (cnae?: CNAEInfo) => {
    if (cnae) {
      // Usar o código completo formatado do IBGE (ex: "01.34-2/00")
      const cnaeCode = cnae.codigo || '';
      
      console.log('[Step3] ✅ Adicionando CNAE:', {
        codigo: cnaeCode,
        descricao: cnae.descricao,
        objetoCompleto: cnae
      });
      
      // Verificar limite de 10 CNAEs
      if (formData.cnaesAlvo.length >= 10) {
        alert('Limite máximo de 10 CNAEs principais. Remova um CNAE antes de adicionar outro.');
        setCnaeSearchOpen(false);
        return;
      }
      
      // Usar código completo como chave única
      if (!formData.cnaesAlvo.includes(cnaeCode)) {
        // Armazenar CNAE completo para exibição (garantir que temos código e descrição)
        const cnaeCompletoParaArmazenar: CNAEInfo = {
          ...cnae,
          codigo: cnaeCode, // Garantir código formatado
          descricao: cnae.descricao || 'CNAE sem descrição'
        };
        
        console.log('[Step3] 💾 Armazenando CNAE completo:', cnaeCompletoParaArmazenar);
        setCnaesCompletos(prev => new Map(prev).set(cnaeCode, cnaeCompletoParaArmazenar));
        
        // Buscar classificação se ainda não tiver
        if (!cnaeClassifications.has(cnaeCode)) {
          const classification = await getCNAEClassification(cnaeCode);
          if (classification) {
            setCnaeClassifications(prev => new Map(prev).set(cnaeCode, classification));
          }
        }
        
        setFormData({
          ...formData,
          cnaesAlvo: [...formData.cnaesAlvo, cnaeCode],
        });
        
        // Fechar popover após adicionar
        setCnaeSearchOpen(false);
        setCnaeSearchQuery('');
      } else {
        // Já existe, fechar popover
        setCnaeSearchOpen(false);
      }
    } else if (cnaeSearchQuery.trim()) {
      // Adicionar manualmente se não for selecionado do dropdown
      if (formData.cnaesAlvo.length >= 10) {
        alert('Limite máximo de 10 CNAEs principais. Remova um CNAE antes de adicionar outro.');
        setCnaeSearchOpen(false);
        return;
      }
      const codeToAdd = cnaeSearchQuery.trim();
      if (!formData.cnaesAlvo.includes(codeToAdd)) {
        setFormData({
          ...formData,
          cnaesAlvo: [...formData.cnaesAlvo, codeToAdd],
        });
        setCnaeSearchQuery('');
        setCnaeSearchOpen(false);
      }
    }
  };

  const handleAddNCM = (ncm?: NCMInfo) => {
    if (ncm) {
      const ncmCode = ncm.codigo;
      // Verificar limite de 10 NCMs
      if (formData.ncmsAlvo.length >= 10) {
        alert('Limite máximo de 10 NCMs principais. Remova um NCM antes de adicionar outro.');
        setNcmSearchOpen(false);
        return;
      }
      if (!formData.ncmsAlvo.includes(ncmCode)) {
        // Armazenar NCM completo para exibição
        setNcmsCompletos(prev => new Map(prev).set(ncmCode, ncm));
        setFormData({
          ...formData,
          ncmsAlvo: [...formData.ncmsAlvo, ncmCode],
        });
        // Fechar popover após adicionar
        setNcmSearchOpen(false);
        setNcmSearchQuery('');
      } else {
        // Já existe, fechar popover
        setNcmSearchOpen(false);
      }
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
      // Adicionar ao formData também
      setFormData({
        ...formData,
        caracteristicasEspeciais: [...formData.caracteristicasEspeciais, code],
      });
      setNovaCaracteristicaCustom('');
    }
  };

  const toggleRegiao = (regiao: string) => {
    const regioes = formData.localizacaoAlvo.regioes;
    if (regioes.includes(regiao)) {
      // Remover região e seus estados
      const estadosDaRegiao = REGIAO_ESTADOS[regiao] || [];
      setFormData({
        ...formData,
        localizacaoAlvo: {
          regioes: regioes.filter(r => r !== regiao),
          estados: formData.localizacaoAlvo.estados.filter(e => !estadosDaRegiao.includes(e)),
        },
      });
    } else {
      setFormData({
        ...formData,
        localizacaoAlvo: {
          ...formData.localizacaoAlvo,
          regioes: [...regioes, regiao],
        },
      });
    }
  };

  // Função para carregar municípios por estado via API
  const carregarMunicipiosPorEstado = async (uf: string) => {
    try {
      setMunicipiosLoading(true);
      console.log(`[Step3] 🔍 Carregando municípios do estado ${uf}...`);
      
      const municipios = await getIBGECities(uf);
      
      if (municipios.length > 0) {
        // Adicionar municípios aos já carregados (sem duplicatas) com UF associada
        setMunicipiosCarregados(prev => {
          const novosMunicipios = municipios
            .filter(m => !prev.some(existing => existing.codigo_ibge === m.codigo_ibge))
            .map(m => ({ ...m, uf: uf.toUpperCase() }));
          return [...prev, ...novosMunicipios];
        });
        console.log(`[Step3] ✅ ${municipios.length} municípios carregados para ${uf}`);
      }
    } catch (error) {
      console.error(`[Step3] ❌ Erro ao carregar municípios de ${uf}:`, error);
    } finally {
      setMunicipiosLoading(false);
    }
  };
  
  // Carregar municípios quando estados são selecionados
  useEffect(() => {
    if (formData.localizacaoAlvo.estados.length > 0) {
      // Carregar municípios para estados ainda não carregados
      formData.localizacaoAlvo.estados.forEach(uf => {
        // Verificar se já temos municípios deste estado carregados
        const temMunicipiosDoEstado = municipiosCarregados.some(m => m.uf === uf.toUpperCase());
        
        if (!temMunicipiosDoEstado) {
          carregarMunicipiosPorEstado(uf);
        }
      });
      
      // Remover municípios de estados que não estão mais selecionados
      const estadosSelecionados = new Set(formData.localizacaoAlvo.estados.map(e => e.toUpperCase()));
      setMunicipiosCarregados(prev => prev.filter(m => estadosSelecionados.has(m.uf)));
    } else {
      // Se não há estados selecionados, limpar municípios
      setMunicipiosCarregados([]);
    }
  }, [formData.localizacaoAlvo.estados.join(',')]); // Usar join para evitar re-renders desnecessários
  
  // Municípios disponíveis filtrados pelos estados selecionados
  const municipiosDisponiveis = useMemo(() => {
    if (formData.localizacaoAlvo.estados.length === 0) {
      return [];
    }
    const estadosSelecionados = new Set(formData.localizacaoAlvo.estados.map(e => e.toUpperCase()));
    // Filtrar municípios dos estados selecionados e ordenar por nome
    return municipiosCarregados
      .filter(m => estadosSelecionados.has(m.uf))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [municipiosCarregados, formData.localizacaoAlvo.estados]);
  
  const toggleEstado = (estado: string) => {
    const estados = formData.localizacaoAlvo.estados;
    if (estados.includes(estado)) {
      // Remover estado e seus municípios (formato: UF-CODIGO-NOME)
      const municipiosAtualizados = (formData.localizacaoAlvo.municipios || []).filter(
        (m: string) => !m.startsWith(`${estado.toUpperCase()}-`)
      );
      setFormData({
        ...formData,
        localizacaoAlvo: {
          ...formData.localizacaoAlvo,
          estados: estados.filter(e => e !== estado),
          municipios: municipiosAtualizados,
        },
      });
    } else {
      setFormData({
        ...formData,
        localizacaoAlvo: {
          ...formData.localizacaoAlvo,
          estados: [...estados, estado],
        },
      });
      // Carregar municípios do estado selecionado
      carregarMunicipiosPorEstado(estado);
    }
  };
  
  // Toggle município
  const toggleMunicipio = (codigoIBGE: string, nome: string, uf: string) => {
    const municipios = formData.localizacaoAlvo.municipios || [];
    const codigoCompleto = `${uf.toUpperCase()}-${codigoIBGE}-${nome}`;
    
    if (municipios.includes(codigoCompleto)) {
      setFormData({
        ...formData,
        localizacaoAlvo: {
          ...formData.localizacaoAlvo,
          municipios: municipios.filter(m => m !== codigoCompleto),
        },
      });
    } else {
      setFormData({
        ...formData,
        localizacaoAlvo: {
          ...formData.localizacaoAlvo,
          municipios: [...municipios, codigoCompleto],
        },
      });
    }
  };

  const togglePorte = (porte: string) => {
    const portes = formData.porteAlvo;
    if (portes.includes(porte)) {
      setFormData({
        ...formData,
        porteAlvo: portes.filter(p => p !== porte),
      });
    } else {
      setFormData({
        ...formData,
        porteAlvo: [...portes, porte],
      });
    }
  };

  const toggleCaracteristica = (code: string) => {
    const caracteristicas = formData.caracteristicasEspeciais;
    if (caracteristicas.includes(code)) {
      setFormData({
        ...formData,
        caracteristicasEspeciais: caracteristicas.filter(c => c !== code),
      });
    } else {
      setFormData({
        ...formData,
        caracteristicasEspeciais: [...caracteristicas, code],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.setoresAlvo.length === 0) {
      alert('Selecione pelo menos 1 setor-alvo');
      return;
    }

    if (formData.porteAlvo.length === 0) {
      alert('Selecione pelo menos 1 porte-alvo');
      return;
    }

    // 🔥 CRÍTICO: Salvar ANTES de avançar
    if (onSave) {
      try {
        await onSave();
      } catch (error) {
        console.error('[Step3] Erro ao salvar:', error);
        alert('Erro ao salvar dados. Tente novamente.');
        return;
      }
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Perfil do Cliente Ideal (ICP)
        </h2>
        <p className="text-muted-foreground">
          Refine os critérios para encontrar empresas ideais para prospectar
        </p>
      </div>

      {/* CARD 1: Setores e Nichos (Somente Leitura - vêm do Step2) */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Setores e Nichos Selecionados</CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Dados carregados automaticamente da etapa anterior ({formData.setoresAlvo.length} setor{formData.setoresAlvo.length !== 1 ? 'es' : ''}, {formData.nichosAlvo.length} nicho{formData.nichosAlvo.length !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              {/* Setores */}
              <div>
                <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 block">
                  Setores ({formData.setoresAlvo.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.setoresAlvo.length > 0 ? (
                    formData.setoresAlvo.map((setor, index) => (
                      <Badge key={`setor-${index}-${setor}`} variant="default" className="bg-blue-600 text-white">
                        {setor}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum setor selecionado. Volte para a etapa anterior.</p>
                  )}
                </div>
              </div>

              {/* Nichos */}
              <div>
                <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 block">
                  Nichos ({formData.nichosAlvo.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {formData.nichosAlvo.length > 0 ? (
                    formData.nichosAlvo.map((nicho, index) => (
                      <Badge key={`nicho-${index}-${nicho}`} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {nicho}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum nicho selecionado. Volte para a etapa anterior.</p>
                  )}
                </div>
              </div>
        </CardContent>
      </Card>

      {/* CARD 2: Porte (Dropdown como Step2) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Porte da Empresa *</CardTitle>
          <CardDescription className="text-muted-foreground">
            Selecione um ou mais portes que você quer prospectar
            {formData.porteAlvo.length > 0 && ` (${formData.porteAlvo.length} selecionado${formData.porteAlvo.length > 1 ? 's' : ''})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={porteDropdownOpen} onOpenChange={setPorteDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                Selecionar portes...
                <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar porte..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>Nenhum porte encontrado.</CommandEmpty>
                  <CommandGroup>
                    {PORTE_OPCOES.map((porte) => (
                      <CommandItem
                        key={porte}
                        value={porte}
                        onSelect={() => {
                          togglePorte(porte);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.porteAlvo.includes(porte) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="text-foreground">{porte}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {formData.porteAlvo.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.porteAlvo.map((porte) => (
                <Badge
                  key={porte}
                  variant="secondary"
                  className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => togglePorte(porte)}
                >
                  {porte}
                  <X className="ml-2 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 3: Localização (Regiões → Estados Filtrados) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Localização</CardTitle>
          <CardDescription className="text-muted-foreground">
            Selecione regiões primeiro, depois escolha estados específicos. Por fim, refine escolhendo municípios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Regiões */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Regiões-Alvo
            </Label>
            <Popover open={regioesDropdownOpen} onOpenChange={setRegioesDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  Selecionar regiões...
                  <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar região..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>Nenhuma região encontrada.</CommandEmpty>
                    <CommandGroup>
                      {Object.keys(REGIAO_ESTADOS).map((regiao) => (
                        <CommandItem
                          key={regiao}
                          value={regiao}
                          onSelect={() => {
                            toggleRegiao(regiao);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.localizacaoAlvo.regioes.includes(regiao) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="text-foreground">{regiao}</span>
                            <span className="text-xs text-muted-foreground">
                              {REGIAO_ESTADOS[regiao].join(', ')}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {formData.localizacaoAlvo.regioes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.localizacaoAlvo.regioes.map((regiao) => (
                  <Badge
                    key={regiao}
                    variant="secondary"
                    className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleRegiao(regiao)}
                  >
                    {regiao}
                    <X className="ml-2 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Estados (Filtrados por Regiões) */}
          {formData.localizacaoAlvo.regioes.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Estados-Alvo ({estadosDisponiveis.length} disponíveis)
              </Label>
              <Popover open={estadosDropdownOpen} onOpenChange={setEstadosDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={formData.localizacaoAlvo.regioes.length === 0}
                  >
                    {formData.localizacaoAlvo.regioes.length === 0 
                      ? 'Selecione regiões primeiro...'
                      : 'Selecionar estados...'}
                    <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar estado..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                      <CommandGroup>
                        {estadosDisponiveis.map((estado) => {
                          // Encontrar região do estado
                          const regiaoDoEstado = Object.keys(REGIAO_ESTADOS).find(r => 
                            REGIAO_ESTADOS[r].includes(estado)
                          );
                          return (
                            <CommandItem
                              key={estado}
                              value={estado}
                              onSelect={() => {
                                toggleEstado(estado);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.localizacaoAlvo.estados.includes(estado) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="text-foreground">{estado}</span>
                                {regiaoDoEstado && (
                                  <span className="text-xs text-muted-foreground">{regiaoDoEstado}</span>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {formData.localizacaoAlvo.estados.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.localizacaoAlvo.estados.map((estado) => (
                    <Badge
                      key={estado}
                      variant="secondary"
                      className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                      onClick={() => toggleEstado(estado)}
                    >
                      {estado}
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Municípios (Filtrados por Estados) */}
          {formData.localizacaoAlvo.estados.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Municípios ({municipiosDisponiveis.length} disponíveis)
                {municipiosLoading && <Loader2 className="ml-2 h-3 w-3 inline animate-spin" />}
              </Label>
              <Popover open={municipiosDropdownOpen} onOpenChange={setMunicipiosDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={formData.localizacaoAlvo.estados.length === 0 || municipiosLoading}
                  >
                    {municipiosLoading
                      ? 'Carregando municípios...'
                      : municipiosDisponiveis.length === 0
                      ? 'Carregando municípios...'
                      : 'Selecionar municípios...'}
                    <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar município..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>
                        {municipiosLoading ? 'Carregando municípios...' : 'Nenhum município encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {municipiosDisponiveis.map((municipio) => {
                          const codigoCompleto = `${municipio.uf}-${municipio.codigo_ibge}-${municipio.nome}`;
                          const isSelected = (formData.localizacaoAlvo.municipios || []).includes(codigoCompleto);
                          
                          return (
                            <CommandItem
                              key={municipio.codigo_ibge}
                              value={municipio.nome}
                              onSelect={() => {
                                toggleMunicipio(municipio.codigo_ibge, municipio.nome, municipio.uf);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="text-foreground">{municipio.nome}</span>
                                <span className="text-xs text-muted-foreground">{municipio.uf}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {(formData.localizacaoAlvo.municipios || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.localizacaoAlvo.municipios || []).map((municipioCompleto: string) => {
                    const parts = municipioCompleto.split('-');
                    const uf = parts[0];
                    const codigoIBGE = parts[1];
                    const nome = parts.slice(2).join('-');
                    return (
                      <Badge
                        key={municipioCompleto}
                        variant="secondary"
                        className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => toggleMunicipio(codigoIBGE, nome, uf)}
                      >
                        {nome} - {uf}
                        <X className="ml-2 h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 4: Faturamento e Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Faturamento Anual (opcional)</CardTitle>
            <CardDescription className="text-muted-foreground">
              Faixa de faturamento em R$
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mínimo (R$)</Label>
              <Input
                type="number"
                value={formData.faturamentoAlvo.minimo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    faturamentoAlvo: {
                      ...formData.faturamentoAlvo,
                      minimo: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="Ex: 1000000"
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Máximo (R$)</Label>
              <Input
                type="number"
                value={formData.faturamentoAlvo.maximo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    faturamentoAlvo: {
                      ...formData.faturamentoAlvo,
                      maximo: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="Ex: 50000000"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Nº de Funcionários (opcional)</CardTitle>
            <CardDescription className="text-muted-foreground">
              Faixa de funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mínimo</Label>
              <Input
                type="number"
                value={formData.funcionariosAlvo.minimo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    funcionariosAlvo: {
                      ...formData.funcionariosAlvo,
                      minimo: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="Ex: 50"
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Máximo</Label>
              <Input
                type="number"
                value={formData.funcionariosAlvo.maximo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    funcionariosAlvo: {
                      ...formData.funcionariosAlvo,
                      maximo: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                placeholder="Ex: 500"
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARD 5: CNAEs (Busca API IBGE) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">CNAEs-Alvo (opcional)</CardTitle>
          <CardDescription className="text-muted-foreground">
            Busque CNAEs por código ou descrição usando API do IBGE. Digite código (ex: 6201-5/00) ou descrição (ex: desenvolvimento de software)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Popover 
            open={cnaeSearchOpen} 
            onOpenChange={(open) => {
              // Só fechar se não tiver texto OU se o usuário clicar fora
              if (!open && cnaeSearchQuery.length < 2) {
                setCnaeSearchOpen(false);
              } else if (open) {
                setCnaeSearchOpen(true);
              }
            }}
          >
            <PopoverTrigger asChild>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={cnaeSearchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCnaeSearchQuery(newValue);
                    // Abrir popover automaticamente quando digitar 2+ caracteres
                    if (newValue.length >= 2) {
                      setCnaeSearchOpen(true);
                    }
                    // Não fechar automaticamente - deixar usuário digitar
                  }}
                  placeholder="Digite código CNAE (ex: 0134 ou desenvolvimento)..."
                  className="flex-1"
                  onFocus={() => {
                    // Abrir popover se já tiver texto
                    if (cnaeSearchQuery.length >= 2) {
                      setCnaeSearchOpen(true);
                    }
                  }}
                  onBlur={() => {
                    // Fechar popover apenas se query for muito curta
                    // O popover fecha automaticamente quando clica fora
                    setTimeout(() => {
                      if (cnaeSearchQuery.length < 2) {
                        setCnaeSearchOpen(false);
                      }
                    }, 150);
                  }}
                />
              </div>
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
                    // Manter popover aberto quando digitar
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
                      {cnaeSearchResults.map((cnae) => {
                        const classification = cnaeClassifications.get(cnae.codigo || '');
                        return (
                          <CommandItem
                            key={cnae.id || cnae.codigo}
                            value={`${cnae.codigo} ${cnae.descricao}`}
                            onSelect={() => {
                              handleAddCNAE(cnae);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.cnaesAlvo.includes(cnae.codigo) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="font-semibold text-foreground">{cnae.codigo || 'Sem código'}</span>
                              <span className="text-xs text-muted-foreground">{cnae.descricao || 'Sem descrição'}</span>
                              {classification && (
                                <div className="flex gap-1 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {classification.setor_industria}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    {classification.categoria}
                                  </Badge>
                                </div>
                              )}
                              {cnae.classe && (
                                <span className="text-xs text-muted-foreground mt-1">Classe: {cnae.classe.descricao}</span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {formData.cnaesAlvo.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3 w-full">
              {formData.cnaesAlvo.map((cnaeCode, index) => {
                const cnaeCompleto = cnaesCompletos.get(cnaeCode);
                
                // Debug: verificar o que temos armazenado
                if (!cnaeCompleto) {
                  console.warn('[Step3] ⚠️ CNAE não encontrado no mapa:', {
                    codigo: cnaeCode,
                    mapaSize: cnaesCompletos.size,
                    mapKeys: Array.from(cnaesCompletos.keys())
                  });
                }
                
                // Garantir que temos código e descrição
                const codigoExibir = cnaeCompleto?.codigo || cnaeCode;
                const descricaoExibir = cnaeCompleto?.descricao || 'CNAE sem descrição';
                const classification = cnaeClassifications.get(cnaeCode);
                
                return (
                  <div
                    key={`${cnaeCode}-${index}`}
                    className="flex items-start justify-between gap-2 p-2 rounded border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        cnaesAlvo: formData.cnaesAlvo.filter((_, i) => i !== index),
                      });
                      // Remover do mapa de CNAEs completos
                      setCnaesCompletos(prev => {
                        const novo = new Map(prev);
                        novo.delete(cnaeCode);
                        return novo;
                      });
                      // Remover classificação
                      setCnaeClassifications(prev => {
                        const novo = new Map(prev);
                        novo.delete(cnaeCode);
                        return novo;
                      });
                    }}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-foreground whitespace-nowrap">
                          {codigoExibir}
                        </span>
                        {classification && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30">
                              {classification.setor_industria}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30">
                              {classification.categoria}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground leading-tight break-words">
                        {descricaoExibir}
                      </span>
                    </div>
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
          {formData.cnaesAlvo.length >= 10 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              ⚠️ Limite máximo de 10 CNAEs principais atingido.
            </p>
          )}
        </CardContent>
      </Card>

      {/* CARD 6: NCMs (Busca API Brasil) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">NCMs-Alvo (opcional)</CardTitle>
          <CardDescription className="text-muted-foreground">
            Busque NCMs por código ou descrição. Digite código (ex: 8471) ou descrição (ex: computador)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Popover 
            open={ncmSearchOpen} 
            onOpenChange={(open) => {
              // Só fechar se não tiver texto OU se o usuário clicar fora
              if (!open && ncmSearchQuery.length < 2) {
                setNcmSearchOpen(false);
              } else if (open) {
                setNcmSearchOpen(true);
              }
            }}
          >
            <PopoverTrigger asChild>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={ncmSearchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setNcmSearchQuery(newValue);
                    // Abrir popover automaticamente quando digitar 2+ caracteres
                    if (newValue.length >= 2) {
                      setNcmSearchOpen(true);
                    }
                    // Não fechar automaticamente - deixar usuário digitar
                  }}
                  placeholder="Digite código NCM (ex: 8471) ou descrição (ex: computador)..."
                  className="flex-1"
                  onFocus={() => {
                    // Abrir popover se já tiver texto
                    if (ncmSearchQuery.length >= 2) {
                      setNcmSearchOpen(true);
                    }
                  }}
                  onBlur={() => {
                    // Fechar popover apenas se query for muito curta
                    // O popover fecha automaticamente quando clica fora
                    setTimeout(() => {
                      if (ncmSearchQuery.length < 2) {
                        setNcmSearchOpen(false);
                      }
                    }, 150);
                  }}
                />
              </div>
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
                    // Manter popover aberto quando digitar
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
                          onSelect={() => {
                            handleAddNCM(ncm);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.ncmsAlvo.includes(ncm.codigo) ? "opacity-100" : "opacity-0"
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

          {formData.ncmsAlvo.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-3 w-full">
              {formData.ncmsAlvo.map((ncmCode, index) => {
                const ncmCompleto = ncmsCompletos.get(ncmCode);
                return (
                  <div
                    key={`${ncmCode}-${index}`}
                    className="flex items-start justify-between gap-2 p-2 rounded border border-border/50 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        ncmsAlvo: formData.ncmsAlvo.filter((_, i) => i !== index),
                      });
                      // Remover do mapa de NCMs completos
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
          {formData.ncmsAlvo.length >= 10 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              ⚠️ Limite máximo de 10 NCMs principais atingido.
            </p>
          )}
        </CardContent>
      </Card>

      {/* CARD 7: Características Especiais (Dropdown como Step2) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Características Especiais (opcional)</CardTitle>
          <CardDescription className="text-muted-foreground">
            Selecione características que as empresas ideais devem ter
            {formData.caracteristicasEspeciais.length > 0 && ` (${formData.caracteristicasEspeciais.length} selecionada${formData.caracteristicasEspeciais.length > 1 ? 's' : ''})`}
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
                    {CARACTERISTICAS_ESPECIAIS.map((carac) => (
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
                            formData.caracteristicasEspeciais.includes(carac.code) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="text-foreground">{carac.label}</span>
                          <span className="text-xs text-muted-foreground">{carac.description}</span>
                        </div>
                      </CommandItem>
                    ))}
                    {/* Características customizadas */}
                    {caracteristicasCustom.map((carac) => (
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
                            formData.caracteristicasEspeciais.includes(carac.code) ? "opacity-100" : "opacity-0"
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
          
          {/* Campo para adicionar característica customizada */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={novaCaracteristicaCustom}
              onChange={(e) => setNovaCaracteristicaCustom(e.target.value)}
              placeholder="Adicionar característica customizada..."
              className="flex-1"
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
              disabled={!novaCaracteristicaCustom.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {formData.caracteristicasEspeciais.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.caracteristicasEspeciais.map((code) => {
                const carac = CARACTERISTICAS_ESPECIAIS.find(c => c.code === code) || 
                             caracteristicasCustom.find(c => c.code === code);
                return carac ? (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => toggleCaracteristica(code)}
                  >
                    {carac.label}
                    <X className="ml-2 h-3 w-3" />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Card de Aviso/Disclaimer sobre Responsabilidade do ICP */}
      <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
          ⚠️ Importante: Responsabilidade na Configuração do ICP
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2 space-y-2">
          <p>
            <strong>A configuração do Perfil do Cliente Ideal (ICP) é de inteira responsabilidade do usuário.</strong>
          </p>
          <p className="text-sm">
            A qualidade e assertividade dos resultados de busca dependem diretamente da objetividade e precisão nas informações fornecidas.
          </p>
          <p className="text-sm font-medium">
            ⚡ Dimensões generalizadas, informações tumultuadas ou excesso de critérios podem reduzir significativamente a sensibilidade e assertividade do ICP.
          </p>
          <p className="text-sm">
            <strong>Recomendação:</strong> Seja objetivo e estratégico na seleção dos critérios. Foque nos aspectos mais relevantes para o seu negócio e evite sobrecarregar o perfil com informações desnecessárias.
          </p>
        </AlertDescription>
      </Alert>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={onBack}
        onNext={() => {}}
        onSave={onSaveExplicit || onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Próximo"
        isSubmit={true}
      />
    </form>
  );
}
