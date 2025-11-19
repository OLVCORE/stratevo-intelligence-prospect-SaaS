// src/components/onboarding/steps/Step2AtividadesCNAEs.tsx

'use client';

import { useState } from 'react';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

export function Step2AtividadesCNAEs({ onNext, onBack, initialData }: Props) {
  const [formData, setFormData] = useState({
    cnaePrincipal: initialData?.cnaePrincipal || '',
    cnaesSecundarios: initialData?.cnaesSecundarios || [],
    descricaoAtividade: initialData?.descricaoAtividade || '',
    produtosServicos: initialData?.produtosServicos || [],
  });

  const [novoCNAE, setNovoCNAE] = useState('');
  const [novoProduto, setNovoProduto] = useState({ nome: '', categoria: '', descricao: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cnaePrincipal || !formData.descricaoAtividade) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Atividades e CNAEs
        </h2>
        <p className="text-gray-600">
          Defina o que sua empresa faz
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNAE Principal *
        </label>
        <input
          type="text"
          value={formData.cnaePrincipal}
          onChange={(e) => setFormData({ ...formData, cnaePrincipal: e.target.value })}
          placeholder="Ex: 6201-5/00"
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CNAEs Secundários (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={novoCNAE}
            onChange={(e) => setNovoCNAE(e.target.value)}
            placeholder="Ex: 6202-3/00"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={() => {
              if (novoCNAE.trim()) {
                setFormData({
                  ...formData,
                  cnaesSecundarios: [...formData.cnaesSecundarios, novoCNAE.trim()],
                });
                setNovoCNAE('');
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição das Atividades *
        </label>
        <textarea
          value={formData.descricaoAtividade}
          onChange={(e) => setFormData({ ...formData, descricaoAtividade: e.target.value })}
          placeholder="Descreva as principais atividades da empresa..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Produtos/Serviços
        </label>
        <div className="space-y-2">
          {formData.produtosServicos.map((produto: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{produto.nome}</span>
                <span className="text-sm text-gray-500 ml-2">({produto.categoria})</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    produtosServicos: formData.produtosServicos.filter((_: any, i: number) => i !== index),
                  })
                }
                className="text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={novoProduto.nome}
            onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
            placeholder="Nome do produto/serviço"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="text"
            value={novoProduto.categoria}
            onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
            placeholder="Categoria"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />
          <button
            type="button"
            onClick={() => {
              if (novoProduto.nome.trim()) {
                setFormData({
                  ...formData,
                  produtosServicos: [...formData.produtosServicos, { ...novoProduto }],
                });
                setNovoProduto({ nome: '', categoria: '', descricao: '' });
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Adicionar Produto/Serviço
          </button>
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

