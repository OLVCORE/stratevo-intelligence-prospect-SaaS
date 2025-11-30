# 🧪 TESTE COMPLETO DO CRM - CHECKLIST

## 📋 GUIA DE TESTES END-TO-END

Execute estes testes na ordem para verificar se tudo está funcionando.

---

## 1️⃣ TESTE: AUTOMAÇÕES BÁSICAS

### 1.1. Criar Lead e Verificar Automação
1. Acesse `/crm/leads`
2. Clique em "Novo Lead"
3. Preencha os dados e salve
4. **Verificar:**
   - [ ] Lead aparece na lista
   - [ ] Console do navegador mostra: `[Automation Polling] Automation runner executado`
   - [ ] Verificar se score de IA foi calculado (pode levar alguns segundos)

### 1.2. Mudar Status de Lead
1. Abra um lead existente
2. Mude o status (ex: de "novo" para "qualificado")
3. **Verificar:**
   - [ ] Status foi atualizado
   - [ ] Console mostra trigger de IA sendo chamado
   - [ ] Verificar se coaching insights foram gerados em `/crm/performance`

### 1.3. Criar Atividade
1. Abra um lead ou deal
2. Crie uma nova atividade (email, call, meeting)
3. **Verificar:**
   - [ ] Atividade foi criada
   - [ ] Verificar se IA Assistant gerou sugestões em `/crm/ai-insights`
   - [ ] Verificar se pontos de gamificação foram calculados em `/crm/performance`

---

## 2️⃣ TESTE: PERFORMANCE (CICLO 7)

### 2.1. Metas
1. Acesse `/crm/performance`
2. Clique em "Criar Meta"
3. Preencha os dados e salve
4. **Verificar:**
   - [ ] Meta aparece no dashboard
   - [ ] Progresso é atualizado automaticamente

### 2.2. Gamificação
1. Registre algumas atividades (criar lead, fazer call, enviar email)
2. Acesse `/crm/performance` → Aba "Gamificação"
3. **Verificar:**
   - [ ] Pontos foram calculados
   - [ ] Leaderboard mostra seu nome
   - [ ] Badges aparecem (se aplicável)

### 2.3. Coaching Insights
1. Mude status de alguns leads/deals
2. Acesse `/crm/performance` → Aba "Coaching"
3. **Verificar:**
   - [ ] Insights aparecem
   - [ ] Sugestões são relevantes

---

## 3️⃣ TESTE: INTEGRAÇÕES (CICLO 8)

### 3.1. API Keys
1. Acesse `/crm/integrations` → Aba "API Keys"
2. Clique em "Gerar Nova Chave"
3. Preencha nome e descrição
4. **Verificar:**
   - [ ] Chave foi gerada (aparece apenas uma vez!)
   - [ ] Chave aparece na lista com prefixo
   - [ ] É possível deletar a chave

### 3.2. Webhooks
1. Acesse `/crm/integrations` → Aba "Webhooks"
2. Clique em "Criar Webhook"
3. Preencha URL e eventos
4. **Verificar:**
   - [ ] Webhook foi criado
   - [ ] Quando um evento acontece, webhook é processado
   - [ ] Logs de entrega aparecem

---

## 4️⃣ TESTE: IA INSIGHTS (CICLO 9)

### 4.1. Lead Scoring
1. Crie alguns leads com diferentes status
2. Acesse `/crm/ai-insights` → Aba "Lead Scoring"
3. **Verificar:**
   - [ ] Scores aparecem para cada lead
   - [ ] Probabilidade de fechamento está calculada
   - [ ] Risco de churn está calculado
   - [ ] Próxima melhor ação aparece

### 4.2. Sugestões de IA
1. Crie algumas atividades (emails, calls)
2. Acesse `/crm/ai-insights` → Aba "Sugestões"
3. **Verificar:**
   - [ ] Sugestões aparecem
   - [ ] É possível aplicar sugestões
   - [ ] Sugestões aplicadas desaparecem

### 4.3. Resumos de Conversas
1. Crie atividades com notas/detalhes
2. Acesse `/crm/ai-insights` → Aba "Resumos"
3. **Verificar:**
   - [ ] Resumos aparecem
   - [ ] Pontos-chave são extraídos
   - [ ] Itens de ação aparecem

---

