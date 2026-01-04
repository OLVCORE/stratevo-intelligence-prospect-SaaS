#!/usr/bin/env python3
"""
Script para processar arquivo cnae_data_complete.txt e gerar SQL completo

Uso:
    python scripts/process_cnae_complete_file.py

O script procura o arquivo 'cnae_data_complete.txt' na raiz do projeto
e gera o SQL completo em 'supabase/migrations/20250226000002_populate_cnae_classifications_COMPLETE.sql'
"""

import os
import sys

def parse_cnae_file(file_path):
    """Parse arquivo TSV com dados CNAE"""
    results = []
    
    if not os.path.exists(file_path):
        print(f"ERRO: Arquivo nao encontrado: {file_path}")
        sys.exit(1)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith('CNAE'):
                continue
            
            # Tentar diferentes separadores
            if '\t' in line:
                parts = line.split('\t')
            elif '  ' in line:  # Espaços múltiplos
                parts = [p.strip() for p in line.split('  ') if p.strip()]
            else:
                # Tentar split por espaços
                parts = line.split()
            
            if len(parts) >= 3:
                cnae = parts[0].strip()
                setor = parts[1].strip()
                categoria = parts[2].strip()
                
                # Validar CNAE (deve ter - ou /)
                if cnae and setor and categoria and ('-' in cnae or '/' in cnae):
                    results.append((cnae, setor, categoria))
                else:
                    print(f"AVISO linha {line_num}: Formato invalido - {line[:50]}...")
    
    return results

def generate_sql(data, output_file):
    """Gera SQL completo"""
    print(f"Processando {len(data)} registros...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"""-- ============================================================================
-- MIGRATION: Popular Tabela cnae_classifications - DADOS COMPLETOS
-- ============================================================================
-- Data: 2025-02-26
-- Descricao: Insere TODOS os dados de Setor/Industria e Categoria fornecidos
-- Total de registros: {len(data)}
-- ============================================================================

INSERT INTO public.cnae_classifications (cnae_code, setor_industria, categoria) VALUES
""")
        
        values = []
        for i, (cnae, setor, categoria) in enumerate(data):
            # Escapar aspas simples
            setor_esc = setor.replace("'", "''")
            cat_esc = categoria.replace("'", "''")
            values.append(f"('{cnae}', '{setor_esc}', '{cat_esc}')")
            
            # Escrever em lotes para não sobrecarregar memória
            if len(values) >= 500:
                f.write(',\n'.join(values))
                f.write(',\n')
                values = []
                if (i + 1) % 500 == 0:
                    print(f"  Processados {i+1}/{len(data)} registros...")
        
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
  RAISE NOTICE 'Registros inseridos/atualizados: %', total_registros;
END $$;
""")
    
    print(f"SQL gerado: {output_file}")
    print(f"Total de registros processados: {len(data)}")

if __name__ == '__main__':
    # Caminho do arquivo na raiz do projeto
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(project_root, 'cnae_data_complete.txt')
    output_file = os.path.join(project_root, 'supabase', 'migrations', '20250226000002_populate_cnae_classifications_COMPLETE.sql')
    
    print(f"Procurando arquivo: {input_file}")
    
    data = parse_cnae_file(input_file)
    
    if not data:
        print("ERRO: Nenhum dado valido encontrado no arquivo!")
        sys.exit(1)
    
    # Estatisticas
    setores = set(s for _, s, _ in data)
    categorias = set(c for _, _, c in data)
    print(f"Setores unicos: {len(setores)}")
    print(f"Categorias unicas: {len(categorias)}")
    
    generate_sql(data, output_file)
    print("Concluido!")

