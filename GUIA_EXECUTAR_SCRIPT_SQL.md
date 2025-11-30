# 🚨 GUIA URGENTE: Executar Script SQL no Supabase

## ⚠️ PROBLEMA ATUAL

O erro `"Could not find the table 'public.sectors' in the schema cache"` indica que:
- ❌ As tabelas `sectors` e `niches` **NÃO foram criadas** no Supabase
- ❌ A função RPC `get_sectors_niches` **NÃO foi criada**
- ❌ O PostgREST não consegue encontrar as tabelas

## ✅ SOLUÇÃO: Executar Script SQL

### PASSO 1: Acessar Supabase SQL Editor

1. Abra seu navegador
2. Acesse: **https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new**
   - Substitua `qtcwetabhhkhvomcrqgm` pelo ID do seu projeto se diferente
3. Você verá o **SQL Editor** do Supabase

---

### PASSO 2: Abrir o Script SQL

1. No seu projeto local, abra o arquivo:
   ```
   SOLUCAO_DEFINITIVA_SETORES_NICHOS.sql
   ```
2. **Selecione TODO o conteúdo** (Ctrl+A)
3. **Copie** (Ctrl+C)

---

### PASSO 3: Colar e Executar no Supabase

1. **Cole** o conteúdo no SQL Editor do Supabase (Ctrl+V)
2. **Verifique** que o script está completo (deve ter ~450 linhas)
3. Clique no botão **"RUN"** (verde) ou pressione **Ctrl+Enter**
4. **Aguarde** a execução (pode levar 10-30 segundos)

---

### PASSO 4: Verificar Execução Bem-Sucedida

Após executar, você deve ver:

✅ **Mensagens de sucesso** (NOTICE):
```
✅ Setores criados: 12
✅ Nichos criados: 120
✅ SISTEMA CONFIGURADO CORRETAMENTE!
```

❌ **Se houver erros**, você verá mensagens em vermelho. Neste caso:
- Copie a mensagem de erro
- Verifique se há conflitos (tabelas já existentes)
- Execute novamente (o script é idempotente)

---

### PASSO 5: Forçar Atualização do Cache do PostgREST

Após executar o script principal, execute também:

1. Abra o arquivo: `FORCAR_ATUALIZACAO_POSTGREST.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor (nova query)
4. Execute (RUN)
5. Aguarde 30-60 segundos

---

### PASSO 6: Reiniciar Projeto (RECOMENDADO)

Para garantir que o PostgREST atualize o cache:

1. No Supabase Dashboard, vá em **Settings** → **General**
2. Role até encontrar **"Restart Project"**
3. Clique em **"Restart"**
4. Aguarde 1-2 minutos para o projeto reiniciar

---

### PASSO 7: Validar no Frontend

1. Recarregue a página do onboarding (Ctrl+Shift+R)
2. Abra o Console (F12)
3. Você deve ver:
   ```
   ✅ 12 setores carregados
   ✅ 120 nichos carregados
   ```

---

## 🔍 VERIFICAÇÃO ALTERNATIVA

Se ainda não funcionar, execute o diagnóstico:

1. Abra: `DIAGNOSTICO_COMPLETO_POSTGREST.sql`
2. Copie e execute no SQL Editor
3. Verifique os resultados:
   - **Tabelas devem existir** no banco
   - **Dados devem estar inseridos** (12 setores, 120 nichos)
   - **RLS deve estar configurado**
   - **Função RPC deve existir**

---

## ❓ TROUBLESHOOTING

### Erro: "relation already exists"
- ✅ **Normal** - significa que as tabelas já existem
- O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro executar novamente

### Erro: "permission denied"
- ❌ Você precisa de permissões de administrador
- Verifique se está logado como owner do projeto

### Erro: "function already exists"
- ✅ **Normal** - significa que a função já existe
- O script usa `CREATE OR REPLACE FUNCTION`, então é seguro executar novamente

### Tabelas existem mas PostgREST não vê
- Execute `FORCAR_ATUALIZACAO_POSTGREST.sql`
- **Reinicie o projeto** no Dashboard
- Aguarde 2-3 minutos

---

## 📞 PRÓXIMOS PASSOS

Após executar os scripts:

1. ✅ Execute `VALIDACAO_CONTINUA_SETORES_NICHOS.sql` para verificar status
2. ✅ Reinicie o projeto no Dashboard
3. ✅ Recarregue a página do frontend
4. ✅ Verifique os logs no console

Se ainda não funcionar após seguir TODOS os passos acima, me avise com:
- Screenshot do resultado do `DIAGNOSTICO_COMPLETO_POSTGREST.sql`
- Mensagens de erro do console do navegador

