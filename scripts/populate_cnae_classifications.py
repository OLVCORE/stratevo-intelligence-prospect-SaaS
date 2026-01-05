#!/usr/bin/env python3
"""
Script para popular tabela cnae_classifications com dados de Setor/Indústria e Categoria

Uso:
    python scripts/populate_cnae_classifications.py

Requisitos:
    - psycopg2 ou supabase-py
    - Arquivo CSV ou dados fornecidos pelo usuário
"""

import csv
import sys
from supabase import create_client, Client

# Dados fornecidos pelo usuário (primeira parte)
CNAE_DATA = [
    {"cnae": "0111-3/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0111-3/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0111-3/03", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0111-3/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0112-1/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0112-1/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0112-1/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0113-0/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0114-8/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0115-6/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0116-4/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0116-4/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0116-4/03", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0116-4/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/03", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/04", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/05", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/06", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/07", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/08", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/09", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0119-9/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0121-1/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0121-1/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0122-9/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0131-8/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0132-6/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/03", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/04", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/05", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/06", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/07", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/08", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/09", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/10", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/11", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0133-4/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0134-2/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0135-1/00", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/01", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/02", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/03", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/04", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/05", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/06", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0139-3/99", "setor": "Agricultura", "categoria": "Produtor"},
    {"cnae": "0141-5/01", "setor": "Agricultura", "categoria": "Insumos - Agro"},
    {"cnae": "0141-5/02", "setor": "Agricultura", "categoria": "Insumos - Agro"},
    {"cnae": "0142-3/00", "setor": "Agricultura", "categoria": "Insumos - Agro"},
    # ... (continuar com todos os dados fornecidos)
]

def populate_cnae_classifications():
    """
    Popula a tabela cnae_classifications com dados de Setor/Indústria e Categoria
    """
    # Configurar Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados")
        sys.exit(1)
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print(f"📊 Populando {len(CNAE_DATA)} registros de CNAE...")
    
    # Inserir em lotes de 100
    batch_size = 100
    for i in range(0, len(CNAE_DATA), batch_size):
        batch = CNAE_DATA[i:i + batch_size]
        records = [
            {
                "cnae_code": item["cnae"],
                "setor_industria": item["setor"],
                "categoria": item["categoria"]
            }
            for item in batch
        ]
        
        try:
            result = supabase.table("cnae_classifications").upsert(
                records,
                on_conflict="cnae_code"
            ).execute()
            
            print(f"✅ Lote {i//batch_size + 1}: {len(batch)} registros inseridos/atualizados")
        except Exception as e:
            print(f"❌ Erro ao inserir lote {i//batch_size + 1}: {e}")
    
    print("✅ População concluída!")

if __name__ == "__main__":
    import os
    populate_cnae_classifications()

