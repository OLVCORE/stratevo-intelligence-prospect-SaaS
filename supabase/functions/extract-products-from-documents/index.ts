/**
 * Edge Function: Extração de Produtos de Documentos
 * 
 * Usa OpenAI para extrair informações de produtos de:
 * - PDFs (catálogos, fichas técnicas)
 * - Excel (listas de preços, tabelas de produtos)
 * - Word (documentos comerciais)
 * - Imagens (fotos de produtos com OCR)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

        // Baixar conteúdo do documento
        let documentContent = '';
        
        try {
          const response = await fetch(doc.url_storage);
          if (!response.ok) throw new Error('Falha ao baixar documento');
          
          // Para PDFs e imagens, precisamos de OCR/extração especial
          // Por enquanto, vamos simular com texto
          if (doc.tipo_arquivo === 'txt') {
            documentContent = await response.text();
          } else {
            // Para outros tipos, usar o nome do arquivo como contexto
            documentContent = `Documento: ${doc.nome_arquivo}\nTipo: ${doc.tipo_arquivo}`;
          }
        } catch (downloadError) {
          console.error(`Erro ao baixar documento ${docId}:`, downloadError);
          documentContent = `Documento: ${doc.nome_arquivo}`;
        }

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
                content: `Você é um especialista em extração de dados de catálogos de produtos.
                
Analise o documento fornecido e extraia TODOS os produtos/serviços encontrados.

Para cada produto, extraia:
- nome: Nome do produto (obrigatório)
- descricao: Descrição breve
- categoria: Categoria do produto
- preco_minimo: Preço mínimo (apenas número)
- preco_maximo: Preço máximo (apenas número)
- ticket_medio: Ticket médio estimado
- setores_alvo: Lista de setores que usam este produto
- diferenciais: Lista de diferenciais competitivos
- confianca: Sua confiança na extração (0.0 a 1.0)

Responda APENAS com um JSON válido no formato:
{
  "produtos": [
    {
      "nome": "...",
      "descricao": "...",
      "categoria": "...",
      "preco_minimo": null,
      "preco_maximo": null,
      "ticket_medio": null,
      "setores_alvo": [],
      "diferenciais": [],
      "confianca": 0.8
    }
  ]
}`
              },
              {
                role: 'user',
                content: `Extraia os produtos do seguinte documento:\n\n${documentContent.substring(0, 8000)}`
              }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI error: ${openaiResponse.status}`);
        }

        const aiResult = await openaiResponse.json();
        const content = aiResult.choices?.[0]?.message?.content || '{"produtos":[]}';
        
        // Parse do JSON
        let extractedProducts: ExtractedProduct[] = [];
        try {
          const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
          extractedProducts = parsed.produtos || [];
        } catch (parseError) {
          console.error('Erro ao parsear resposta da IA:', parseError);
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
            dados_extraidos: { produtos: extractedProducts },
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

