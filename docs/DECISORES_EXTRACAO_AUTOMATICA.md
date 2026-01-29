# Extração automática de decisores (Apollo + Lusha)

## Como funciona

1. **Onde usar**: No dossiê da empresa (TOTVSCheckCard), aba **Decisores**.
2. **Botão**: "Extrair decisores" — usa **domínio** e **localização** já cadastrados (cidade, estado, CEP, nome fantasia) para buscar no Apollo e complementar com Lusha.
3. **Checkbox**: "Forçar nova extração" — quando marcado, a busca é refeita mesmo que já existam decisores salvos (ignora idempotência).

## O que foi implementado

- **Normalização canônica do nome**: O backend remove sufixos jurídicos (S.A., S/A, LTDA, ME, EPP, etc.) antes de buscar no Apollo, alinhado ao que as plataformas usam.
- **Ordem de matching no Apollo**:  
  1. Domínio (mais preciso)  
  2. URL do LinkedIn  
  3. Nome (primeira palavra → segunda palavra → nome canônico → nome original), com filtros por CEP, cidade/estado, fantasia e Brasil.
- **Forçar nova extração**: Permite rodar de novo a extração mesmo quando já há decisores (útil após corrigir domínio ou endereço).

## Por que pode dar "0 decisores"?

1. **Domínio não cadastrado**  
   A extração automática exige **site/domínio** da empresa. Sem isso, o botão fica desabilitado e aparece a mensagem: "Cadastre o site/domínio da empresa para extração automática."

2. **Empresa não encontrada no Apollo**  
   - Domínio diferente do que o Apollo tem (ex.: site antigo ou outro domínio).  
   - Empresa pequena ou pouco exposta, sem perfil no Apollo.  
   - Nome/razão social muito diferente do que está no Apollo (a normalização canônica ajuda, mas não cobre todos os casos).

3. **Organização encontrada, mas sem pessoas**  
   O Apollo pode ter a empresa cadastrada e não ter contatos (pessoas) associados. A mensagem será: "Organização encontrada, mas nenhuma pessoa listada no Apollo."

4. **Localização não preenchida**  
   Cidade, estado, CEP e fantasia melhoram o matching quando a busca é por nome. Se a planilha/upload não preencher `raw_data.municipio`, `raw_data.uf`, `raw_data.cep` ou `raw_data.nome_fantasia`, o backend usa só nome/domínio e o resultado pode ser pior ou incorreto.

5. **APOLLO_API_KEY**  
   No Supabase (Edge Functions), a variável `APOLLO_API_KEY` precisa estar configurada. Caso contrário, a mensagem será: "APOLLO_API_KEY não configurada no Supabase."

## Upload de planilha (CSV/XLSX) — fluxo completo

As **444 (e milhares)** empresas vêm do upload da planilha completa no **Motor de Qualificação** (Upload em Massa). O fluxo é:

1. **Upload CSV/Excel** (BulkUploadDialog) → dados vão para **prospecting_candidates** com mapeamento automático de colunas:
   - **Website/Site/Domínio** → `website` (usado depois para extração por domínio)
   - **Cidade/Município** → `city`
   - **UF/Estado** → `uf`
   - **Nome Fantasia** → `nome_fantasia` (para matching Apollo)
   - Razão Social, CNPJ, Setor também são mapeados.

2. **Rodar Qualificação** → o job processa e insere em **qualified_prospects** (Estoque Qualificado) com `website`, `cidade`, `estado`, `nome_fantasia`, etc.

3. **Enviar para Banco de Empresas** (a partir do Estoque Qualificado) → cria/atualiza registros em **companies** com:
   - `website`, `headquarters_city`, `headquarters_state`
   - **raw_data**: `municipio`, `uf`, `cidade`, `fantasia`, `nome_fantasia` (para a aba Decisores e a Edge Function usarem na extração)

4. No **dossiê** da empresa (Base de Empresas), a aba **Decisores** lê cidade/estado/fantasia de `raw_data.municipio`, `raw_data.uf`, `raw_data.fantasia`/`raw_data.nome_fantasia`. Com **domínio** cadastrado (ou `website`), o botão "Extrair decisores" usa domínio + localização para buscar no Apollo.

**Resumo**: Planilha completa → prospecting_candidates (website, city, uf, nome_fantasia) → Rodar Qualificação → qualified_prospects → Enviar para Banco de Empresas → companies com raw_data preenchido → no dossiê, "Extrair decisores" usa domínio + localização.

## O que conferir quando der 0 decisores

1. Empresa tem **site/domínio** cadastrado (campo domínio ou website)?  
2. No Supabase, a Edge Function **enrich-apollo-decisores** está com **APOLLO_API_KEY** (e, se usar, **LUSHA_API_KEY**) definidas?  
3. A empresa está em **companies** (e não só em prospecting_candidates)?  
4. Se a busca for por nome, **raw_data** tem `municipio`, `uf`, `cep`, `nome_fantasia`?  
5. Testar com "Forçar nova extração" marcado após corrigir domínio ou endereço.

## Redeploy da Edge Function

Após alterações em `supabase/functions/enrich-apollo-decisores/index.ts`, é necessário fazer o deploy da função no Supabase para que as mudanças valham em produção:

```bash
supabase functions deploy enrich-apollo-decisores
```

Depois, conferir no dashboard do Supabase se as variáveis de ambiente (APOLLO_API_KEY, LUSHA_API_KEY) estão definidas para essa função.
