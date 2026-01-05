#!/usr/bin/env python3
"""
Script para gerar SQL completo a partir dos dados fornecidos pelo usuário
Processa dados tab-separated e gera arquivo SQL completo
"""

import sys
import re

# Dados fornecidos pelo usuário (cole aqui todos os dados)
USER_DATA = """CNAE	Setor / Indústria	Categoria
0111-3/01	Agricultura	Produtor
0111-3/02	Agricultura	Produtor
0111-3/03	Agricultura	Produtor
0111-3/99	Agricultura	Produtor
0112-1/01	Agricultura	Produtor
0112-1/02	Agricultura	Produtor
0112-1/99	Agricultura	Produtor
0113-0/00	Agricultura	Produtor
0114-8/00	Agricultura	Produtor
0115-6/00	Agricultura	Produtor
0116-4/01	Agricultura	Produtor
0116-4/02	Agricultura	Produtor
0116-4/03	Agricultura	Produtor
0116-4/99	Agricultura	Produtor
0119-9/01	Agricultura	Produtor
0119-9/02	Agricultura	Produtor
0119-9/03	Agricultura	Produtor
0119-9/04	Agricultura	Produtor
0119-9/05	Agricultura	Produtor
0119-9/06	Agricultura	Produtor
0119-9/07	Agricultura	Produtor
0119-9/08	Agricultura	Produtor
0119-9/09	Agricultura	Produtor
0119-9/99	Agricultura	Produtor
0121-1/01	Agricultura	Produtor
0121-1/02	Agricultura	Produtor
0122-9/00	Agricultura	Produtor
0131-8/00	Agricultura	Produtor
0132-6/00	Agricultura	Produtor
0133-4/01	Agricultura	Produtor
0133-4/02	Agricultura	Produtor
0133-4/03	Agricultura	Produtor
0133-4/04	Agricultura	Produtor
0133-4/05	Agricultura	Produtor
0133-4/06	Agricultura	Produtor
0133-4/07	Agricultura	Produtor
0133-4/08	Agricultura	Produtor
0133-4/09	Agricultura	Produtor
0133-4/10	Agricultura	Produtor
0133-4/11	Agricultura	Produtor
0133-4/99	Agricultura	Produtor
0134-2/00	Agricultura	Produtor
0135-1/00	Agricultura	Produtor
0139-3/01	Agricultura	Produtor
0139-3/02	Agricultura	Produtor
0139-3/03	Agricultura	Produtor
0139-3/04	Agricultura	Produtor
0139-3/05	Agricultura	Produtor
0139-3/06	Agricultura	Produtor
0139-3/99	Agricultura	Produtor
0141-5/01	Agricultura	Insumos - Agro
0141-5/02	Agricultura	Insumos - Agro
0142-3/00	Agricultura	Insumos - Agro
0151-2/01	Pecuária	Produtor
0151-2/02	Pecuária	Produtor
0151-2/03	Pecuária	Produtor
0152-1/01	Pecuária	Produtor
0152-1/02	Pecuária	Produtor
0152-1/03	Pecuária	Produtor
0153-9/01	Pecuária	Produtor
0153-9/02	Pecuária	Produtor
0154-7/00	Pecuária	Produtor
0155-5/01	Pecuária	Produtor
0155-5/02	Pecuária	Produtor
0155-5/03	Pecuária	Produtor
0155-5/04	Pecuária	Produtor
0155-5/05	Pecuária	Produtor
0159-8/01	Agricultura	Produtor
0159-8/02	Serviços	Outros Produtores
0159-8/03	Agricultura	Produtor
0159-8/04	Agricultura	Produtor
0159-8/99	Serviços	Outros Produtores
0161-0/01	Agricultura	Serviços Diretos
0161-0/02	Agricultura	Serviços Diretos
0161-0/03	Agricultura	Serviços Diretos
0161-0/99	Agricultura	Serviços Diretos
0162-8/01	Pecuária	Serviços Diretos
0162-8/02	Pecuária	Serviços Diretos
0162-8/03	Pecuária	Serviços Diretos
0162-8/99	Pecuária	Serviços Diretos
0163-6/00	Agricultura	Serviços Diretos
0170-9/00	Agricultura	Serviços Diretos
0210-1/01	Agricultura	Produtor
0210-1/02	Agricultura	Produtor
0210-1/03	Agricultura	Produtor
0210-1/04	Agricultura	Produtor
0210-1/05	Agricultura	Produtor
0210-1/06	Agricultura	Produtor
0210-1/07	Agricultura	Serviços Diretos
0210-1/08	Agricultura	Produtor
0210-1/09	Agricultura	Produtor
0210-1/99	Agricultura	Produtor
0220-9/01	Agricultura	Serviços Diretos
0220-9/02	Agricultura	Produtor
0220-9/03	Agricultura	Serviços Diretos
0220-9/04	Agricultura	Serviços Diretos
0220-9/05	Agricultura	Serviços Diretos
0220-9/06	Conservação Ambiental	Serviços Diretos
0220-9/99	Agricultura	Serviços Diretos
0230-6/00	Agricultura	Serviços Diretos
0311-6/01	Pesca	Produtor
0311-6/02	Pesca	Produtor
0311-6/03	Pesca	Serviços Diretos
0311-6/04	Pesca	Serviços Diretos
0312-4/01	Pesca	Produtor
0312-4/02	Pesca	Produtor
0312-4/03	Pesca	Serviços Diretos
0312-4/04	Pesca	Serviços Diretos
0321-3/01	Pesca	Produtor
0321-3/02	Pesca	Produtor
0321-3/03	Pesca	Produtor
0321-3/04	Pesca	Produtor
0321-3/05	Pesca	Serviços Diretos
0321-3/99	Pesca	Produtor
0322-1/01	Pesca	Produtor
0322-1/02	Pesca	Produtor
0322-1/03	Pesca	Produtor
0322-1/04	Pesca	Produtor
0322-1/05	Pesca	Produtor
0322-1/06	Pesca	Produtor
0322-1/07	Pesca	Serviços Diretos
0322-1/99	Pesca	Produtor
0500-3/01	Energia	Extrativismo
0500-3/02	Energia	Beneficiamento
0600-0/01	Energia	Extrativismo
0600-0/02	Mineração	Extrativismo
0600-0/03	Mineração	Extrativismo
0710-3/01	Mineração	Extrativismo
0710-3/02	Mineração	Beneficiamento
0721-9/01	Mineração	Extrativismo
0721-9/02	Mineração	Beneficiamento
0722-7/01	Mineração	Extrativismo
0722-7/02	Mineração	Beneficiamento
0723-5/01	Mineração	Extrativismo
0723-5/02	Mineração	Beneficiamento
0724-3/01	Mineração	Extrativismo
0724-3/02	Mineração	Beneficiamento
0725-1/00	Mineração	Extrativismo
0729-4/01	Mineração	Extrativismo
0729-4/02	Mineração	Extrativismo
0729-4/03	Mineração	Extrativismo
0729-4/04	Mineração	Extrativismo
0729-4/05	Mineração	Beneficiamento
0810-0/01	Mineração	Extrativismo
0810-0/02	Mineração	Extrativismo
0810-0/03	Mineração	Extrativismo
0810-0/04	Mineração	Extrativismo
0810-0/05	Mineração	Extrativismo
0810-0/06	Mineração	Extrativismo
0810-0/07	Mineração	Extrativismo
0810-0/08	Mineração	Extrativismo
0810-0/09	Mineração	Extrativismo
0810-0/10	Mineração	Beneficiamento
0810-0/99	Mineração	Extrativismo
0891-6/00	Mineração	Extrativismo
0892-4/01	Mineração	Extrativismo
0892-4/02	Mineração	Extrativismo
0892-4/03	Mineração	Beneficiamento
0893-2/00	Mineração	Extrativismo
0899-1/01	Mineração	Extrativismo
0899-1/02	Mineração	Extrativismo
0899-1/03	Mineração	Extrativismo
0899-1/99	Mineração	Extrativismo
0910-6/00	Mineração	Apoio
0990-4/01	Mineração	Apoio
0990-4/02	Mineração	Apoio
0990-4/03	Mineração	Apoio"""

