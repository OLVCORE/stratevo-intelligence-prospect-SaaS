/**
 * MC9 V2.1: Tela de Importação CSV Hunter
 * 
 * Importa empresas de fontes externas (Empresas Aqui, Apollo, etc.)
 * via CSV para processamento posterior via MC6/MC8/MC9
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileSpreadsheet, Loader2, Globe, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import Papa from 'papaparse';
import type { ProspectSource, RawProspectRow, ColumnMapping, EmpresasAquiApiFilter } from '@/types/prospecting';
import { generateEmpresasAquiMapping } from '@/services/prospectCsvNormalizer.service';
import { importFromEmpresasAquiApi } from '@/services/empresasAquiImport.service';

type Step = 'upload' | 'mapping' | 'importing' | 'complete';
type ImportMode = 'csv' | 'api';

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const PORTE_OPTIONS = [
  { value: 'micro', label: 'Micro' },
  { value: 'pequena', label: 'Pequena' },
  { value: 'media', label: 'Média' },
  { value: 'grande', label: 'Grande' },
];

/**
 * Normaliza header para comparação (remove acentos, espaços, etc.)
 */
const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

/**
 * Verifica se um header corresponde a algum dos candidatos
 */
const headerMatches = (header: string, candidates: string[]) => {
  const norm = normalizeHeader(header);
  return candidates.some((cand) => norm.includes(normalizeHeader(cand)));
};

/**
 * Sugere mapeamento de colunas baseado nos headers do CSV
 */
const suggestColumnMappings = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  for (const h of headers) {
    if (!mapping.companyName && headerMatches(h, ['empresa', 'razao social', 'razaosocial', 'nome empresa', 'nome', 'razao_social', 'nome_fantasia'])) {
      mapping.companyName = h;
      continue;
    }
    if (!mapping.cnpj && headerMatches(h, ['cnpj', 'cnpj raiz', 'cnpjraiz', 'documento'])) {
      mapping.cnpj = h;
      continue;
    }
    if (!mapping.website && headerMatches(h, ['website', 'site', 'url', 'dominio', 'dominio site', 'web', 'homepage'])) {
      mapping.website = h;
      continue;
    }
    if (!mapping.uf && headerMatches(h, ['uf', 'estado', 'est'])) {
      mapping.uf = h;
      continue;
    }
    if (!mapping.city && headerMatches(h, ['cidade', 'municipio', 'municipio empresa', 'localidade'])) {
      mapping.city = h;
      continue;
    }
    if (!mapping.email && headerMatches(h, ['email', 'e-mail', 'contato email', 'mail', 'e_mail'])) {
      mapping.email = h;
      continue;
    }
    if (!mapping.phone && headerMatches(h, ['telefone', 'celular', 'whatsapp', 'fone', 'tel', 'telefone1', 'telefone2'])) {
      mapping.phone = h;
      continue;
    }
    if (!mapping.sector && headerMatches(h, ['setor', 'cnae', 'segmento', 'atividade', 'ramo'])) {
      mapping.sector = h;
      continue;
    }
  }

  return mapping;
};

