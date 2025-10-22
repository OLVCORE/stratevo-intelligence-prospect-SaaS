/**
 * MaturityRadar - Gráfico radar de maturidade (6 pilares)
 * SEM MOCKS - se vazio, mostra empty state com CTA
 */
'use client';
import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

type ScoreData = {
  pillar: string;
  score: number;
  evidence: any[];
};

type Recommendation = {
  pillar: string;
  recommendation: string;
  rationale: string;
  priority: string;
  source?: string;
};

export default function MaturityRadar({ companyId }: { companyId: string }) {
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/${companyId}/maturity`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setScores(json.scores || []);
        setRecommendations(json.recommendations || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/${companyId}/maturity/refresh`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Erro');
      alert(`Maturidade calculada! ${json.recosCount} recomendações geradas.`);
      await load();
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading && scores.length === 0) {
    return <div className="text-sm opacity-70">Calculando maturidade...</div>;
  }

  if (scores.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Sem avaliação de maturidade ainda.</p>
        <p className="text-xs text-muted-foreground">
          Colete dados primeiro (Digital + Tech Stack + Decisores) e depois clique em <strong>"Atualizar
          Maturidade"</strong>.
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="border rounded px-4 py-2 hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Calculando...' : 'Atualizar Maturidade'}
        </button>
      </div>
    );
  }

  // Preparar dados para o radar
  const radarData = scores.map((s) => ({
    pillar: s.pillar.charAt(0).toUpperCase() + s.pillar.slice(1),
    score: s.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Radar de Maturidade (6 Pilares)</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="border rounded px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Recalculando...' : 'Atualizar Maturidade'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="pillar" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar name="Maturidade" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          <Tooltip
            content={({ payload }: any) => {
              if (!payload || !payload[0]) return null;
              const pillar = payload[0].payload.pillar.toLowerCase();
              const scoreData = scores.find((s) => s.pillar === pillar);
              if (!scoreData) return null;

              return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                  <div className="font-medium mb-2">
                    {pillar.charAt(0).toUpperCase() + pillar.slice(1)}: {scoreData.score}/100
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Evidências:</div>
                    {scoreData.evidence.map((e: any, i: number) => (
                      <div key={i} className="opacity-80">
                        • {e.signal} (+{e.weight})
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Recomendações ({recommendations.length})</h4>
          <div className="space-y-2">
            {recommendations.map((reco, i) => (
              <div key={i} className="border rounded p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{reco.recommendation}</div>
                    <div className="text-xs text-muted-foreground mt-1">{reco.rationale}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      reco.priority === 'alta'
                        ? 'bg-red-100 text-red-800'
                        : reco.priority === 'média'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reco.priority}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Pilar: {reco.pillar} • Fonte: {reco.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

