-- ============================================================================
-- INSERIR EMPRESA DE TESTE DIRETAMENTE NO BANCO
-- Copie e cole no Supabase Dashboard → SQL Editor → RUN
-- ============================================================================

-- Inserir empresa WAP (case de sucesso TOTVS)
INSERT INTO companies (
  cnpj,
  company_name,
  industry,
  employees,
  headquarters_city,
  headquarters_state,
  headquarters_country,
  domain,
  created_at
) VALUES (
  '67867580000190',
  'WAP Indústria e Comércio de Eletrodomésticos Ltda.',
  'Indústria',
  500,
  'Vinhedo',
  'SP',
  'Brasil',
  'wap.ind.br',
  NOW()
)
ON CONFLICT (cnpj) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  industry = EXCLUDED.industry,
  employees = EXCLUDED.employees;

-- Verificar se foi inserida
SELECT id, company_name, cnpj, industry FROM companies WHERE cnpj = '67867580000190';

