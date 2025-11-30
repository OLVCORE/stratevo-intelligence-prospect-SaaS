// src/components/onboarding/steps/Step2SetoresNichos.tsx
// VERSÃO SIMPLIFICADA: Dois dropdowns simples (setor único + nichos múltiplos)

'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, X, Check } from 'lucide-react';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { cn } from '@/lib/utils';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
  initialData: any;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

interface Sector {
  sector_code: string;
  sector_name: string;
  description?: string;
}

interface Niche {
  niche_code: string;
  niche_name: string;
  sector_code: string;
  description?: string;
  keywords?: string[];
  isCustom?: boolean; // Para nichos adicionados manualmente
}

export function Step2SetoresNichos({ onNext, onBack, onSave, initialData, isSaving = false, hasUnsavedChanges = false }: Props) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado do formulário - MÚLTIPLAS SELEÇÕES PARA AMBOS
  const [selectedSectors, setSelectedSectors] = useState<string[]>(initialData?.setoresAlvo || initialData?.sectorAtual ? [initialData.sectorAtual] : []);
  // Nichos organizados por setor: { sectorCode: [nicheCodes] }
  const [selectedNichesBySector, setSelectedNichesBySector] = useState<Record<string, string[]>>(
    initialData?.nichosBySector || {}
  );
  const [customNiches, setCustomNiches] = useState<Niche[]>(initialData?.customNiches || []);
  const [newCustomNiche, setNewCustomNiche] = useState<Record<string, string>>({});
  
  // 🆕 Estado para setor customizado
  const [newCustomSector, setNewCustomSector] = useState('');

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa)
  useEffect(() => {
    if (initialData) {
      console.log('[Step2] 🔄 Atualizando dados do initialData:', initialData);
      if (initialData.setoresAlvo) {
        setSelectedSectors(initialData.setoresAlvo);
      }
      if (initialData.nichosBySector) {
        setSelectedNichesBySector(initialData.nichosBySector);
      }
      if (initialData.customNiches) {
        setCustomNiches(initialData.customNiches);
      }
    }
  }, [initialData]);
  
  // Estados para dropdowns (um por setor)
  const [sectorsDropdownOpen, setSectorsDropdownOpen] = useState(false);
  const [nichesDropdownsOpen, setNichesDropdownsOpen] = useState<Record<string, boolean>>({});

  // Dados hardcoded como fallback (25 setores B2B corretos)
  const FALLBACK_SECTORS: Sector[] = [
    { sector_code: 'agro', sector_name: 'Agronegócio', description: 'Agronegócio, pecuária, agroindústria, cooperativas' },
    { sector_code: 'manufatura', sector_name: 'Manufatura', description: 'Indústria de transformação, manufatura avançada' },
    { sector_code: 'construcao', sector_name: 'Construção Civil', description: 'Construção civil, infraestrutura, incorporação' },
    { sector_code: 'tecnologia', sector_name: 'Tecnologia', description: 'Software, hardware, TI, SaaS' },
    { sector_code: 'logistica', sector_name: 'Logística', description: 'Transporte, armazenagem, 3PL, supply chain' },
    { sector_code: 'distribuicao', sector_name: 'Distribuição', description: 'Atacado, distribuição, logística comercial' },
    { sector_code: 'varejo', sector_name: 'Varejo', description: 'Grandes redes varejistas, e-commerce' },
    { sector_code: 'financial_services', sector_name: 'Serviços Financeiros', description: 'Bancos, fintechs, seguradoras' },
    { sector_code: 'energia', sector_name: 'Energia', description: 'Geração, distribuição, energia renovável' },
    { sector_code: 'mineracao', sector_name: 'Mineração', description: 'Extração mineral, mineração, siderurgia' },
    { sector_code: 'quimica', sector_name: 'Química', description: 'Indústria química, petroquímica' },
    { sector_code: 'metalurgia', sector_name: 'Metalurgia', description: 'Metalurgia, siderurgia, fundição' },
    { sector_code: 'papel_celulose', sector_name: 'Papel e Celulose', description: 'Indústria de papel, celulose' },
    { sector_code: 'textil', sector_name: 'Têxtil', description: 'Indústria têxtil, confecção industrial' },
    { sector_code: 'automotivo', sector_name: 'Automotivo', description: 'Indústria automotiva, autopeças' },
    { sector_code: 'farmaceutico', sector_name: 'Farmacêutico', description: 'Indústria farmacêutica, laboratórios' },
    { sector_code: 'alimentacao', sector_name: 'Alimentação', description: 'Indústria alimentícia, processamento' },
    { sector_code: 'telecomunicacoes', sector_name: 'Telecomunicações', description: 'Telecom, provedores, operadoras' },
    { sector_code: 'saude', sector_name: 'Saúde', description: 'Hospitais, clínicas grandes, healthtechs' },
    { sector_code: 'educacional', sector_name: 'Educacional', description: 'Grandes grupos educacionais, universidades' },
    { sector_code: 'engenharia', sector_name: 'Engenharia', description: 'Grandes empresas de engenharia' },
    { sector_code: 'consultoria', sector_name: 'Consultoria', description: 'Grandes consultorias estratégicas' },
    { sector_code: 'juridico', sector_name: 'Jurídico', description: 'Grandes escritórios de advocacia' },
    { sector_code: 'imobiliario', sector_name: 'Imobiliário', description: 'Incorporadoras, construtoras grandes' },
    { sector_code: 'midia_comunicacao', sector_name: 'Mídia e Comunicação', description: 'Grandes grupos de mídia' },
  ];

  // FALLBACK_NICHES removido - os dados devem vir do banco de dados
  // Se o banco não estiver acessível, os nichos não aparecerão até que o problema seja resolvido
  const FALLBACK_NICHES: Niche[] = [
    // Nichos vazios - dados devem vir do banco
    // Se você está vendo esta mensagem, verifique:
    // 1. Se as tabelas sectors e niches existem no banco
    // 2. Se as políticas RLS estão configuradas corretamente
    // 3. Se o schema 'public' está exposto no Supabase Dashboard
    // 4. Se o projeto Supabase foi reiniciado após criar as tabelas
  ];
  
  // FALLBACK ANTIGO (códigos antigos - não usar):
  const FALLBACK_NICHES_OLD: Niche[] = [
    // Tecnologia (20+ nichos)
    { niche_code: 'SAAS', niche_name: 'Software as a Service', sector_code: 'TECH', description: 'Empresas que oferecem software como serviço', keywords: ['saas', 'cloud', 'software'] },
    { niche_code: 'E-COMM', niche_name: 'E-commerce', sector_code: 'TECH', description: 'Plataformas de e-commerce', keywords: ['ecommerce', 'marketplace'] },
    { niche_code: 'MOBILE', niche_name: 'Mobile Apps', sector_code: 'TECH', description: 'Desenvolvimento de aplicativos móveis', keywords: ['mobile', 'app', 'ios', 'android'] },
    { niche_code: 'AI', niche_name: 'Inteligência Artificial', sector_code: 'TECH', description: 'Empresas focadas em IA', keywords: ['ia', 'ai', 'machine learning'] },
    { niche_code: 'SEC', niche_name: 'Segurança Digital', sector_code: 'TECH', description: 'Cybersecurity', keywords: ['segurança', 'cybersecurity'] },
    { niche_code: 'BI', niche_name: 'Business Intelligence', sector_code: 'TECH', description: 'Análise de dados e BI', keywords: ['bi', 'analytics', 'dados'] },
    { niche_code: 'ERP', niche_name: 'ERP', sector_code: 'TECH', description: 'Sistemas ERP', keywords: ['erp', 'gestão'] },
    { niche_code: 'CRM', niche_name: 'CRM', sector_code: 'TECH', description: 'Sistemas CRM', keywords: ['crm', 'vendas'] },
    { niche_code: 'BLOCKCHAIN', niche_name: 'Blockchain', sector_code: 'TECH', description: 'Tecnologia blockchain', keywords: ['blockchain', 'crypto'] },
    { niche_code: 'IOT', niche_name: 'Internet das Coisas', sector_code: 'TECH', description: 'Dispositivos IoT', keywords: ['iot', 'smart devices'] },
    { niche_code: 'GAMING', niche_name: 'Gaming', sector_code: 'TECH', description: 'Jogos e entretenimento digital', keywords: ['gaming', 'games'] },
    { niche_code: 'EDTECH', niche_name: 'EdTech', sector_code: 'TECH', description: 'Tecnologia educacional', keywords: ['edtech', 'educação'] },
    { niche_code: 'FINTECH', niche_name: 'FinTech', sector_code: 'TECH', description: 'Tecnologia financeira', keywords: ['fintech', 'fintech'] },
    { niche_code: 'HEALTHTECH', niche_name: 'HealthTech', sector_code: 'TECH', description: 'Tecnologia em saúde', keywords: ['healthtech', 'saúde'] },
    { niche_code: 'PROPTECH', niche_name: 'PropTech', sector_code: 'TECH', description: 'Tecnologia imobiliária', keywords: ['proptech', 'imóveis'] },
    { niche_code: 'LEGALTECH', niche_name: 'LegalTech', sector_code: 'TECH', description: 'Tecnologia jurídica', keywords: ['legaltech', 'jurídico'] },
    { niche_code: 'HRTECH', niche_name: 'HRTech', sector_code: 'TECH', description: 'Tecnologia de RH', keywords: ['hrtech', 'recursos humanos'] },
    { niche_code: 'MARKETINGTECH', niche_name: 'Marketing Tech', sector_code: 'TECH', description: 'Tecnologia de marketing', keywords: ['martech', 'marketing'] },
    { niche_code: 'SALESTECH', niche_name: 'Sales Tech', sector_code: 'TECH', description: 'Tecnologia de vendas', keywords: ['salestech', 'vendas'] },
    { niche_code: 'DEVOPS', niche_name: 'DevOps', sector_code: 'TECH', description: 'DevOps e infraestrutura', keywords: ['devops', 'infraestrutura'] },
    
    // Financeiro (20+ nichos)
    { niche_code: 'BANK', niche_name: 'Bancos', sector_code: 'FIN', description: 'Bancos tradicionais e digitais', keywords: ['banco', 'bancário'] },
    { niche_code: 'FINTECH_FIN', niche_name: 'Fintechs', sector_code: 'FIN', description: 'Startups financeiras', keywords: ['fintech', 'pagamento'] },
    { niche_code: 'INS', niche_name: 'Seguros', sector_code: 'FIN', description: 'Seguradoras', keywords: ['seguro', 'seguradora'] },
    { niche_code: 'INVEST', niche_name: 'Investimentos', sector_code: 'FIN', description: 'Gestão de investimentos', keywords: ['investimento', 'gestão'] },
    { niche_code: 'CREDIT', niche_name: 'Crédito', sector_code: 'FIN', description: 'Instituições de crédito', keywords: ['crédito', 'empréstimo'] },
    { niche_code: 'PAYMENT', niche_name: 'Pagamentos', sector_code: 'FIN', description: 'Processamento de pagamentos', keywords: ['pagamento', 'payment'] },
    { niche_code: 'CROWDFUNDING', niche_name: 'Crowdfunding', sector_code: 'FIN', description: 'Plataformas de crowdfunding', keywords: ['crowdfunding'] },
    { niche_code: 'CRYPTO', niche_name: 'Criptomoedas', sector_code: 'FIN', description: 'Exchanges e cripto', keywords: ['cripto', 'bitcoin'] },
    { niche_code: 'ACCOUNTING', niche_name: 'Contabilidade', sector_code: 'FIN', description: 'Serviços contábeis', keywords: ['contabilidade', 'contador'] },
    { niche_code: 'AUDIT', niche_name: 'Auditoria', sector_code: 'FIN', description: 'Serviços de auditoria', keywords: ['auditoria'] },
    { niche_code: 'TAX', niche_name: 'Tributário', sector_code: 'FIN', description: 'Consultoria tributária', keywords: ['tributário', 'imposto'] },
    { niche_code: 'WEALTH', niche_name: 'Wealth Management', sector_code: 'FIN', description: 'Gestão de patrimônio', keywords: ['wealth', 'patrimônio'] },
    { niche_code: 'REAL_ESTATE_FIN', niche_name: 'Real Estate Finance', sector_code: 'FIN', description: 'Financiamento imobiliário', keywords: ['imobiliário', 'financiamento'] },
    { niche_code: 'FACTORING', niche_name: 'Factoring', sector_code: 'FIN', description: 'Factoring e antecipação', keywords: ['factoring'] },
    { niche_code: 'LEASING', niche_name: 'Leasing', sector_code: 'FIN', description: 'Operações de leasing', keywords: ['leasing'] },
    { niche_code: 'BROKERAGE', niche_name: 'Corretagem', sector_code: 'FIN', description: 'Corretoras de valores', keywords: ['corretora'] },
    { niche_code: 'PENSION', niche_name: 'Previdência', sector_code: 'FIN', description: 'Fundos de previdência', keywords: ['previdência'] },
    { niche_code: 'MICROFINANCE', niche_name: 'Microfinanças', sector_code: 'FIN', description: 'Microcrédito', keywords: ['microcrédito'] },
    { niche_code: 'REMIT', niche_name: 'Remessas', sector_code: 'FIN', description: 'Remessas internacionais', keywords: ['remessa'] },
    { niche_code: 'FX', niche_name: 'Câmbio', sector_code: 'FIN', description: 'Câmbio e moedas', keywords: ['câmbio'] },
    
    // Varejo (20+ nichos)
    { niche_code: 'FASH', niche_name: 'Moda e Vestuário', sector_code: 'RET', description: 'Lojas de roupas', keywords: ['moda', 'roupa'] },
    { niche_code: 'ELEC', niche_name: 'Eletrônicos', sector_code: 'RET', description: 'Lojas de eletrônicos', keywords: ['eletrônico'] },
    { niche_code: 'PHAR', niche_name: 'Farmácias', sector_code: 'RET', description: 'Rede de farmácias', keywords: ['farmácia'] },
    { niche_code: 'SUPER', niche_name: 'Supermercados', sector_code: 'RET', description: 'Supermercados e hipermercados', keywords: ['supermercado'] },
    { niche_code: 'COSMETICS', niche_name: 'Cosméticos', sector_code: 'RET', description: 'Cosméticos e perfumaria', keywords: ['cosmético'] },
    { niche_code: 'SPORTS', niche_name: 'Artigos Esportivos', sector_code: 'RET', description: 'Equipamentos esportivos', keywords: ['esporte'] },
    { niche_code: 'TOYS', niche_name: 'Brinquedos', sector_code: 'RET', description: 'Brinquedos e games', keywords: ['brinquedo'] },
    { niche_code: 'BOOKS', niche_name: 'Livrarias', sector_code: 'RET', description: 'Livros e material didático', keywords: ['livro'] },
    { niche_code: 'FURNITURE', niche_name: 'Móveis', sector_code: 'RET', description: 'Móveis e decoração', keywords: ['móvel'] },
    { niche_code: 'HOME', niche_name: 'Casa e Jardim', sector_code: 'RET', description: 'Artigos para casa', keywords: ['casa'] },
    { niche_code: 'PET', niche_name: 'Pet Shop', sector_code: 'RET', description: 'Produtos para pets', keywords: ['pet'] },
    { niche_code: 'JEWELRY', niche_name: 'Joias', sector_code: 'RET', description: 'Joias e relógios', keywords: ['joia'] },
    { niche_code: 'AUTO_PARTS', niche_name: 'Peças Automotivas', sector_code: 'RET', description: 'Peças e acessórios', keywords: ['peça', 'automotivo'] },
    { niche_code: 'CONSTRUCTION_RET', niche_name: 'Material de Construção', sector_code: 'RET', description: 'Materiais de construção', keywords: ['construção'] },
    { niche_code: 'OFFICE', niche_name: 'Material de Escritório', sector_code: 'RET', description: 'Artigos de escritório', keywords: ['escritório'] },
    { niche_code: 'GIFTS', niche_name: 'Presentes', sector_code: 'RET', description: 'Lojas de presentes', keywords: ['presente'] },
    { niche_code: 'LUXURY', niche_name: 'Luxo', sector_code: 'RET', description: 'Produtos de luxo', keywords: ['luxo'] },
    { niche_code: 'DISCount', niche_name: 'Atacado', sector_code: 'RET', description: 'Atacado e distribuição', keywords: ['atacado'] },
    { niche_code: 'CONVENIENCE', niche_name: 'Conveniência', sector_code: 'RET', description: 'Lojas de conveniência', keywords: ['conveniência'] },
    { niche_code: 'ONLINE_ONLY', niche_name: 'E-commerce Puro', sector_code: 'RET', description: 'Apenas online', keywords: ['online'] },
    
    // Saúde (20+ nichos)
    { niche_code: 'HOSP', niche_name: 'Hospitais', sector_code: 'HEA', description: 'Hospitais e centros médicos', keywords: ['hospital'] },
    { niche_code: 'CLIN', niche_name: 'Clínicas', sector_code: 'HEA', description: 'Clínicas médicas', keywords: ['clínica'] },
    { niche_code: 'PHARMA', niche_name: 'Farmacêutica', sector_code: 'HEA', description: 'Laboratórios farmacêuticos', keywords: ['farmacêutico'] },
    { niche_code: 'DENTAL', niche_name: 'Odontologia', sector_code: 'HEA', description: 'Clínicas odontológicas', keywords: ['dental', 'odontologia'] },
    { niche_code: 'VET', niche_name: 'Veterinária', sector_code: 'HEA', description: 'Clínicas veterinárias', keywords: ['veterinária'] },
    { niche_code: 'LAB', niche_name: 'Laboratórios', sector_code: 'HEA', description: 'Laboratórios de análises', keywords: ['laboratório'] },
    { niche_code: 'DIAGNOSTIC', niche_name: 'Diagnóstico por Imagem', sector_code: 'HEA', description: 'Exames de imagem', keywords: ['diagnóstico'] },
    { niche_code: 'PHYSIO', niche_name: 'Fisioterapia', sector_code: 'HEA', description: 'Clínicas de fisioterapia', keywords: ['fisioterapia'] },
    { niche_code: 'PSYCH', niche_name: 'Psicologia', sector_code: 'HEA', description: 'Clínicas psicológicas', keywords: ['psicologia'] },
    { niche_code: 'NUTRITION', niche_name: 'Nutrição', sector_code: 'HEA', description: 'Nutricionistas', keywords: ['nutrição'] },
    { niche_code: 'ESTHETIC', niche_name: 'Estética', sector_code: 'HEA', description: 'Clínicas de estética', keywords: ['estética'] },
    { niche_code: 'SPA', niche_name: 'SPA', sector_code: 'HEA', description: 'SPAs e wellness', keywords: ['spa', 'wellness'] },
    { niche_code: 'NURSING', niche_name: 'Enfermagem', sector_code: 'HEA', description: 'Serviços de enfermagem', keywords: ['enfermagem'] },
    { niche_code: 'HOME_CARE', niche_name: 'Home Care', sector_code: 'HEA', description: 'Cuidados domiciliares', keywords: ['home care'] },
    { niche_code: 'EMERGENCY', niche_name: 'Emergência', sector_code: 'HEA', description: 'Serviços de emergência', keywords: ['emergência'] },
    { niche_code: 'AMBULANCE', niche_name: 'Ambulâncias', sector_code: 'HEA', description: 'Serviços de ambulância', keywords: ['ambulância'] },
    { niche_code: 'MEDICAL_EQUIP', niche_name: 'Equipamentos Médicos', sector_code: 'HEA', description: 'Equipamentos médicos', keywords: ['equipamento'] },
    { niche_code: 'HEALTH_INS', niche_name: 'Planos de Saúde', sector_code: 'HEA', description: 'Operadoras de saúde', keywords: ['plano', 'saúde'] },
    { niche_code: 'TELEMEDICINE', niche_name: 'Telemedicina', sector_code: 'HEA', description: 'Consultas online', keywords: ['telemedicina'] },
    { niche_code: 'MEDICAL_DEVICES', niche_name: 'Dispositivos Médicos', sector_code: 'HEA', description: 'Dispositivos médicos', keywords: ['dispositivo'] },
    
    // Manufatura (20+ nichos)
    { niche_code: 'AUTOMOTIVE_MAN', niche_name: 'Automotiva', sector_code: 'MAN', description: 'Fabricação de veículos', keywords: ['automotivo', 'veículo'] },
    { niche_code: 'ELECTRONICS_MAN', niche_name: 'Eletrônicos', sector_code: 'MAN', description: 'Fabricação de eletrônicos', keywords: ['eletrônico', 'componente'] },
    { niche_code: 'TEXTILES', niche_name: 'Têxtil', sector_code: 'MAN', description: 'Indústria têxtil', keywords: ['têxtil', 'tecido'] },
    { niche_code: 'FOOD_PROCESSING', niche_name: 'Processamento de Alimentos', sector_code: 'MAN', description: 'Processamento e embalagem de alimentos', keywords: ['alimento', 'processamento'] },
    { niche_code: 'CHEMICALS', niche_name: 'Química', sector_code: 'MAN', description: 'Indústria química', keywords: ['química', 'químico'] },
    { niche_code: 'PHARMACEUTICAL_MAN', niche_name: 'Farmacêutica', sector_code: 'MAN', description: 'Fabricação de medicamentos', keywords: ['farmacêutico', 'medicamento'] },
    { niche_code: 'METALWORKING', niche_name: 'Metalurgia', sector_code: 'MAN', description: 'Transformação de metais', keywords: ['metal', 'metalurgia'] },
    { niche_code: 'PLASTICS', niche_name: 'Plásticos', sector_code: 'MAN', description: 'Indústria de plásticos', keywords: ['plástico', 'polímero'] },
    { niche_code: 'PAPER', niche_name: 'Papel e Celulose', sector_code: 'MAN', description: 'Fabricação de papel', keywords: ['papel', 'celulose'] },
    { niche_code: 'FURNITURE_MAN', niche_name: 'Móveis', sector_code: 'MAN', description: 'Fabricação de móveis', keywords: ['móvel', 'mobiliário'] },
    { niche_code: 'MACHINERY', niche_name: 'Máquinas e Equipamentos', sector_code: 'MAN', description: 'Fabricação de máquinas', keywords: ['máquina', 'equipamento'] },
    { niche_code: 'AEROSPACE', niche_name: 'Aeroespacial', sector_code: 'MAN', description: 'Indústria aeroespacial', keywords: ['aeroespacial', 'aviação'] },
    { niche_code: 'DEFENSE', niche_name: 'Defesa', sector_code: 'MAN', description: 'Indústria de defesa', keywords: ['defesa', 'militar'] },
    { niche_code: 'ENERGY_EQUIP', niche_name: 'Equipamentos de Energia', sector_code: 'MAN', description: 'Equipamentos energéticos', keywords: ['energia', 'equipamento'] },
    { niche_code: 'PACKAGING', niche_name: 'Embalagens', sector_code: 'MAN', description: 'Fabricação de embalagens', keywords: ['embalagem', 'packaging'] },
    { niche_code: 'FOOTWEAR', niche_name: 'Calçados', sector_code: 'MAN', description: 'Fabricação de calçados', keywords: ['calçado', 'sapato'] },
    { niche_code: 'TOYS_MAN', niche_name: 'Brinquedos', sector_code: 'MAN', description: 'Fabricação de brinquedos', keywords: ['brinquedo', 'toy'] },
    { niche_code: 'SPORTS_EQUIP', niche_name: 'Equipamentos Esportivos', sector_code: 'MAN', description: 'Fabricação de equipamentos esportivos', keywords: ['esporte', 'equipamento'] },
    { niche_code: 'INDUSTRY_40', niche_name: 'Indústria 4.0', sector_code: 'MAN', description: 'Automação e digitalização industrial', keywords: ['indústria 4.0', 'automação'] },
    { niche_code: 'PRECISION_MACHINING', niche_name: 'Usinagem de Precisão', sector_code: 'MAN', description: 'Usinagem e ferramentaria', keywords: ['usinagem', 'precisão'] },
    
    // Educacional (20+ nichos)
    { niche_code: 'K12', niche_name: 'Ensino Fundamental e Médio', sector_code: 'EDU', description: 'Escolas K-12', keywords: ['escola', 'fundamental', 'médio'] },
    { niche_code: 'HIGHER_ED', niche_name: 'Ensino Superior', sector_code: 'EDU', description: 'Universidades e faculdades', keywords: ['universidade', 'faculdade', 'superior'] },
    { niche_code: 'TECHNICAL', niche_name: 'Ensino Técnico', sector_code: 'EDU', description: 'Escolas técnicas', keywords: ['técnico', 'técnica'] },
    { niche_code: 'VOCATIONAL', niche_name: 'Ensino Profissionalizante', sector_code: 'EDU', description: 'Cursos profissionalizantes', keywords: ['profissionalizante', 'curso'] },
    { niche_code: 'LANGUAGE', niche_name: 'Idiomas', sector_code: 'EDU', description: 'Escolas de idiomas', keywords: ['idioma', 'língua'] },
    { niche_code: 'ONLINE_LEARNING', niche_name: 'EAD', sector_code: 'EDU', description: 'Ensino a distância', keywords: ['ead', 'online', 'distância'] },
    { niche_code: 'CORPORATE_TRAINING', niche_name: 'Treinamento Corporativo', sector_code: 'EDU', description: 'Treinamento para empresas', keywords: ['treinamento', 'corporativo'] },
    { niche_code: 'TEST_PREP', niche_name: 'Preparatório para Concursos', sector_code: 'EDU', description: 'Cursos preparatórios', keywords: ['concurso', 'preparatório'] },
    { niche_code: 'TUTORING', niche_name: 'Aulas Particulares', sector_code: 'EDU', description: 'Reforço escolar e aulas particulares', keywords: ['particular', 'reforço'] },
    { niche_code: 'EARLY_CHILDHOOD', niche_name: 'Educação Infantil', sector_code: 'EDU', description: 'Creches e pré-escolas', keywords: ['infantil', 'creche', 'pré-escola'] },
    { niche_code: 'SPECIAL_NEEDS', niche_name: 'Educação Especial', sector_code: 'EDU', description: 'Educação inclusiva', keywords: ['especial', 'inclusiva'] },
    { niche_code: 'ARTS', niche_name: 'Artes', sector_code: 'EDU', description: 'Escolas de artes', keywords: ['arte', 'artístico'] },
    { niche_code: 'MUSIC', niche_name: 'Música', sector_code: 'EDU', description: 'Escolas de música', keywords: ['música', 'musical'] },
    { niche_code: 'SPORTS_EDU', niche_name: 'Esportes', sector_code: 'EDU', description: 'Escolas de esportes', keywords: ['esporte', 'esportivo'] },
    { niche_code: 'DIGITAL_SKILLS', niche_name: 'Habilidades Digitais', sector_code: 'EDU', description: 'Cursos de tecnologia e programação', keywords: ['digital', 'programação', 'tech'] },
    { niche_code: 'BUSINESS_SCHOOL', niche_name: 'Escolas de Negócios', sector_code: 'EDU', description: 'MBA e cursos de negócios', keywords: ['mba', 'negócio', 'business'] },
    { niche_code: 'COACHING', niche_name: 'Coaching', sector_code: 'EDU', description: 'Coaching e desenvolvimento pessoal', keywords: ['coaching', 'desenvolvimento'] },
    { niche_code: 'CERTIFICATION', niche_name: 'Certificações', sector_code: 'EDU', description: 'Cursos de certificação profissional', keywords: ['certificação', 'certificado'] },
    { niche_code: 'CONTINUING_ED', niche_name: 'Educação Continuada', sector_code: 'EDU', description: 'Cursos de extensão e atualização', keywords: ['continuada', 'extensão'] },
    { niche_code: 'STUDY_ABROAD', niche_name: 'Intercâmbio', sector_code: 'EDU', description: 'Programas de intercâmbio', keywords: ['intercâmbio', 'exchange'] },
    
    // Logística (20+ nichos)
    { niche_code: 'FREIGHT', niche_name: 'Transporte de Carga', sector_code: 'LOG', description: 'Transporte rodoviário de carga', keywords: ['carga', 'frete'] },
    { niche_code: 'COURIER', niche_name: 'Entregas Rápidas', sector_code: 'LOG', description: 'Correios e entregas expressas', keywords: ['entrega', 'expresso'] },
    { niche_code: 'WAREHOUSING', niche_name: 'Armazenagem', sector_code: 'LOG', description: 'Centros de distribuição', keywords: ['armazém', 'distribuição'] },
    { niche_code: 'SUPPLY_CHAIN', niche_name: 'Gestão de Cadeia de Suprimentos', sector_code: 'LOG', description: 'Supply chain management', keywords: ['supply chain', 'suprimentos'] },
    { niche_code: 'LAST_MILE', niche_name: 'Última Milha', sector_code: 'LOG', description: 'Entregas finais', keywords: ['última milha', 'entrega final'] },
    { niche_code: 'FLEET_MANAGEMENT', niche_name: 'Gestão de Frotas', sector_code: 'LOG', description: 'Gestão de veículos', keywords: ['frota', 'veículo'] },
    { niche_code: 'CUSTOMS', niche_name: 'Despacho Aduaneiro', sector_code: 'LOG', description: 'Serviços aduaneiros', keywords: ['aduaneiro', 'despacho'] },
    { niche_code: 'AIR_FREIGHT', niche_name: 'Transporte Aéreo', sector_code: 'LOG', description: 'Carga aérea', keywords: ['aéreo', 'aviação'] },
    { niche_code: 'MARITIME', niche_name: 'Transporte Marítimo', sector_code: 'LOG', description: 'Carga marítima', keywords: ['marítimo', 'navio'] },
    { niche_code: 'RAIL', niche_name: 'Transporte Ferroviário', sector_code: 'LOG', description: 'Carga ferroviária', keywords: ['ferroviário', 'trem'] },
    { niche_code: 'LOGISTICS_TECH', niche_name: 'LogTech', sector_code: 'LOG', description: 'Tecnologia logística', keywords: ['logtech', 'tecnologia'] },
    { niche_code: 'REVERSE_LOGISTICS', niche_name: 'Logística Reversa', sector_code: 'LOG', description: 'Devoluções e reciclagem', keywords: ['reversa', 'devolução'] },
    { niche_code: 'COLD_CHAIN', niche_name: 'Cadeia do Frio', sector_code: 'LOG', description: 'Transporte refrigerado', keywords: ['frio', 'refrigerado'] },
    { niche_code: 'DANGEROUS_GOODS', niche_name: 'Cargas Perigosas', sector_code: 'LOG', description: 'Transporte de produtos perigosos', keywords: ['perigoso', 'hazmat'] },
    { niche_code: 'PROJECT_CARGO', niche_name: 'Cargas de Projeto', sector_code: 'LOG', description: 'Transporte especializado', keywords: ['projeto', 'especializado'] },
    { niche_code: 'THIRD_PARTY_LOG', niche_name: '3PL', sector_code: 'LOG', description: 'Terceirização logística', keywords: ['3pl', 'terceirização'] },
    { niche_code: 'FOURTH_PARTY_LOG', niche_name: '4PL', sector_code: 'LOG', description: 'Gestão logística avançada', keywords: ['4pl', 'gestão'] },
    { niche_code: 'PACKAGING_LOG', niche_name: 'Embalagem', sector_code: 'LOG', description: 'Serviços de embalagem', keywords: ['embalagem', 'packaging'] },
    { niche_code: 'CROSS_DOCKING', niche_name: 'Cross-Docking', sector_code: 'LOG', description: 'Operações de cross-docking', keywords: ['cross-docking'] },
    
    // Agronegócio (20+ nichos)
    { niche_code: 'CROP', niche_name: 'Agricultura', sector_code: 'AGR', description: 'Cultivo de grãos e cereais', keywords: ['agricultura', 'grão'] },
    { niche_code: 'LIVESTOCK', niche_name: 'Pecuária', sector_code: 'AGR', description: 'Criação de gado', keywords: ['pecuária', 'gado'] },
    { niche_code: 'POULTRY', niche_name: 'Avicultura', sector_code: 'AGR', description: 'Criação de aves', keywords: ['avicultura', 'ave'] },
    { niche_code: 'FISHERIES', niche_name: 'Aquicultura', sector_code: 'AGR', description: 'Criação de peixes', keywords: ['aquicultura', 'peixe'] },
    { niche_code: 'FORESTRY', niche_name: 'Silvicultura', sector_code: 'AGR', description: 'Florestas e madeira', keywords: ['silvicultura', 'madeira'] },
    { niche_code: 'ORGANIC', niche_name: 'Agricultura Orgânica', sector_code: 'AGR', description: 'Produtos orgânicos', keywords: ['orgânico', 'sustentável'] },
    { niche_code: 'AGRI_TECH', niche_name: 'AgTech', sector_code: 'AGR', description: 'Tecnologia no agronegócio', keywords: ['agtech', 'tecnologia'] },
    { niche_code: 'IRRIGATION', niche_name: 'Irrigação', sector_code: 'AGR', description: 'Sistemas de irrigação', keywords: ['irrigação', 'água'] },
    { niche_code: 'FERTILIZERS', niche_name: 'Fertilizantes', sector_code: 'AGR', description: 'Fabricação de fertilizantes', keywords: ['fertilizante', 'adubo'] },
    { niche_code: 'PESTICIDES', niche_name: 'Defensivos Agrícolas', sector_code: 'AGR', description: 'Agroquímicos', keywords: ['defensivo', 'pesticida'] },
    { niche_code: 'SEEDS', niche_name: 'Sementes', sector_code: 'AGR', description: 'Melhoramento genético', keywords: ['semente', 'genética'] },
    { niche_code: 'MACHINERY_AGR', niche_name: 'Maquinário Agrícola', sector_code: 'AGR', description: 'Tratores e equipamentos', keywords: ['trator', 'máquina'] },
    { niche_code: 'ANIMAL_HEALTH', niche_name: 'Sanidade Animal', sector_code: 'AGR', description: 'Veterinária e saúde animal', keywords: ['veterinária', 'sanidade'] },
    { niche_code: 'FOOD_PROCESSING_AGR', niche_name: 'Processamento de Alimentos', sector_code: 'AGR', description: 'Transformação de produtos agrícolas', keywords: ['processamento', 'transformação'] },
    { niche_code: 'EXPORT', niche_name: 'Exportação Agrícola', sector_code: 'AGR', description: 'Comércio exterior agrícola', keywords: ['exportação', 'comércio'] },
    { niche_code: 'COOPERATIVES', niche_name: 'Cooperativas', sector_code: 'AGR', description: 'Cooperativas agrícolas', keywords: ['cooperativa'] },
    { niche_code: 'RURAL_CREDIT', niche_name: 'Crédito Rural', sector_code: 'AGR', description: 'Financiamento agrícola', keywords: ['crédito', 'financiamento'] },
    { niche_code: 'RURAL_INSURANCE', niche_name: 'Seguro Rural', sector_code: 'AGR', description: 'Seguros agrícolas', keywords: ['seguro', 'rural'] },
    { niche_code: 'PRECISION_AGR', niche_name: 'Agricultura de Precisão', sector_code: 'AGR', description: 'Tecnologia de precisão', keywords: ['precisão', 'gps'] },
    
    // Construção (20+ nichos)
    { niche_code: 'RESIDENTIAL', niche_name: 'Residencial', sector_code: 'CON', description: 'Construção residencial', keywords: ['residencial', 'casa'] },
    { niche_code: 'COMMERCIAL', niche_name: 'Comercial', sector_code: 'CON', description: 'Construção comercial', keywords: ['comercial', 'edifício'] },
    { niche_code: 'INDUSTRIAL_CON', niche_name: 'Industrial', sector_code: 'CON', description: 'Construção industrial', keywords: ['industrial', 'fábrica'] },
    { niche_code: 'INFRASTRUCTURE', niche_name: 'Infraestrutura', sector_code: 'CON', description: 'Obras de infraestrutura', keywords: ['infraestrutura', 'obra'] },
    { niche_code: 'RENOVATION', niche_name: 'Reformas', sector_code: 'CON', description: 'Reformas e restauração', keywords: ['reforma', 'restauração'] },
    { niche_code: 'MATERIALS', niche_name: 'Materiais de Construção', sector_code: 'CON', description: 'Fabricação de materiais', keywords: ['material', 'cimento'] },
    { niche_code: 'ENGINEERING', niche_name: 'Engenharia', sector_code: 'CON', description: 'Serviços de engenharia', keywords: ['engenharia', 'projeto'] },
    { niche_code: 'ARCHITECTURE', niche_name: 'Arquitetura', sector_code: 'CON', description: 'Serviços arquitetônicos', keywords: ['arquitetura', 'projeto'] },
    { niche_code: 'ELECTRICAL', niche_name: 'Elétrica', sector_code: 'CON', description: 'Instalações elétricas', keywords: ['elétrica', 'instalação'] },
    { niche_code: 'PLUMBING', niche_name: 'Hidráulica', sector_code: 'CON', description: 'Instalações hidráulicas', keywords: ['hidráulica', 'encanamento'] },
    { niche_code: 'PAINTING', niche_name: 'Pintura', sector_code: 'CON', description: 'Serviços de pintura', keywords: ['pintura', 'tinta'] },
    { niche_code: 'FLOORING', niche_name: 'Pisos e Revestimentos', sector_code: 'CON', description: 'Instalação de pisos', keywords: ['piso', 'revestimento'] },
    { niche_code: 'ROOFING', niche_name: 'Coberturas', sector_code: 'CON', description: 'Telhados e coberturas', keywords: ['telhado', 'cobertura'] },
    { niche_code: 'LANDSCAPING', niche_name: 'Paisagismo', sector_code: 'CON', description: 'Paisagismo e jardinagem', keywords: ['paisagismo', 'jardim'] },
    { niche_code: 'DEMOLITION', niche_name: 'Demolição', sector_code: 'CON', description: 'Serviços de demolição', keywords: ['demolição', 'demolir'] },
    { niche_code: 'FOUNDATION', niche_name: 'Fundações', sector_code: 'CON', description: 'Fundações e estruturas', keywords: ['fundação', 'estrutura'] },
    { niche_code: 'CONSTRUTECH', niche_name: 'Construtech', sector_code: 'CON', description: 'Tecnologia na construção', keywords: ['construtech', 'tecnologia'] },
    { niche_code: 'PROJECT_MANAGEMENT', niche_name: 'Gestão de Projetos', sector_code: 'CON', description: 'Gestão de obras', keywords: ['gestão', 'obra'] },
    { niche_code: 'INSPECTION', niche_name: 'Fiscalização', sector_code: 'CON', description: 'Fiscalização e vistoria', keywords: ['fiscalização', 'vistoria'] },
    
    // Serviços (20+ nichos)
    { niche_code: 'CONSULTING', niche_name: 'Consultoria', sector_code: 'SER', description: 'Consultoria empresarial', keywords: ['consultoria', 'consultor'] },
    { niche_code: 'MARKETING_SER', niche_name: 'Marketing Digital', sector_code: 'SER', description: 'Agências de marketing', keywords: ['marketing', 'digital'] },
    { niche_code: 'ADVERTISING', niche_name: 'Publicidade', sector_code: 'SER', description: 'Agências de publicidade', keywords: ['publicidade', 'agência'] },
    { niche_code: 'LEGAL_SER', niche_name: 'Jurídico', sector_code: 'SER', description: 'Serviços jurídicos', keywords: ['jurídico', 'advocacia'] },
    { niche_code: 'ACCOUNTING_SER', niche_name: 'Contabilidade', sector_code: 'SER', description: 'Serviços contábeis', keywords: ['contabilidade', 'contador'] },
    { niche_code: 'HR_SERVICES', niche_name: 'Recursos Humanos', sector_code: 'SER', description: 'Serviços de RH', keywords: ['rh', 'recursos humanos'] },
    { niche_code: 'CLEANING', niche_name: 'Limpeza', sector_code: 'SER', description: 'Serviços de limpeza', keywords: ['limpeza', 'faxina'] },
    { niche_code: 'SECURITY', niche_name: 'Segurança', sector_code: 'SER', description: 'Serviços de segurança', keywords: ['segurança', 'vigilância'] },
    { niche_code: 'MAINTENANCE', niche_name: 'Manutenção', sector_code: 'SER', description: 'Manutenção predial', keywords: ['manutenção', 'predial'] },
    { niche_code: 'IT_SERVICES', niche_name: 'TI', sector_code: 'SER', description: 'Serviços de TI', keywords: ['ti', 'tecnologia'] },
    { niche_code: 'EVENTS', niche_name: 'Eventos', sector_code: 'SER', description: 'Organização de eventos', keywords: ['evento', 'organização'] },
    { niche_code: 'PHOTOGRAPHY', niche_name: 'Fotografia', sector_code: 'SER', description: 'Serviços fotográficos', keywords: ['fotografia', 'foto'] },
    { niche_code: 'TRANSLATION', niche_name: 'Tradução', sector_code: 'SER', description: 'Serviços de tradução', keywords: ['tradução', 'idioma'] },
    { niche_code: 'DESIGN', niche_name: 'Design', sector_code: 'SER', description: 'Design gráfico e web', keywords: ['design', 'gráfico'] },
    { niche_code: 'PRINTING', niche_name: 'Impressão', sector_code: 'SER', description: 'Serviços de impressão', keywords: ['impressão', 'gráfica'] },
    { niche_code: 'CALL_CENTER', niche_name: 'Call Center', sector_code: 'SER', description: 'Atendimento ao cliente', keywords: ['call center', 'atendimento'] },
    { niche_code: 'OUTSOURCING', niche_name: 'Terceirização', sector_code: 'SER', description: 'Serviços terceirizados', keywords: ['terceirização', 'outsourcing'] },
    { niche_code: 'FACILITY_MANAGEMENT', niche_name: 'Facility Management', sector_code: 'SER', description: 'Gestão de instalações', keywords: ['facility', 'gestão'] },
    { niche_code: 'PROFESSIONAL_SERVICES', niche_name: 'Serviços Profissionais', sector_code: 'SER', description: 'Serviços diversos', keywords: ['profissional', 'serviço'] },
    
    // Alimentação (20+ nichos)
    { niche_code: 'RESTAURANTS', niche_name: 'Restaurantes', sector_code: 'FOOD', description: 'Restaurantes e bares', keywords: ['restaurante', 'bar'] },
    { niche_code: 'FAST_FOOD', niche_name: 'Fast Food', sector_code: 'FOOD', description: 'Rede de fast food', keywords: ['fast food', 'lanchonete'] },
    { niche_code: 'CAFETERIA', niche_name: 'Cafeterias', sector_code: 'FOOD', description: 'Cafés e cafeterias', keywords: ['café', 'cafeteria'] },
    { niche_code: 'BAKERY', niche_name: 'Padarias', sector_code: 'FOOD', description: 'Padarias e confeitarias', keywords: ['padaria', 'pão'] },
    { niche_code: 'CATERING', niche_name: 'Buffet', sector_code: 'FOOD', description: 'Serviços de buffet', keywords: ['buffet', 'catering'] },
    { niche_code: 'FOOD_DELIVERY', niche_name: 'Delivery', sector_code: 'FOOD', description: 'Plataformas de delivery', keywords: ['delivery', 'entrega'] },
    { niche_code: 'FOOD_TRUCKS', niche_name: 'Food Trucks', sector_code: 'FOOD', description: 'Food trucks', keywords: ['food truck', 'móvel'] },
    { niche_code: 'ICE_CREAM', niche_name: 'Sorveterias', sector_code: 'FOOD', description: 'Sorveterias e açaí', keywords: ['sorvete', 'açaí'] },
    { niche_code: 'PIZZA', niche_name: 'Pizzarias', sector_code: 'FOOD', description: 'Pizzarias', keywords: ['pizza', 'pizzaria'] },
    { niche_code: 'SUSHI', niche_name: 'Sushi', sector_code: 'FOOD', description: 'Restaurantes japoneses', keywords: ['sushi', 'japonês'] },
    { niche_code: 'VEGETARIAN', niche_name: 'Vegetariano/Vegano', sector_code: 'FOOD', description: 'Alimentação vegetariana', keywords: ['vegetariano', 'vegano'] },
    { niche_code: 'STREET_FOOD', niche_name: 'Comida de Rua', sector_code: 'FOOD', description: 'Comida de rua', keywords: ['rua', 'street food'] },
    { niche_code: 'FINE_DINING', niche_name: 'Alta Gastronomia', sector_code: 'FOOD', description: 'Restaurantes finos', keywords: ['gastronomia', 'fino'] },
    { niche_code: 'FOOD_MANUFACTURING', niche_name: 'Fabricação de Alimentos', sector_code: 'FOOD', description: 'Indústria alimentícia', keywords: ['fabricação', 'alimento'] },
    { niche_code: 'BEVERAGES', niche_name: 'Bebidas', sector_code: 'FOOD', description: 'Fabricação de bebidas', keywords: ['bebida', 'refrigerante'] },
    { niche_code: 'SNACKS', niche_name: 'Snacks', sector_code: 'FOOD', description: 'Salgadinhos e snacks', keywords: ['snack', 'salgadinho'] },
    { niche_code: 'CONFECTIONERY', niche_name: 'Confeitaria', sector_code: 'FOOD', description: 'Doces e confeitaria', keywords: ['doce', 'confeitaria'] },
    { niche_code: 'FOOD_TECH', niche_name: 'FoodTech', sector_code: 'FOOD', description: 'Tecnologia alimentar', keywords: ['foodtech', 'tecnologia'] },
    { niche_code: 'MEAL_PREP', niche_name: 'Marmitas', sector_code: 'FOOD', description: 'Preparação de marmitas', keywords: ['marmita', 'preparação'] },
    { niche_code: 'FOOD_SUPPLY', niche_name: 'Distribuição de Alimentos', sector_code: 'FOOD', description: 'Distribuição alimentar', keywords: ['distribuição', 'alimento'] },
    
    // Automotivo (20+ nichos)
    { niche_code: 'DEALERSHIPS', niche_name: 'Concessionárias', sector_code: 'AUTO', description: 'Venda de veículos novos', keywords: ['concessionária', 'venda'] },
    { niche_code: 'USED_CARS', niche_name: 'Seminovos', sector_code: 'AUTO', description: 'Venda de usados', keywords: ['usado', 'seminovo'] },
    { niche_code: 'PARTS', niche_name: 'Peças', sector_code: 'AUTO', description: 'Peças automotivas', keywords: ['peça', 'autopeça'] },
    { niche_code: 'REPAIR', niche_name: 'Oficinas', sector_code: 'AUTO', description: 'Oficinas mecânicas', keywords: ['oficina', 'mecânica'] },
    { niche_code: 'BODY_SHOP', niche_name: 'Funilarias', sector_code: 'AUTO', description: 'Funilaria e pintura', keywords: ['funilaria', 'pintura'] },
    { niche_code: 'TIRE', niche_name: 'Pneus', sector_code: 'AUTO', description: 'Venda e montagem de pneus', keywords: ['pneu', 'rodagem'] },
    { niche_code: 'BATTERY', niche_name: 'Baterias', sector_code: 'AUTO', description: 'Baterias automotivas', keywords: ['bateria', 'elétrica'] },
    { niche_code: 'CAR_WASH', niche_name: 'Lavagem', sector_code: 'AUTO', description: 'Lava-jatos', keywords: ['lavagem', 'lava-jato'] },
    { niche_code: 'ACCESSORIES', niche_name: 'Acessórios', sector_code: 'AUTO', description: 'Acessórios automotivos', keywords: ['acessório', 'customização'] },
    { niche_code: 'INSURANCE_AUTO', niche_name: 'Seguros Automotivos', sector_code: 'AUTO', description: 'Seguros de veículos', keywords: ['seguro', 'veículo'] },
    { niche_code: 'FINANCING_AUTO', niche_name: 'Financiamento', sector_code: 'AUTO', description: 'Financiamento de veículos', keywords: ['financiamento', 'crédito'] },
    { niche_code: 'RENTAL', niche_name: 'Locação', sector_code: 'AUTO', description: 'Aluguel de veículos', keywords: ['locação', 'aluguel'] },
    { niche_code: 'MOTORCYCLE', niche_name: 'Motocicletas', sector_code: 'AUTO', description: 'Motos e scooters', keywords: ['moto', 'motocicleta'] },
    { niche_code: 'TRUCKS', niche_name: 'Caminhões', sector_code: 'AUTO', description: 'Veículos comerciais', keywords: ['caminhão', 'comercial'] },
    { niche_code: 'ELECTRIC_VEHICLES', niche_name: 'Veículos Elétricos', sector_code: 'AUTO', description: 'Carros elétricos', keywords: ['elétrico', 'ev'] },
    { niche_code: 'AUTO_TECH', niche_name: 'AutoTech', sector_code: 'AUTO', description: 'Tecnologia automotiva', keywords: ['autotech', 'tecnologia'] },
    { niche_code: 'DIAGNOSTICS', niche_name: 'Diagnóstico', sector_code: 'AUTO', description: 'Diagnóstico eletrônico', keywords: ['diagnóstico', 'scanner'] },
    { niche_code: 'TUNING', niche_name: 'Tuning', sector_code: 'AUTO', description: 'Customização e tuning', keywords: ['tuning', 'customização'] },
    { niche_code: 'CLASSIC_CARS', niche_name: 'Clássicos', sector_code: 'AUTO', description: 'Carros antigos e clássicos', keywords: ['clássico', 'antigo'] },
  ];

  // Carregar dados do banco
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        let loadedSectors: Sector[] = [];
        let loadedNiches: Niche[] = [];
        
        try {
          console.log('[Step2SetoresNichos] 🔍 Buscando setores e nichos do banco...');
          
          // Tentar buscar setores (usar cast para evitar erro de tipo)
          const sectorsRes = await (supabase as any)
            .from('sectors')
            .select('sector_code, sector_name, description')
            .order('sector_name', { ascending: true });
          
          // Tentar buscar nichos (usar cast para evitar erro de tipo)
          const nichesRes = await (supabase as any)
            .from('niches')
            .select('niche_code, niche_name, sector_code, description, keywords, cnaes, ncms')
            .order('niche_name', { ascending: true });
          
          console.log('[Step2SetoresNichos] 📊 Resultado da busca:', {
            sectors: sectorsRes.data?.length || 0,
            niches: nichesRes.data?.length || 0,
            sectorsError: sectorsRes.error ? {
              message: sectorsRes.error.message,
              code: sectorsRes.error.code,
              details: sectorsRes.error.details,
              hint: sectorsRes.error.hint,
            } : null,
            nichesError: nichesRes.error ? {
              message: nichesRes.error.message,
              code: nichesRes.error.code,
              details: nichesRes.error.details,
              hint: nichesRes.error.hint,
            } : null,
          });
          
          // Se houver erro 404, pode ser problema de RLS ou PostgREST cache
          if (sectorsRes.error && sectorsRes.error.code === 'PGRST116') {
            console.error('[Step2SetoresNichos] ❌ ERRO 404: Tabela sectors não encontrada pelo PostgREST. Verifique:');
            console.error('  1. Se a tabela existe no banco (execute DIAGNOSTICO_RAPIDO.sql)');
            console.error('  2. Se as políticas RLS estão configuradas (execute GARANTIR_RLS_SETORES_NICHOS.sql)');
            console.error('  3. Se o schema "public" está exposto no Supabase Dashboard → Settings → API → Exposed schemas');
            console.error('  4. Se o projeto Supabase foi REINICIADO após criar as tabelas');
          }
          
          if (nichesRes.error && nichesRes.error.code === 'PGRST116') {
            console.error('[Step2SetoresNichos] ❌ ERRO 404: Tabela niches não encontrada pelo PostgREST. Verifique:');
            console.error('  1. Se a tabela existe no banco (execute DIAGNOSTICO_RAPIDO.sql)');
            console.error('  2. Se as políticas RLS estão configuradas (execute GARANTIR_RLS_SETORES_NICHOS.sql)');
            console.error('  3. Se o schema "public" está exposto no Supabase Dashboard → Settings → API → Exposed schemas');
            console.error('  4. Se o projeto Supabase foi REINICIADO após criar as tabelas');
          }
          
          if (sectorsRes.data?.length > 0) {
            loadedSectors = sectorsRes.data.map((s: any) => ({
              sector_code: s.sector_code,
              sector_name: s.sector_name,
              description: s.description || ''
            }));
            console.log('[Step2SetoresNichos] ✅ Setores carregados do banco:', loadedSectors.length);
          } else {
            console.warn('[Step2SetoresNichos] ⚠️ Nenhum setor encontrado no banco, usando fallback');
          }
          
          if (nichesRes.data && nichesRes.data.length > 0) {
            loadedNiches = nichesRes.data.map((n: any) => ({
              niche_code: n.niche_code,
              niche_name: n.niche_name,
              sector_code: n.sector_code,
              description: n.description || '',
              keywords: Array.isArray(n.keywords) ? n.keywords : [],
              cnaes: Array.isArray(n.cnaes) ? n.cnaes : [],
              ncms: Array.isArray(n.ncms) ? n.ncms : []
            }));
            console.log('[Step2SetoresNichos] ✅ Nichos carregados do banco:', loadedNiches.length);
            
            // Mostrar alguns exemplos de nichos por setor
            const nichesBySector = loadedNiches.reduce((acc: any, niche: any) => {
              acc[niche.sector_code] = (acc[niche.sector_code] || 0) + 1;
              return acc;
            }, {});
            console.log('[Step2SetoresNichos] 📊 Nichos por setor:', nichesBySector);
            
            // Mostrar alguns exemplos
            const sampleNiches = loadedNiches.slice(0, 10).map((n: any) => ({
              code: n.niche_code,
              name: n.niche_name,
              sector: n.sector_code
            }));
            console.log('[Step2SetoresNichos] 📝 Exemplos de nichos:', sampleNiches);
            
            // Verificar nichos do setor "manufatura" especificamente
            const manufaturaNiches = loadedNiches.filter((n: any) => n.sector_code === 'manufatura');
            console.log('[Step2SetoresNichos] 🔍 Nichos de manufatura encontrados:', manufaturaNiches.length);
            if (manufaturaNiches.length > 0) {
              console.log('[Step2SetoresNichos] 📋 Primeiros nichos de manufatura:', manufaturaNiches.slice(0, 5).map((n: any) => n.niche_name));
            }
          } else {
            console.warn('[Step2SetoresNichos] ⚠️ Nenhum nicho encontrado no banco');
            if (nichesRes.error) {
              console.error('[Step2SetoresNichos] ❌ Erro ao buscar nichos:', nichesRes.error);
            }
          }
        } catch (error) {
          console.error('[Step2SetoresNichos] ❌ Erro ao carregar:', error);
        }
        
        // Usar fallback se necessário
        const finalSectors = loadedSectors.length > 0 ? loadedSectors : FALLBACK_SECTORS;
        const finalNiches = loadedNiches.length > 0 ? loadedNiches : FALLBACK_NICHES;
        
        console.log('[Step2SetoresNichos] 📋 Dados finais:', {
          setores: finalSectors.length,
          nichos: finalNiches.length,
          usandoFallbackSetores: loadedSectors.length === 0,
          usandoFallbackNichos: loadedNiches.length === 0,
          setoresCodes: finalSectors.map(s => s.sector_code),
          nichosSectors: [...new Set(finalNiches.map(n => n.sector_code))],
        });
        
        // Verificar se há correspondência entre setores e nichos
        const setoresCodes = new Set(finalSectors.map(s => s.sector_code));
        const nichosSectors = new Set(finalNiches.map(n => n.sector_code));
        const setoresSemNichos = finalSectors.filter(s => !nichosSectors.has(s.sector_code));
        const nichosSemSetor = finalNiches.filter(n => !setoresCodes.has(n.sector_code));
        
        if (setoresSemNichos.length > 0) {
          console.warn('[Step2SetoresNichos] ⚠️ Setores sem nichos:', setoresSemNichos.map(s => s.sector_code));
        }
        if (nichosSemSetor.length > 0) {
          console.warn('[Step2SetoresNichos] ⚠️ Nichos sem setor correspondente:', nichosSemSetor.slice(0, 5).map(n => ({ code: n.niche_code, sector: n.sector_code })));
        }
        
        setSectors(finalSectors);
        setNiches(finalNiches);
        
        // Log final para debug
        console.log('[Step2SetoresNichos] 📋 Estado final após setState:', {
          setoresCount: finalSectors.length,
          nichosCount: finalNiches.length,
          setoresCodes: finalSectors.map(s => s.sector_code),
          nichosSectors: [...new Set(finalNiches.map(n => n.sector_code))],
          nichosParaManufatura: finalNiches.filter(n => n.sector_code === 'manufatura').length,
        });
      } catch (error) {
        console.error('[Step2SetoresNichos] Erro geral:', error);
        setSectors(FALLBACK_SECTORS);
        setNiches(FALLBACK_NICHES);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar nichos por setor específico (mesmo mecanismo que setores)
  const getNichesForSector = (sectorCode: string) => {
    // Combinar nichos do banco + customizados
    const allNiches = [...niches, ...customNiches];
    
    // Filtrar por sector_code (comparação exata)
    const filtered = allNiches.filter(n => {
      const matches = n.sector_code === sectorCode;
      if (!matches && n.sector_code && sectorCode) {
        // Log apenas para debug - remover depois
        console.log(`[Step2SetoresNichos] 🔍 Comparando: "${n.sector_code}" === "${sectorCode}" = ${matches}`);
      }
      return matches;
    });
    
    console.log(`[Step2SetoresNichos] 🔍 Nichos para setor "${sectorCode}":`, {
      totalNiches: niches.length,
      totalCustomNiches: customNiches.length,
      allNiches: allNiches.length,
      filteredCount: filtered.length,
      sectorCode: sectorCode,
      availableSectorCodes: [...new Set(allNiches.map(n => n.sector_code))],
      sampleNiches: filtered.slice(0, 5).map(n => ({ 
        code: n.niche_code, 
        name: n.niche_name, 
        sector: n.sector_code 
      })),
    });
    
    // Ordenar por nome
    return filtered.sort((a, b) => (a.niche_name || '').localeCompare(b.niche_name || ''));
  };
  
  // Calcular total de nichos selecionados
  const totalSelectedNiches = useMemo(() => {
    return Object.values(selectedNichesBySector).reduce((sum, niches) => sum + niches.length, 0);
  }, [selectedNichesBySector]);
  
  // Alerta inteligente: muitas seleções podem reduzir qualidade
  const showQualityWarning = useMemo(() => {
    return selectedSectors.length > 3 || totalSelectedNiches > 15;
  }, [selectedSectors.length, totalSelectedNiches]);

  // Toggle setor (múltiplas seleções)
  const toggleSector = (sectorCode: string) => {
    if (selectedSectors.includes(sectorCode)) {
      // Remover setor e seus nichos
      setSelectedSectors(selectedSectors.filter(s => s !== sectorCode));
      const updated = { ...selectedNichesBySector };
      delete updated[sectorCode];
      setSelectedNichesBySector(updated);
    } else {
      // Adicionar setor (sem nichos inicialmente)
      setSelectedSectors([...selectedSectors, sectorCode]);
      setSelectedNichesBySector({
        ...selectedNichesBySector,
        [sectorCode]: []
      });
    }
  };
  
  // Toggle nicho para um setor específico
  const toggleNicheForSector = (sectorCode: string, nicheCode: string) => {
    const currentNiches = selectedNichesBySector[sectorCode] || [];
    if (currentNiches.includes(nicheCode)) {
      setSelectedNichesBySector({
        ...selectedNichesBySector,
        [sectorCode]: currentNiches.filter(n => n !== nicheCode)
      });
    } else {
      setSelectedNichesBySector({
        ...selectedNichesBySector,
        [sectorCode]: [...currentNiches, nicheCode]
      });
    }
  };
  
  // Adicionar nicho customizado para um setor específico
  const handleAddCustomNiche = (sectorCode: string) => {
    const nicheName = newCustomNiche[sectorCode]?.trim();
    if (!nicheName) return;
    
    const newNiche: Niche = {
      niche_code: `CUSTOM_${sectorCode}_${Date.now()}`,
      niche_name: nicheName,
      sector_code: sectorCode,
      description: 'Nicho customizado pelo usuário',
      isCustom: true
    };
    
    setCustomNiches([...customNiches, newNiche]);
    toggleNicheForSector(sectorCode, newNiche.niche_code);
    setNewCustomNiche({ ...newCustomNiche, [sectorCode]: '' });
  };

  // 🆕 Adicionar setor customizado
  const handleAddCustomSector = () => {
    const sectorName = newCustomSector.trim();
    if (!sectorName) return;
    
    // Gerar código único para o setor
    const sectorCode = `CUSTOM_${Date.now()}`;
    
    const newSector: Sector = {
      sector_code: sectorCode,
      sector_name: sectorName,
      description: 'Setor customizado pelo usuário'
    };
    
    // Adicionar setor à lista
    setSectors(prev => [...prev, newSector]);
    
    // Selecionar automaticamente o novo setor
    toggleSector(sectorCode);
    
    // Limpar input
    setNewCustomSector('');
    
    console.log('[Step2] ✅ Setor customizado adicionado:', newSector);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSectors.length === 0) {
      alert('Selecione pelo menos um setor');
      return;
    }

    // 🔥 CRÍTICO: Salvar ANTES de avançar
    if (onSave) {
      try {
        await onSave();
      } catch (error) {
        console.error('[Step2] Erro ao salvar:', error);
        alert('Erro ao salvar dados. Tente novamente.');
        return;
      }
    }

    // Coletar todos os nichos selecionados (códigos) - APENAS dos setores selecionados
    const allSelectedNiches = Object.entries(selectedNichesBySector)
      .filter(([sectorCode]) => selectedSectors.includes(sectorCode)) // FILTRAR: só nichos dos setores selecionados
      .flatMap(([, nicheCodes]) => nicheCodes);
    
    console.log('[Step2] 🔍 Debug antes de passar:', {
      selectedSectors,
      selectedNichesBySector,
      allSelectedNiches,
      customNiches: customNiches.map(n => n.niche_code),
    });
    
    // Buscar nomes dos setores para passar para próxima etapa
    const sectorNames = selectedSectors.map(code => {
      const sector = sectors.find(s => s.sector_code === code);
      return sector?.sector_name || code;
    });
    
    // Buscar nomes dos nichos para passar para próxima etapa
    // Combinar nichos do banco + fallback + custom
    const allNichesData = [...niches, ...FALLBACK_NICHES, ...customNiches];
    const nicheNames = allSelectedNiches.map(code => {
      const niche = allNichesData.find(n => n.niche_code === code);
      const name = niche?.niche_name || code;
      console.log(`[Step2] 🔍 Nicho ${code} → ${name} (setor: ${niche?.sector_code})`);
      return name;
    });
    
    console.log('[Step2] 📤 Passando dados para Step3 (APENAS selecionados):', {
      setoresAlvo: sectorNames,
      nichosAlvo: nicheNames, // NOMES legíveis
      nichosAlvoCodes: allSelectedNiches, // Códigos para salvar no banco
      totalSetores: sectorNames.length,
      totalNichos: nicheNames.length,
      nichosDetalhados: allSelectedNiches.map((code, idx) => ({
        codigo: code,
        nome: nicheNames[idx],
        setor: allNichesData.find(n => n.niche_code === code)?.sector_code,
      })),
    });
    
    onNext({
      sectorAtual: selectedSectors[0], // Primeiro setor como principal (compatibilidade)
      setoresAlvo: sectorNames, // TODOS os setores selecionados (NOMES)
      nichosAlvo: nicheNames, // TODOS os nichos selecionados (NOMES legíveis)
      nichosAlvoCodes: allSelectedNiches, // Códigos para salvar no banco
      nichosBySector: Object.fromEntries(
        Object.entries(selectedNichesBySector).filter(([sectorCode]) => 
          selectedSectors.includes(sectorCode)
        )
      ), // Manter estrutura por setor (APENAS setores selecionados)
      customNiches: customNiches.filter(n => allSelectedNiches.includes(n.niche_code)),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          Setores e Nichos
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Defina o setor da sua empresa e os nichos que você quer prospectar
        </CardDescription>
      </div>

      {/* CARD 1: Setores (MÚLTIPLAS SELEÇÕES) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Setores que Você Quer Prospectar *</CardTitle>
          <CardDescription className="text-muted-foreground">
            Selecione um ou mais setores onde você quer encontrar clientes potenciais
            {selectedSectors.length > 0 && ` (${selectedSectors.length} selecionado${selectedSectors.length > 1 ? 's' : ''})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropdown de Setores */}
          <Popover open={sectorsDropdownOpen} onOpenChange={setSectorsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                Selecionar setores...
                <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <Command shouldFilter={true}>
                <CommandInput placeholder="Digite para buscar setor..." className="h-9" />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm">
                      <p className="text-muted-foreground mb-2">Nenhum setor encontrado.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const customSector = prompt('Digite o nome do setor:');
                          if (customSector && customSector.trim()) {
                            // Adicionar setor customizado
                            const newSector: Sector = {
                              sector_code: `CUSTOM_${Date.now()}`,
                              sector_name: customSector.trim(),
                              description: 'Setor customizado pelo usuário'
                            };
                            setSectors([...sectors, newSector]);
                            toggleSector(newSector.sector_code);
                            setSectorsDropdownOpen(false);
                          }
                        }}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Setor Customizado
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {sectors.map((sector) => (
                      <CommandItem
                        key={sector.sector_code}
                        value={sector.sector_name}
                        onSelect={() => {
                          toggleSector(sector.sector_code);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSectors.includes(sector.sector_code) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="text-foreground">{sector.sector_name}</span>
                          {sector.description && (
                            <span className="text-xs text-muted-foreground">{sector.description}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Setores Selecionados */}
          {selectedSectors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Setores Selecionados:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSectors.map((sectorCode) => {
                  const sector = sectors.find(s => s.sector_code === sectorCode);
                  if (!sector) return null;
                  return (
                    <Badge
                      key={sectorCode}
                      variant="secondary"
                      className={cn(
                        "text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20",
                        sectorCode.startsWith('CUSTOM_') && "bg-primary/20 border-primary"
                      )}
                      onClick={() => toggleSector(sectorCode)}
                    >
                      {sector.sector_name}
                      {sectorCode.startsWith('CUSTOM_') && <span className="ml-1 text-xs opacity-60">(custom)</span>}
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🆕 Adicionar Setor Customizado */}
          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Input
              placeholder="Adicionar setor customizado..."
              value={newCustomSector}
              onChange={(e) => setNewCustomSector(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSector();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddCustomSector}
              disabled={!newCustomSector.trim()}
              size="icon"
              variant="outline"
              title="Adicionar setor customizado"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ALERTA DE QUALIDADE */}
      {showQualityWarning && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Atenção: Muitas Seleções Podem Reduzir a Qualidade da Busca
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Você selecionou <strong>{selectedSectors.length} setor{selectedSectors.length > 1 ? 'es' : ''}</strong> e <strong>{totalSelectedNiches} nicho{totalSelectedNiches > 1 ? 's' : ''}</strong>.
                  Muitas seleções ampliam muito o escopo da busca e podem reduzir a assertividade dos resultados.
                  <br />
                  <strong>Recomendação:</strong> Foque em 2-3 setores principais e selecione nichos específicos dentro deles para obter resultados mais refinados e assertivos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CARD 2: Nichos por Setor (Dropdown Separado para Cada Setor) */}
      {selectedSectors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Nichos por Setor *</CardTitle>
            <CardDescription className="text-muted-foreground">
              Para cada setor selecionado, escolha os nichos específicos que você quer prospectar
              {totalSelectedNiches > 0 && ` (${totalSelectedNiches} nicho${totalSelectedNiches > 1 ? 's' : ''} selecionado${totalSelectedNiches > 1 ? 's' : ''} no total)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedSectors.map((sectorCode) => {
              const sector = sectors.find(s => s.sector_code === sectorCode);
              if (!sector) return null;
              
              const sectorNiches = getNichesForSector(sectorCode);
              const selectedNichesForSector = selectedNichesBySector[sectorCode] || [];
              const isOpen = nichesDropdownsOpen[sectorCode] || false;
              
              return (
                <div key={sectorCode} className="space-y-3 p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{sector.sector_name}</h4>
                      {sector.description && (
                        <p className="text-xs text-muted-foreground mt-1">{sector.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedNichesForSector.length} nicho{selectedNichesForSector.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {/* Dropdown de Nichos para Este Setor */}
                  <Popover open={isOpen} onOpenChange={(open) => {
                    setNichesDropdownsOpen({ ...nichesDropdownsOpen, [sectorCode]: open });
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        Selecionar nichos de {sector.sector_name}...
                        <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                      <Command shouldFilter={true}>
                        <CommandInput placeholder={`Digite para buscar nichos de ${sector.sector_name}...`} className="h-9" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>
                            <div className="py-6 text-center text-sm">
                              <p className="text-muted-foreground mb-2">Nenhum nicho encontrado para {sector.sector_name}.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const customNiche = prompt(`Digite o nome do nicho para ${sector.sector_name}:`);
                                  if (customNiche && customNiche.trim()) {
                                    setNewCustomNiche({ ...newCustomNiche, [sector.sector_code]: customNiche.trim() });
                                    setTimeout(() => {
                                      handleAddCustomNiche(sector.sector_code);
                                    }, 100);
                                  }
                                }}
                                className="mt-2"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar Nicho Customizado
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {sectorNiches.map((niche) => (
                              <CommandItem
                                key={niche.niche_code}
                                value={niche.niche_name}
                                onSelect={() => {
                                  toggleNicheForSector(sectorCode, niche.niche_code);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedNichesForSector.includes(niche.niche_code) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1">
                                  <span className="text-foreground">{niche.niche_name}</span>
                                  {niche.description && (
                                    <span className="text-xs text-muted-foreground">{niche.description}</span>
                                  )}
                                  {niche.isCustom && (
                                    <Badge variant="secondary" className="mt-1 w-fit text-xs">Customizado</Badge>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Nichos Selecionados para Este Setor */}
                  {selectedNichesForSector.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedNichesForSector.map((nicheCode) => {
                        const niche = sectorNiches.find(n => n.niche_code === nicheCode);
                        if (!niche) return null;
                        return (
                          <Badge
                            key={nicheCode}
                            variant="secondary"
                            className="text-sm px-3 py-1 cursor-pointer hover:bg-destructive/20"
                            onClick={() => toggleNicheForSector(sectorCode, nicheCode)}
                          >
                            {niche.niche_name}
                            <X className="ml-2 h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Adicionar Nicho Customizado para Este Setor */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Input
                      placeholder={`Adicionar nicho customizado para ${sector.sector_name}...`}
                      value={newCustomNiche[sectorCode] || ''}
                      onChange={(e) => {
                        setNewCustomNiche({ ...newCustomNiche, [sectorCode]: e.target.value });
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomNiche(sectorCode);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddCustomNiche(sectorCode)}
                      disabled={!newCustomNiche[sectorCode]?.trim()}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={onBack}
        onNext={() => {}}
        onSave={onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        nextLabel="Próximo"
        isSubmit={true}
      />
    </form>
  );
}
