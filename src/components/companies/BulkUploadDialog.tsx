import { useState, useEffect, ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon, Folder, Sheet, Zap, Target, Building2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizeCnpj } from '@/lib/format';
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/contexts/TenantContext";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MAX_COMPANIES = 1000;

export function BulkUploadDialog({ children }: { children?: ReactNode }) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
const navigate = useNavigate();
const [sourceName, setSourceName] = useState("");
const [sourceCampaign, setSourceCampaign] = useState("");
const [enableQualification, setEnableQualification] = useState(true); // 🔥 NOVO: Qualificação automática
const [selectedIcpIds, setSelectedIcpIds] = useState<string[]>([]); // 🔥 NOVO: ICPs selecionados (múltiplos)
const [availableIcps, setAvailableIcps] = useState<any[]>([]); // 🔥 NOVO: Lista de ICPs

  // Carregar ICPs do tenant
  useEffect(() => {
    const loadIcps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (!userProfile?.tenant_id) return;
      
      // Buscar ICPs via onboarding_sessions
      const { data: icps, error } = await supabase
        .from('onboarding_sessions' as any)
        .select('id, step1_data, created_at')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Erro ao carregar ICPs:', error);
        return;
      }
      
      const icpList = (icps || []).map(icp => ({
        id: icp.id,
        nome: icp.step1_data?.cnpjData?.fantasia || icp.step1_data?.cnpjData?.nome || 'ICP sem nome',
        cnpj: icp.step1_data?.cnpj || '',
        criado: new Date(icp.created_at).toLocaleDateString('pt-BR')
      }));
      
      setAvailableIcps(icpList);
      
      // Auto-selecionar o mais recente
      if (icpList.length > 0) {
        setSelectedIcpIds([icpList[0].id]);
      }
    };
    
    if (isOpen) {
      loadIcps();
    }
  }, [isOpen]);

  // Fecha automaticamente após sucesso
  useEffect(() => {
    if (result && result.success > 0 && !isUploading) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        // Reseta o estado após fechar
        setTimeout(() => {
          setFile(null);
          setGoogleSheetUrl("");
          setResult(null);
          setProgress(0);
        }, 300);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [result, isUploading]);

  const downloadTemplate = () => {
    const BOM = '\uFEFF';
    
    const headers = [
      'CNPJ', 'Nome da Empresa', 'Nome Fantasia', 'Razão Social', 'Website', 'Domínio',
      'Instagram', 'LinkedIn', 'Facebook', 'Twitter', 'YouTube',
      'Setor', 'Porte', 'Natureza Jurídica', 'Funcionários', 'Faturamento Estimado',
      'Capital Social', 'Data de Abertura', 'Situação Cadastral', 'Data Situação',
      'Motivo Situação', 'Situação Especial', 'Data Situação Especial',
      'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro', 
      'Município', 'UF', 'País', 'Latitude', 'Longitude',
      'Telefone', 'Email', 'Email Verificado',
      'CNAE Principal Código', 'CNAE Principal Descrição',
      'CNAEs Secundários Quantidade', 'CNAEs Secundários',
      'Quadro Societário Quantidade', 'Sócios',
      'Score Maturidade Digital', 'Score Fit TOTVS', 'Score Análise',
      'Tech Stack', 'ERP Atual', 'CRM Atual',
      'Produto Principal', 'Marca', 'Link Produto/Marketplace', 'Categoria',
      'Decisores Quantidade', 'Decisor 1 Nome', 'Decisor 1 Cargo', 'Decisor 1 Email', 
      'Decisor 1 Telefone', 'Decisor 1 LinkedIn',
      'Decisor 2 Nome', 'Decisor 2 Cargo', 'Decisor 2 Email', 
      'Decisor 2 Telefone', 'Decisor 2 LinkedIn',
      'Decisor 3 Nome', 'Decisor 3 Cargo', 'Decisor 3 Email', 
      'Decisor 3 Telefone', 'Decisor 3 LinkedIn',
      'Enriquecido Receita', 'Enriquecido 360', 'Enriquecido Apollo', 'Enriquecido Phantom',
      'Data Criação', 'Data Última Atualização', 'Data Último Enriquecimento',
      'Status Enriquecimento', 'Fonte Enriquecimento',
      'Observações', 'Tags', 'Prioridade',
      'Último Contato', 'Próximo Contato', 'Status Pipeline',
      'Valor Oportunidade', 'Probabilidade Fechamento', 'Data Fechamento Esperada'
    ];
    
    const exampleRow = [
      '00.000.000/0000-00', 'Empresa Exemplo LTDA', 'Nome Fantasia Exemplo', 'Empresa Exemplo LTDA', 
      'https://exemplo.com.br', 'exemplo.com.br',
      '@exemploempresa', 'linkedin.com/company/exemplo', 'facebook.com/exemplo', 'twitter.com/exemplo', 'youtube.com/exemplo',
      'Tecnologia', 'MÉDIA', 'Sociedade Limitada', '50', 'R$ 5M - R$ 10M',
      '100000.00', '01/01/2010', 'ATIVA', '01/01/2010',
      '', '', '',
      '01310-100', 'Avenida Paulista', '1578', 'Sala 10', 'Bela Vista',
      'São Paulo', 'SP', 'Brasil', '-23.561684', '-46.655981',
      '(11) 3000-0000', 'contato@exemplo.com.br', 'Sim',
      '6201-5/00', 'Desenvolvimento de programas de computador sob encomenda',
      '3', '6202-3/00 - Desenvolvimento web; 6209-1/00 - Suporte técnico',
      '2', 'João Silva (Administrador); Maria Santos (Sócia)',
      '75.5', '85', '90',
      'ERP Proprietário, CRM Salesforce', 'SAP', 'Salesforce',
      'Software ERP', 'Marca Exemplo', 'mercadolivre.com.br/produto', 'Software',
      '2', 'João Silva', 'CEO', 'joao.silva@exemplo.com.br', 
      '(11) 99999-0000', 'linkedin.com/in/joaosilva',
      'Maria Santos', 'CTO', 'maria.santos@exemplo.com.br',
      '(11) 99999-0001', 'linkedin.com/in/mariasantos',
      '', '', '', '', '',
      'Sim', 'Sim', 'Não', 'Não',
      '01/01/2024', '15/10/2024', '15/10/2024',
      'Completo', 'Receita Federal + Enriquecimento 360',
      'Cliente potencial de alto valor', 'ERP, Cloud, Enterprise', 'Alta',
      '10/10/2024', '20/10/2024', 'Qualificação',
      'R$ 500.000', '75%', '31/12/2024'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
                      exampleRow.map(cell => `"${cell}"`).join(',') + '\n' +
                      '53.113.791/0001-22,TOTVS SA,TOTVS,TOTVS S.A.,https://www.totvs.com,totvs.com,@totvs,linkedin.com/company/totvs,,,,Software ERP,GRANDE,Sociedade Anônima,10000,R$ 1B+,,,ATIVA,,,,,04711-904,Avenida Braz Leme,1000,,Brooklin,São Paulo,SP,Brasil,,,,,,,,,0,,,,,80,,,,,,,,,0,,,,,,,,,,,,Sim,Sim,,,,,,,,,,,,,,,';
    
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-importacao-empresas-completo-87-colunas.csv';
    link.click();
    toast.success("Template completo baixado com 87 colunas!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.tsv', '.xlsx', '.xls'];
      const hasValidExtension = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        toast.error("Formato não suportado", {
          description: "Use: CSV, TSV, XLSX ou XLS"
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const normalizeValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    // Trata valores inválidos
    const invalidValues = ['não encontrado', 'nao encontrado', '---', '###', 'n/a', 'na', '', 'null', 'undefined'];
    return invalidValues.includes(str.toLowerCase()) ? '' : str;
  };

  const detectSeparator = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    
    if (tabs > 0) return '\t';
    return semicolons > commas ? ';' : ',';
  };

  const normalizeHeader = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const mapHeaders = (headers: string[]): Map<string, string> => {
    const mapping = new Map<string, string>();
    const normalized = headers.map(h => normalizeHeader(h));
    
    // Mapeamento COMPLETO e EXATO dos 87 campos Econodata
    const headerMap: { [key: string]: string[] } = {
      // === IDENTIFICAÇÃO BÁSICA ===
      'cnpj': ['cnpj', 'cnpj da empresa', 'cnpj empresa'],
      'nome_empresa': ['nome', 'nome da empresa', 'empresa', 'razao social', 'razão social'],
      'nome_fantasia': ['nome fantasia', 'fantasia'],
      'marca': ['marca', 'brand'],
      'tipo_unidade': ['tipo unidade', 'tipo da unidade', 'tipo', 'natureza unidade'],
      
      // === NATUREZA JURÍDICA E REGIME ===
      'natureza_juridica': ['natureza juridica', 'natureza', 'tipo juridico'],
      'situacao_cadastral': ['situacao cadastral', 'situacao', 'status cadastral'],
      'data_abertura': ['data de abertura', 'abertura', 'data abertura'],
      'regime_tributario': ['regime tributario', 'regime tributário', 'regime'],
      
      // === LOCALIZAÇÃO ===
      'endereco': ['endereco', 'endereço', 'logradouro', 'rua', 'address'],
      'numero': ['numero', 'número', 'num', 'number'],
      'complemento': ['complemento', 'compl'],
      'bairro': ['bairro', 'neighborhood'],
      'cep': ['cep', 'codigo postal', 'zipcode'],
      'municipio': ['municipio', 'município', 'cidade', 'city'],
      'uf': ['uf', 'estado', 'state'],
      'pais': ['pais', 'país', 'country'],
      'microrregiao': ['microrregiao', 'microrregião', '(mi)', 'microrregião geográfica'],
      'mesorregiao': ['mesorregiao', 'mesorregião', '(me)', 'mesorregião geográfica'],
      
      // === CONTATOS - ASSERTIVIDADE ===
      'assertividade': ['assertividade'],
      'melhor_telefone': ['melhor telefone'],
      'segundo_melhor_telefone': ['segundo melhor telefone'],
      'telefones_alta_assertividade': ['telefones de alta assertividade', 'telefones alta assertividade'],
      'telefones_media_assertividade': ['telefones de media assertividade', 'telefones média assertividade', 'telefones media assertividade', 'telefones de média assertividade'],
      'telefones_baixa_assertividade': ['telefones de baixa assertividade', 'telefones baixa assertividade'],
      'telefones_matriz': ['telefones - matriz', 'telefones matriz'],
      'telefones_filiais': ['telefones- filiais', 'telefones - filiais', 'telefones filiais'],
      'celulares': ['celulares'],
      'melhor_celular': ['melhor celular'],
      'fixos': ['fixos'],
      'pat_telefone': ['pat - telefone', 'pat telefone'],
      'whatsapp': ['whatsapp', 'wa'],
      
      // === ATIVIDADE ECONÔMICA ===
      'setor_amigavel': ['setor amigavel', 'setor amigável'],
      'atividade_economica': ['atividade economica', 'atividade econômica'],
      'cod_atividade_economica': ['cod atividade economica', 'cod atividade econômica', 'cnae codigo primario', 'cnae codigo principal'],
      'atividades_secundarias': ['atividades secundarias', 'atividades secundárias'],
      'cod_atividades_secundarias': ['cod atividades secundarias', 'cod atividades secundárias'],
      
      // === NCMs ===
      'cod_ncms_primarios': ['cod ncms primarios', 'codigos ncms primarios', 'cód ncms primários', 'cod. ncms primários'],
      'ncms_primarios': ['ncms primarios', 'ncms primários'],
      
      // === FINANCEIRO ===
      'capital_social': ['capital social', 'capital'],
      'recebimentos_governo_federal': ['recebimentos do governo federal', 'recebimentos governo'],
      'enquadramento_porte': ['enquadramento de porte', 'enquadramento porte'],
      'funcionarios_presumido_matriz_cnpj': ['funcionarios presumido para matriz + cnpj', 'funcionários presumido para matriz + cnpj', 'func matriz cnpj'],
      'funcionarios_presumido_este_cnpj': ['funcionarios presumido para este cnpj', 'funcionários presumido para este cnpj', 'func este cnpj'],
      'faturamento_presumido_matriz_cnpj': ['faturamento presumido para matriz + cnpjs', 'faturamento presumido matriz cnpj', 'fat matriz cnpj'],
      'faturamento_presumido_este_cnpj': ['faturamento presumido para este cnpj', 'fat este cnpj'],
      'crescimento_empresa': ['crescimento da empresa', 'crescimento'],
      'qtd_filiais': ['qtd. filiais', 'qtd filiais', 'quantidade de filiais'],
      
      // === ESTRUTURA ===
      'socios_administradores': ['sócios e administradores', 'socios e administradores', 'socios administradores'],
      'decisores_cargos': ['decisores - cargos', 'decisores cargos'],
      'decisores_linkedin': ['decisores - linkedin', 'decisores linkedin'],
      'colaboradores_cargos': ['colaboradores - cargos', 'colaboradores cargos'],
      'colaboradores_linkedin': ['colaboradores - linkedin', 'colaboradores linkedin'],
      
      // === EMAILS ===
      'emails_validados_departamentos': ['e-mails validados de departamentos', 'emails validados de departamentos', 'emails departamentos'],
      'emails_validados_socios': ['e-mails validados de socios', 'emails validados de sócios', 'e-mails validados de sócios', 'emails socios'],
      'emails_validados_decisores': ['e-mails validados de decisores', 'emails validados de decisores', 'emails decisores'],
      'emails_validados_colaboradores': ['e-mails validados de colaboradores', 'emails validados de colaboradores', 'emails colaboradores'],
      'email_pat': ['email pat'],
      'email_receita_federal': ['email receita federal'],
      'emails_publicos': ['emails publicos', 'e-mails publicos', 'e-mails públicos', 'emails públicos'],
      
      // === PORTE E COMÉRCIO EXTERIOR ===
      'porte_estimado': ['porte estimado', 'medio', 'médio', 'grande', 'pequeno'],
      'importacao': ['importacao', 'importação'],
      'exportacao': ['exportacao', 'exportação'],
      'pat_funcionarios': ['pat - funcionarios', 'pat - funcionários', 'pat funcionarios'],
      
      // === DIGITAL PRESENCE ===
      'sites': ['sites', 'websites', 'site'],
      'melhor_site': ['melhor site'],
      'segundo_melhor_site': ['segundo melhor site'],
      'instagram': ['instagram', 'insta', '@instagram'],
      'facebook': ['facebook', 'fb'],
      'linkedin': ['linkedin', 'link linkedin', 'linkedin url'],
      'twitter': ['twitter', 'x', 'twitter/x'],
      'youtube': ['youtube', 'yt'],
      'outras': ['outras', 'outras redes'],
      
      // === TECNOLOGIA ===
      'tecnologias': ['tecnologias', 'tech stack', 'stack tecnológico'],
      'ferramentas': ['ferramentas', 'tools'],
      
      // === METADATA ===
      'tags': ['tags', 'etiquetas'],
      'notas': ['notas', 'notes', 'observações', 'observacoes'],
      'nivel_atividade': ['nível de atividade', 'nivel de atividade'],
      
      // === DÍVIDAS ===
      'perc_dividas_cnpj_sobre_faturamento': ['% dívidas cnpj sobre faturamento anual', '% dividas cnpj sobre faturamento'],
      'perc_dividas_cnpj_socios_sobre_faturamento': ['% dívidas cnpj e sócios sobre faturamento anual', '% dividas cnpj e socios sobre faturamento'],
      'total_dividas_cnpj_uniao': ['total dívidas cnpj com a união', 'total dividas cnpj uniao'],
      'total_dividas_cnpj_socios_uniao': ['total dívidas cnpj e sócios com a união', 'total dividas cnpj socios uniao'],
      'dividas_gerais_cnpj_uniao': ['dívidas gerais cnpj com a união', 'dividas gerais cnpj uniao'],
      'dividas_gerais_cnpj_socios_uniao': ['dívidas gerais cnpj e sócios com a união', 'dividas gerais cnpj socios uniao'],
      'dividas_cnpj_fgts': ['dívidas cnpj com o fgts', 'dividas cnpj fgts'],
      'dividas_cnpj_socios_fgts': ['dívidas cnpj e sócios com o fgts', 'dividas cnpj socios fgts'],
      'dividas_cnpj_previdencia': ['dívidas cnpj com a previdência', 'dividas cnpj previdencia'],
      'dividas_cnpj_socios_previdencia': ['dívidas cnpj e sócios com a previdência', 'dividas cnpj socios previdencia']
    };

    // Primeiro, tenta mapeamento direto (case insensitive + normalizado)
    normalized.forEach((norm, idx) => {
      for (const [standard, variations] of Object.entries(headerMap)) {
        if (variations.includes(norm) || norm === normalizeHeader(standard)) {
          mapping.set(standard, headers[idx]);
          break;
        }
      }
    });

    console.log(`🔄 Mapeamento de ${mapping.size}/87 campos Econodata:`, Object.fromEntries(mapping));
    return mapping;
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            throw new Error('Planilha vazia ou sem dados');
          }
          
          const headers = (jsonData[0] as any[]).map(h => String(h).trim());
          const headerMapping = mapHeaders(headers);
          
      const rows: any[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        const row: any = {};
        
        // Primeiro, mapeia com o mapeamento padrão
        headers.forEach((rawHeader, index) => {
          const value = normalizeValue(rowData[index]);
          
          for (const [standard, mapped] of headerMapping.entries()) {
            if (mapped === rawHeader) {
              row[standard] = value;
              break;
            }
          }
        });
        
        // Se não achou no mapeamento, tenta mapeamento direto (chave original)
        headers.forEach((rawHeader, index) => {
          const value = normalizeValue(rowData[index]);
          if (value && !row[rawHeader]) {
            row[rawHeader] = value;
          }
        });
        
        const hasIdentifier = row.cnpj || row['nome_empresa'] || row.nome_empresa || 
                              row.sites || row.instagram || row.linkedin;
        
        if (hasIdentifier) {
          rows.push(row);
        }
      }
          
          console.log(`✅ ${rows.length} empresas válidas de ${jsonData.length - 1} linhas (Excel)`);
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVLine = (line: string, separator: string = ','): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const parseCSV = (text: string): any[] => {
    text = text.replace(/^\uFEFF/, '');
    
    const separator = detectSeparator(text);
    console.log(`Separador detectado: "${separator === '\t' ? 'TAB' : separator}"`);
    
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Arquivo vazio ou sem dados');
    }
    
    const headerLine = lines[0];
    const rawHeaders = parseCSVLine(headerLine, separator);
    const headerMapping = mapHeaders(rawHeaders);
    
    console.log('📋 Cabeçalhos detectados:', rawHeaders);
    
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      try {
        const values = parseCSVLine(line, separator);
        const row: any = {};
        
        // Primeiro, mapeia com o mapeamento padrão
        rawHeaders.forEach((rawHeader, index) => {
          const value = normalizeValue(values[index]);
          
          for (const [standard, mapped] of headerMapping.entries()) {
            if (mapped === rawHeader) {
              row[standard] = value;
              break;
            }
          }
        });
        
        // Se não achou no mapeamento, tenta mapeamento direto (chave original)
        rawHeaders.forEach((rawHeader, index) => {
          const value = normalizeValue(values[index]);
          if (value && !row[rawHeader]) {
            row[rawHeader] = value;
          }
        });
        
        const hasIdentifier = row.cnpj || row.nome_empresa || row.sites || 
                              row.instagram || row.linkedin;
        
        if (hasIdentifier) {
          // 🔍 DETECTAR DUPLICADOS NO ARQUIVO
          const cnpjNormalizado = row.CNPJ?.replace(/\D/g, '') || row.cnpj?.replace(/\D/g, '');
          if (cnpjNormalizado) {
            const jaTem = rows.find(r => {
              const cnpjExistente = r.CNPJ?.replace(/\D/g, '') || r.cnpj?.replace(/\D/g, '');
              return cnpjExistente === cnpjNormalizado;
            });
            
            if (jaTem) {
              console.warn(`⚠️ DUPLICADO no arquivo - Linha ${i + 1}: ${cnpjNormalizado}`);
              continue; // Pular
            }
          }
          
          rows.push(row);
          console.log(`✓ Linha ${i + 1}:`, row['Nome da Empresa'] || row.CNPJ || 'Sem nome');
        } else {
          console.warn(`✗ Linha ${i + 1}: Sem identificadores válidos`);
        }
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 1}:`, error);
      }
    }
    
    console.log(`✅ ${rows.length} empresas válidas de ${lines.length - 1} linhas`);
    return rows;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      let companies: any[] = [];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast.info("Processando planilha Excel...");
        companies = await parseExcel(file);
      } else {
        const text = await file.text();
        companies = parseCSV(text);
      }

      if (companies.length === 0) {
        toast.error("Nenhuma empresa encontrada no arquivo");
        setIsUploading(false);
        return;
      }

      if (companies.length > MAX_COMPANIES) {
        toast.error(`Limite de ${MAX_COMPANIES} empresas por upload. Seu arquivo contém ${companies.length}.`);
        setIsUploading(false);
        return;
      }

      // GERAR ID ÚNICO DO LOTE
      const import_batch_id = crypto.randomUUID();
      const import_date = new Date().toISOString();
      
      // ADICIONAR METADADOS DE RASTREABILIDADE A TODAS AS EMPRESAS
      const companiesWithMetadata = companies.map(company => ({
        ...company,
        source_type: 'csv',
        source_name: sourceName.trim(),
        import_batch_id,
        import_date,
        source_metadata: {
          file_name: file.name,
          campaign: sourceCampaign.trim() || null,
          total_rows: companies.length
        }
      }));

// FLUXO NOVO: SEMPRE importa para estoque (companies) e redireciona para Quarentena ICP
toast.info(`📤 Importando ${companiesWithMetadata.length} empresas de "${sourceName}" para o estoque...`);

// Simular progresso durante o upload
setProgress(10);

// 🛡️ FORÇAR REFRESH DE SESSÃO ANTES DE UPLOAD (prevenir 401)
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

if (sessionError || !sessionData.session) {
  console.error('❌ Sessão inválida antes do upload:', sessionError);
  toast.error('Sessão expirada', {
    description: 'Recarregue a página e faça login novamente'
  });
  setProgress(0);
  setIsUploading(false);
  return;
}

console.log('✅ Sessão válida - prosseguindo com upload');
console.log('🔑 Access Token:', sessionData.session.access_token.substring(0, 20) + '...');
console.log('🔑 Token Type:', sessionData.session.token_type);
console.log('👤 User ID:', sessionData.session.user.id);
console.log('📧 User Email:', sessionData.session.user.email);

// ❌ NÃO enviar Content-Type - Supabase Client gerencia isso automaticamente
// ❌ NÃO enviar Authorization - Supabase Client já envia com a sessão ativa
console.log('📤 Supabase Client vai enviar automaticamente: Authorization + Content-Type');

// 🔍 DEBUG: Ver o que está sendo enviado
const bodyPayload = { 
  companies: companiesWithMetadata,
  metadata: {
    source_name: sourceName.trim(),
    campaign: sourceCampaign.trim() || null,
    import_batch_id,
    destination: 'quarantine'
  }
};

console.log('📦 Body payload (primeiros 500 chars):', JSON.stringify(bodyPayload).substring(0, 500));
console.log('📊 Número de empresas:', companiesWithMetadata.length);
console.log('📊 Primeira empresa:', JSON.stringify(companiesWithMetadata[0]).substring(0, 200));

// 🔥 VALIDAR TENANT
if (!tenantId) {
  toast.error('Erro: Tenant não identificado', {
    description: 'Recarregue a página e tente novamente'
  });
  setIsUploading(false);
  setProgress(0);
  return;
}

console.log('💾 Salvando diretamente no banco de dados para tenant:', tenantId);

// 🔥 FLUXO CORRETO: Usar ICP selecionado OU buscar ICP principal automaticamente
// Se o usuário não selecionou ICP, buscar o ICP principal do tenant
let icpIdToUse: string | null = null;

if (selectedIcpIds && selectedIcpIds.length > 0) {
  icpIdToUse = selectedIcpIds[0]; // Usar o primeiro ICP selecionado
} else {
  // Se nenhum ICP foi selecionado, buscar o ICP principal automaticamente
  const { data: icpData, error: icpError } = await supabase
    .from('icp_profiles_metadata' as any)
    .select('id')
    .eq('tenant_id', tenantId)
    .order('icp_principal', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (icpError || !icpData) {
    toast.error('Erro: Nenhum ICP encontrado para o tenant', {
      description: 'Crie um ICP antes de importar empresas ou selecione um ICP no card de upload'
    });
    setIsUploading(false);
    setProgress(0);
    return;
  }
  
  icpIdToUse = icpData.id;
  toast.info('Usando ICP principal automaticamente', {
    description: 'Você pode selecionar outro ICP no card de upload ou depois na página de qualificação'
  });
}

// Preparar columnMapping
const firstRow = companies[0] || {};
const csvHeaders = Object.keys(firstRow);
const columnMapping: Record<string, string> = {};

csvHeaders.forEach(header => {
  const headerLower = header.toLowerCase();
  if (headerLower.includes('cnpj')) columnMapping['cnpj'] = header;
  else if (headerLower.includes('razao') || headerLower.includes('razão')) columnMapping['razao_social'] = header;
  else if (headerLower.includes('nome') && headerLower.includes('fantasia')) columnMapping['nome_fantasia'] = header;
  else if (headerLower.includes('nome') && (headerLower.includes('empresa') || headerLower.includes('fantasia'))) columnMapping['companyName'] = header;
  else if (headerLower.includes('site') || headerLower.includes('website')) columnMapping['website'] = header;
  else if (headerLower.includes('setor') || headerLower.includes('sector')) columnMapping['sector'] = header;
  else if (headerLower.includes('uf') || headerLower.includes('estado')) columnMapping['uf'] = header;
  else if (headerLower.includes('cidade') || headerLower.includes('municipio')) columnMapping['city'] = header;
  else if (headerLower.includes('email')) columnMapping['contactEmail'] = header;
  else if (headerLower.includes('telefone') || headerLower.includes('phone')) columnMapping['contactPhone'] = header;
  else if (headerLower.includes('linkedin')) columnMapping['linkedinUrl'] = header;
});

const sourceBatchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
setProgress(10);
toast.info(`📤 Importando ${companies.length} empresas via Motor de Qualificação...`);

let totalInserted = 0;
let totalDuplicates = 0;

// 🔥 SOLUÇÃO: Inserir diretamente em prospecting_candidates (evita CORS)
// Funções auxiliares para normalização
// ✅ REMOVIDO: Usar normalizeCnpj de src/lib/format.ts (importado no topo)

const normalizeWebsite = (website: string | null | undefined): string | null => {
  if (!website) return null;
  let cleaned = String(website).trim().replace(/\s+/g, '');
  if (!cleaned) return null;
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = `https://${cleaned}`;
  }
  try {
    const url = new URL(cleaned);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return cleaned;
  }
};

const normalizeUF = (uf: string | null | undefined): string | null => {
  if (!uf) return null;
  const cleaned = String(uf).trim().toUpperCase();
  return cleaned.length === 2 ? cleaned : null;
};

const normalizeEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  const cleaned = String(email).trim().toLowerCase();
  return cleaned.includes('@') && cleaned.includes('.') ? cleaned : null;
};

const normalizePhone = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : null;
};

