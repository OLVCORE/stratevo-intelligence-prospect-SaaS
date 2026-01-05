#!/usr/bin/env python3
"""
Script para processar dados CNAE fornecidos pelo usuário e gerar SQL ou inserir diretamente

Uso:
    # Gerar SQL
    python scripts/process_cnae_data.py --generate-sql > cnae_data.sql
    
    # Inserir diretamente no Supabase
    python scripts/process_cnae_data.py --insert
"""

import sys
import re
import argparse
from typing import List, Tuple

# Dados fornecidos pelo usuário (formato: CNAE\tSetor\tCategoria)
CNAE_DATA_RAW = """
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
0990-4/03	Mineração	Apoio
"""

def parse_cnae_data(data: str) -> List[Tuple[str, str, str]]:
    """Parse dados CNAE do formato tab-separated"""
    results = []
    for line in data.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) >= 3:
            cnae = parts[0].strip()
            setor = parts[1].strip()
            categoria = parts[2].strip()
            if cnae and setor and categoria:
                results.append((cnae, setor, categoria))
    return results

def generate_sql(data: List[Tuple[str, str, str]]) -> str:
    """Gera SQL INSERT para os dados"""
    sql = """-- ============================================================================
-- MIGRATION: Popular Tabela cnae_classifications - DADOS COMPLETOS
-- ============================================================================
-- Data: 2025-02-26
-- Descrição: Insere TODOS os dados de Setor/Indústria e Categoria fornecidos
-- Total de registros: {total}
-- ============================================================================

INSERT INTO public.cnae_classifications (cnae_code, setor_industria, categoria) VALUES
""".format(total=len(data))
    
    values = []
    for cnae, setor, categoria in data:
        # Escapar aspas simples
        setor_escaped = setor.replace("'", "''")
        categoria_escaped = categoria.replace("'", "''")
        values.append(f"('{cnae}', '{setor_escaped}', '{categoria_escaped}')")
    
    sql += ',\n'.join(values)
    sql += """
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
"""
    return sql

def main():
    parser = argparse.ArgumentParser(description='Processar dados CNAE')
    parser.add_argument('--generate-sql', action='store_true', help='Gerar arquivo SQL')
    parser.add_argument('--output', default='cnae_data_complete.sql', help='Arquivo de saída SQL')
    parser.add_argument('--input-file', help='Arquivo de entrada com dados CNAE (opcional)')
    
    args = parser.parse_args()
    
    # Ler dados
    if args.input_file:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            data_raw = f.read()
    else:
        data_raw = CNAE_DATA_RAW
    
    # Parse dados
    data = parse_cnae_data(data_raw)
    print(f"📊 Processados {len(data)} registros CNAE", file=sys.stderr)
    
    if args.generate_sql:
        sql = generate_sql(data)
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f"✅ SQL gerado em: {args.output}", file=sys.stderr)
        print(f"   Total de registros: {len(data)}", file=sys.stderr)
    else:
        # Apenas mostrar estatísticas
        print(f"Total de registros: {len(data)}")
        setores = set(s for _, s, _ in data)
        categorias = set(c for _, _, c in data)
        print(f"Setores únicos: {len(setores)}")
        print(f"Categorias únicas: {len(categorias)}")

if __name__ == '__main__':
    main()