def parse_data(text):
    """Parse dados tab-separated"""
    results = []
    for line in text.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('CNAE'):
            continue
        parts = line.split('\t')
        if len(parts) >= 3:
            cnae = parts[0].strip()
            setor = parts[1].strip()
            categoria = parts[2].strip()
            if cnae and setor and categoria:
                results.append((cnae, setor, categoria))
    return results

def generate_sql(data, output_file):
    """Gera SQL completo"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"""-- ============================================================================
-- MIGRATION: Popular Tabela cnae_classifications - DADOS COMPLETOS
-- ============================================================================
-- Data: 2025-02-26
-- Descrição: Insere TODOS os dados de Setor/Indústria e Categoria fornecidos
-- Total de registros: {len(data)}
-- ============================================================================

INSERT INTO public.cnae_classifications (cnae_code, setor_industria, categoria) VALUES
""")
        values = []
        for cnae, setor, categoria in data:
            setor_esc = setor.replace("'", "''")
            cat_esc = categoria.replace("'", "''")
            values.append(f"('{cnae}', '{setor_esc}', '{cat_esc}')")
        
        f.write(',\n'.join(values))
        f.write("""
ON CONFLICT (cnae_code) DO UPDATE SET
  setor_industria = EXCLUDED.setor_industria,
  categoria = EXCLUDED.categoria,
  updated_at = NOW();

-- Verificar quantos registros foram inseridos
DO $$
DECLARE
  total_registros INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM public.cnae_classifications;
  RAISE NOTICE '✅ Registros inseridos/atualizados: %', total_registros;
END $$;
""")
    print(f"SQL gerado: {output_file} ({len(data)} registros)")

if __name__ == '__main__':
    # Ler dados do arquivo se fornecido, senão usar USER_DATA
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            data_text = f.read()
    else:
        data_text = USER_DATA
    
    data = parse_data(data_text)
    output = sys.argv[2] if len(sys.argv) > 2 else 'supabase/migrations/20250226000002_populate_cnae_classifications_COMPLETE.sql'
    generate_sql(data, output)

