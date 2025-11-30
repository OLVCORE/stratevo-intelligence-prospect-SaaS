-- Atualizar constraint da tabela notifications para aceitar tipo 'automation'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('lead', 'task', 'appointment', 'proposal', 'deal', 'automation', 'lead_assigned', 'system'));

-- Atualizar regra de automação para usar tipo correto de tarefa
UPDATE public.automation_rules
SET actions = '[
  {
    "type": "create_task",
    "title": "Follow-up com lead qualificado",
    "description": "Entrar em contato para agendar visita",
    "due_days": 1,
    "task_type": "task"
  },
  {
    "type": "notification",
    "title": "Lead Qualificado!",
    "message": "Um novo lead foi qualificado e precisa de follow-up"
  }
]'::jsonb
WHERE name = 'Lead Qualificado - Criar Tarefa';