/**
 * 📄 GERADOR DE PDF PARA RELATÓRIO TOTVS
 * 
 * Gera PDF profissional e completo do relatório TOTVS Check
 * Inclui todas as 10 abas com formatação corporativa
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Snapshot } from '@/components/icp/tabs/snapshotReport';

interface PDFOptions {
  companyName?: string;
  cnpj?: string;
  generatedAt?: Date;
}

/**
 * Gera PDF completo do relatório TOTVS
 */
export async function generateTOTVSPDF(
  snapshot: Snapshot,
  options: PDFOptions = {}
): Promise<void> {
  const { companyName = 'Empresa', cnpj, generatedAt = new Date() } = options;
  
  console.log('[PDF] 📄 Iniciando geração de PDF...');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // 🎨 CORES CORPORATIVAS
  const colors = {
    primary: [0, 102, 204],      // Azul TOTVS
    success: [34, 197, 94],      // Verde
    danger: [239, 68, 68],       // Vermelho
    warning: [234, 179, 8],      // Amarelo
    dark: [30, 41, 59],          // Slate
    light: [241, 245, 249],      // Slate claro
  };
  
  // 📋 CAPA
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO TOTVS CHECK', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, pageWidth / 2, 45, { align: 'center' });
  
  if (cnpj) {
    doc.setFontSize(12);
    doc.text(`CNPJ: ${cnpj}`, pageWidth / 2, 52, { align: 'center' });
  }
  
  doc.setTextColor(...colors.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Gerado em: ${generatedAt.toLocaleDateString('pt-BR')} às ${generatedAt.toLocaleTimeString('pt-BR')}`,
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  
  // Nova página para conteúdo
  doc.addPage();
  yPosition = margin;
  
  // 📊 SUMÁRIO EXECUTIVO
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('SUMÁRIO EXECUTIVO', margin, yPosition);
  yPosition += 10;
  
  // Status TOTVS
  const detectionReport = snapshot.tabs.detection_report || snapshot.tabs.keywords_report;
  if (detectionReport) {
    const status = detectionReport.status || 'unknown';
    const statusText = status === 'go' ? '✅ NÃO É CLIENTE TOTVS' 
                      : status === 'no-go' ? '❌ CLIENTE TOTVS' 
                      : '⚠️ REVISAR';
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text('Status:', margin, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(
      status === 'go' ? colors.success[0] :
      status === 'no-go' ? colors.danger[0] :
      colors.warning[0]
    );
    doc.text(statusText, margin + 25, yPosition);
    yPosition += 8;
    
    // Métricas
    const tripleMatches = detectionReport.triple_matches || detectionReport.evidences?.filter((e: any) => e.match_type === 'triple').length || 0;
    const doubleMatches = detectionReport.double_matches || detectionReport.evidences?.filter((e: any) => e.match_type === 'double').length || 0;
    const totalEvidences = detectionReport.evidences?.length || 0;
    const confidence = detectionReport.confidence || 'medium';
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.dark);
    doc.text(`Evidências Triple Match: ${tripleMatches}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Evidências Double Match: ${doubleMatches}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Total de Evidências: ${totalEvidences}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Confiança: ${confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}`, margin, yPosition);
    yPosition += 10;
  }
  
  // 📋 ÍNDICE DE ABAS
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('ÍNDICE DO RELATÓRIO', margin, yPosition);
  yPosition += 8;
  
  const tabNames: Record<string, string> = {
    detection_report: '1. Fit de Produtos',
    decisors_report: '2. Decisores & Contatos',
    digital_report: '3. Inteligência Digital',
    competitors_report: '4. Análise de Concorrentes',
    similar_companies_report: '5. Empresas Similares',
    clients_report: '6. Descoberta de Clientes',
    analysis_report: '7. Análise 360°',
    products_report: '8. Produtos Recomendados',
    opportunities_report: '9. Oportunidades',
    executive_report: '10. Sumário Executivo',
  };
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  
  Object.entries(tabNames).forEach(([key, name]) => {
    if (snapshot.tabs[key]) {
      doc.text(name, margin + 5, yPosition);
      yPosition += 6;
      
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
    }
  });
  
  // 📄 SEÇÕES POR ABA
  yPosition += 10;
  
  // 1. VERIFICAÇÃO TOTVS
  if (detectionReport) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('1. VERIFICAÇÃO TOTVS', margin, yPosition);
    yPosition += 8;
    
    // Tabela de evidências
    const evidences = detectionReport.evidences || [];
    if (evidences.length > 0) {
      const tableData = evidences.slice(0, 20).map((evidence: any, idx: number) => [
        idx + 1,
        evidence.match_type?.toUpperCase() || 'N/A',
        evidence.source_name || evidence.source || 'N/A',
        (evidence.title || '').substring(0, 50) + (evidence.title?.length > 50 ? '...' : ''),
        evidence.detected_products?.join(', ') || 'N/A',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Tipo', 'Fonte', 'Título', 'Produtos']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: colors.primary, textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 80 },
          4: { cellWidth: 50 },
        },
        margin: { left: margin, right: margin },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
      
      if (evidences.length > 20) {
        doc.setFontSize(10);
        doc.setTextColor(...colors.dark);
        doc.text(`... e mais ${evidences.length - 20} evidências`, margin, yPosition);
        yPosition += 8;
      }
    }
  }
  
  // 2. DECISORES
  const decisorsReport = snapshot.tabs.decisors_report;
  if (decisorsReport && decisorsReport.decisors) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('2. DECISORES & CONTATOS', margin, yPosition);
    yPosition += 8;
    
    const decisors = decisorsReport.decisors.slice(0, 15);
    const decisorsData = decisors.map((d: any) => [
      d.name || 'N/A',
      d.position || 'N/A',
      d.email || 'N/A',
      d.phone || 'N/A',
      d.department || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Nome', 'Cargo', 'Email', 'Telefone', 'Departamento']],
      body: decisorsData,
      theme: 'striped',
      headStyles: { fillColor: colors.primary, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // 3. COMPETIDORES
  const competitorsReport = snapshot.tabs.competitors_report;
  if (competitorsReport && competitorsReport.knownCompetitors) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('3. ANÁLISE DE CONCORRENTES', margin, yPosition);
    yPosition += 8;
    
    const competitors = competitorsReport.knownCompetitors.slice(0, 10);
    const competitorsData = competitors.map((c: any) => [
      c.competitor_name || 'N/A',
      c.product_name || 'N/A',
      c.confidence || 'N/A',
      c.evidences?.length || 0,
      c.total_score || 0,
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Concorrente', 'Produto', 'Confiança', 'Evidências', 'Score']],
      body: competitorsData,
      theme: 'striped',
      headStyles: { fillColor: colors.primary, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // 4. PRODUTOS RECOMENDADOS
  const productsReport = snapshot.tabs.products_report;
  if (productsReport && productsReport.primary_opportunities) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('4. PRODUTOS RECOMENDADOS', margin, yPosition);
    yPosition += 8;
    
    const products = [
      ...(productsReport.primary_opportunities || []),
      ...(productsReport.relevant_opportunities || []),
    ].slice(0, 15);
    
    const productsData = products.map((p: any) => [
      p.name || 'N/A',
      p.category || 'N/A',
      p.value || 'N/A',
      p.fit_score || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Categoria', 'Valor Estimado', 'Fit Score']],
      body: productsData,
      theme: 'striped',
      headStyles: { fillColor: colors.primary, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // 5. OPORTUNIDADES
  const opportunitiesReport = snapshot.tabs.opportunities_report;
  if (opportunitiesReport) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('5. OPORTUNIDADES', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.dark);
    
    if (opportunitiesReport.primaryOpportunities) {
      doc.setFont('helvetica', 'bold');
      doc.text('Oportunidades Primárias:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      
      opportunitiesReport.primaryOpportunities.slice(0, 5).forEach((opp: any) => {
        doc.text(`• ${opp.name || 'N/A'}: ${opp.description || ''}`, margin + 5, yPosition);
        yPosition += 6;
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
      });
    }
  }
  
  // 📄 RODAPÉ EM TODAS AS PÁGINAS
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} | Relatório TOTVS Check - OLV Intelligence`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // 💾 DOWNLOAD
  const fileName = `Relatorio_TOTVS_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${generatedAt.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  console.log('[PDF] ✅ PDF gerado com sucesso:', fileName);
}

