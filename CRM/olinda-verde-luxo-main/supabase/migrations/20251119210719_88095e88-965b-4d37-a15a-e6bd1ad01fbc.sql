-- Adicionar status "reagendado" aos appointments (se ainda não existir)
-- Não precisa de migração se o campo já é TEXT livre

-- Criar tabela de email templates preenchidos (se ainda não existir)
INSERT INTO public.email_templates (name, subject, body, category, created_by) 
VALUES 
(
  'Confirmação de Agendamento',
  'Agendamento Confirmado - Espaço Olinda',
  '<h2>Agendamento Confirmado!</h2>
<p>Olá {{nome}},</p>
<p>Seu agendamento foi confirmado com sucesso!</p>
<ul>
  <li><strong>Data:</strong> {{data}}</li>
  <li><strong>Horário:</strong> {{horario}}</li>
  <li><strong>Tipo:</strong> {{tipo}}</li>
</ul>
<p>Nos vemos em breve!</p>
<p>Equipe Espaço Olinda</p>',
  'agendamento',
  NULL
),
(
  'Lembrete de Visita',
  'Lembrete: Sua Visita é Amanhã!',
  '<h2>Lembrete de Visita</h2>
<p>Olá {{nome}},</p>
<p>Lembrando que sua visita ao Espaço Olinda é amanhã!</p>
<ul>
  <li><strong>Data:</strong> {{data}}</li>
  <li><strong>Horário:</strong> {{horario}}</li>
</ul>
<p>Estamos ansiosos para recebê-lo(a)!</p>
<p>Equipe Espaço Olinda</p>',
  'lembrete',
  NULL
),
(
  'Follow-up Pós-Visita',
  'Obrigado pela Visita! Vamos dar continuidade?',
  '<h2>Obrigado pela Visita!</h2>
<p>Olá {{nome}},</p>
<p>Foi um prazer recebê-lo(a) ontem em nosso espaço!</p>
<p>Gostaríamos de preparar uma proposta personalizada para o seu {{tipo_evento}}.</p>
<p>Entre em contato para darmos continuidade!</p>
<p>Equipe Espaço Olinda</p>',
  'followup',
  NULL
),
(
  'Confirmação de Contrato',
  'Contrato Assinado - Evento Confirmado! 🎉',
  '<h2>Parabéns! Seu Evento Está Confirmado!</h2>
<p>Olá {{nome}},</p>
<p>Seu contrato foi assinado com sucesso e seu evento está oficialmente confirmado!</p>
<ul>
  <li><strong>Data do Evento:</strong> {{data_evento}}</li>
  <li><strong>Tipo:</strong> {{tipo_evento}}</li>
  <li><strong>Valor Total:</strong> {{valor_total}}</li>
</ul>
<p>Entraremos em contato em breve para iniciar o planejamento detalhado.</p>
<p>Equipe Espaço Olinda</p>',
  'contrato',
  NULL
)
ON CONFLICT DO NOTHING;