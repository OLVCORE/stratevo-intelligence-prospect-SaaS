/**
 * CSV Export Utility
 * Gera CSV com BOM para compatibilidade Excel
 * SEM MOCKS - dados reais sempre
 */
import Papa from 'papaparse';

export type CsvRow = Record<string, string | number | boolean | null | undefined>;

export function csvResponse(filename: string, rows: CsvRow[], headers?: string[]) {
  // Se precisar de streaming: adapte para ReadableStream; para 10–50k linhas isso atende.
  const csv = Papa.unparse(rows, { columns: headers });
  const body = '\uFEFF' + csv; // BOM
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

