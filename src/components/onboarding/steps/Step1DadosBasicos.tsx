// src/components/onboarding/steps/Step1DadosBasicos.tsx

'use client';

import { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

export function Step1DadosBasicos({ onNext, onBack, initialData }: Props) {
  const [formData, setFormData] = useState({
    cnpj: initialData?.cnpj || '',
    razaoSocial: initialData?.razaoSocial || '',
    nomeFantasia: initialData?.nomeFantasia || '',
    website: initialData?.website || '',
    telefone: initialData?.telefone || '',
    email: initialData?.email || '',
    setorPrincipal: initialData?.setorPrincipal || '',
    porteEmpresa: initialData?.porteEmpresa || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.cnpj || !formData.razaoSocial || !formData.email) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dados Básicos da Empresa
        </h2>
        <p className="text-gray-600">
          Informe os dados principais da sua empresa
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ *
          </label>
          <input
            type="text"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razão Social *
          </label>
          <input
            type="text"
            value={formData.razaoSocial}
            onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
            placeholder="Nome da empresa"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome Fantasia
        </label>
        <input
          type="text"
          value={formData.nomeFantasia}
          onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
          placeholder="Nome comercial"
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
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
            Setor Principal
          </label>
          <select
            value={formData.setorPrincipal}
            onChange={(e) => setFormData({ ...formData, setorPrincipal: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Selecione...</option>
            <option value="Agronegócio">Agronegócio</option>
            <option value="Construção Civil">Construção Civil</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Serviços">Serviços</option>
            <option value="Varejo">Varejo</option>
            <option value="Indústria">Indústria</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Porte da Empresa
          </label>
          <select
            value={formData.porteEmpresa}
            onChange={(e) => setFormData({ ...formData, porteEmpresa: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">Selecione...</option>
            <option value="Micro">Micro</option>
            <option value="Pequena">Pequena</option>
            <option value="Média">Média</option>
            <option value="Grande">Grande</option>
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Próximo →
        </button>
      </div>
    </form>
  );
}

