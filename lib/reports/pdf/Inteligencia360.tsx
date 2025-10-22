/**
 * PDF Template: Inteligência 360°
 * @react-pdf/renderer component
 * SEM MOCKS - renderiza "Sem dados coletados" quando vazio
 */
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ReportData } from '../compose';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, marginBottom: 8 },
  h2: { fontSize: 14, marginTop: 16, marginBottom: 6 },
  small: { color: '#666' },
  table: { marginTop: 8, borderTop: 1, borderColor: '#ddd' },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#eee', paddingVertical: 4 },
  cell: { flex: 1, paddingRight: 8 },
});

export default function Inteligencia360PDF({
  data,
  sections,
}: {
  data: ReportData;
  sections: string[];
}) {
  const c = data.company || {};
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>OLV Intelligence Prospect v2 — Inteligência 360°</Text>
        <Text>{c.name || c.trade_name || 'Empresa sem nome'}</Text>
        <Text style={styles.small}>
          CNPJ: {c.cnpj || '—'} · Domínio: {c.domain || '—'} · Atualizado: {c.updated_at || '—'}
        </Text>
        <Text style={{ marginTop: 12 }}>Gerado em: {new Date(data.generatedAt).toLocaleString()}</Text>

        {sections.includes('maturidade') && (
          <View>
            <Text style={styles.h2}>Maturidade (6 pilares)</Text>
            {(data.maturity?.pillars?.length
              ? data.maturity.pillars
              : [{ name: 'Sem dados coletados', score: 0, evidence: [] }]
            ).map((p, i) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.cell, { flex: 2 }]}>{p.name.toUpperCase()}</Text>
                <Text style={styles.cell}>Score: {p.score}</Text>
                <Text style={[styles.cell, { flex: 3 }]}>
                  Evidências:{' '}
                  {(p.evidence || [])
                    .slice(0, 3)
                    .map((e: any) => e.signal || e.name || 'evidência')
                    .join(', ') || '—'}
                </Text>
              </View>
            ))}
            <Text style={{ marginTop: 6 }}>Recomendações:</Text>
            {(data.maturity?.recos?.length
              ? data.maturity.recos
              : [{ pillar: '—', recommendation: 'Sem dados coletados', priority: 'média' }]
            ).map((r, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cell}>{r.pillar}</Text>
                <Text style={[styles.cell, { flex: 3 }]}>{r.recommendation}</Text>
                <Text style={styles.cell}>Prioridade: {r.priority}</Text>
              </View>
            ))}
          </View>
        )}

        {sections.includes('fit') && (
          <View>
            <Text style={styles.h2}>FIT TOTVS</Text>
            {(data.fit?.length
              ? data.fit
              : [{ area: '—', fit: 0, next_steps: 'Sem dados coletados' }]
            ).map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.cell}>{f.area}</Text>
                <Text style={styles.cell}>FIT: {f.fit}%</Text>
                <Text style={[styles.cell, { flex: 3 }]}>{f.next_steps || '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {sections.includes('decisores') && (
          <View>
            <Text style={styles.h2}>Decisores</Text>
            {(data.decisionMakers?.length
              ? data.decisionMakers
              : [{ name: 'Sem dados coletados' }]
            )
              .slice(0, 50)
              .map((d, i) => (
                <View key={i} style={styles.row}>
                  <Text style={[styles.cell, { flex: 2 }]}>{d.name}</Text>
                  <Text style={styles.cell}>{d.title || '—'}</Text>
                  <Text style={[styles.cell, { flex: 3 }]}>
                    {(d.contacts || [])
                      .slice(0, 2)
                      .map((c: any) => `${c.type}:${c.value}${c.verified ? ' ✓' : ''}`)
                      .join('  •  ') || '—'}
                  </Text>
                  <Text style={styles.cell}>Fonte: {d.source || '—'}</Text>
                </View>
              ))}
          </View>
        )}

        {sections.includes('digital') && (
          <View>
            <Text style={styles.h2}>Presença Digital & Tech Stack</Text>
            <Text>URLs principais:</Text>
            {data.digital?.homepage?.slice(0, 6).map((h: any, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.cell, { flex: 4 }]}>{h.url || h.page || '—'}</Text>
                {!!h.url && (
                  <Link style={styles.cell} src={h.url}>
                    abrir
                  </Link>
                )}
                <Text style={styles.cell}>{h.source || '—'}</Text>
              </View>
            )) || <Text>Sem dados coletados</Text>}
            <Text style={{ marginTop: 6 }}>Tecnologias detectadas:</Text>
            {data.digital?.tech?.slice(0, 12).map((t: any, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.cell, { flex: 2 }]}>{t.tech_name || t.name || '—'}</Text>
                <Text style={styles.cell}>Confiança: {t.confidence ?? '—'}</Text>
                <Text style={[styles.cell, { flex: 3 }]}>{t.source || '—'}</Text>
              </View>
            )) || <Text>Sem dados coletados</Text>}
          </View>
        )}
      </Page>
    </Document>
  );
}

