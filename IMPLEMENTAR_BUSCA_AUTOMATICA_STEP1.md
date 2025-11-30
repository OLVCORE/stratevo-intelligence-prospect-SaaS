# 🚀 IMPLEMENTAR BUSCA AUTOMÁTICA NO STEP 1

## 📋 OBJETIVO
Modificar `Step1DadosBasicos.tsx` para buscar dados administrativos automaticamente via API quando CNPJ for informado.

---

## 🔧 IMPLEMENTAÇÃO

### 1. Modificar `Step1DadosBasicos.tsx`

**Mudanças:**
- Adicionar estado de loading ao buscar CNPJ
- Adicionar função `handleCNPJSearch` que busca dados via API
- Exibir dados encontrados (read-only)
- Remover campos administrativos do formulário (buscar automaticamente)
- Manter apenas: CNPJ, Email, Website, Telefone

### 2. Usar API Existente

**Arquivo:** `src/services/receitaFederal.ts` (já existe)

```typescript
import { buscarDadosReceitaFederal } from '@/services/receitaFederal';

// Ao preencher CNPJ, buscar automaticamente
const receitaData = await buscarDadosReceitaFederal(cnpj);

// Dados retornados:
// - nome (razão social)
// - fantasia (nome fantasia)
// - situacao (situação cadastral)
// - abertura (data de abertura)
// - natureza_juridica
// - capital_social
// - endereco completo
// - telefone
// - email
// - cnaes
```

---

## 📝 CÓDIGO A IMPLEMENTAR

### Componente Modificado:

```typescript
// src/components/onboarding/steps/Step1DadosBasicos.tsx

'use client';

import { useState } from 'react';
import { buscarDadosReceitaFederal } from '@/services/receitaFederal';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function Step1DadosBasicos({ onNext, onBack, initialData }: Props) {
  const [formData, setFormData] = useState({
    cnpj: initialData?.cnpj || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    telefone: initialData?.telefone || '',
  });

  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [cnpjData, setCnpjData] = useState<any>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);

  // Buscar dados automaticamente ao preencher CNPJ
  const handleCNPJSearch = async () => {
    if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
      setCnpjError('CNPJ inválido');
      return;
    }

    setLoadingCNPJ(true);
    setCnpjError(null);

    try {
      const data = await buscarDadosReceitaFederal(formData.cnpj);
      
      if (data.error) {
        setCnpjError(data.error);
        return;
      }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cnpj || !formData.email) {
      alert('Preencha CNPJ e Email');
      return;
    }

    // Incluir dados encontrados no CNPJ
    onNext({
      ...formData,
      // Dados administrativos (buscados automaticamente)
      razaoSocial: cnpjData?.nome || formData.cnpj,
      nomeFantasia: cnpjData?.fantasia || '',
      situacaoCadastral: cnpjData?.situacao || '',
      dataAbertura: cnpjData?.abertura || '',
      naturezaJuridica: cnpjData?.natureza_juridica || '',
      capitalSocial: cnpjData?.capital_social || null,
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
      ] : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dados Básicos da Empresa
        </h2>
        <p className="text-gray-600">
          Informe o CNPJ e busque os dados automaticamente da Receita Federal
        </p>
      </div>

      {/* CNPJ com Busca Automática */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNPJ *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.cnpj}
            onChange={(e) => {
              setFormData({ ...formData, cnpj: e.target.value });
              setCnpjData(null);
              setCnpjError(null);
            }}
            placeholder="00.000.000/0000-00"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            required
          />
          <button
            type="button"
            onClick={handleCNPJSearch}
            disabled={loadingCNPJ || !formData.cnpj}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingCNPJ ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              'Buscar Dados'
            )}
          </button>
        </div>
        {cnpjError && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {cnpjError}
          </p>
        )}
      </div>

      {/* Dados Encontrados (Read-Only) */}
      {cnpjData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Dados Encontrados</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Razão Social:</span>
              <p className="font-medium">{cnpjData.nome}</p>
            </div>
            {cnpjData.fantasia && (
              <div>
                <span className="text-gray-600">Nome Fantasia:</span>
                <p className="font-medium">{cnpjData.fantasia}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Situação:</span>
              <p className="font-medium">{cnpjData.situacao}</p>
            </div>
            {cnpjData.abertura && (
              <div>
                <span className="text-gray-600">Data de Abertura:</span>
                <p className="font-medium">{cnpjData.abertura}</p>
              </div>
            )}
            {cnpjData.natureza_juridica && (
              <div>
                <span className="text-gray-600">Natureza Jurídica:</span>
                <p className="font-medium">{cnpjData.natureza_juridica}</p>
              </div>
            )}
            {cnpjData.capital_social && (
              <div>
                <span className="text-gray-600">Capital Social:</span>
                <p className="font-medium">R$ {cnpjData.capital_social.toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campos Manuais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="contato@empresa.com.br"
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://exemplo.com.br"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <input
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          disabled={!cnpjData}
        >
          Próximo →
        </button>
      </div>
    </form>
  );
}
```

---

## ✅ CHECKLIST

- [ ] Modificar `Step1DadosBasicos.tsx`
- [ ] Adicionar função `handleCNPJSearch`
- [ ] Adicionar exibição de dados encontrados (read-only)
- [ ] Remover campos administrativos do formulário
- [ ] Testar busca com CNPJ válido
- [ ] Testar tratamento de erros
- [ ] Atualizar `OnboardingWizard.tsx` para receber novos dados

---

**Próximo passo:** Implementar este código e testar!