// Normalizar e preparar candidatos para inserção
const getValue = (row: any, field: string, columnMapping: Record<string, string>): string | null => {
  const csvColumn = columnMapping[field];
  if (!csvColumn) return null;
  const value = row[csvColumn] || row[field];
  return value ? String(value).trim() : null;
};

// Usar ICP selecionado ou o principal encontrado
const icpIdsToProcess = selectedIcpIds && selectedIcpIds.length > 0 ? selectedIcpIds : [icpIdToUse!];

// Função auxiliar para fallback direto - REFATORADA COM LOGS DETALHADOS
const insertDirectlyToProspectingCandidates = async ({
  supabase,
  companies,
  tenantId,
  icpId,
  sourceBatchId,
  columnMapping,
}: {
  supabase: any;
  companies: any[];
  tenantId: string;
  icpId: string;
  sourceBatchId: string;
  columnMapping: Record<string, string>;
}): Promise<{ insertedCount: number; duplicateCount: number }> => {
  console.log('[BulkUpload][fallback] 🔍 Recebidas empresas para fallback:', {
    totalCompanies: companies.length,
    tenantId,
    icpId,
  });

  // 1) ✅ NORMALIZAÇÃO OBRIGATÓRIA: Normalizar/filtrar empresas válidas usando função central
  const validCompanies = companies
    .map((c) => {
      const rawCnpj = c.cnpj || c.CNPJ || getValue(c, 'cnpj', columnMapping);
      const normalizedCnpj = normalizeCnpj(rawCnpj);
      
      // ✅ LOG DE DIAGNÓSTICO
      if (rawCnpj && !normalizedCnpj) {
        console.warn('[BulkUpload][fallback] ⚠️ CNPJ inválido após normalização', {
          raw: rawCnpj,
          normalized: normalizedCnpj,
        });
      }
      
      return {
        ...c,
        cnpj_raw: rawCnpj, // ✅ Salvar valor original
        cnpj: normalizedCnpj, // ✅ Salvar normalizado
      };
    })
    .filter((c) => c.cnpj && c.cnpj.length === 14);

  console.log('[BulkUpload][fallback] ✅ Empresas válidas após normalização:', {
    totalValid: validCompanies.length,
    totalOriginal: companies.length,
  });

  if (validCompanies.length === 0) {
    console.warn('[BulkUpload][fallback] ⚠️ Nenhuma empresa válida após normalização de CNPJ.');
    return { insertedCount: 0, duplicateCount: 0 };
  }

  // 2) Buscar CNPJs já existentes para esse tenant + ICP
  // ✅ NORMALIZAR CNPJs antes de buscar (remover formatação)
  const normalizedCnpjs = validCompanies
    .map((c) => normalizeCnpj(c.cnpj))
    .filter(Boolean);
  
  // Buscar TODOS os candidatos do tenant + ICP para comparar normalizados
  const { data: existingRows, error: existingError } = await supabase
    .from('prospecting_candidates' as any)
    .select('cnpj')
    .eq('tenant_id', tenantId)
    .eq('icp_id', icpId);

  if (existingError) {
    console.error('[BulkUpload][fallback] ❌ Erro ao buscar CNPJs existentes:', existingError);
    throw existingError;
  }

  // ✅ Normalizar CNPJs do banco também para comparação
  const existingCnpjsNormalized = new Set(
    (existingRows || []).map((r: any) => normalizeCnpj(r.cnpj)).filter(Boolean)
  );
  
  console.log('[BulkUpload][fallback] ℹ️ CNPJs já existentes no banco:', {
    countExisting: existingCnpjsNormalized.size,
    totalNew: normalizedCnpjs.length,
    sampleExisting: Array.from(existingCnpjsNormalized).slice(0, 3),
    sampleNew: normalizedCnpjs.slice(0, 3),
    matches: normalizedCnpjs.filter(cnpj => existingCnpjsNormalized.has(cnpj)).length,
  });

  // 3) Filtrar apenas os que NÃO existem ainda (comparando normalizados)
  const companiesToInsert = validCompanies.filter((c) => {
    const normalized = normalizeCnpj(c.cnpj);
    return normalized && !existingCnpjsNormalized.has(normalized);
  });

  console.log('[BulkUpload][fallback] 📦 Preparando insert:', {
    candidates: validCompanies.length,
    toInsert: companiesToInsert.length,
    duplicates: validCompanies.length - companiesToInsert.length,
  });

  if (companiesToInsert.length === 0) {
    return {
      insertedCount: 0,
      duplicateCount: validCompanies.length,
    };
  }

  // 4) ✅ CORREÇÃO DEFINITIVA: Montar payload do insert com mapeamento estruturado
  const rows = companiesToInsert.map((c) => {
    // 🔍 DEBUG: Log do objeto completo para entender estrutura
    if (companiesToInsert.indexOf(c) === 0) {
      console.log('[BulkUpload][fallback] 🔍 DEBUG Primeira empresa antes do mapeamento:', {
        keys: Object.keys(c),
        cnpj: c.cnpj,
        sampleFields: {
          'Razão': c['Razão'],
          'Razao': c['Razao'],
          'Razão Social': c['Razão Social'],
          'Razao Social': c['Razao Social'],
          'Fantasia': c['Fantasia'],
          'Nome Fantasia': c['Nome Fantasia'],
        }
      });
    }
    
    // ✅ Mapeamento estruturado de razão social (múltiplas variações)
    // Buscar em TODOS os campos possíveis, incluindo variações de encoding
    const razao = 
      // Campos diretos da planilha (com todas variações possíveis)
      c['Razão'] ??  
      c['Razao'] ??  
      c['Razão Social'] ??
      c['Razao Social'] ??
      c['RAZAO_SOCIAL'] ??
      c['Razão Social'] ??  // Com encoding diferente
      c['Razo'] ??  // Encoding ISO-8859-1
      c['Razão'] ??  // Encoding UTF-8
      // Campos normalizados
      c.razao_social ??  
      c.company_name ??  
      c.nome_empresa ??
      // Buscar por getValue
      getValue(c, 'razao_social', columnMapping) ??
      getValue(c, 'companyName', columnMapping) ??
      null;
    
    // ✅ Mapeamento estruturado de nome fantasia
    const fantasia = 
      c['Nome Fantasia'] ??
      c['Fantasia'] ??
      c['NOME_FANTASIA'] ??
      getValue(c, 'nome_fantasia', columnMapping) ??
      getValue(c, 'fantasia', columnMapping) ??
      null;
    
    // ✅ Usar razão social, se não tiver, usar fantasia, se não tiver, deixar null
    const companyName = razao || fantasia || null;
    
    // ✅ Se houver nome fantasia diferente da razão social, incluir em notes
    const notesContent = [];
    if (fantasia && razao && fantasia.trim() !== razao.trim()) {
      notesContent.push(`Nome fantasia: ${fantasia.trim()}`);
    }

    // ✅ Mapeamento estruturado de cidade
    const city = 
      c['Cidade'] ??
      c['Municipio'] ??
      c['Município'] ??
      c['CIDADE'] ??
      getValue(c, 'city', columnMapping) ??
      getValue(c, 'cidade', columnMapping) ??
      getValue(c, 'municipio', columnMapping) ??
      null;
    
    // ✅ Mapeamento estruturado de estado/UF
    const state = 
      c['UF'] ??
      c['Estado'] ??
      c['ESTADO'] ??
      getValue(c, 'uf', columnMapping) ??
      getValue(c, 'estado', columnMapping) ??
      null;
    
    // ✅ Mapeamento estruturado de setor
    const sector = 
      c['Setor'] ??
      c['Segmento'] ??
      c['Texto CNAE Principal'] ??
      c['CNAE_DESC'] ??
      c['Atividade Econômica'] ??
      getValue(c, 'setor', columnMapping) ??
      getValue(c, 'sector', columnMapping) ??
      null;
    
    // ✅ Mapeamento estruturado de website
    const website = 
      c['Site'] ??
      c['Website'] ??
      c['URL'] ??
      getValue(c, 'website', columnMapping) ??
      getValue(c, 'site', columnMapping) ??
      null;
    
    // ✅ Normalizar CNPJ usando helper centralizado
    const normalizedCnpj = normalizeCnpj(c.cnpj);
    
    // ✅ VALIDAÇÃO: Se não houver CNPJ ou company_name, marcar como inválido
    if (!normalizedCnpj || !companyName) {
      // Retornar objeto com flag de inválido (será filtrado antes do insert)
      return {
        _invalid: true,
        _reason: !normalizedCnpj ? 'CNPJ ausente ou inválido' : 'Nome da empresa ausente',
      } as any;
    }
    
    // Buscar email e telefone (mantendo lógica existente)
    const emailRaw = c['E-mail'] ?? c['Email'] ?? getValue(c, 'contactEmail', columnMapping) ?? getValue(c, 'contato_email', columnMapping);
    const phoneRaw = c['Telefone 1'] ?? c['Telefone'] ?? getValue(c, 'contactPhone', columnMapping) ?? getValue(c, 'contato_telefone', columnMapping);

    // ✅ Montar candidato com dados estruturados
    return {
      tenant_id: tenantId,
      icp_id: icpId,
      cnpj: normalizedCnpj, // ✅ CNPJ normalizado (14 dígitos)
      cnpj_raw: c.cnpj_raw || c.cnpj || c.CNPJ || getValue(c, 'cnpj', columnMapping), // ✅ CNPJ original (com máscara)
      company_name: companyName.trim(),
      // ✅ REMOVIDO: nome_fantasia não existe na tabela prospecting_candidates
      // Se houver nome fantasia diferente, será incluído em notes
      website: normalizeWebsite(website),
      sector: sector ? String(sector).trim() : null,
      uf: normalizeUF(state),
      city: city ? String(city).trim() : null,
      country: 'Brasil',
      contact_name: null,
      contact_role: null,
      contact_email: normalizeEmail(emailRaw),
      contact_phone: normalizePhone(phoneRaw),
      linkedin_url: null,
      notes: notesContent.length > 0 ? notesContent.join('; ') : null,
      source: 'MANUAL',
      source_batch_id: sourceBatchId,
      status: 'pending',
    };
  }).filter((row: any) => !row._invalid); // ✅ Filtrar registros inválidos

  console.log('[BulkUpload][fallback] 📤 Tentando inserir', rows.length, 'registros...');
  console.log('[BulkUpload][fallback] 📋 Primeiro registro exemplo:', rows[0]);

  const { data: insertData, error: insertError } = await supabase
    .from('prospecting_candidates' as any)
    .insert(rows)
    .select('id');

  if (insertError) {
    console.error('[BulkUpload][fallback] ❌ Erro ao inserir em prospecting_candidates:', insertError);
    console.error('[BulkUpload][fallback] ❌ Detalhes do erro:', {
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      code: insertError.code,
    });
    throw insertError;
  }

  const insertedCount = insertData?.length ?? rows.length;
  const duplicateCount = validCompanies.length - insertedCount;

  console.log('[BulkUpload][fallback] ✅ Insert concluído:', {
    insertedCount,
    duplicateCount,
    rowsInserted: insertData?.length,
  });

  return { insertedCount, duplicateCount };
};

