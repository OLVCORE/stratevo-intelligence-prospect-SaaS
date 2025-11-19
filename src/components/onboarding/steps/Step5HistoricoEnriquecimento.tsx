// src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx

'use client';

import { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: any;
  isSubmitting?: boolean;
}

export function Step5HistoricoEnriquecimento({ onNext, onBack, initialData, isSubmitting }: Props) {
  const [formData, setFormData] = useState({
    clientesAtuais: initialData?.clientesAtuais || [],
    analisarComIA: initialData?.analisarComIA || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Histórico e Enriquecimento
        </h2>
        <p className="text-gray-600">
          Opcional: Adicione informações sobre clientes atuais para melhorar o ICP
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analisar com IA
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.analisarComIA}
            onChange={(e) => setFormData({ ...formData, analisarComIA: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Usar IA para analisar e melhorar o perfil ICP</span>
        </label>
      </div>

      {/* Botões */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Finalizar'}
        </button>
      </div>
    </form>
  );
}

