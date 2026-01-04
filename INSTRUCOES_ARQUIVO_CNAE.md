# 📋 Instruções: Criar Arquivo cnae_data_complete.txt

## 📁 Nome do Arquivo

Crie o arquivo na **raiz do projeto** com o nome:

```
cnae_data_complete.txt
```

## 📝 Formato do Arquivo

O arquivo deve estar no formato **TSV (Tab-Separated Values)**:

```
CNAE	Setor / Indústria	Categoria
0111-3/01	Agricultura	Produtor
0111-3/02	Agricultura	Produtor
0111-3/03	Agricultura	Produtor
...
```

**Importante:**
- Primeira linha: cabeçalho (será ignorada)
- Separador: **Tab** (`\t`) entre as colunas
- Uma linha por registro
- Encoding: **UTF-8**

## ✅ Após Criar o Arquivo

Execute o script para gerar o SQL:

```bash
python scripts/process_cnae_complete_file.py
```

O script irá:
1. Ler o arquivo `cnae_data_complete.txt` da raiz do projeto
2. Processar todos os registros
3. Gerar o SQL completo em `supabase/migrations/20250226000002_populate_cnae_classifications_COMPLETE.sql`

## 🔍 Verificação

Após executar o script, verifique:
- Total de registros processados
- Se o arquivo SQL foi gerado corretamente
- Execute o SQL no Supabase para popular a tabela

## 📊 Exemplo de Conteúdo

```
CNAE	Setor / Indústria	Categoria
0111-3/01	Agricultura	Produtor
0111-3/02	Agricultura	Produtor
6201-5/00	Tecnologia da Informação	Serviços
1091-1/01	Alimentos	Fabricante
...
```

**Nota:** Cole TODOS os dados fornecidos (1000+ registros) no arquivo.

