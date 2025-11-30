// src/components/onboarding/steps/Step1DadosBasicos.tsx

'use client';

import { useState, useEffect } from 'react';
import { consultarReceitaFederal } from '@/services/receitaFederal';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepNavigation } from '../StepNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
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

    // Incluir dados encontrados no CNPJ
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
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://exemplo.com.br"
            className="mt-2"
          />
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