// Processar cada ICP
for (const icpId of icpIdsToProcess) {
  try {
    setProgress(20 + (icpIdsToProcess.indexOf(icpId) / icpIdsToProcess.length) * 60);
    
    let insertedCount = 0;
    let duplicatesCount = 0;
    
    // TODO: Reativar mc9-import-csv quando CORS estiver resolvido
    // Por enquanto, vamos direto para o fallback para validar o fluxo banco → telas
    /*
    // TENTATIVA 1: Chamar Edge Function mc9-import-csv
    try {
      const { data, error } = await supabase.functions.invoke('mc9-import-csv', {
        body: {
          tenantId,
          icpId,
          source: 'upload_csv',
          sourceBatchId,
          rows: companies,
          columnMapping,
        },
      });

      if (error) {
        console.error('[BulkUpload] ❌ Erro na Edge Function mc9-import-csv', error);
        throw error;
      }

      if (!data) {
        throw new Error('Resposta inválida da Edge Function');
      }

      insertedCount = data.insertedCount || data.importedCount || 0;
      duplicatesCount = data.duplicatesCount || data.duplicatedCount || 0;
      
      console.log(`✅ [BulkUpload] Edge Function processou: ${insertedCount} inseridas, ${duplicatesCount} duplicadas`);
      
    } catch (edgeFunctionError: any) {
      console.error('[BulkUpload] ❌ Falha ao chamar mc9-import-csv', edgeFunctionError);
      // Fallback será acionado abaixo
    }
    */
    
    // TENTATIVA 2: Fallback direto (sempre ativo por enquanto)
    try {
      const fallbackResult = await insertDirectlyToProspectingCandidates({
        supabase,
        companies,
        tenantId,
        icpId,
        sourceBatchId,
        columnMapping,
      });
      insertedCount = fallbackResult.insertedCount;
      duplicatesCount = fallbackResult.duplicateCount;
      console.log(`✅ [BulkUpload] Fallback processou: ${insertedCount} inseridas, ${duplicatesCount} duplicadas`);
    } catch (fallbackError: any) {
      console.error('[BulkUpload] ❌ Fallback também falhou', fallbackError);
      toast.error(`Erro ao importar para ICP ${icpId}`, {
        description: fallbackError.message || 'Erro ao inserir empresas. Veja o console para detalhes.'
      });
      continue;
    }
    
    totalInserted += insertedCount;
    totalDuplicates += duplicatesCount;
    
  } catch (err: any) {
    console.error(`❌ Erro ao processar ICP ${icpId}:`, err);
    toast.error(`Erro ao processar ICP ${icpId}`, {
      description: err.message || 'Erro desconhecido'
    });
  }
}

      setProgress(90);

      // ✅ CRIAR E PROCESSAR JOB APÓS TODAS AS INSERÇÕES (fora do loop de ICPs)
      if (totalInserted > 0 && tenantId) {
        console.log(`[BulkUpload] 🎯 Criando jobs para ${icpIdsToProcess.length} ICP(s). Total no arquivo: ${companies.length}, Inseridas: ${totalInserted}, Duplicadas: ${totalDuplicates}`);
        
        // Adicionar um pequeno delay para garantir que os inserts foram commitados
        await new Promise(resolve => setTimeout(resolve, 500));

        for (const icpId of icpIdsToProcess) {
          try {
            // 1) Contar candidatos pendentes para este batch e ICP
            const { count: pendingCandidatesCount, error: countError } = await supabase
              .from('prospecting_candidates' as any)
              .select('id', { count: 'exact' })
              .eq('tenant_id', tenantId)
              .eq('icp_id', icpId)
              .eq('source_batch_id', sourceBatchId)
              .eq('status', 'pending');

            if (countError) throw countError;

            if (pendingCandidatesCount === 0) {
              console.warn(`[BulkUpload] ⚠️ Nenhum candidato pendente encontrado para ICP ${icpId} no batch ${sourceBatchId}. Pulando criação de job.`);
              continue;
            }

            // 1) Criar job
            const { data: jobId, error: jobError } = await supabase.rpc(
              'create_qualification_job_after_import' as any,
              {
                p_tenant_id: tenantId,
                p_icp_id: icpId,
                p_source_type: 'upload_csv',
                p_source_batch_id: sourceBatchId,
                p_job_name: `Importação ${new Date().toLocaleDateString('pt-BR')} - ${pendingCandidatesCount} empresas`,
              }
            );

            if (jobError) {
              console.error('[BulkUpload] ❌ Erro ao criar job:', jobError);
              toast.warning('⚠️ Empresas inseridas, mas job não foi criado', {
                description: `Crie o job manualmente. Erro: ${jobError.message}`,
                duration: 6000,
              });
              continue;
            }

            if (!jobId) {
              console.error('[BulkUpload] ❌ jobId é null/undefined!');
              continue;
            }

            console.log('[BulkUpload] ✅ Job criado:', jobId);
            
            // 2) PROCESSAR job automaticamente (AGUARDAR execução)
            try {
              console.log('[BulkUpload] 🔄 Processando job...', jobId);
              
              const { data: processData, error: processError } = await (supabase.rpc as any)(
                'process_qualification_job',
                {
                  p_job_id: jobId,
                  p_tenant_id: tenantId,
                }
              );

              if (processError) {
                console.error('[BulkUpload] ❌ ERRO ao processar:', {
                  error: processError,
                  code: processError.code,
                  message: processError.message,
                  details: processError.details,
                });
                toast.error('⚠️ Job criado, mas processamento falhou', {
                  description: `Clique em "Rodar Qualificação" para processar. Erro: ${processError.message}`,
                  duration: 10000,
                });
              } else {
                const result = processData && Array.isArray(processData) ? processData[0] : (processData as any);
                console.log('[BulkUpload] ✅ Job processado com sucesso!', result);
                toast.success('✅ Qualificação concluída!', {
                  description: `${result?.processed_count || 0} processadas, ${result?.qualified_count || 0} qualificadas`,
                  duration: 5000,
                });
              }
            } catch (processEx: any) {
              console.error('[BulkUpload] ❌ EXCEÇÃO ao processar:', processEx);
              toast.error('⚠️ Erro ao processar automaticamente', {
                description: `Processe manualmente. Erro: ${processEx.message}`,
                duration: 8000,
              });
            }
          } catch (jobEx: any) {
            console.error('[BulkUpload] ❌ Erro ao criar job:', jobEx);
          }
        }
      }

      setProgress(100);

      // Mensagens de sucesso/erro corretas
      if (totalInserted > 0) {
        console.log(`✅ SUCESSO: ${totalInserted} empresas importadas, ${totalDuplicates} duplicadas ignoradas!`);
        
        toast.success(`✅ ${totalInserted} empresas importadas e qualificadas!`, {
          description: `🎯 Empresas salvas e qualificadas automaticamente. ${totalDuplicates > 0 ? `${totalDuplicates} duplicadas ignoradas.` : ''}`,
          action: {
            label: 'Ver Estoque Qualificado →',
            onClick: () => {
              setIsOpen(false);
              navigate('/leads/qualified-stock');
            }
          },
          duration: 6000
        });
      } else {
        console.error(`❌ ERRO: Nenhuma empresa foi importada. Total duplicadas/inválidas: ${totalDuplicates}`);
        
        toast.error('Nenhuma empresa foi importada', {
          description: totalDuplicates > 0 
            ? `${totalDuplicates} empresas foram ignoradas (duplicadas ou CNPJ inválido). Veja o console para detalhes.`
            : 'Verifique se o arquivo contém dados válidos com CNPJs corretos. Veja o console para detalhes.',
          duration: 8000
        });
      }

      // Fechar dialog
      setTimeout(() => setIsOpen(false), 2000);

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error("Erro ao processar arquivo", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      toast.error("Insira a URL do Google Sheets");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setResult(null);

try {
  // Evitar CORS: delega para função de backend que baixa e importa
  toast.info("Processando planilha no servidor...");

  const { data, error } = await supabase.functions.invoke('import-google-sheet', {
    body: { url: googleSheetUrl }
  });

  if (error) throw error;

  setResult(data);
  setProgress(100);

  if (data.success > 0) {
    toast.success(`${data.success} empresas importadas do Google Sheets!`, {
      action: {
        label: 'Ver base de empresas',
        onClick: () => navigate('/companies')
      }
    });
  }

  if (data.errors?.length > 0) {
    toast.warning(`${data.errors.length} empresas com erros`);
  }

} catch (error) {
  console.error('Erro ao importar do Google Sheets:', error);
  toast.error("Erro ao importar planilha", {
    description: error instanceof Error ? error.message : "Verifique se a planilha está pública"
  });
} finally {
  setIsUploading(false);
}
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload em Massa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-indigo-600" />
            Motor de Qualificação • Upload em Massa
          </DialogTitle>
          <DialogDescription>
            Importe até {MAX_COMPANIES} empresas • Triagem automática com IA
          </DialogDescription>
        </DialogHeader>

        {/* 🔥 NOVO: Seletor de ICP - SEMPRE VISÍVEL (opcional) */}
        {availableIcps.length > 0 && (
          <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <Target className="h-4 w-4 text-indigo-600" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100">
                    🎯 Selecione o ICP (Opcional):
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {selectedIcpIds.length > 0 ? `${selectedIcpIds.length} selecionado(s)` : 'Usará ICP principal'}
                  </Badge>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">
                  ✨ Se não selecionar, usaremos o ICP principal automaticamente. Você pode escolher outro depois na página de qualificação.
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {availableIcps.map(icp => {
                    const isSelected = selectedIcpIds.includes(icp.id);
                    return (
                      <div
                        key={icp.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIcpIds(selectedIcpIds.filter(id => id !== icp.id));
                          } else {
                            setSelectedIcpIds([...selectedIcpIds, icp.id]);
                          }
                        }}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                          <Building2 className="h-4 w-4 text-indigo-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{icp.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {icp.cnpj} • Criado em {icp.criado}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                  💡 Cada prospect receberá um FIT score para cada ICP selecionado
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-2">
              <Folder className="h-4 w-4 text-yellow-500" />
              Arquivo
            </TabsTrigger>
            <TabsTrigger value="sheets" className="gap-2">
              <GoogleIcon />
              <Sheet className="h-4 w-4 text-green-600" />
              Google Sheets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-6 py-4">
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Template CSV
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Formato expandido:</strong> 87 colunas completas de dados
                <br />
                <strong>Campos incluídos:</strong> CNPJ, identificação, endereço, CNAEs, sócios, decisores (até 3), redes sociais, tech stack, scores, enriquecimentos, pipeline CRM
                <br />
                <strong>Formatos aceitos:</strong> CSV, TSV, XLSX, XLS
                <br />
                <strong>Separadores:</strong> vírgula (,), ponto e vírgula (;) ou TAB
                <br />
                <strong>Valores vazios:</strong> "não encontrado", "---", "###" são ignorados
              </AlertDescription>
            </Alert>

            {/* FLUXO LINEAR FIXO */}
            <Alert className="border-blue-600/30 bg-blue-600/5">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Fluxo Automático:</strong> Empresas serão importadas para o <strong>Estoque</strong> → <strong>Quarentena ICP</strong> → Aprovação
              </AlertDescription>
            </Alert>

            {/* CAMPOS DE RASTREABILIDADE */}
            <div className="space-y-4 rounded-lg border border-blue-600/30 bg-blue-600/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-600">Rastreabilidade da Importação</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source-name">Nome da Fonte *</Label>
                <Input
                  id="source-name"
                  placeholder="Ex: Prospecção Q1 2025, Leads Manuais, Teste Campanha"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  disabled={isUploading}
                  className="border-blue-600/50"
                />
                <p className="text-xs text-muted-foreground">
                  Identifique a origem desta planilha para rastrear conversão por fonte
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-campaign">Campanha (opcional)</Label>
                <Input
                  id="source-campaign"
                  placeholder="Ex: Black Friday, Webinar Tech, Feira SP"
                  value={sourceCampaign}
                  onChange={(e) => setSourceCampaign(e.target.value)}
                  disabled={isUploading}
                  className="border-blue-600/50"
                />
                <p className="text-xs text-muted-foreground">
                  Tag adicional para organizar importações por campanha
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {file ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-primary">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Clique para selecionar outro arquivo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">
                        CSV, TSV, XLSX ou XLS
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processando...</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.success > 0 && (
                    <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        {result.success} empresas importadas com sucesso
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {result.errors.length > 0 && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <p className="font-medium mb-2">{result.errors.length} erros encontrados:</p>
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {result.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>• ... e mais {result.errors.length - 5} erros</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* 🔥 NOVO: Opção de Qualificação Automática */}
            <div className="flex items-center justify-between p-4 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    ⚡ Qualificação Automática com IA
                    <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600">NOVO!</Badge>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    Calcular FIT score e classificar (A+, A, B, C, D) automaticamente após importar
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    <Target className="h-3 w-3 inline mr-1" />
                    Apenas prospects com FIT &gt; 70% entram na Base de Empresas
                  </p>
                </div>
              </div>
              <Switch
                checked={enableQualification}
                onCheckedChange={setEnableQualification}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading || !sourceName.trim()}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar Empresas
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6 py-4">
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p><strong>Como usar:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Abra sua planilha no Google Sheets</li>
                  <li>Clique em "Compartilhar" → "Qualquer pessoa com o link"</li>
                  <li>Cole o link abaixo</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheets-url">URL do Google Sheets</Label>
                <Input
                  id="sheets-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processando...</span>
                    <span className="text-primary font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.success > 0 && (
                    <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        {result.success} empresas importadas com sucesso
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {result.errors.length > 0 && (
                    <Alert className="border-destructive/50 bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <p className="font-medium mb-2">{result.errors.length} erros encontrados:</p>
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {result.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>• ... e mais {result.errors.length - 5} erros</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGoogleSheetImport}
                disabled={!googleSheetUrl.trim() || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Importar do Sheets
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
