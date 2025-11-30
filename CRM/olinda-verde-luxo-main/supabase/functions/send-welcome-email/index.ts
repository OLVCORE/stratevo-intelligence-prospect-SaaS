import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  sales: 'Vendas',
  viewer: 'Visualizador',
  direcao: 'Direção',
  gerencia: 'Gerência',
  gestor: 'Gestor',
  sdr: 'SDR',
  vendedor: 'Vendedor',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email e perfil são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const roleLabel = roleLabels[role] || role
    const loginUrl = 'https://lovable.app/projects/9338b6de-2293-4422-b905-3422ee1237b0/editor'

    const { data, error } = await resend.emails.send({
      from: 'Espaço Olinda <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Bem-vindo(a) à Plataforma Espaço Olinda!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Espaço Olinda</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                  🌟 Bem-vindo(a) ao Espaço Olinda!
                </h1>
              </div>

              <!-- Content -->
              <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0 0 20px; color: #27272a; font-size: 16px; line-height: 1.6;">
                  Olá! 👋
                </p>
                
                <p style="margin: 0 0 20px; color: #27272a; font-size: 16px; line-height: 1.6;">
                  Uma conta foi criada para você na plataforma administrativa do <strong>Espaço Olinda</strong>.
                </p>

                <div style="background-color: #f4f4f5; padding: 24px; border-radius: 12px; margin: 30px 0;">
                  <p style="margin: 0 0 12px; color: #52525b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                    Suas Credenciais
                  </p>
                  <p style="margin: 0 0 8px; color: #27272a; font-size: 15px;">
                    <strong>Email:</strong> ${email}
                  </p>
                  <p style="margin: 0; color: #27272a; font-size: 15px;">
                    <strong>Perfil:</strong> ${roleLabel}
                  </p>
                </div>

                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #059669;">
                  <p style="margin: 0; color: #14532d; font-size: 14px; line-height: 1.6;">
                    ✅ <strong>Pronto para começar:</strong> Sua conta está ativa e você já pode fazer login com suas credenciais.
                  </p>
                </div>

                <p style="margin: 30px 0 20px; color: #27272a; font-size: 16px; line-height: 1.6;">
                  Após confirmar seu email, você poderá acessar a plataforma:
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
                    🔐 Acessar Plataforma
                  </a>
                </div>

                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0 0 12px; color: #71717a; font-size: 14px; line-height: 1.6;">
                    Se tiver alguma dúvida, entre em contato com o administrador.
                  </p>
                  <p style="margin: 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                    Atenciosamente,<br>
                    <strong>Equipe Espaço Olinda</strong>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; text-align: center;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                  © ${new Date().getFullYear()} Espaço Olinda. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      throw error
    }

    console.log('Email de boas-vindas enviado com sucesso:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro na função send-welcome-email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
