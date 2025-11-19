/**
 * 📊 SERVIÇO DE EXPORTAÇÃO DE DADOS
 * 
 * Exporta evidências e relatórios em diversos formatos (CSV, Excel, JSON)
 */

import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface Evidence {
  url: string;
  title: string;
  snippet?: string;
  content?: string;
  match_type: 'single' | 'double' | 'triple';
  source?: string;
  source_name?: string;
  detected_products?: string[];
  intent_keywords?: string[];
  validation_method?: 'ai' | 'basic';
  has_intent?: boolean;
  weight?: number;
  date_found?: string;
}

/**
 * Exporta evidências para CSV
 */
export function exportEvidencesToCSV(evidences: Evidence[], filename: string = 'evidencias-totvs'): void {
  try {
    // Preparar dados para CSV
    const csvData = evidences.map((e, index) => ({
      '#': index + 1,
      'Tipo Match': e.match_type.toUpperCase(),
      'Título': e.title || '',
      'URL': e.url || '',
      'Conteúdo': (e.content || e.snippet || '').substring(0, 500),
      'Fonte': e.source_name || e.source || '',
      'Produtos Detectados': (e.detected_products || []).join('; '),
      'Keywords Intenção': (e.intent_keywords || []).join('; '),
      'Tem Intenção': e.has_intent ? 'Sim' : 'Não',
      'Validação': e.validation_method === 'ai' ? 'IA' : 'Básica',
      'Score': e.weight || 0,
      'Data Encontrada': e.date_found || '',
    }));

    // Converter para CSV
    const headers = Object.keys(csvData[0] || {});
    const csvRows = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar vírgulas e aspas
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('✅ CSV exportado com sucesso!');
  } catch (error: any) {
    console.error('[EXPORT] ❌ Erro ao exportar CSV:', error);
    toast.error('Erro ao exportar CSV', { description: error.message });
  }
}

/**
 * Exporta evidências para Excel (XLSX)
 */
export function exportEvidencesToExcel(evidences: Evidence[], filename: string = 'evidencias-totvs'): void {
  try {
    // Preparar dados
    const excelData = evidences.map((e, index) => ({
      '#': index + 1,
      'Tipo Match': e.match_type.toUpperCase(),
      'Título': e.title || '',
      'URL': e.url || '',
      'Conteúdo': (e.content || e.snippet || '').substring(0, 500),
      'Fonte': e.source_name || e.source || '',
      'Produtos Detectados': (e.detected_products || []).join('; '),
      'Keywords Intenção': (e.intent_keywords || []).join('; '),
      'Tem Intenção': e.has_intent ? 'Sim' : 'Não',
      'Validação': e.validation_method === 'ai' ? 'IA' : 'Básica',
      'Score': e.weight || 0,
      'Data Encontrada': e.date_found || '',
    }));

    // Criar workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 5 },   // #
      { wch: 12 },  // Tipo Match
      { wch: 50 },  // Título
      { wch: 40 },  // URL
      { wch: 60 },  // Conteúdo
      { wch: 20 },  // Fonte
      { wch: 30 },  // Produtos
      { wch: 30 },  // Keywords
      { wch: 12 },  // Tem Intenção
      { wch: 12 },  // Validação
      { wch: 8 },   // Score
      { wch: 15 },  // Data
    ];
    ws['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Evidências');

    // Criar segunda aba com resumo
    const summaryData = [
      { Métrica: 'Total de Evidências', Valor: evidences.length },
      { Métrica: 'Triple Match', Valor: evidences.filter(e => e.match_type === 'triple').length },
      { Métrica: 'Double Match', Valor: evidences.filter(e => e.match_type === 'double').length },
      { Métrica: 'Single Match', Valor: evidences.filter(e => e.match_type === 'single').length },
      { Métrica: 'Com Intenção de Compra', Valor: evidences.filter(e => e.has_intent).length },
      { Métrica: 'Validado por IA', Valor: evidences.filter(e => e.validation_method === 'ai').length },
      { Métrica: 'Score Total', Valor: evidences.reduce((sum, e) => sum + (e.weight || 0), 0) },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

    // Exportar
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success('✅ Excel exportado com sucesso!');
  } catch (error: any) {
    console.error('[EXPORT] ❌ Erro ao exportar Excel:', error);
    toast.error('Erro ao exportar Excel', { description: error.message });
  }
}

/**
 * Exporta evidências para JSON
 */
export function exportEvidencesToJSON(evidences: Evidence[], filename: string = 'evidencias-totvs'): void {
  try {
    const jsonContent = JSON.stringify(evidences, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('✅ JSON exportado com sucesso!');
  } catch (error: any) {
    console.error('[EXPORT] ❌ Erro ao exportar JSON:', error);
    toast.error('Erro ao exportar JSON', { description: error.message });
  }
}

/**
 * Exporta gráfico como imagem PNG
 */
export function exportChartAsPNG(chartId: string, filename: string = 'grafico'): void {
  try {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      toast.error('Gráfico não encontrado');
      return;
    }

    // Usar html2canvas se disponível, senão usar SVG
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      }).then((canvas) => {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        toast.success('✅ Gráfico exportado como PNG!');
      });
    }).catch(() => {
      // Fallback: tentar exportar SVG
      const svg = chartElement.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.svg`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('✅ Gráfico exportado como SVG!');
      } else {
        toast.error('Não foi possível exportar o gráfico');
      }
    });
  } catch (error: any) {
    console.error('[EXPORT] ❌ Erro ao exportar gráfico:', error);
    toast.error('Erro ao exportar gráfico', { description: error.message });
  }
}

