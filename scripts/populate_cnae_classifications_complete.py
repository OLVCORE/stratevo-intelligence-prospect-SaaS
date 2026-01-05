#!/usr/bin/env python3
"""
Script COMPLETO para popular tabela cnae_classifications com TODOS os dados fornecidos

Uso:
    python scripts/populate_cnae_classifications_complete.py

Requisitos:
    - supabase-py: pip install supabase
    - Variáveis de ambiente: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
"""

import os
import sys
from supabase import create_client, Client

# TODOS OS DADOS FORNECIDOS PELO USUÁRIO
CNAE_DATA_COMPLETE = [
    # Agricultura - Produtor
    ("0111-3/01", "Agricultura", "Produtor"),
    ("0111-3/02", "Agricultura", "Produtor"),
    ("0111-3/03", "Agricultura", "Produtor"),
    ("0111-3/99", "Agricultura", "Produtor"),
    ("0112-1/01", "Agricultura", "Produtor"),
    ("0112-1/02", "Agricultura", "Produtor"),
    ("0112-1/99", "Agricultura", "Produtor"),
    ("0113-0/00", "Agricultura", "Produtor"),
    ("0114-8/00", "Agricultura", "Produtor"),
    ("0115-6/00", "Agricultura", "Produtor"),
    ("0116-4/01", "Agricultura", "Produtor"),
    ("0116-4/02", "Agricultura", "Produtor"),
    ("0116-4/03", "Agricultura", "Produtor"),
    ("0116-4/99", "Agricultura", "Produtor"),
    ("0119-9/01", "Agricultura", "Produtor"),
    ("0119-9/02", "Agricultura", "Produtor"),
    ("0119-9/03", "Agricultura", "Produtor"),
    ("0119-9/04", "Agricultura", "Produtor"),
    ("0119-9/05", "Agricultura", "Produtor"),
    ("0119-9/06", "Agricultura", "Produtor"),
    ("0119-9/07", "Agricultura", "Produtor"),
    ("0119-9/08", "Agricultura", "Produtor"),
    ("0119-9/09", "Agricultura", "Produtor"),
    ("0119-9/99", "Agricultura", "Produtor"),
    ("0121-1/01", "Agricultura", "Produtor"),
    ("0121-1/02", "Agricultura", "Produtor"),
    ("0122-9/00", "Agricultura", "Produtor"),
    ("0131-8/00", "Agricultura", "Produtor"),
    ("0132-6/00", "Agricultura", "Produtor"),
    ("0133-4/01", "Agricultura", "Produtor"),
    ("0133-4/02", "Agricultura", "Produtor"),
    ("0133-4/03", "Agricultura", "Produtor"),
    ("0133-4/04", "Agricultura", "Produtor"),
    ("0133-4/05", "Agricultura", "Produtor"),
    ("0133-4/06", "Agricultura", "Produtor"),
    ("0133-4/07", "Agricultura", "Produtor"),
    ("0133-4/08", "Agricultura", "Produtor"),
    ("0133-4/09", "Agricultura", "Produtor"),
    ("0133-4/10", "Agricultura", "Produtor"),
    ("0133-4/11", "Agricultura", "Produtor"),
    ("0133-4/99", "Agricultura", "Produtor"),
    ("0134-2/00", "Agricultura", "Produtor"),
    ("0135-1/00", "Agricultura", "Produtor"),
    ("0139-3/01", "Agricultura", "Produtor"),
    ("0139-3/02", "Agricultura", "Produtor"),
    ("0139-3/03", "Agricultura", "Produtor"),
    ("0139-3/04", "Agricultura", "Produtor"),
    ("0139-3/05", "Agricultura", "Produtor"),
    ("0139-3/06", "Agricultura", "Produtor"),
    ("0139-3/99", "Agricultura", "Produtor"),
    # Agricultura - Insumos - Agro
    ("0141-5/01", "Agricultura", "Insumos - Agro"),
    ("0141-5/02", "Agricultura", "Insumos - Agro"),
    ("0142-3/00", "Agricultura", "Insumos - Agro"),
    # Pecuária - Produtor
    ("0151-2/01", "Pecuária", "Produtor"),
    ("0151-2/02", "Pecuária", "Produtor"),
    ("0151-2/03", "Pecuária", "Produtor"),
    ("0152-1/01", "Pecuária", "Produtor"),
    ("0152-1/02", "Pecuária", "Produtor"),
    ("0152-1/03", "Pecuária", "Produtor"),
    ("0153-9/01", "Pecuária", "Produtor"),
    ("0153-9/02", "Pecuária", "Produtor"),
    ("0154-7/00", "Pecuária", "Produtor"),
    ("0155-5/01", "Pecuária", "Produtor"),
    ("0155-5/02", "Pecuária", "Produtor"),
    ("0155-5/03", "Pecuária", "Produtor"),
    ("0155-5/04", "Pecuária", "Produtor"),
    ("0155-5/05", "Pecuária", "Produtor"),
    # Agricultura/Pecuária - Outros
    ("0159-8/01", "Agricultura", "Produtor"),
    ("0159-8/02", "Serviços", "Outros Produtores"),
    ("0159-8/03", "Agricultura", "Produtor"),
    ("0159-8/04", "Agricultura", "Produtor"),
    ("0159-8/99", "Serviços", "Outros Produtores"),
    # Agricultura/Pecuária - Serviços Diretos
    ("0161-0/01", "Agricultura", "Serviços Diretos"),
    ("0161-0/02", "Agricultura", "Serviços Diretos"),
    ("0161-0/03", "Agricultura", "Serviços Diretos"),
    ("0161-0/99", "Agricultura", "Serviços Diretos"),
    ("0162-8/01", "Pecuária", "Serviços Diretos"),
    ("0162-8/02", "Pecuária", "Serviços Diretos"),
    ("0162-8/03", "Pecuária", "Serviços Diretos"),
    ("0162-8/99", "Pecuária", "Serviços Diretos"),
    ("0163-6/00", "Agricultura", "Serviços Diretos"),
    ("0170-9/00", "Agricultura", "Serviços Diretos"),
    # Agricultura - Produtor (continuação)
    ("0210-1/01", "Agricultura", "Produtor"),
    ("0210-1/02", "Agricultura", "Produtor"),
    ("0210-1/03", "Agricultura", "Produtor"),
    ("0210-1/04", "Agricultura", "Produtor"),
    ("0210-1/05", "Agricultura", "Produtor"),
    ("0210-1/06", "Agricultura", "Produtor"),
    ("0210-1/07", "Agricultura", "Serviços Diretos"),
    ("0210-1/08", "Agricultura", "Produtor"),
    ("0210-1/09", "Agricultura", "Produtor"),
    ("0210-1/99", "Agricultura", "Produtor"),
    ("0220-9/01", "Agricultura", "Serviços Diretos"),
    ("0220-9/02", "Agricultura", "Produtor"),
    ("0220-9/03", "Agricultura", "Serviços Diretos"),
    ("0220-9/04", "Agricultura", "Serviços Diretos"),
    ("0220-9/05", "Agricultura", "Serviços Diretos"),
    ("0220-9/06", "Conservação Ambiental", "Serviços Diretos"),
    ("0220-9/99", "Agricultura", "Serviços Diretos"),
    ("0230-6/00", "Agricultura", "Serviços Diretos"),
    # Pesca
    ("0311-6/01", "Pesca", "Produtor"),
    ("0311-6/02", "Pesca", "Produtor"),
    ("0311-6/03", "Pesca", "Serviços Diretos"),
    ("0311-6/04", "Pesca", "Serviços Diretos"),
    ("0312-4/01", "Pesca", "Produtor"),
    ("0312-4/02", "Pesca", "Produtor"),
    ("0312-4/03", "Pesca", "Serviços Diretos"),
    ("0312-4/04", "Pesca", "Serviços Diretos"),
    ("0321-3/01", "Pesca", "Produtor"),
    ("0321-3/02", "Pesca", "Produtor"),
    ("0321-3/03", "Pesca", "Produtor"),
    ("0321-3/04", "Pesca", "Produtor"),
    ("0321-3/05", "Pesca", "Serviços Diretos"),
    ("0321-3/99", "Pesca", "Produtor"),
    ("0322-1/01", "Pesca", "Produtor"),
    ("0322-1/02", "Pesca", "Produtor"),
    ("0322-1/03", "Pesca", "Produtor"),
    ("0322-1/04", "Pesca", "Produtor"),
    ("0322-1/05", "Pesca", "Produtor"),
    ("0322-1/06", "Pesca", "Produtor"),
    ("0322-1/07", "Pesca", "Serviços Diretos"),
    ("0322-1/99", "Pesca", "Produtor"),
    # Energia/Mineração
    ("0500-3/01", "Energia", "Extrativismo"),
    ("0500-3/02", "Energia", "Beneficiamento"),
    ("0600-0/01", "Energia", "Extrativismo"),
    ("0600-0/02", "Mineração", "Extrativismo"),
    ("0600-0/03", "Mineração", "Extrativismo"),
    ("0710-3/01", "Mineração", "Extrativismo"),
    ("0710-3/02", "Mineração", "Beneficiamento"),
    ("0721-9/01", "Mineração", "Extrativismo"),
    ("0721-9/02", "Mineração", "Beneficiamento"),
    ("0722-7/01", "Mineração", "Extrativismo"),
    ("0722-7/02", "Mineração", "Beneficiamento"),
    ("0723-5/01", "Mineração", "Extrativismo"),
    ("0723-5/02", "Mineração", "Beneficiamento"),
    ("0724-3/01", "Mineração", "Extrativismo"),
    ("0724-3/02", "Mineração", "Beneficiamento"),
    ("0725-1/00", "Mineração", "Extrativismo"),
    ("0729-4/01", "Mineração", "Extrativismo"),
    ("0729-4/02", "Mineração", "Extrativismo"),
    ("0729-4/03", "Mineração", "Extrativismo"),
    ("0729-4/04", "Mineração", "Extrativismo"),
    ("0729-4/05", "Mineração", "Beneficiamento"),
    ("0810-0/01", "Mineração", "Extrativismo"),
    ("0810-0/02", "Mineração", "Extrativismo"),
    ("0810-0/03", "Mineração", "Extrativismo"),
    ("0810-0/04", "Mineração", "Extrativismo"),
    ("0810-0/05", "Mineração", "Extrativismo"),
    ("0810-0/06", "Mineração", "Extrativismo"),
    ("0810-0/07", "Mineração", "Extrativismo"),
    ("0810-0/08", "Mineração", "Extrativismo"),
    ("0810-0/09", "Mineração", "Extrativismo"),
    ("0810-0/10", "Mineração", "Beneficiamento"),
    ("0810-0/99", "Mineração", "Extrativismo"),
    ("0891-6/00", "Mineração", "Extrativismo"),
    ("0892-4/01", "Mineração", "Extrativismo"),
    ("0892-4/02", "Mineração", "Extrativismo"),
    ("0892-4/03", "Mineração", "Beneficiamento"),
    ("0893-2/00", "Mineração", "Extrativismo"),
    ("0899-1/01", "Mineração", "Extrativismo"),
    ("0899-1/02", "Mineração", "Extrativismo"),
    ("0899-1/03", "Mineração", "Extrativismo"),
    ("0899-1/99", "Mineração", "Extrativismo"),
    ("0910-6/00", "Mineração", "Apoio"),
    ("0990-4/01", "Mineração", "Apoio"),
    ("0990-4/02", "Mineração", "Apoio"),
    ("0990-4/03", "Mineração", "Apoio"),
]

