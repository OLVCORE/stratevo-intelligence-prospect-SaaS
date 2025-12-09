/**
 * 🎯 RECOMMENDATION LIST - STRATEVO One
 * 
 * MC5: Componente de lista de recomendações consultivas
 * 
 * Exibe recomendações priorizadas com:
 * - Título e descrição
 * - Riscos de não agir
 * - Próxima ação
 * - Badges de prioridade e impacto
 */

interface MatchRecommendation {
  title: string;
  description: string;
  solutionType: 'product' | 'category' | 'service';
  solutionName: string;
  solutionCategory?: string;
  risksOfNotActing: string[];
  nextAction: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  relatedScore?: {
    score: number;
    factors: string[];
  };
}

interface RecommendationListProps {
  recommendations: MatchRecommendation[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  console.log('MC5:UI: list render', {
    recommendationsCount: recommendations?.length || 0,
  });

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Nenhuma recomendação disponível no momento.
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSolutionTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Produto';
      case 'category':
        return 'Categoria';
      case 'service':
        return 'Serviço';
      default:
        return 'Solução';
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <div
          key={i}
          className="border border-gray-200 p-4 rounded-lg space-y-3 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow"
        >
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{rec.title}</h4>
              {rec.solutionCategory && (
                <span className="text-xs text-gray-500">
                  {getSolutionTypeLabel(rec.solutionType)} • {rec.solutionCategory}
                </span>
              )}
            </div>
            {rec.relatedScore && (
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {rec.relatedScore.score}%
                </div>
                <div className="text-xs text-gray-500">Fit</div>
              </div>
            )}
          </div>

          {/* Descrição */}
          {rec.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{rec.description}</p>
          )}

          {/* Riscos e Ação */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {rec.risksOfNotActing && rec.risksOfNotActing.length > 0 && (
              <div>
                <strong className="text-xs text-gray-700 font-semibold">Riscos de não agir:</strong>
                <ul className="mt-1 space-y-1">
                  {rec.risksOfNotActing.map((risk, riskIdx) => (
                    <li key={riskIdx} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rec.nextAction && (
              <div>
                <strong className="text-xs text-gray-700 font-semibold">Próxima ação:</strong>
                <p className="text-xs text-gray-600 mt-1">{rec.nextAction}</p>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {rec.priority && (
              <span
                className={`text-xs px-2 py-1 rounded border ${getPriorityColor(rec.priority)}`}
              >
                Prioridade: {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            )}
            {rec.impact && (
              <span
                className={`text-xs px-2 py-1 rounded border ${getImpactColor(rec.impact)}`}
              >
                Impacto: {rec.impact === 'high' ? 'Alto' : rec.impact === 'medium' ? 'Médio' : 'Baixo'}
              </span>
            )}
          </div>

          {/* Fatores do score (se disponível) */}
          {rec.relatedScore && rec.relatedScore.factors && rec.relatedScore.factors.length > 0 && (
            <details className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              <summary className="cursor-pointer hover:text-gray-700">
                Ver fatores de fit ({rec.relatedScore.factors.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4">
                {rec.relatedScore.factors.slice(0, 3).map((factor, factorIdx) => (
                  <li key={factorIdx} className="list-disc">{factor}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

