// src/components/onboarding/steps/Step4SituacaoAtual.tsx

'use client';

import { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

export function Step4SituacaoAtual({ onNext, onBack, initialData }: Props) {
  const [formData, setFormData] = useState({
    categoriaSolucao: initialData?.categoriaSolucao || '',
    diferenciais: initialData?.diferenciais || [],
    casosDeUso: initialData?.casosDeUso || [],
    ticketMedio: initialData?.ticketMedio || 0,
    cicloVendaMedia: initialData?.cicloVendaMedia || 0,
    concorrentesDiretos: initialData?.concorrentesDiretos || [],
  });

  const [novoDiferencial, setNovoDiferencial] = useState('');
  const [novoCasoUso, setNovoCasoUso] = useState('');
  const [novoConcorrente, setNovoConcorrente] = useState({ nome: '', website: '', diferencialDeles: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Situação Atual
        </h2>
        <p className="text-gray-600">
          Conte-nos sobre sua solução e mercado
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria da Solução
        </label>
        <input
          type="text"
          value={formData.categoriaSolucao}
          onChange={(e) => setFormData({ ...formData, categoriaSolucao: e.target.value })}
          placeholder="Ex: Software de Gestão, Consultoria, etc."
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diferenciais
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoDiferencial}
            onChange={(e) => setNovoDiferencial(e.target.value)}
            placeholder="Ex: Preço competitivo, Suporte 24/7"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={() => {
              if (novoDiferencial.trim()) {
                setFormData({
                  ...formData,
                  diferenciais: [...formData.diferenciais, novoDiferencial.trim()],
                });
                setNovoDiferencial('');
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ticket Médio (R$)
          </label>
          <input
            type="number"
            value={formData.ticketMedio}
            onChange={(e) => setFormData({ ...formData, ticketMedio: Number(e.target.value) })}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciclo de Venda Médio (dias)
          </label>
          <input
            type="number"
            value={formData.cicloVendaMedia}
            onChange={(e) => setFormData({ ...formData, cicloVendaMedia: Number(e.target.value) })}
            placeholder="0"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
        </div>
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

