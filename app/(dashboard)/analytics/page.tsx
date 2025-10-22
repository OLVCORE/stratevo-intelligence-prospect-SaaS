/**
 * Analytics Overview
 * Dashboard principal com links para os 4 painéis
 */
import Link from 'next/link';

export default function AnalyticsPage() {
  const dashboards = [
    {
      title: 'Funil',
      description: 'Busca → Enriquecimento → Decisores → Contato → Resposta → Reunião',
      href: '/analytics/funnel',
      icon: '📊',
    },
    {
      title: 'Playbooks',
      description: 'Desempenho por step/variante + evolução temporal',
      href: '/analytics/playbooks',
      icon: '🎯',
    },
    {
      title: 'Heatmap',
      description: 'Horário × Dia útil de envios e respostas',
      href: '/analytics/heatmap',
      icon: '🔥',
    },
    {
      title: 'Persona',
      description: 'Eficiência por persona (C-level, Compras, TI, etc.)',
      href: '/analytics/persona',
      icon: '👥',
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Analytics 360</h1>
          <p className="text-sm text-muted-foreground">
            Dashboards executivos com cache materializado (SLA &lt; 1.5s)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboards.map((dash) => (
            <Link
              key={dash.href}
              href={dash.href}
              className="block p-6 border rounded-lg hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{dash.icon}</div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">{dash.title}</h2>
                  <p className="text-sm text-muted-foreground">{dash.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <h3 className="font-medium mb-2">📝 Sobre os Dashboards</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>Cache Materializado:</strong> Views atualizadas a cada 5 min via cron
            </li>
            <li>
              <strong>Ver Dados:</strong> Todos os gráficos têm botão para ver JSON bruto
            </li>
            <li>
              <strong>Performance:</strong> SLA &lt; 1.5s (p95) para janelas de 30-90 dias
            </li>
            <li>
              <strong>Zero Mocks:</strong> Se não houver dados, mostra empty state claro
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

