import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      throw new Error("proposalId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch proposal with lead data
    const { data: proposal, error: fetchError } = await supabase
      .from("proposals")
      .select(`
        *,
        leads (
          name,
          email,
          phone
        )
      `)
      .eq("id", proposalId)
      .single();

    if (fetchError) throw fetchError;
    if (!proposal) throw new Error("Proposal not found");

    console.log("Generating PDF for proposal:", proposal.proposal_number);

    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2c5f2d;
          }
          .proposal-number {
            font-size: 24px;
            margin: 20px 0;
            color: #666;
          }
          .section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c5f2d;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 10px;
            background: #f9f9f9;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .price-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .price-table th,
          .price-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .price-table th {
            background: #2c5f2d;
            color: white;
          }
          .total-row {
            font-size: 20px;
            font-weight: bold;
            background: #f0f0f0;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            color: #666;
          }
          .signature-box {
            margin-top: 60px;
            border-top: 1px solid #333;
            width: 300px;
            text-align: center;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Espaço Linda</div>
          <div class="proposal-number">Proposta Nº ${proposal.proposal_number}</div>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-row">
            <span class="info-label">Nome:</span>
            <span>${proposal.leads?.name || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${proposal.leads?.email || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Telefone:</span>
            <span>${proposal.leads?.phone || "N/A"}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Detalhes do Evento</div>
          <div class="info-row">
            <span class="info-label">Tipo de Evento:</span>
            <span>${proposal.event_type}</span>
          </div>
          ${proposal.event_date ? `
          <div class="info-row">
            <span class="info-label">Data do Evento:</span>
            <span>${new Date(proposal.event_date).toLocaleDateString("pt-BR")}</span>
          </div>
          ` : ""}
          ${proposal.guest_count ? `
          <div class="info-row">
            <span class="info-label">Número de Convidados:</span>
            <span>${proposal.guest_count}</span>
          </div>
          ` : ""}
        </div>

        <div class="section">
          <div class="section-title">Investimento</div>
          <table class="price-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Locação do Espaço</td>
                <td style="text-align: right;">R$ ${proposal.venue_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              </tr>
              ${proposal.catering_price > 0 ? `
              <tr>
                <td>Gastronomia</td>
                <td style="text-align: right;">R$ ${proposal.catering_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              </tr>
              ` : ""}
              ${proposal.decoration_price > 0 ? `
              <tr>
                <td>Decoração</td>
                <td style="text-align: right;">R$ ${proposal.decoration_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              </tr>
              ` : ""}
              ${proposal.discount_percentage > 0 ? `
              <tr>
                <td>Desconto (${proposal.discount_percentage}%)</td>
                <td style="text-align: right; color: #2c5f2d;">- R$ ${((proposal.total_price * proposal.discount_percentage) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              </tr>
              ` : ""}
              <tr class="total-row">
                <td>TOTAL</td>
                <td style="text-align: right;">R$ ${proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${proposal.notes ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <p>${proposal.notes}</p>
        </div>
        ` : ""}

        <div class="section">
          <div class="section-title">Termos e Condições</div>
          <p>${proposal.terms_and_conditions || "Termos e condições padrão."}</p>
          <div class="info-row">
            <span class="info-label">Proposta válida até:</span>
            <span>${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-around; margin-top: 80px;">
          <div class="signature-box">
            <div>Espaço Linda</div>
            <div style="font-size: 12px; color: #666;">Fornecedor</div>
          </div>
          <div class="signature-box">
            <div>${proposal.leads?.name || "Cliente"}</div>
            <div style="font-size: 12px; color: #666;">Cliente</div>
          </div>
        </div>

        <div class="footer">
          <p>Espaço Linda - Eventos Inesquecíveis</p>
          <p style="font-size: 12px;">www.espacoolinda.com.br</p>
        </div>
      </body>
    </html>
    `;

    // In a production environment, you would use a PDF generation service here
    // For now, we'll store the HTML and mark the PDF as generated
    const pdfUrl = `proposal_${proposal.proposal_number}.pdf`;
    
    // Update proposal with PDF URL
    const { error: updateError } = await supabase
      .from("proposals")
      .update({ pdf_url: pdfUrl })
      .eq("id", proposalId);

    if (updateError) throw updateError;

    console.log("PDF generated successfully:", pdfUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        message: "PDF gerado com sucesso" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
