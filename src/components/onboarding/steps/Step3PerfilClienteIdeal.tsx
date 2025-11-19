// src/components/onboarding/steps/Step3PerfilClienteIdeal.tsx

'use client';

import { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

const SETORES_OPCOES = [
  'Agronegócio',
  'Construção Civil',
  'Distribuição',
  'Educação',
  'Hotelaria',
  'Jurídico',
  'Logística',
  'Manufatura/Indústria',
  'Saúde',
  'Serviços',
  'Serviços Financeiros',
  'Varejo',
];

const ESTADOS_OPCOES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

const REGIOES_OPCOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

const PORTE_OPCOES = ['Micro', 'Pequena', 'Média', 'Grande'];

export function Step3PerfilClienteIdeal({ onNext, onBack, initialData }: Props) {
  const [formData, setFormData] = useState({
    setoresAlvo: initialData?.setoresAlvo || [],
    cnaesAlvo: initialData?.cnaesAlvo || [],
    porteAlvo: initialData?.porteAlvo || [],
    localizacaoAlvo: initialData?.localizacaoAlvo || {
      estados: [],
      regioes: [],
    },
    faturamentoAlvo: initialData?.faturamentoAlvo || {},
    funcionariosAlvo: initialData?.funcionariosAlvo || {},
    caracteristicasEspeciais: initialData?.caracteristicasEspeciais || [],
  });

  const [novoCNAE, setNovoCNAE] = useState('');
  const [novaCaracteristica, setNovaCaracteristica] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (formData.setoresAlvo.length === 0) {
      alert('Selecione pelo menos 1 setor-alvo');
      return;
    }

    if (formData.porteAlvo.length === 0) {
      alert('Selecione pelo menos 1 porte-alvo');
      return;
    }

    onNext(formData);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    } else {
      return [...array, item];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Perfil do Cliente Ideal (ICP)
        </h2>
        <p className="text-gray-600">
          Defina as características das empresas que você quer prospectar
        </p>
      </div>

      {/* Setores Alvo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Setores-Alvo * (selecione um ou mais)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SETORES_OPCOES.map((setor) => (
            <label
              key={setor}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                formData.setoresAlvo.includes(setor)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.setoresAlvo.includes(setor)}
                onChange={() =>
                  setFormData({
                    ...formData,
                    setoresAlvo: toggleArrayItem(formData.setoresAlvo, setor),
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">{setor}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CNAEs Alvo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNAEs-Alvo (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoCNAE}
            onChange={(e) => setNovoCNAE(e.target.value)}
            placeholder="Ex: 6201-5/00"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={() => {
              if (novoCNAE.trim()) {
                setFormData({
                  ...formData,
                  cnaesAlvo: [...formData.cnaesAlvo, novoCNAE.trim()],
                });
                setNovoCNAE('');
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            + Adicionar
          </button>
        </div>
        {formData.cnaesAlvo.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.cnaesAlvo.map((cnae, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {cnae}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      cnaesAlvo: formData.cnaesAlvo.filter((_, i) => i !== index),
                    })
                  }
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Porte Alvo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Porte-Alvo * (selecione um ou mais)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PORTE_OPCOES.map((porte) => (
            <label
              key={porte}
              className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                formData.porteAlvo.includes(porte)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.porteAlvo.includes(porte)}
                onChange={() =>
                  setFormData({
                    ...formData,
                    porteAlvo: toggleArrayItem(formData.porteAlvo, porte),
                  })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium">{porte}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Localização */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estados-Alvo
          </label>
          <select
            multiple
            value={formData.localizacaoAlvo.estados}
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setFormData({
                ...formData,
                localizacaoAlvo: {
                  ...formData.localizacaoAlvo,
                  estados: selected,
                },
              });
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32"
          >
            {ESTADOS_OPCOES.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Segure Ctrl/Cmd para selecionar múltiplos
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regiões-Alvo
          </label>
          <div className="space-y-2">
            {REGIOES_OPCOES.map((regiao) => (
              <label
                key={regiao}
                className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={formData.localizacaoAlvo.regioes.includes(regiao)}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      localizacaoAlvo: {
                        ...formData.localizacaoAlvo,
                        regioes: toggleArrayItem(
                          formData.localizacaoAlvo.regioes,
                          regiao
                        ),
                      },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm">{regiao}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Faturamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Faturamento Anual (opcional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
            <input
              type="number"
              value={formData.faturamentoAlvo.minimo || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  faturamentoAlvo: {
                    ...formData.faturamentoAlvo,
                    minimo: Number(e.target.value),
                  },
                })
              }
              placeholder="Ex: 1000000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Máximo</label>
            <input
              type="number"
              value={formData.faturamentoAlvo.maximo || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  faturamentoAlvo: {
                    ...formData.faturamentoAlvo,
                    maximo: Number(e.target.value),
                  },
                })
              }
              placeholder="Ex: 50000000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Funcionários */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantidade de Funcionários (opcional)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
            <input
              type="number"
              value={formData.funcionariosAlvo.minimo || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  funcionariosAlvo: {
                    ...formData.funcionariosAlvo,
                    minimo: Number(e.target.value),
                  },
                })
              }
              placeholder="Ex: 50"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Máximo</label>
            <input
              type="number"
              value={formData.funcionariosAlvo.maximo || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  funcionariosAlvo: {
                    ...formData.funcionariosAlvo,
                    maximo: Number(e.target.value),
                  },
                })
              }
              placeholder="Ex: 500"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
        </div>
      </div>

      {/* Características Especiais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Características Especiais (opcional)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Ex: "ISO 9001", "Exportador", "Frota própria 10+ veículos"
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={novaCaracteristica}
            onChange={(e) => setNovaCaracteristica(e.target.value)}
            placeholder="Digite uma característica"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={() => {
              if (novaCaracteristica.trim()) {
                setFormData({
                  ...formData,
                  caracteristicasEspeciais: [
                    ...formData.caracteristicasEspeciais,
                    novaCaracteristica.trim(),
                  ],
                });
                setNovaCaracteristica('');
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            + Adicionar
          </button>
        </div>
        {formData.caracteristicasEspeciais.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.caracteristicasEspeciais.map((carac, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {carac}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      caracteristicasEspeciais:
                        formData.caracteristicasEspeciais.filter(
                          (_, i) => i !== index
                        ),
                    })
                  }
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          ← Voltar
        </button>
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

