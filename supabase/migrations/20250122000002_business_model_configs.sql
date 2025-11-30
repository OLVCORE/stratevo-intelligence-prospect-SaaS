-- ============================================================================
-- MIGRATION: Business Model Templates
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Cria templates de configuração por modelo de negócio
-- ============================================================================

-- ============================================
-- TABELA: BUSINESS MODEL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.business_model_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  model_key TEXT UNIQUE NOT NULL, -- eventos, comercio_exterior, software, logistica
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- lucide icon name
  
  -- Configuração do CRM
  crm_config JSONB NOT NULL,
  -- Exemplo para Eventos:
  -- {
  --   "lead_fields": {
  --     "event_type": { "type": "select", "label": "Tipo de Evento", "options": ["casamento", "corporativo", "social"] },
  --     "event_date": { "type": "date", "label": "Data do Evento", "required": true },
  --     "guest_count": { "type": "number", "label": "Número de Convidados" }
  --   },
  --   "pipeline_stages": ["novo", "visita_agendada", "proposta", "negociacao", "fechado"],
  --   "proposal_structure": {
  --     "sections": ["venue", "catering", "decoration", "entertainment", "extras"]
  --   },
  --   "automation_templates": [...]
  -- }
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir modelo GENERIC primeiro (crítico para evitar 404)
INSERT INTO public.business_model_templates (model_key, name, description, icon, crm_config) VALUES
('generic', 'Modelo Genérico', 'Configuração padrão de CRM multi-tenant', 'building', '{
  "leadFields": {
    "name": {
      "type": "text",
      "label": "Nome",
      "required": true
    },
    "email": {
      "type": "text",
      "label": "Email",
      "required": true
    },
    "phone": {
      "type": "text",
      "label": "Telefone",
      "required": true
    },
    "opportunity_type": {
      "type": "select",
      "label": "Tipo de Oportunidade",
      "options": ["projeto", "consultoria", "produto", "servico", "licenca"],
      "required": false
    },
    "budget": {
      "type": "number",
      "label": "Orçamento",
      "required": false
    }
  },
  "pipelineStages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "qualificado", "label": "Qualificado", "color": "#8b5cf6"},
    {"key": "proposta", "label": "Proposta", "color": "#f59e0b"},
    {"key": "negociacao", "label": "Negociação", "color": "#10b981"},
    {"key": "ganho", "label": "Ganho", "color": "#22c55e"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "labels": {
    "opportunity": "Oportunidade",
    "lead": "Lead"
  }
}'::JSONB)
ON CONFLICT (model_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  crm_config = EXCLUDED.crm_config;

-- Inserir templates padrão
INSERT INTO public.business_model_templates (model_key, name, description, icon, crm_config) VALUES
('eventos', 'Empresa de Eventos', 'CRM otimizado para gestão de eventos corporativos, casamentos e festas', 'calendar', '{
  "lead_fields": {
    "event_type": {
      "type": "select",
      "label": "Tipo de Evento",
      "options": ["casamento", "corporativo", "aniversario", "formatura", "outro"],
      "required": true
    },
    "event_date": {
      "type": "date",
      "label": "Data do Evento",
      "required": true
    },
    "guest_count": {
      "type": "number",
      "label": "Número de Convidados",
      "required": false
    },
    "venue_preference": {
      "type": "text",
      "label": "Preferência de Local",
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "visita_agendada", "label": "Visita Agendada", "color": "#8b5cf6"},
    {"key": "proposta_enviada", "label": "Proposta Enviada", "color": "#f59e0b"},
    {"key": "negociacao", "label": "Negociação", "color": "#10b981"},
    {"key": "fechado", "label": "Fechado", "color": "#22c55e"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "venue", "label": "Espaço", "icon": "building"},
    {"key": "catering", "label": "Buffet", "icon": "utensils"},
    {"key": "decoration", "label": "Decoração", "icon": "flower"},
    {"key": "entertainment", "label": "Entretenimento", "icon": "music"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB),

('comercio_exterior', 'Comércio Exterior', 'CRM para trading, importação e exportação', 'ship', '{
  "lead_fields": {
    "product_category": {
      "type": "select",
      "label": "Categoria de Produto",
      "options": ["eletronicos", "maquinas", "textil", "alimentos", "quimicos", "outro"],
      "required": true
    },
    "operation_type": {
      "type": "select",
      "label": "Tipo de Operação",
      "options": ["importacao", "exportacao", "triangulacao"],
      "required": true
    },
    "destination_country": {
      "type": "text",
      "label": "País de Destino/Origem",
      "required": true
    },
    "volume": {
      "type": "text",
      "label": "Volume Estimado",
      "required": false
    },
    "incoterm": {
      "type": "select",
      "label": "Incoterm",
      "options": ["FOB", "CIF", "EXW", "DDP", "DAP"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "analise_viabilidade", "label": "Análise de Viabilidade", "color": "#8b5cf6"},
    {"key": "cotacao_enviada", "label": "Cotação Enviada", "color": "#f59e0b"},
    {"key": "documentacao", "label": "Documentação", "color": "#10b981"},
    {"key": "embarque", "label": "Embarque", "color": "#22c55e"},
    {"key": "desembaraco", "label": "Desembaraço", "color": "#14b8a6"},
    {"key": "entregue", "label": "Entregue", "color": "#06b6d4"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "product", "label": "Produto", "icon": "package"},
    {"key": "freight", "label": "Frete", "icon": "truck"},
    {"key": "customs", "label": "Desembaraço", "icon": "file-check"},
    {"key": "insurance", "label": "Seguro", "icon": "shield"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB),

('software', 'Software/SaaS', 'CRM para vendas de software e soluções tecnológicas', 'code', '{
  "lead_fields": {
    "company_size": {
      "type": "select",
      "label": "Tamanho da Empresa",
      "options": ["1-10", "11-50", "51-200", "201-500", "500+"],
      "required": true
    },
    "current_stack": {
      "type": "multiselect",
      "label": "Stack Atual",
      "options": ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday", "Outro", "Nenhum"],
      "required": false
    },
    "pain_points": {
      "type": "textarea",
      "label": "Dores/Desafios",
      "required": false
    },
    "budget_range": {
      "type": "select",
      "label": "Faixa de Orçamento",
      "options": ["até 5k/mês", "5k-10k/mês", "10k-25k/mês", "25k+/mês"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "discovery", "label": "Discovery Call", "color": "#8b5cf6"},
    {"key": "demo", "label": "Demo", "color": "#f59e0b"},
    {"key": "proposta", "label": "Proposta", "color": "#10b981"},
    {"key": "negociacao", "label": "Negociação", "color": "#22c55e"},
    {"key": "contrato", "label": "Contrato", "color": "#14b8a6"},
    {"key": "onboarding", "label": "Onboarding", "color": "#06b6d4"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "licenses", "label": "Licenças", "icon": "key"},
    {"key": "implementation", "label": "Implementação", "icon": "settings"},
    {"key": "training", "label": "Treinamento", "icon": "graduation-cap"},
    {"key": "support", "label": "Suporte", "icon": "headphones"},
    {"key": "integrations", "label": "Integrações", "icon": "plug"}
  ]
}'::JSONB),

('logistica', 'Logística e Transportes', 'CRM para transportadoras e operadores logísticos', 'truck', '{
  "lead_fields": {
    "cargo_type": {
      "type": "select",
      "label": "Tipo de Carga",
      "options": ["geral", "refrigerada", "perigosa", "fracionada", "completa"],
      "required": true
    },
    "route": {
      "type": "text",
      "label": "Rota (Origem-Destino)",
      "required": true
    },
    "volume": {
      "type": "text",
      "label": "Volume Mensal Estimado",
      "required": false
    },
    "urgency": {
      "type": "select",
      "label": "Urgência",
      "options": ["express", "normal", "economica"],
      "required": false
    }
  },
  "pipeline_stages": [
    {"key": "novo", "label": "Novo Lead", "color": "#3b82f6"},
    {"key": "cotacao", "label": "Cotação", "color": "#8b5cf6"},
    {"key": "negociacao", "label": "Negociação", "color": "#f59e0b"},
    {"key": "contrato", "label": "Contrato", "color": "#10b981"},
    {"key": "primeira_operacao", "label": "Primeira Operação", "color": "#22c55e"},
    {"key": "ativo", "label": "Cliente Ativo", "color": "#14b8a6"},
    {"key": "perdido", "label": "Perdido", "color": "#ef4444"}
  ],
  "proposal_sections": [
    {"key": "freight", "label": "Frete", "icon": "truck"},
    {"key": "handling", "label": "Movimentação", "icon": "package"},
    {"key": "storage", "label": "Armazenagem", "icon": "warehouse"},
    {"key": "insurance", "label": "Seguro", "icon": "shield"},
    {"key": "extras", "label": "Serviços Extras", "icon": "plus"}
  ]
}'::JSONB)
ON CONFLICT (model_key) DO NOTHING;

-- RLS para business_model_templates (público para leitura)
ALTER TABLE public.business_model_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business model templates"
  ON public.business_model_templates FOR SELECT
  USING (true);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.business_model_templates IS 'Templates de configuração do CRM por modelo de negócio';

