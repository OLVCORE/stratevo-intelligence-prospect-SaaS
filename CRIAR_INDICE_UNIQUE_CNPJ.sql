CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_tenant_cnpj_unique
ON companies(tenant_id, cnpj)
WHERE cnpj IS NOT NULL;

