# 🔧 SOLUÇÃO: Erro "column tenant_id does not exist"

## ❌ **ERRO:**
```
ERROR: 42703: column "tenant_id" does not exist
```

## 🔍 **CAUSA:**
Algumas tabelas não têm a coluna `tenant_id` ou o SQL tentou criar policies em tabelas que ainda não existem.

---

## ✅ **SOLUÇÃO RÁPIDA**

### **Execute Este Arquivo CORRIGIDO:**

```
RLS_SAAS_PRODUCAO_SEGURO_CORRIGIDO.sql
```

### **O Que Foi Corrigido:**

1. ✅ **Verificação de Existência:**
   - Verifica se a tabela existe antes de criar policy
   - Verifica se a coluna `tenant_id` existe
   - Só cria policy se ambos existirem

2. ✅ **Mensagens Informativas:**
   - RAISE NOTICE em cada etapa
   - Mostra quais policies foram criadas
   - Mostra quais tabelas foram puladas

3. ✅ **Diagnóstico Incluído:**
   - Lista todas as colunas relacionadas a tenant
   - Ajuda a identificar problemas de estrutura

---

## 🚀 **COMO EXECUTAR:**

### **Passo 1: Deletar o Arquivo Antigo**
❌ NÃO use mais: `RLS_SAAS_PRODUCAO_SEGURO.sql`

### **Passo 2: Usar o Novo**
✅ Use: `RLS_SAAS_PRODUCAO_SEGURO_CORRIGIDO.sql`

### **Passo 3: Executar no Supabase**
1. Abra: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql
2. Cole o conteúdo de `RLS_SAAS_PRODUCAO_SEGURO_CORRIGIDO.sql`
3. Clique em RUN

---

## 📊 **O QUE ESPERAR:**

### **NOTICES que Aparecerão:**

```
✅ Policies antigas removidas de icp_profiles_metadata
✅ Função is_admin_or_developer() criada
✅ Policies criadas para icp_profiles_metadata
✅ Policy criada para onboarding_sessions
✅ Policy criada para companies
⚠️ Tabela qualified_prospects não existe ainda (normal se não aplicou MOTOR_QUALIFICACAO_SIMPLES.sql)
```

### **Resultados:**

```sql
-- Lista de policies criadas:
📋 POLICIES ATIVAS:
| tablename               | policyname                              | operacao |
|-------------------------|-----------------------------------------|----------|
| icp_profiles_metadata   | SAAS Secure: View ICPs                  | SELECT   |
| icp_profiles_metadata   | SAAS Secure: Create ICPs                | INSERT   |
| icp_profiles_metadata   | SAAS Secure: Update ICPs                | UPDATE   |
| icp_profiles_metadata   | SAAS Secure: Delete ICPs                | DELETE   |
| onboarding_sessions     | SAAS Secure: View onboarding sessions   | SELECT   |
| companies               | SAAS Secure: View companies             | SELECT   |
```

---

## 🔍 **SE ALGUMA TABELA NÃO FOI CONFIGURADA:**

### **Verificar Estrutura:**

Execute este SQL para ver a estrutura:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('companies', 'icp_analysis_results', 'qualified_prospects')
AND (column_name LIKE '%tenant%' OR column_name LIKE '%id%')
ORDER BY table_name, ordinal_position;
```

### **Se a Tabela Não Tem `tenant_id`:**

Posso criar uma policy customizada. Me avise:
- Nome da tabela
- Colunas que ela tem
- Como identificar o tenant (ex: via outra tabela)

---

## ⚠️ **TABELAS QUE PODEM PRECISAR DE AJUSTE:**

### **1. `qualified_prospects`**
- Só existe se você aplicou `MOTOR_QUALIFICACAO_SIMPLES.sql`
- Se não aplicou ainda, a policy será criada depois

### **2. `companies`**
- Se não tem `tenant_id`, pode ter outra estrutura
- Pode estar usando schema separado por tenant
- Me avise se der aviso sobre esta tabela

### **3. `icp_analysis_results`**
- Deve ter `tenant_id`
- Se não tiver, me avise

---

## 📋 **CHECKLIST:**

- [ ] 1. Abri `RLS_SAAS_PRODUCAO_SEGURO_CORRIGIDO.sql`
- [ ] 2. Copiei o conteúdo
- [ ] 3. Abri Supabase SQL Editor
- [ ] 4. Colei e executei
- [ ] 5. Li os NOTICES que apareceram
- [ ] 6. Verifiquei a lista de policies criadas
- [ ] 7. ✅ Sucesso! Sem erros

---

## 🎯 **RESULTADO ESPERADO:**

```
✅ Script executa SEM ERROS
✅ Policies criadas onde possível
✅ Mensagens informativas sobre cada etapa
✅ Função is_admin_or_developer() funcionando
✅ Você (desenvolvedor) tem acesso total
✅ Outros usuários têm acesso restrito
```

---

## 📞 **SE AINDA DER ERRO:**

Cole aqui:
1. A mensagem de erro completa
2. Os NOTICES que apareceram antes do erro
3. Qual linha do SQL deu erro

Vou corrigir imediatamente! 🚀

---

## ✅ **EXECUTE AGORA:**

```
1. Abra: RLS_SAAS_PRODUCAO_SEGURO_CORRIGIDO.sql
2. Copie tudo
3. Cole no Supabase SQL Editor
4. Execute (RUN)
5. Leia os NOTICES
6. Cole o resultado aqui
```

**Problema resolvido! 🎉**

