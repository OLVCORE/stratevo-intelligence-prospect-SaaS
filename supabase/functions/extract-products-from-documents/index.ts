/**
 * Edge Function: Extração de Produtos de Documentos
 * 
 * VERSÃO MELHORADA - Usa OpenAI + OCR para extrair produtos de:
 * - PDFs (com pdf-parse)
 * - Excel/CSV (com read-excel-file)
 * - Word (conversão básica)
 * - Imagens (OCR via OpenAI Vision)
 * - TXT (leitura direta)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfParse from 'npm:pdf-parse@1.1.1';
import readXlsxFile from 'npm:read-excel-file@5.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ExtractRequest {
  tenant_id: string;
  document_ids: string[];
}

interface ExtractedProduct {
  nome: string;
  descricao?: string;
  categoria?: string;
  preco_minimo?: number;
  preco_maximo?: number;
  ticket_medio?: number;
  cnaes_alvo?: string[];
  setores_alvo?: string[];
  diferenciais?: string[];
  confianca: number;
}

// 🔥 FUNÇÃO: Extrair texto de PDF
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdfParse.default(Buffer.from(buffer));
    return data.text || '';
  } catch (error) {
    console.error('Erro ao extrair PDF:', error);
    return '';
  }
}

// 🔥 FUNÇÃO: Extrair texto de Excel/CSV
async function extractTextFromExcel(buffer: ArrayBuffer): Promise<string> {
  try {
    const rows = await readXlsxFile(buffer);
    
    // Converter linhas em texto formatado
    let text = '';
    const headers = rows[0] || [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      text += '\n\n--- Produto ---\n';
      for (let j = 0; j < headers.length; j++) {
        text += `${headers[j]}: ${row[j] || ''}\n`;
      }
    }
    
    return text;
  } catch (error) {
    console.error('Erro ao extrair Excel:', error);
    return '';
  }
}

// 🔥 FUNÇÃO: Extrair texto de Imagem via OpenAI Vision
async function extractTextFromImage(imageUrl: string, openaiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia TODOS os produtos/serviços visíveis nesta imagem. Liste nome, descrição, categoria e preço (se houver).',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Vision error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Erro ao extrair imagem:', error);
    return '';
  }
}

// 🔥 FUNÇÃO: Processar documento e extrair texto
async function extractDocumentContent(doc: any, openaiKey: string): Promise<string> {
  try {
    const response = await fetch(doc.url_storage);
    if (!response.ok) throw new Error('Falha ao baixar documento');

    const contentType = response.headers.get('content-type') || '';
    
    // TXT - leitura direta
    if (doc.tipo_arquivo === 'txt' || contentType.includes('text/plain')) {
      return await response.text();
    }
    
    // PDF - usar pdf-parse
    if (doc.tipo_arquivo === 'pdf' || contentType.includes('pdf')) {
      const buffer = await response.arrayBuffer();
      return await extractTextFromPDF(buffer);
    }
    
    // Excel/CSV - usar read-excel-file
    if (doc.tipo_arquivo === 'xlsx' || contentType.includes('spreadsheet') || contentType.includes('excel')) {
      const buffer = await response.arrayBuffer();
      return await extractTextFromExcel(buffer);
    }
    
    // Imagens - usar OpenAI Vision
    if (doc.tipo_arquivo === 'image' || contentType.includes('image')) {
      return await extractTextFromImage(doc.url_storage, openaiKey);
    }
    
    // Word/DOCX - tentar como texto
    if (doc.tipo_arquivo === 'docx') {
      const text = await response.text();
      return text || `Documento Word: ${doc.nome_arquivo}`;
    }
    
    // Fallback
    return `Documento: ${doc.nome_arquivo}\nTipo: ${doc.tipo_arquivo}`;
    
  } catch (error) {
    console.error('Erro ao extrair conteúdo:', error);
    return `Documento: ${doc.nome_arquivo} (erro na extração)`;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tenant_id, document_ids } = await req.json() as ExtractRequest;

    if (!tenant_id || !document_ids?.length) {
      return new Response(
        JSON.stringify({ error: 'tenant_id e document_ids são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    let totalProductsExtracted = 0;

    // Processar cada documento
    for (const docId of document_ids) {
      try {
        // Buscar documento
        const { data: doc, error: docError } = await supabase
          .from('tenant_product_documents')
          .select('*')
          .eq('id', docId)
          .single();

        if (docError || !doc) {
          console.error(`Documento ${docId} não encontrado`);
          continue;
        }

        // Atualizar status para processando
        await supabase
          .from('tenant_product_documents')
          .update({ status: 'processing' })
          .eq('id', docId);

        // 🔥 NOVO: Extrair conteúdo com OCR e parsers especializados
        console.log(`📄 Extraindo conteúdo de: ${doc.nome_arquivo} (${doc.tipo_arquivo})`);
        const documentContent = await extractDocumentContent(doc, openaiKey);
        console.log(`✅ Conteúdo extraído: ${documentContent.length} caracteres`);

        // Chamar OpenAI para extrair produtos
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em extração de dados de catálogos, planilhas e documentos comerciais.

🎯 MISSÃO: Extrair TODOS os produtos/serviços do documento fornecido.

📋 REGRAS DE EXTRAÇÃO:
1. Identifique CADA produto/serviço mencionado
2. Se houver tabelas, processe linha por linha
3. Se houver imagens com texto, extraia o conteúdo
4. Normalize nomes (capitalize, remova caracteres especiais)
5. Categorize de forma consistente

📊 PARA CADA PRODUTO, EXTRAIA:
- nome: Nome do produto (obrigatório, capitalize)
- descricao: Descrição completa (incluir especificações técnicas)
- categoria: Categoria/linha de produto (normalize: "EPIs", "Luvas", "Calçados", etc.)
- preco_minimo: Preço mínimo em reais (apenas número, sem R$)
- preco_maximo: Preço máximo em reais (apenas número)
- ticket_medio: Ticket médio estimado (calcule se houver faixa)
- setores_alvo: Array de setores (ex: ["Indústria", "Construção", "Saúde"])
- diferenciais: Array de diferenciais (ex: ["Alta resistência", "Certificado CA"])
- confianca: Sua confiança na extração (0.0 a 1.0)

✅ FORMATO DE RESPOSTA (JSON válido):
{
  "produtos": [
    {
      "nome": "Luva de Proteção NitriPro",
      "descricao": "Luva de nitrilo para proteção química, tamanho M-GG",
      "categoria": "EPIs - Luvas",
      "preco_minimo": 15.90,
      "preco_maximo": 25.50,
      "ticket_medio": 20.70,
      "setores_alvo": ["Indústria Química", "Laboratórios"],
      "diferenciais": ["Resistente a ácidos", "CA 12345"],
      "confianca": 0.95
    }
  ],
  "resumo": {
    "total_produtos": 1,
    "categorias_encontradas": ["EPIs - Luvas"],
    "observacoes": "Documento bem estruturado"
  }
}

⚠️ IMPORTANTE:
- NÃO invente produtos que não existem no documento
- Se não encontrar preço, deixe null
- Se a confiança for < 0.5, marque no campo "observacoes"
- Agrupe produtos similares (ex: cores/tamanhos) em um único item`
              },
              {
                role: 'user',
                content: `📄 DOCUMENTO PARA ANÁLISE:\n\n${documentContent.substring(0, 12000)}\n\n🎯 Extraia TODOS os produtos/serviços encontrados acima.`
              }
            ],
            temperature: 0.2,
            max_tokens: 6000,
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI error: ${openaiResponse.status}`);
        }

        const aiResult = await openaiResponse.json();
        const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';
        
        // Parse do JSON (remover markdown se houver)
        let extractedProducts: ExtractedProduct[] = [];
        let resumo: any = null;
        
        try {
          const cleanContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          const parsed = JSON.parse(cleanContent);
          extractedProducts = parsed.produtos || [];
          resumo = parsed.resumo || null;
          
          console.log(`✅ Extraídos ${extractedProducts.length} produtos`);
          if (resumo) {
            console.log(`📊 Resumo:`, resumo);
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta da IA:', parseError);
          console.error('📄 Conteúdo recebido:', content.substring(0, 500));
          extractedProducts = [];
        }

        // Inserir produtos no banco
        for (const product of extractedProducts) {
          if (!product.nome) continue;

          const { error: insertError } = await supabase
            .from('tenant_products')
            .insert({
              tenant_id,
              nome: product.nome,
              descricao: product.descricao || null,
              categoria: product.categoria || null,
              preco_minimo: product.preco_minimo || null,
              preco_maximo: product.preco_maximo || null,
              ticket_medio: product.ticket_medio || null,
              setores_alvo: product.setores_alvo || null,
              diferenciais: product.diferenciais || null,
              extraido_de: `upload_${doc.tipo_arquivo}`,
              confianca_extracao: product.confianca || 0.5,
              dados_extraidos: { source_document: docId, raw: product },
            });

          if (!insertError) {
            totalProductsExtracted++;
          }
        }

        // Atualizar documento como concluído
        await supabase
          .from('tenant_product_documents')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            produtos_identificados: extractedProducts.length,
            dados_extraidos: { 
              produtos: extractedProducts,
              resumo: resumo,
              content_length: documentContent.length,
              extraction_timestamp: new Date().toISOString(),
            },
          })
          .eq('id', docId);

      } catch (docError: any) {
        console.error(`Erro ao processar documento ${docId}:`, docError);
        
        // Marcar como erro
        await supabase
          .from('tenant_product_documents')
          .update({
            status: 'error',
            erro_mensagem: docError.message,
          })
          .eq('id', docId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        documents_processed: document_ids.length,
        products_extracted: totalProductsExtracted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na extração:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

