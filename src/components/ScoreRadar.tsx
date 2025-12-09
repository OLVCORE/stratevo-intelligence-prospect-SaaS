/**
 * 🎯 SCORE RADAR - STRATEVO One
 * 
 * MC5: Componente de visualização de scores em formato radar (SVG puro)
 * 
 * Exibe scores de fit (0-100) em formato radar chart
 */

interface MatchScore {
  referenceType: 'icp' | 'product';
  referenceId: string;
  referenceName: string;
  score: number;
  factors: string[];
}

interface ScoreRadarProps {
  scores: MatchScore[];
}

export default function ScoreRadar({ scores }: ScoreRadarProps) {
  console.log('MC5:UI: radar render', {
    scoresCount: scores?.length || 0,
  });

  if (!scores || scores.length === 0) {
    return null;
  }

  // Limitar a 8 scores para não ficar confuso
  const displayScores = scores.slice(0, 8);
  
  const size = 300;
  const center = size / 2;
  const maxRadius = 120;
  const angleStep = (Math.PI * 2) / displayScores.length;

  // Calcular pontos do polígono
  const points = displayScores.map((s, i) => {
    const angle = i * angleStep - Math.PI / 2; // Começar no topo
    const radius = (s.score / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      angle,
      score: s.score,
      name: s.referenceName,
      type: s.referenceType,
    };
  });

  // Criar path do polígono
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
    .concat(' Z');

  // Círculos de referência (25%, 50%, 75%, 100%)
  const referenceCircles = [25, 50, 75, 100].map(percent => ({
    radius: (percent / 100) * maxRadius,
    label: `${percent}%`,
  }));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mx-auto" viewBox={`0 0 ${size} ${size}`}>
        {/* Círculos de referência */}
        {referenceCircles.map((circle, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={circle.radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={i === referenceCircles.length - 1 ? '0' : '2,2'}
          />
        ))}

        {/* Linhas dos eixos */}
        {displayScores.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + maxRadius * Math.cos(angle);
          const y = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Polígono do radar */}
        <path
          d={pathData}
          fill="rgba(37, 99, 235, 0.3)"
          stroke="#2563eb"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Pontos e labels */}
        {points.map((point, i) => {
          const labelX = center + (maxRadius + 20) * Math.cos(point.angle);
          const labelY = center + (maxRadius + 20) * Math.sin(point.angle);
          
          return (
            <g key={i}>
              {/* Ponto */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#2563eb"
                stroke="white"
                strokeWidth="2"
              />
              {/* Label do score */}
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#2563eb"
                className="font-semibold"
              >
                {point.score}%
              </text>
              {/* Label do nome */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                className="text-gray-700"
              >
                {point.name.length > 20 ? point.name.substring(0, 20) + '...' : point.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda */}
      {displayScores.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
          {displayScores.map((score, i) => (
            <div
              key={i}
              className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  score.referenceType === 'product' ? 'bg-blue-500' : 'bg-indigo-500'
                }`}
              />
              <span className="text-gray-600">
                {score.referenceName}: {score.score}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

