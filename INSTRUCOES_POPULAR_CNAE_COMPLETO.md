# 📋 Instruções para Popular TODOS os Dados CNAE

## 🎯 Objetivo

Popular a tabela `cnae_classifications` com **TODOS os 1000+ registros** fornecidos pelo usuário.

---

## ✅ Opção 1: Usar Script Python (Recomendado)

### Passo 1: Criar arquivo com todos os dados

Crie um arquivo `cnae_data_complete.txt` com todos os dados fornecidos no formato:

```
CNAE	Setor/Indústria	Categoria
0111-3/01	Agricultura	Produtor
0111-3/02	Agricultura	Produtor
...
```

**Formato:** Tab-separated (TSV) - um registro por linha

### Passo 2: Executar script

```bash
# Gerar SQL completo
python scripts/populate_all_cnae_data.py --generate-sql --input-file cnae_data_complete.txt

# OU inserir diretamente no Supabase
python scripts/populate_all_cnae_data.py --insert --input-file cnae_data_complete.txt
```

**Requisitos:**
- Python 3.7+
- `pip install supabase` (se usar --insert)

---

## ✅ Opção 2: Criar SQL Manualmente

### Passo 1: Processar dados

Use o script `process_cnae_data.py` para gerar SQL:

```bash
python scripts/process_cnae_data.py --generate-sql --input-file cnae_data_complete.txt
```

### Passo 2: Executar SQL no Supabase

1. Abra o Supabase SQL Editor
2. Cole o conteúdo do arquivo gerado
3. Execute

---

## ✅ Opção 3: Inserir via Supabase Dashboard

1. Acesse Supabase Dashboard → Table Editor
2. Selecione tabela `cnae_classifications`
3. Use "Import data" ou insira manualmente

---

## 📝 Formato dos Dados

Os dados devem estar no formato:

```
CNAE	Setor/Indústria	Categoria
0111-3/01	Agricultura	Produtor
6201-5/00	Tecnologia da Informação	Serviços
```

**Separador:** Tab (`\t`) ou múltiplos espaços

**Colunas:**
1. **CNAE:** Código CNAE (ex: `0111-3/01`)
2. **Setor/Indústria:** Setor (ex: `Agricultura`, `Tecnologia da Informação`)
3. **Categoria:** Categoria (ex: `Produtor`, `Serviços`, `Fabricante`)

---

## 🔍 Verificação

Após popular os dados, verifique:

```sql
-- Contar total de registros
SELECT COUNT(*) FROM public.cnae_classifications;

-- Verificar setores únicos
SELECT DISTINCT setor_industria FROM public.cnae_classifications ORDER BY setor_industria;

-- Verificar categorias únicas
SELECT DISTINCT categoria FROM public.cnae_classifications ORDER BY categoria;

-- Verificar alguns registros
SELECT * FROM public.cnae_classifications LIMIT 10;
```

---

## ⚠️ Importante

1. **Todos os dados:** Certifique-se de incluir TODOS os 1000+ registros fornecidos
2. **Formato correto:** CNAE deve ter formato válido (ex: `0111-3/01`)
3. **Sem duplicatas:** O script usa `ON CONFLICT` para evitar duplicatas
4. **Backup:** Faça backup antes de executar em produção

---

## 🐛 Troubleshooting

### Erro: "Nenhum dado válido encontrado"

**Causa:** Formato do arquivo incorreto

**Solução:**
- Verifique se o arquivo usa Tab (`\t`) como separador
- Verifique se há 3 colunas por linha
- Verifique se não há linhas vazias no início

### Erro: "supabase-py não instalado"

**Solução:**
```bash
pip install supabase
```

### Erro: "SUPABASE_URL não configurado"

**Solução:**
```bash
export SUPABASE_URL="sua-url"
export SUPABASE_SERVICE_ROLE_KEY="sua-chave"
```

---

## 📊 Estatísticas Esperadas

Após popular todos os dados, você deve ter:

- **Total de registros:** 1000+ (dependendo dos dados fornecidos)
- **Setores únicos:** ~20-30 setores diferentes
- **Categorias únicas:** ~10-15 categorias diferentes

---

**Data:** 2025-02-26  
**Status:** Aguardando dados completos do usuário

