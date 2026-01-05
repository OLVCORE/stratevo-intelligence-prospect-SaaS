#!/usr/bin/env python3
"""
Script para processar TODOS os dados CNAE fornecidos pelo usuário
e gerar SQL completo ou inserir diretamente no Supabase

Este script processa os dados fornecidos pelo usuário e cria um SQL completo
com TODOS os 1000+ registros.

Uso:
    # Gerar SQL completo
    python scripts/populate_all_cnae_data.py --generate-sql
    
    # Inserir diretamente no Supabase
    python scripts/populate_all_cnae_data.py --insert
"""

import os
import sys
import argparse
from typing import List, Tuple

# NOTA: Este script espera que os dados completos estejam em um arquivo
# chamado 'cnae_data_complete.txt' no mesmo diretório
# Ou você pode passar via --input-file

def parse_cnae_data_from_text(text: str) -> List[Tuple[str, str, str]]:
    """Parse dados CNAE do formato tab-separated"""
    results = []
    lines = text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Tentar diferentes separadores
        if '\t' in line:
            parts = line.split('\t')
        elif '  ' in line:  # Espaços múltiplos
            parts = [p.strip() for p in line.split('  ') if p.strip()]
        else:
            # Tentar split por espaços e pegar primeiros 3 campos
            parts = line.split()
            if len(parts) < 3:
                continue
        
        if len(parts) >= 3:
            cnae = parts[0].strip()
            setor = parts[1].strip()
            categoria = parts[2].strip()
            
            # Validar formato CNAE (ex: 0111-3/01)
            if cnae and setor and categoria and ('-' in cnae or '/' in cnae):
                results.append((cnae, setor, categoria))
    
    return results

def generate_sql_complete(data: List[Tuple[str, str, str]], output_file: str):
    """Gera SQL completo com todos os dados"""
    print(f"📊 Gerando SQL com {len(data)} registros...", file=sys.stderr)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("""-- ============================================================================
-- MIGRATION: Popular Tabela cnae_classifications - DADOS COMPLETOS
-- ============================================================================
-- Data: 2025-02-26
-- Descrição: Insere TODOS os dados de Setor/Indústria e Categoria fornecidos
-- Total de registros: {total}
-- ============================================================================

INSERT INTO public.cnae_classifications (cnae_code, setor_industria, categoria) VALUES
""".format(total=len(data)))
        
        values = []
        for i, (cnae, setor, categoria) in enumerate(data):
            # Escapar aspas simples
            setor_escaped = setor.replace("'", "''")
            categoria_escaped = categoria.replace("'", "''")
            values.append(f"('{cnae}', '{setor_escaped}', '{categoria_escaped}')")
            
            # Escrever em lotes para não sobrecarregar memória
            if len(values) >= 500:
                f.write(',\n'.join(values))
                f.write(',\n')
                values = []
                print(f"  Processados {i+1}/{len(data)} registros...", file=sys.stderr)
        
        # Escrever restante
        if values:
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
    
    print(f"✅ SQL gerado em: {output_file}", file=sys.stderr)

def insert_directly(data: List[Tuple[str, str, str]]):
    """Insere dados diretamente no Supabase"""
    try:
        from supabase import create_client, Client
    except ImportError:
        print("❌ Erro: supabase-py não instalado. Execute: pip install supabase", file=sys.stderr)
        sys.exit(1)
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados", file=sys.stderr)
        sys.exit(1)
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"📊 Inserindo {len(data)} registros no Supabase...", file=sys.stderr)
    
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        records = [
            {
                "cnae_code": cnae,
                "setor_industria": setor,
                "categoria": categoria
            }
            for cnae, setor, categoria in batch
        ]
        
        try:
            result = supabase.table("cnae_classifications").upsert(
                records,
                on_conflict="cnae_code"
            ).execute()
            
            total_inserted += len(records)
            print(f"✅ Lote {i//batch_size + 1}: {len(records)} registros (Total: {total_inserted})", file=sys.stderr)
        except Exception as e:
            print(f"❌ Erro no lote {i//batch_size + 1}: {e}", file=sys.stderr)
    
    print(f"✅ Concluído! Total inserido: {total_inserted}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description='Processar TODOS os dados CNAE')
    parser.add_argument('--generate-sql', action='store_true', help='Gerar arquivo SQL completo')
    parser.add_argument('--insert', action='store_true', help='Inserir diretamente no Supabase')
    parser.add_argument('--output', default='supabase/migrations/20250226000002_populate_cnae_classifications_COMPLETE.sql', 
                       help='Arquivo de saída SQL')
    parser.add_argument('--input-file', help='Arquivo de entrada com dados CNAE (formato: CNAE\\tSetor\\tCategoria)')
    
    args = parser.parse_args()
    
    # Ler dados
    if args.input_file:
        if not os.path.exists(args.input_file):
            print(f"❌ Arquivo não encontrado: {args.input_file}", file=sys.stderr)
            sys.exit(1)
        with open(args.input_file, 'r', encoding='utf-8') as f:
            data_text = f.read()
    else:
        print("⚠️  Nenhum arquivo de entrada fornecido.", file=sys.stderr)
        print("   Use --input-file para especificar arquivo com dados CNAE", file=sys.stderr)
        print("   Formato esperado: CNAE\\tSetor\\tCategoria (um por linha)", file=sys.stderr)
        sys.exit(1)
    
    # Parse dados
    data = parse_cnae_data_from_text(data_text)
    print(f"📊 Processados {len(data)} registros CNAE", file=sys.stderr)
    
    if not data:
        print("❌ Nenhum dado válido encontrado!", file=sys.stderr)
        sys.exit(1)
    
    # Estatísticas
    setores = set(s for _, s, _ in data)
    categorias = set(c for _, _, c in data)
    print(f"   Setores únicos: {len(setores)}", file=sys.stderr)
    print(f"   Categorias únicas: {len(categorias)}", file=sys.stderr)
    
    if args.generate_sql:
        generate_sql_complete(data, args.output)
    elif args.insert:
        insert_directly(data)
    else:
        print("⚠️  Especifique --generate-sql ou --insert", file=sys.stderr)

if __name__ == '__main__':
    main()