def populate_cnae_classifications():
    """
    Popula a tabela cnae_classifications com TODOS os dados fornecidos
    """
    # Configurar Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados")
        print("   Configure via variáveis de ambiente ou arquivo .env")
        sys.exit(1)
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"📊 Processando {len(CNAE_DATA_COMPLETE)} registros de CNAE...")
    
    # Inserir em lotes de 100 para melhor performance
    batch_size = 100
    total_inserted = 0
    total_errors = 0
    
    for i in range(0, len(CNAE_DATA_COMPLETE), batch_size):
        batch = CNAE_DATA_COMPLETE[i:i + batch_size]
        records = [
            {
                "cnae_code": item[0],
                "setor_industria": item[1],
                "categoria": item[2]
            }
            for item in batch
        ]
        
        try:
            result = supabase.table("cnae_classifications").upsert(
                records,
                on_conflict="cnae_code"
            ).execute()
            
            batch_inserted = len(records)
            total_inserted += batch_inserted
            print(f"✅ Lote {i//batch_size + 1}: {batch_inserted} registros inseridos/atualizados (Total: {total_inserted})")
        except Exception as e:
            total_errors += len(batch)
            print(f"❌ Erro ao inserir lote {i//batch_size + 1}: {e}")
            # Tentar inserir um por um para identificar qual está com problema
            for record in records:
                try:
                    supabase.table("cnae_classifications").upsert(
                        [record],
                        on_conflict="cnae_code"
                    ).execute()
                    total_inserted += 1
                except Exception as e2:
                    print(f"   ⚠️ Erro ao inserir {record['cnae_code']}: {e2}")
    
    print(f"\n✅ População concluída!")
    print(f"   Total inserido/atualizado: {total_inserted}")
    if total_errors > 0:
        print(f"   ⚠️ Erros: {total_errors}")
    
    # Verificar total na tabela
    try:
        result = supabase.table("cnae_classifications").select("cnae_code", count="exact").execute()
        print(f"   📊 Total na tabela: {result.count}")
    except Exception as e:
        print(f"   ⚠️ Não foi possível verificar total: {e}")

if __name__ == "__main__":
    populate_cnae_classifications()