## 5️⃣ TESTE: CUSTOMIZAÇÃO (CICLO 10)

### 5.1. Campos Customizados
1. Acesse `/crm/customization` → Aba "Campos Customizados"
2. Clique em "Novo Campo"
3. Crie um campo (ex: "Número do Contrato", tipo: texto)
4. **Verificar:**
   - [ ] Campo foi criado
   - [ ] Aparece na lista
   - [ ] É possível editar/deletar

### 5.2. Visualizações Customizadas
1. Acesse `/crm/customization` → Aba "Visualizações Customizadas"
2. Clique em "Nova Visualização"
3. Crie uma visualização (ex: "Leads de Alta Prioridade")
4. **Verificar:**
   - [ ] Visualização foi criada
   - [ ] Aparece na lista
   - [ ] É possível compartilhar com equipe

---

## 6️⃣ TESTE: CONEXÕES ENTRE MÓDULOS

### 6.1. SDR → CRM
1. No módulo SDR, qualifique um lead
2. Acesse `/crm/leads`
3. **Verificar:**
   - [ ] Lead aparece no CRM
   - [ ] Dados do SDR estão presentes

### 6.2. ICP → CRM
1. No módulo ICP, aprove um lead
2. Acesse `/crm/leads`
3. **Verificar:**
   - [ ] Lead aparece no CRM
   - [ ] Dados de enriquecimento estão presentes

### 6.3. CRM → Analytics
1. Crie alguns leads e deals no CRM
2. Acesse `/crm/analytics`
3. **Verificar:**
   - [ ] Dados aparecem nos gráficos
   - [ ] Funil de conversão está correto
   - [ ] Relatórios podem ser exportados

---

## 7️⃣ TESTE: PERFORMANCE E OTIMIZAÇÕES

### 7.1. Tempo de Carregamento
1. Abra DevTools (F12) → Network
2. Acesse cada página do CRM
3. **Verificar:**
   - [ ] Tempo de carregamento < 2 segundos
   - [ ] Lazy loading está funcionando
   - [ ] Imagens são carregadas sob demanda

### 7.2. Queries Otimizadas
1. Abra DevTools → Console
2. Navegue pelo CRM
3. **Verificar:**
   - [ ] Não há queries duplicadas
   - [ ] Cache está funcionando
   - [ ] Não há erros no console

---

## 8️⃣ TESTE: AUTOMAÇÕES AUTOMÁTICAS

### 8.1. Polling Interno
1. Abra DevTools → Console
2. Acesse qualquer página do CRM
3. Aguarde 5 minutos
4. **Verificar:**
   - [ ] Console mostra: `[Automation Polling] Automation runner executado`
   - [ ] Aguarde 1 hora
   - [ ] Console mostra: `[Automation Polling] Reminder processor executado`

### 8.2. Triggers Automáticos
1. Crie um lead
2. Verifique logs do Supabase (Edge Functions → Logs)
3. **Verificar:**
   - [ ] Edge Function `crm-ai-lead-scoring` foi chamada
   - [ ] Score foi calculado e salvo

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Checklist de Troubleshooting:

1. **Verificar Console do Navegador:**
   - Abra DevTools (F12) → Console
   - Procure por erros em vermelho
   - Copie e cole os erros aqui

2. **Verificar Logs do Supabase:**
   - Supabase Dashboard → Edge Functions → Logs
   - Procure por erros nas Edge Functions

3. **Verificar Tabelas no Banco:**
   - Supabase Dashboard → Table Editor
   - Verifique se as tabelas foram criadas
   - Verifique se há dados nas tabelas

4. **Verificar RLS (Row Level Security):**
   - Supabase Dashboard → Authentication → Policies
   - Verifique se as políticas estão ativas

---

## ✅ CRITÉRIOS DE SUCESSO

O CRM está 100% funcional quando:

- ✅ Todas as páginas carregam sem erros
- ✅ Todas as automações executam automaticamente
- ✅ IA gera scores e sugestões
- ✅ Integrações funcionam (API Keys, Webhooks)
- ✅ Performance está otimizada (< 2s carregamento)
- ✅ Conexões entre módulos funcionam
- ✅ Customização funciona (campos e views)

---

**Execute estes testes e me informe quais falharam para corrigirmos!** 🚀

