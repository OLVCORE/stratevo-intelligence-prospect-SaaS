/**
 * 🎯 MATCH & FIT DASHBOARD - STRATEVO One
 * 
 * MC5: Componente principal para visualização do resultado Match & Fit
 * 
 * Exibe:
 * - Scores de aderência (radar)
 * - Recomendações consultivas
 * - Resumo executivo
 * - Metadados
 */

import ScoreRadar from './ScoreRadar';
import RecommendationList from './RecommendationList';

interface MatchScore {
  referenceType: 'icp' | 'product';
  referenceId: string;
  referenceName: string;
  score: number;
  factors: string[];
  breakdown?: {
    sectorMatch?: number;
    cnaeMatch?: number;
    sizeMatch?: number;
    regionMatch?: number;
    painMatch?: number;
    interestMatch?: number;
  };
}

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
  relatedScore?: MatchScore;
}

interface MatchFitResult {
  scores: MatchScore[];
  recommendations: MatchRecommendation[];
  executiveSummary: string;
  metadata: {
    totalIcpEvaluated: number;
    totalProductsEvaluated: number;
    bestFitScore: number;
    bestFitType: 'icp' | 'product' | 'none';
    dataCompleteness: 'complete' | 'partial' | 'insufficient';
    missingData: string[];
  };
}

interface MatchFitDashboardProps {
  matchFit: MatchFitResult | null | undefined;
}

export default function MatchFitDashboard({ matchFit }: MatchFitDashboardProps) {
  console.log('MC5:UI: dashboard render', {
    hasMatchFit: !!matchFit,
    scoresCount: matchFit?.scores?.length || 0,
    recommendationsCount: matchFit?.recommendations?.length || 0,
  });

  if (!matchFit) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-sm text-gray-500">
          Match & Fit em processamento…
        </p>
      </div>
    );
  }

  const { scores, recommendations, executiveSummary, metadata } = matchFit;

  return (
    <div className="p-6 space-y-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900">STRATEVO One — Match & Fit</h2>
        {metadata.dataCompleteness !== 'complete' && (
          <p className="text-xs text-amber-600 mt-1">
            {metadata.dataCompleteness === 'partial' 
              ? '⚠️ Dados parciais - alguns dados podem estar faltando'
              : '⚠️ Dados insuficientes - recomenda-se complementar informações'}
          </p>
        )}
      </div>

      {/* Scores Radar */}
      {scores && scores.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Scores de Aderência</h3>
          <ScoreRadar scores={scores} />
          <div className="mt-4 text-xs text-gray-500 text-center">
            Melhor fit: {metadata.bestFitScore}% ({metadata.bestFitType === 'icp' ? 'ICP' : metadata.bestFitType === 'product' ? 'Produto' : 'N/A'})
          </div>
        </section>
      )}

      {/* Recomendações */}
      {recommendations && recommendations.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Recomendações</h3>
          <RecommendationList recommendations={recommendations} />
        </section>
      )}

      {/* Resumo Executivo */}
      {executiveSummary && (
        <section className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumo Executivo</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{executiveSummary}</p>
        </section>
      )}

      {/* Metadados (debug - opcional) */}
      {process.env.NODE_ENV === 'development' && metadata && (
        <details className="text-xs text-gray-500 border-t border-gray-200 pt-4">
          <summary className="cursor-pointer">Metadados (debug)</summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

