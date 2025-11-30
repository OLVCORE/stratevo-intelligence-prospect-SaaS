import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: "Espaço Linda CRM API",
        version: "1.0.0",
        description: "API completa para gerenciamento de leads, propostas, eventos e automações do Espaço Linda",
        contact: {
          name: "Suporte Espaço Linda",
          email: "contato@espacoolinda.com.br"
        }
      },
      servers: [
        {
          url: `${Deno.env.get('SUPABASE_URL')}/functions/v1`,
          description: "Production server"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          },
          apiKey: {
            type: "apiKey",
            in: "header",
            name: "apikey"
          }
        },
        schemas: {
          Lead: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              phone: { type: "string" },
              event_type: { type: "string", enum: ["casamento", "corporativo", "aniversario", "outros"] },
              status: { type: "string", enum: ["novo", "contatado", "qualificado", "proposta", "negociacao", "fechado", "perdido"] },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              created_at: { type: "string", format: "date-time" }
            }
          },
          Proposal: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              lead_id: { type: "string", format: "uuid" },
              proposal_number: { type: "string" },
              event_type: { type: "string" },
              event_date: { type: "string", format: "date" },
              guest_count: { type: "integer" },
              total_price: { type: "number" },
              final_price: { type: "number" },
              status: { type: "string", enum: ["draft", "enviada", "visualizada", "aceita", "recusada", "expirada"] },
              created_at: { type: "string", format: "date-time" }
            }
          },
          Appointment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              phone: { type: "string" },
              event_type: { type: "string" },
              appointment_date: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["agendado", "confirmado", "realizado", "cancelado"] }
            }
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
              details: { type: "object" }
            }
          }
        }
      },
      paths: {
        "/chatbot": {
          post: {
            summary: "Chatbot WhatsApp/Web",
            description: "Endpoint para processar mensagens do chatbot IA",
            tags: ["Chatbot"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      session_id: { type: "string" }
                    },
                    required: ["message"]
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "Resposta do chatbot",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        response: { type: "string" },
                        session_id: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/send-contact-email": {
          post: {
            summary: "Enviar email de contato",
            description: "Envia email de contato para lead",
            tags: ["Email"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      to: { type: "string", format: "email" },
                      subject: { type: "string" },
                      body: { type: "string" }
                    },
                    required: ["to", "subject", "body"]
                  }
                }
              }
            },
            responses: {
              "200": { description: "Email enviado com sucesso" },
              "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
            }
          }
        },
        "/generate-proposal-pdf": {
          post: {
            summary: "Gerar PDF de proposta",
            description: "Gera PDF da proposta e retorna URL",
            tags: ["Propostas"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      proposal_id: { type: "string", format: "uuid" }
                    },
                    required: ["proposal_id"]
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "PDF gerado",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        pdf_url: { type: "string", format: "uri" }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/whatsapp-webhook": {
          post: {
            summary: "Webhook WhatsApp",
            description: "Recebe mensagens via WhatsApp Business API",
            tags: ["WhatsApp"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      from: { type: "string" },
                      body: { type: "string" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "Mensagem processada" }
            }
          }
        },
        "/meta-webhook": {
          post: {
            summary: "Webhook Meta (Facebook/Instagram)",
            description: "Recebe leads do Facebook/Instagram Ads",
            tags: ["Webhooks"],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      entry: { type: "array", items: { type: "object" } }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "Lead processado" }
            }
          }
        },
        "/notify-new-lead": {
          post: {
            summary: "Notificar novo lead",
            description: "Envia notificações push/email sobre novo lead",
            tags: ["Notificações"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      lead_id: { type: "string", format: "uuid" }
                    },
                    required: ["lead_id"]
                  }
                }
              }
            },
            responses: {
              "200": { description: "Notificação enviada" }
            }
          }
        },
        "/send-appointment-confirmation": {
          post: {
            summary: "Confirmação de agendamento",
            description: "Envia email/SMS de confirmação de visita",
            tags: ["Agendamentos"],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      appointment_id: { type: "string", format: "uuid" }
                    },
                    required: ["appointment_id"]
                  }
                }
              }
            },
            responses: {
              "200": { description: "Confirmação enviada" }
            }
          }
        },
        "/process-reminders": {
          post: {
            summary: "Processar lembretes automáticos",
            description: "Processa e envia lembretes configurados",
            tags: ["Automações"],
            security: [{ bearerAuth: [] }],
            responses: {
              "200": { description: "Lembretes processados" }
            }
          }
        }
      },
      tags: [
        { name: "Chatbot", description: "Endpoints de chatbot IA" },
        { name: "Email", description: "Envio de emails" },
        { name: "WhatsApp", description: "Integração WhatsApp Business" },
        { name: "Propostas", description: "Geração e gestão de propostas" },
        { name: "Agendamentos", description: "Gestão de visitas e agendamentos" },
        { name: "Webhooks", description: "Webhooks de integrações externas" },
        { name: "Notificações", description: "Push e email notifications" },
        { name: "Automações", description: "Automações e workflows" }
      ]
    };

    // Retornar HTML do Swagger UI
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Espaço Linda CRM API - Documentação</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      })
    }
  </script>
</body>
</html>
    `;

    return new Response(swaggerHtml, {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Error generating API docs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
