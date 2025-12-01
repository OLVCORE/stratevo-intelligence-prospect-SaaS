// src/components/onboarding/steps/Step1DadosBasicos.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, Globe, Sparkles, X, Package, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { TenantProductsCatalog } from '@/components/products/TenantProductsCatalog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: (data?: any) => void | Promise<void>;
  initialData: any;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export function Step1DadosBasicos({ onNext, onBack, onSave, initialData, isSaving = false, hasUnsavedChanges = false }: Props) {
  const [formData, setFormData] = useState({
    cnpj: initialData?.cnpj || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    telefone: initialData?.telefone || '',
  });

  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [cnpjData, setCnpjData] = useState<any>(initialData?.cnpjData || null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  // 🔥 NOVO: Estados para scan de produtos do tenant
  const [scanningTenantWebsite, setScanningTenantWebsite] = useState(false);
  const [tenantProductsCount, setTenantProductsCount] = useState(0);
  const [productsCatalogOpen, setProductsCatalogOpen] = useState(false);
  
  // 🔥 NOVO: Estados para concorrentes
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
    urlParaScan?: string; // NOVO: URL manual para scan
    produtosExtraidos?: number; // NOVO: Contador de produtos
  }
  
  const [concorrentes, setConcorrentes] = useState<ConcorrenteDireto[]>(
    initialData?.concorrentesDiretos || []
  );
  
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
    urlParaScan: '',
  });
  
  const [buscandoCNPJConcorrente, setBuscandoCNPJConcorrente] = useState(false);
  const [cnpjConcorrenteEncontrado, setCnpjConcorrenteEncontrado] = useState(false);
  const [erroCNPJConcorrente, setErroCNPJConcorrente] = useState<string | null>(null);
  const [scanningConcorrente, setScanningConcorrente] = useState<Record<string, boolean>>({});
  const cnpjConcorrenteUltimoBuscadoRef = useRef<string>('');
  
  const { tenant } = useTenant();

  // 🔥 CRÍTICO: Sincronizar estado quando initialData mudar (ao voltar para etapa)
  useEffect(() => {
    if (initialData) {
      console.log('[Step1] 🔄 Atualizando dados do initialData:', initialData);
      setFormData({
        cnpj: initialData.cnpj || '',
        email: initialData.email || '',
        website: initialData.website || '',
        telefone: initialData.telefone || '',
      });
      
      // 🔥 NOVO: Carregar concorrentes
      if (initialData.concorrentesDiretos) {
        setConcorrentes(initialData.concorrentesDiretos);
      }
      
      // Restaurar cnpjData se disponível
      if (initialData.razaoSocial || initialData.nomeFantasia) {
        setCnpjData({
          nome: initialData.razaoSocial || '',
          fantasia: initialData.nomeFantasia || '',
          situacao: initialData.situacaoCadastral || '',
          abertura: initialData.dataAbertura || '',
          natureza_juridica: initialData.naturezaJuridica || '',
          capital_social: initialData.capitalSocial || null,
          porte: initialData.porteEmpresa || '',
          email: initialData.email || '',
          telefone: initialData.telefone || '',
          logradouro: initialData.endereco?.logradouro || '',
          numero: initialData.endereco?.numero || '',
          complemento: initialData.endereco?.complemento || '',
          bairro: initialData.endereco?.bairro || '',
          municipio: initialData.endereco?.municipio || '',
          uf: initialData.endereco?.uf || '',
          cep: initialData.endereco?.cep || '',
          cnaes: initialData.cnaes || [],
        });
      }
    }
  }, [initialData]);

  // Buscar dados automaticamente ao preencher CNPJ
  const handleCNPJSearch = async () => {
    const cnpjClean = formData.cnpj.replace(/\D/g, '');
    if (!cnpjClean || cnpjClean.length !== 14) {
      setCnpjError('CNPJ inválido (deve ter 14 dígitos)');
      return;
    }

    setLoadingCNPJ(true);
    setCnpjError(null);

    try {
      const result = await consultarReceitaFederal(formData.cnpj);
      
      if (!result.success || !result.data) {
        setCnpjError(result.error || 'Erro ao buscar dados do CNPJ');
        return;
      }

      // O serviço retorna um objeto merged com campos adicionais (email, telefone, etc.)
      // que não estão no tipo ReceitaWSResponse, então fazemos cast para any
      const data = result.data as any;
      setCnpjData(data);
      
      // Preencher campos automaticamente se disponíveis
      if (data.email && !formData.email) {
        setFormData(prev => ({ ...prev, email: data.email }));
      }
      if (data.telefone && !formData.telefone) {
        setFormData(prev => ({ ...prev, telefone: data.telefone }));
      }
    } catch (error: any) {
      setCnpjError(error.message || 'Erro ao buscar dados do CNPJ');
    } finally {
      setLoadingCNPJ(false);
    }
  };

  // 🔥 NOVO: Scan de produtos do website do tenant
  const handleScanTenantWebsite = async () => {
    if (!formData.website || !tenant?.id) {
      toast.error('Configure o website do tenant primeiro');
      return;
    }

    setScanningTenantWebsite(true);
    toast.info(`Escaneando ${formData.website}...`);

    try {
      const { data, error } = await supabase.functions.invoke('scan-website-products', {
        body: {
          tenant_id: tenant.id,
          website_url: formData.website,
        },
      });

      if (error) throw error;

      const count = data?.products_inserted || 0;
      setTenantProductsCount(count);
      
      toast.success(`${count} produtos encontrados no site!`, {
        description: 'Revise os produtos no catálogo',
      });
    } catch (err: any) {
      console.error('Erro ao escanear website:', err);
      toast.error('Erro ao escanear website', { description: err.message });
    } finally {
      setScanningTenantWebsite(false);
    }
  };

  // 🔥 NOVO: Buscar dados do CNPJ do concorrente
  const buscarDadosCNPJConcorrente = async (cnpjClean: string) => {
    setBuscandoCNPJConcorrente(true);
    setErroCNPJConcorrente(null);
    setCnpjConcorrenteEncontrado(false);

    try {
      const result = await consultarReceitaFederal(cnpjClean);
      
      if (!result.success || !result.data) {
        setErroCNPJConcorrente(result.error || 'Erro ao buscar dados do CNPJ');
        return;
      }

      const data = result.data;
      
      // Extrair setor do CNAE
      let setorExtraido = '';
      if (data.atividade_principal?.[0]?.code) {
        const cnaeCode = data.atividade_principal[0].code.replace(/\D/g, '');
        const secao = cnaeCode.substring(0, 1);
        const setores: Record<string, string> = {
          '1': 'Agricultura', '2': 'Indústria', '3': 'Indústria',
          '4': 'Energia', '5': 'Construção', '6': 'Comércio',
          '7': 'Transporte', '8': 'Serviços', '9': 'Serviços'
        };
        setorExtraido = setores[secao] || 'Outros';
      }

      setNovoConcorrente({
        cnpj: novoConcorrente.cnpj,
        razaoSocial: data.nome || data.fantasia || '',
        nomeFantasia: data.fantasia || '',
        setor: setorExtraido,
        cidade: data.municipio || '',
        estado: data.uf || '',
        capitalSocial: (data as any).capital_social ? parseFloat(String((data as any).capital_social).replace(/[^\d.,]/g, '').replace(',', '.')) : 0,
        cnaePrincipal: data.atividade_principal?.[0]?.code || '',
        cnaePrincipalDescricao: data.atividade_principal?.[0]?.text || '',
        website: novoConcorrente.website || '',
        urlParaScan: novoConcorrente.urlParaScan || '',
      });

      setCnpjConcorrenteEncontrado(true);
    } catch (error: any) {
      setErroCNPJConcorrente(error.message || 'Erro ao buscar dados do CNPJ');
    } finally {
      setBuscandoCNPJConcorrente(false);
    }
  };

  // 🔥 NOVO: Busca automática quando CNPJ tem 14 dígitos
  useEffect(() => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    
    if (cnpjClean.length === 14 && !buscandoCNPJConcorrente && cnpjClean !== cnpjConcorrenteUltimoBuscadoRef.current) {
      cnpjConcorrenteUltimoBuscadoRef.current = cnpjClean;
      buscarDadosCNPJConcorrente(cnpjClean);
    } else if (cnpjClean.length < 14) {
      setCnpjConcorrenteEncontrado(false);
      cnpjConcorrenteUltimoBuscadoRef.current = '';
      setErroCNPJConcorrente(null);
    }
  }, [novoConcorrente.cnpj, buscandoCNPJConcorrente]);

  // 🔥 NOVO: Scan de URL do concorrente
  const handleScanConcorrenteURL = async (concorrente: ConcorrenteDireto, index: number) => {
    if (!concorrente.urlParaScan || !tenant?.id) {
      toast.error('Informe a URL para escanear');
      return;
    }

    setScanningConcorrente(prev => ({ ...prev, [index]: true }));
    toast.info(`Escaneando ${concorrente.urlParaScan}...`);

    try {
      // Detectar tipo de URL
      let sourceType = 'website';
      if (concorrente.urlParaScan.includes('instagram.com')) sourceType = 'instagram';
      else if (concorrente.urlParaScan.includes('linkedin.com')) sourceType = 'linkedin';
      else if (concorrente.urlParaScan.includes('facebook.com')) sourceType = 'facebook';

      // Chamar Edge Function para extrair produtos
      const { data, error } = await supabase.functions.invoke('scan-competitor-url', {
        body: {
          tenant_id: tenant.id,
          competitor_cnpj: concorrente.cnpj.replace(/\D/g, ''),
          competitor_name: concorrente.razaoSocial,
          source_url: concorrente.urlParaScan,
          source_type: sourceType,
        },
      });

      if (error) throw error;

      const count = data?.products_extracted || 0;
      
      // Atualizar contador no concorrente
      const updated = [...concorrentes];
      updated[index] = { ...updated[index], produtosExtraidos: count };
      setConcorrentes(updated);

      toast.success(`${count} produtos extraídos de ${concorrente.razaoSocial}!`);
    } catch (err: any) {
      console.error('Erro ao escanear URL:', err);
      toast.error('Erro ao escanear URL', { description: err.message });
    } finally {
      setScanningConcorrente(prev => ({ ...prev, [index]: false }));
    }
  };

  // 🔥 NOVO: Adicionar concorrente
  const adicionarConcorrente = () => {
    const cnpjClean = novoConcorrente.cnpj.replace(/\D/g, '');
    
    if (!cnpjClean || cnpjClean.length !== 14 || !novoConcorrente.razaoSocial.trim()) {
      toast.error('Preencha o CNPJ e aguarde a busca automática dos dados');
      return;
    }

    if (concorrentes.some(c => c.cnpj.replace(/\D/g, '') === cnpjClean)) {
      toast.error('Este concorrente já foi adicionado');
      return;
    }

    const updatedConcorrentes = [...concorrentes, { ...novoConcorrente }];
    setConcorrentes(updatedConcorrentes);
    
    // 🔥 CRÍTICO: Salvar imediatamente para persistência
    if (onSave) {
      const dataToSave = {
        ...formData,
        concorrentesDiretos: updatedConcorrentes,
      };
      onSave(dataToSave);
    }
    
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
      urlParaScan: '',
    });
    setCnpjConcorrenteEncontrado(false);
    cnpjConcorrenteUltimoBuscadoRef.current = '';
    
    toast.success('Concorrente adicionado!');
  };

  // 🔥 NOVO: Remover concorrente
  const removerConcorrente = (index: number) => {
    const updatedConcorrentes = concorrentes.filter((_, i) => i !== index);
    setConcorrentes(updatedConcorrentes);
    
    // 🔥 CRÍTICO: Salvar imediatamente para persistência
    if (onSave) {
      const dataToSave = {
        ...formData,
        concorrentesDiretos: updatedConcorrentes,
      };
      onSave(dataToSave);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!formData.cnpj || !formData.email) {
      alert('Preencha CNPJ e Email');
      return;
    }

    if (!cnpjData) {
      alert('Por favor, busque os dados do CNPJ antes de continuar');
      return;
    }

    // Incluir dados encontrados no CNPJ + concorrentes
    onNext({
      ...formData,
      // Dados administrativos (buscados automaticamente)
      razaoSocial: cnpjData.nome || formData.cnpj,
      nomeFantasia: cnpjData.fantasia || '',
      situacaoCadastral: cnpjData.situacao || '',
      dataAbertura: cnpjData.abertura || '',
      naturezaJuridica: cnpjData.natureza_juridica || '',
      capitalSocial: cnpjData.capital_social || null,
      porteEmpresa: cnpjData.porte || '',
      endereco: cnpjData ? {
        logradouro: cnpjData.logradouro || '',
        numero: cnpjData.numero || '',
        complemento: cnpjData.complemento || '',
        bairro: cnpjData.bairro || '',
        cep: cnpjData.cep || '',
        cidade: cnpjData.municipio || '',
        estado: cnpjData.uf || '',
      } : null,
      cnaes: cnpjData?.atividade_principal ? [
        cnpjData.atividade_principal[0]?.code,
        ...(cnpjData.atividades_secundarias || []).map((a: any) => a.code)
      ].filter(Boolean) : [],
      // 🔥 NOVO: Incluir concorrentes
      concorrentesDiretos: concorrentes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <CardTitle className="text-2xl font-bold text-foreground mb-2">
          Dados Básicos da Empresa
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Informe os dados principais da sua empresa
        </CardDescription>
      </div>

      {/* CNPJ com Busca Automática */}
      <div>
        <Label htmlFor="cnpj" className="text-foreground">
          CNPJ *
        </Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="cnpj"
            type="text"
            value={formData.cnpj}
            onChange={(e) => {
              setFormData({ ...formData, cnpj: e.target.value });
              setCnpjData(null);
              setCnpjError(null);
            }}
            placeholder="00.000.000/0000-00"
            className="flex-1"
            required
          />
          <Button
            type="button"
            onClick={handleCNPJSearch}
            disabled={loadingCNPJ || !formData.cnpj}
            className="flex items-center gap-2"
          >
            {loadingCNPJ ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar Dados'
            )}
          </Button>
        </div>
        {cnpjError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cnpjError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Dados Encontrados (Read-Only) */}
      {cnpjData && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-900 dark:text-green-100">
                Dados Encontrados Automaticamente
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Razão Social:</span>
                <p className="font-medium text-foreground">{cnpjData.nome}</p>
              </div>
              {cnpjData.fantasia && (
                <div>
                  <span className="text-muted-foreground">Nome Fantasia:</span>
                  <p className="font-medium text-foreground">{cnpjData.fantasia}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Situação:</span>
                <p className="font-medium text-foreground">{cnpjData.situacao}</p>
              </div>
              {cnpjData.abertura && (
                <div>
                  <span className="text-muted-foreground">Data de Abertura:</span>
                  <p className="font-medium text-foreground">{cnpjData.abertura}</p>
                </div>
              )}
              {cnpjData.natureza_juridica && (
                <div>
                  <span className="text-muted-foreground">Natureza Jurídica:</span>
                  <p className="font-medium text-foreground">{cnpjData.natureza_juridica}</p>
                </div>
              )}
              {cnpjData.capital_social && (
                <div>
                  <span className="text-muted-foreground">Capital Social:</span>
                  <p className="font-medium text-foreground">R$ {Number(cnpjData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {cnpjData.porte && (
                <div>
                  <span className="text-muted-foreground">Porte:</span>
                  <p className="font-medium text-foreground">{cnpjData.porte}</p>
                </div>
              )}
              {cnpjData.atividade_principal?.[0] && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">CNAE Principal:</span>
                  <p className="font-medium text-foreground">{cnpjData.atividade_principal[0].code} - {cnpjData.atividade_principal[0].text}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campos Manuais */}
      <div>
        <Label htmlFor="email" className="text-foreground">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contato@empresa.com.br"
          className="mt-2"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          O email informado será usado para notificações e recuperação de conta
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="website" className="text-foreground">
            Website
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://exemplo.com.br"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScanTenantWebsite}
              disabled={scanningTenantWebsite || !formData.website || !tenant?.id}
              title="Escanear produtos do website"
            >
              {scanningTenantWebsite ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
          {tenantProductsCount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <Package className="h-3 w-3" />
              {tenantProductsCount} produtos extraídos
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="telefone" className="text-foreground">
            Telefone
          </Label>
          <Input
            id="telefone"
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="mt-2"
          />
        </div>
      </div>

      {/* 🔥 NOVO: Catálogo de Produtos do Tenant */}
      <Separator className="my-6" />
      
      <Collapsible open={productsCatalogOpen} onOpenChange={setProductsCatalogOpen}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo de Produtos
            </h3>
            <p className="text-sm text-muted-foreground">
              Gerencie seus produtos para cálculo de FIT com prospects. Cadastre manualmente ou extraia do website.
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              {productsCatalogOpen ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar Catálogo
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Abrir Catálogo
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <TenantProductsCatalog />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* 🔥 NOVO: Seção de Concorrentes */}
      <Separator className="my-6" />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">🏆 Meus Concorrentes</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre seus concorrentes para análise competitiva. O CNPJ busca dados automaticamente.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={adicionarConcorrente}
            disabled={!cnpjConcorrenteEncontrado}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Concorrente
          </Button>
        </div>

        {/* Formulário de Novo Concorrente */}
        <Card className="mb-4 border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>CNPJ do Concorrente</Label>
              <Input
                value={novoConcorrente.cnpj}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '');
                  let formatted = clean;
                  if (clean.length > 2) formatted = clean.substring(0, 2) + '.' + clean.substring(2);
                  if (clean.length > 5) formatted = formatted.substring(0, 6) + '.' + clean.substring(5);
                  if (clean.length > 8) formatted = formatted.substring(0, 10) + '/' + clean.substring(8);
                  if (clean.length > 12) formatted = formatted.substring(0, 15) + '-' + clean.substring(12);
                  setNovoConcorrente({ ...novoConcorrente, cnpj: formatted });
                }}
                placeholder="00.000.000/0000-00"
                className="w-full"
              />
              {buscandoCNPJConcorrente && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando dados...
                </p>
              )}
              {cnpjConcorrenteEncontrado && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Dados encontrados! Preencha a URL e clique em "Adicionar Concorrente"
                </p>
              )}
              {erroCNPJConcorrente && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{erroCNPJConcorrente}</p>
              )}
            </div>

            {/* Dados Encontrados - Card Completo */}
            {cnpjConcorrenteEncontrado && (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-green-900 dark:text-green-100 text-base">
                      Dados Encontrados Automaticamente
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Razão Social:</span>
                      <p className="font-medium text-foreground">{novoConcorrente.razaoSocial}</p>
                    </div>
                    {novoConcorrente.nomeFantasia && (
                      <div>
                        <span className="text-muted-foreground">Nome Fantasia:</span>
                        <p className="font-medium text-foreground">{novoConcorrente.nomeFantasia}</p>
                      </div>
                    )}
                    {novoConcorrente.setor && (
                      <div>
                        <span className="text-muted-foreground">Setor:</span>
                        <p className="font-medium text-foreground">{novoConcorrente.setor}</p>
                      </div>
                    )}
                    {(novoConcorrente.cidade || novoConcorrente.estado) && (
                      <div>
                        <span className="text-muted-foreground">Localização:</span>
                        <p className="font-medium text-foreground">
                          {novoConcorrente.cidade}{novoConcorrente.cidade && novoConcorrente.estado ? ', ' : ''}{novoConcorrente.estado}
                        </p>
                      </div>
                    )}
                    {novoConcorrente.capitalSocial > 0 && (
                      <div>
                        <span className="text-muted-foreground">Capital Social:</span>
                        <p className="font-medium text-foreground">
                          R$ {novoConcorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {novoConcorrente.cnaePrincipal && (
                      <div>
                        <span className="text-muted-foreground">CNAE Principal:</span>
                        <p className="font-mono text-xs text-foreground">{novoConcorrente.cnaePrincipal}</p>
                      </div>
                    )}
                    {novoConcorrente.cnaePrincipalDescricao && (
                      <div className="col-span-2 md:col-span-3">
                        <span className="text-muted-foreground">Descrição CNAE:</span>
                        <p className="text-xs text-foreground">{novoConcorrente.cnaePrincipalDescricao}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* URL para Scan */}
                  <div className="mt-4 space-y-2">
                    <Label>URL para Scan (Website, Instagram, LinkedIn)</Label>
                    <Input
                      value={novoConcorrente.urlParaScan || ''}
                      onChange={(e) => setNovoConcorrente({ ...novoConcorrente, urlParaScan: e.target.value })}
                      placeholder="https://exemplo.com.br ou instagram.com/empresa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe a URL para extrair produtos automaticamente
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Lista de Concorrentes Cadastrados */}
        {concorrentes.length > 0 && (
          <div className="space-y-3">
            {concorrentes.map((concorrente, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Nome da Empresa */}
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
                      
                      {/* Dados Completos - Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">CNPJ:</span>
                          <div className="font-mono text-foreground">{concorrente.cnpj}</div>
                        </div>
                        {concorrente.setor && (
                          <div>
                            <span className="font-medium text-muted-foreground">Setor:</span>
                            <div className="text-foreground">{concorrente.setor}</div>
                          </div>
                        )}
                        {(concorrente.cidade || concorrente.estado) && (
                          <div>
                            <span className="font-medium text-muted-foreground">Localização:</span>
                            <div className="text-foreground">
                              {concorrente.cidade}{concorrente.cidade && concorrente.estado ? ', ' : ''}{concorrente.estado}
                            </div>
                          </div>
                        )}
                        {concorrente.capitalSocial > 0 && (
                          <div>
                            <span className="font-medium text-muted-foreground">Capital Social:</span>
                            <div className="text-foreground">
                              R$ {concorrente.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        )}
                        {concorrente.cnaePrincipal && (
                          <div>
                            <span className="font-medium text-muted-foreground">CNAE Principal:</span>
                            <div className="font-mono text-xs text-foreground">{concorrente.cnaePrincipal}</div>
                          </div>
                        )}
                        {concorrente.produtosExtraidos !== undefined && (
                          <div>
                            <span className="font-medium text-muted-foreground">Produtos Extraídos:</span>
                            <div className="text-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {concorrente.produtosExtraidos}
                            </div>
                          </div>
                        )}
                        {concorrente.cnaePrincipalDescricao && (
                          <div className="col-span-2 md:col-span-3">
                            <span className="font-medium text-muted-foreground">Descrição CNAE:</span>
                            <div className="text-xs text-foreground">{concorrente.cnaePrincipalDescricao}</div>
                          </div>
                        )}
                        {concorrente.website && (
                          <div>
                            <span className="font-medium text-muted-foreground">Website:</span>
                            <div className="text-blue-600 hover:underline">
                              <a href={concorrente.website} target="_blank" rel="noopener noreferrer">
                                {concorrente.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Campo URL + Botão Scan */}
                      <div className="mt-3 space-y-2">
                        <Label className="text-sm">URL para Extração de Produtos</Label>
                        <div className="flex gap-2">
                          <Input
                            value={concorrente.urlParaScan || ''}
                            onChange={(e) => {
                              const updated = [...concorrentes];
                              updated[index] = { ...updated[index], urlParaScan: e.target.value };
                              setConcorrentes(updated);
                              // Salvar ao editar
                              if (onSave) {
                                const dataToSave = {
                                  ...formData,
                                  concorrentesDiretos: updated,
                                };
                                onSave(dataToSave);
                              }
                            }}
                            placeholder="https://exemplo.com.br ou instagram.com/empresa"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleScanConcorrenteURL(concorrente, index)}
                            disabled={scanningConcorrente[index] || !concorrente.urlParaScan}
                            className="flex items-center gap-2"
                          >
                            {scanningConcorrente[index] ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Escaneando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Extrair Produtos
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Informe a URL (website, Instagram, LinkedIn) para extrair produtos automaticamente
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerConcorrente(index)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Botões de Navegação */}
      <StepNavigation
        onBack={() => {
          // Se estiver na primeira página, voltar para dashboard
          if (window.confirm('Deseja cancelar o cadastro e voltar ao dashboard?')) {
            window.location.href = '/dashboard';
          }
        }}
        onNext={handleSubmit}
        onSave={onSave}
        showSave={!!onSave}
        saveLoading={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        showBack={true}
        backLabel="Cancelar"
        nextLabel="Próximo →"
        nextDisabled={!cnpjData}
      />
    </form>
  );
}

