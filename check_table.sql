-- Verificar se a tabela icp_mapping_templates existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'icp_mapping_templates'
) AS table_exists;

-- Se existir, mostrar estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'icp_mapping_templates'
ORDER BY ordinal_position;