export default function ProspectingImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const { data: icpLibrary } = useICPLibrary();
  
  const [importMode, setImportMode] = useState<ImportMode>('csv');
  const [step, setStep] = useState<Step>('upload');
  const [source, setSource] = useState<ProspectSource>('EMPRESAS_AQUI');
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<RawProspectRow[]>([]);
  const [previewRows, setPreviewRows] = useState<RawProspectRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<{
    insertedCount: number;
    duplicatesCount: number;
    batchId: string;
    warnings: string[];
  } | null>(null);

  // MC9 V2.2: Estados para API Empresas Aqui
  const [apiFilters, setApiFilters] = useState<EmpresasAquiApiFilter>({
    cnae: '',
    uf: '',
    porte: '',
    page: 1,
    pageSize: 50,
  });
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiStats, setApiStats] = useState<{
    totalEncontradas: number;
    totalNovas: number;
    totalDuplicadas: number;
    pagina: number;
  } | null>(null);

  // Campos normalizados esperados
  const normalizedFields = [
    { field: 'companyName', label: 'Nome da Empresa', required: true },
    { field: 'cnpj', label: 'CNPJ', required: false },
    { field: 'website', label: 'Website', required: false },
    { field: 'uf', label: 'UF', required: false },
    { field: 'city', label: 'Cidade', required: false },
    { field: 'sector', label: 'Setor', required: false },
    { field: 'contactName', label: 'Contato (Nome)', required: false },
    { field: 'contactRole', label: 'Contato (Cargo)', required: false },
    { field: 'contactEmail', label: 'Contato (Email)', required: false },
    { field: 'contactPhone', label: 'Contato (Telefone)', required: false },
    { field: 'linkedinUrl', label: 'LinkedIn URL', required: false },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setCsvFile(uploadedFile);

    try {
      // Ler texto do arquivo
      let text = await uploadedFile.text();
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1); // Remove BOM
      }

      // Detectar separador
      const firstLine = text.split(/\r?\n/)[0] || '';
      const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

      // Parse CSV
      Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter,
        transformHeader: (h) => h.trim().replace(/^["']|["']$/g, ''),
        complete: (results) => {
          const data = (results.data as any[]).filter(Boolean);
          
          if (!data || data.length === 0) {
            toast({
              title: 'Erro',
              description: 'Arquivo CSV vazio ou inválido.',
              variant: 'destructive',
            });
            return;
          }

          const headers = Object.keys(data[0] || {});
          setCsvHeaders(headers);
          setCsvRows(data);
          setPreviewRows(data.slice(0, 10));

          // Gerar mapeamento automático baseado na origem
          let autoMapping: Record<string, string> = {};
          if (source === 'EMPRESAS_AQUI') {
            autoMapping = generateEmpresasAquiMapping(headers);
          } else {
            // Auto-sugestão genérica para qualquer origem
            autoMapping = suggestColumnMappings(headers);
          }

          setColumnMapping(autoMapping);
          setStep('mapping');

          toast({
            title: '✅ Arquivo carregado!',
            description: `${data.length} linhas detectadas. Revise o mapeamento de colunas.`,
          });
        },
        error: (error) => {
          console.error('Erro ao ler CSV:', error);
          toast({
            title: 'Erro ao ler arquivo',
            description: 'Verifique se o arquivo está no formato CSV correto.',
            variant: 'destructive',
          });
        },
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o arquivo.',
        variant: 'destructive',
      });
    }
  };

  const handleMappingChange = (normalizedField: string, csvColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [normalizedField]: csvColumn === '__SKIP__' ? '' : csvColumn,
    }));
  };

  const handleImport = async () => {
    if (!tenantId || !selectedIcpId) {
      toast({
        title: 'Erro',
        description: 'Tenant e ICP são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');

    try {
      // Gerar batch ID
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('mc9-import-csv', {
        body: {
          tenantId,
          icpId: selectedIcpId,
          source,
          sourceBatchId: batchId,
          rows: csvRows,
          columnMapping,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao importar empresas');
      }

      if (!data) {
        throw new Error('Resposta inválida da Edge Function');
      }

      setImportResult({
        insertedCount: data.insertedCount || 0,
        duplicatesCount: data.duplicatesCount || 0,
        batchId: data.batchId || batchId,
        warnings: data.warnings || [],
      });

      // Criar job de qualificação automaticamente
      if (data.insertedCount > 0 && tenantId && selectedIcpId) {
        try {
          const { data: jobData, error: jobError } = await supabase.rpc(
            'create_qualification_job_after_import',
            {
              p_tenant_id: tenantId,
              p_icp_id: selectedIcpId,
              p_source_type: source === 'CSV_EMPRESAS_AQUI' ? 'upload_csv' : 
                            source === 'APOLLO' ? 'apollo_import' : 
                            source === 'PHANTOMBUSTER' ? 'paste_list' : 'upload_csv',
              p_source_batch_id: batchId,
              p_job_name: `Importação ${new Date().toLocaleDateString('pt-BR')} - ${data.insertedCount} empresas`,
            }
          );

          if (jobError) {
            console.warn('Erro ao criar job de qualificação:', jobError);
          } else {
            console.log('✅ Job de qualificação criado:', jobData);
          }
        } catch (err) {
          console.warn('Erro ao criar job de qualificação:', err);
        }
      }

      setStep('complete');

      toast({
        title: '✅ Importação concluída!',
        description: `${data.insertedCount || 0} empresas importadas, ${data.duplicatesCount || 0} duplicadas ignoradas. Job de qualificação criado automaticamente.`,
      });
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: error.message || 'Ocorreu um erro ao importar os dados.',
        variant: 'destructive',
      });
      setStep('mapping');
    }
  };

  const resetImport = () => {
    setStep('upload');
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setPreviewRows([]);
    setColumnMapping({});
    setImportResult(null);
    setApiStats(null);
  };

  // MC9 V2.2: Handler para importação via API
  const handleApiImport = async () => {
    if (!tenantId || !selectedIcpId) {
      toast({
        title: 'Erro',
        description: 'Tenant e ICP são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingApi(true);

    try {
      const stats = await importFromEmpresasAquiApi({
        tenantId,
        icpId: selectedIcpId,
        filters: apiFilters,
      });

      setApiStats(stats);

      toast({
        title: '✅ Importação via API concluída!',
        description: `Empresas Aqui: ${stats.totalEncontradas} encontradas, ${stats.totalNovas} novas, ${stats.totalDuplicadas} já existentes.`,
      });
    } catch (error: any) {
      console.error('[MC9-V2.2] Erro na importação via API:', error);
      toast({
        title: 'Erro na importação via API',
        description: error.message || 'Ocorreu um erro ao importar empresas via API.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Etapa 1: Upload
  if (step === 'upload') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <CardTitle>Importação Hunter (MC9 V2.1 + V2.2)</CardTitle>
            <CardDescription>
              Importe empresas de fontes externas via CSV ou API para processamento posterior via MC6/MC8/MC9.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </TabsTrigger>
                <TabsTrigger value="api">
                  <Globe className="w-4 h-4 mr-2" />
                  API Empresas Aqui
                </TabsTrigger>
              </TabsList>

              <TabsContent value="csv" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Origem dos dados</Label>
                  <Select value={source} onValueChange={(value) => setSource(value as ProspectSource)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV_EMPRESAS_AQUI">Empresas Aqui (CSV)</SelectItem>
                      <SelectItem value="CSV_GENERICO">CSV Genérico</SelectItem>
                      <SelectItem value="APOLLO">Apollo</SelectItem>
                      <SelectItem value="PHANTOMBUSTER">PhantomBuster</SelectItem>
                      <SelectItem value="GOOGLE_SHEETS">Google Sheets (CSV exportado)</SelectItem>
                      <SelectItem value="MANUAL">Outro (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ICP alvo</Label>
                  <Select value={selectedIcpId} onValueChange={setSelectedIcpId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ICP" />
                    </SelectTrigger>
                    <SelectContent>
                      {icpLibrary?.data?.map((icp) => (
                        <SelectItem key={icp.id} value={icp.id}>
                          {icp.nome} {icp.icp_principal ? '(Principal)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo CSV</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aceita arquivos .csv até 20MB
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>ICP alvo</Label>
                  <Select value={selectedIcpId} onValueChange={setSelectedIcpId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ICP" />
                    </SelectTrigger>
                    <SelectContent>
                      {icpLibrary?.data?.map((icp) => (
                        <SelectItem key={icp.id} value={icp.id}>
                          {icp.nome} {icp.icp_principal ? '(Principal)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CNAE (opcional)</Label>
                    <Input
                      placeholder="Ex: 2512-8/00"
                      value={apiFilters.cnae || ''}
                      onChange={(e) => setApiFilters(prev => ({ ...prev, cnae: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>UF (opcional)</Label>
                    <Select
                      value={apiFilters.uf || ''}
                      onValueChange={(value) => setApiFilters(prev => ({ ...prev, uf: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as UFs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as UFs</SelectItem>
                        {BRAZIL_STATES.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Porte (opcional)</Label>
                    <Select
                      value={apiFilters.porte || ''}
                      onValueChange={(value) => setApiFilters(prev => ({ ...prev, porte: value || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os portes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os portes</SelectItem>
                        {PORTE_OPTIONS.map((porte) => (
                          <SelectItem key={porte.value} value={porte.value}>{porte.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resultados por página</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={apiFilters.pageSize || 50}
                      onChange={(e) => setApiFilters(prev => ({ ...prev, pageSize: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleApiImport}
                  disabled={isLoadingApi || !tenantId || !selectedIcpId}
                  className="w-full"
                >
                  {isLoadingApi ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Buscando empresas...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Buscar empresas via Empresas Aqui (API)
                    </>
                  )}
                </Button>

                {apiStats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-800">Resultado da Importação:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{apiStats.totalEncontradas}</div>
                        <div className="text-sm text-muted-foreground">Encontradas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{apiStats.totalNovas}</div>
                        <div className="text-sm text-muted-foreground">Novas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{apiStats.totalDuplicadas}</div>
                        <div className="text-sm text-muted-foreground">Duplicadas</div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 2: Mapeamento
  if (step === 'mapping') {
    const mappedCount = normalizedFields.filter(f => columnMapping[f.field]).length;
    const requiredMapped = normalizedFields.filter(f => f.required && columnMapping[f.field]).length;
    const requiredCount = normalizedFields.filter(f => f.required).length;

    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mapeamento de Colunas</CardTitle>
                <CardDescription>
                  Revise o mapeamento automático. Ajuste se necessário.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge>{mappedCount} Mapeados</Badge>
                <Badge variant={requiredMapped === requiredCount ? 'default' : 'destructive'}>
                  {requiredMapped}/{requiredCount} Obrigatórios
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Campo do Sistema</TableHead>
                    <TableHead className="w-[300px]">Coluna do CSV</TableHead>
                    <TableHead>Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedFields.map((field) => (
                    <TableRow key={field.field}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={columnMapping[field.field] || '__SKIP__'}
                          onValueChange={(value) => handleMappingChange(field.field, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione uma coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__SKIP__">❌ Não mapear</SelectItem>
                            {csvHeaders.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {previewRows.length > 0 && columnMapping[field.field] && (
                          <div className="truncate max-w-[200px]">
                            {String(previewRows[0]?.[columnMapping[field.field]] || '').substring(0, 50)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={requiredMapped < requiredCount || !tenantId || !selectedIcpId}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar empresas ({csvRows.length} linhas)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 3: Importando
  if (step === 'importing') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-2xl font-bold mb-4">Importando empresas...</h2>
              <p className="text-muted-foreground">
                Processando {csvRows.length} linhas do CSV...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Etapa 4: Completo
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">🎉 Importação Concluída!</h2>
            
            {importResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-green-600">{csvRows.length}</div>
                      <div className="text-sm text-muted-foreground">Total no CSV</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">{importResult.insertedCount}</div>
                      <div className="text-sm text-muted-foreground">✅ Importadas</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-red-600">{importResult.duplicatesCount}</div>
                      <div className="text-sm text-muted-foreground">⚠️ Duplicadas</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {csvRows.length - importResult.insertedCount - importResult.duplicatesCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Rejeitadas</div>
                    </div>
                  </div>
                </div>
                
                {/* ICP Selecionado */}
                {selectedIcpId && icpLibrary?.data && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">ICP Selecionado:</div>
                        <div className="text-sm text-blue-700">
                          {icpLibrary.data.find(icp => icp.id === selectedIcpId)?.nome || 'ICP'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {importResult?.warnings && importResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Avisos:</span>
                </div>
                <ul className="text-sm text-yellow-700 list-disc list-inside">
                  {importResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={resetImport} variant="outline">
                Importar outro CSV
              </Button>
              <Button 
                onClick={() => navigate('/leads/qualification-engine')}
                variant="default"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ver Job de Qualificação
              </Button>
              <Button onClick={() => navigate('/leads/icp-quarantine')}>
                Ver Quarentena ICP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

