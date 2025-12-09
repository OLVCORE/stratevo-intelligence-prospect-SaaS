# 🧪 Checklist - Testes de Guerra STRATEVO One

**Data:** 07/12/2025  
**Objetivo:** Validar fluxo E2E completo com dados reais

---

## 📋 PREPARAÇÃO

### 1. Limpeza da Base
- [ ] Limpar dados de teste anteriores (empresas, leads, deals)
- [ ] Manter estrutura de tabelas e configurações
- [ ] Verificar RLS policies ativas
- [ ] Confirmar ICPs existentes ou criar novos

### 2. Configuração de ICPs
- [ ] Criar 2-3 ICPs por tenant para teste
- [ ] Configurar critérios diferentes em cada ICP:
  - Setores diferentes
  - Estados diferentes
  - Tamanhos diferentes
- [ ] Verificar se ICPs aparecem no seletor em todas as páginas

### 3. Tenant de Teste
- [ ] Criar tenant limpo para testes
- [ ] Configurar tenant com dados mínimos necessários
- [ ] Verificar acesso e permissões

---

## 🔄 FLUXO COMPLETO - TESTE PASSO A PASSO

### ETAPA 1: Importação
- [ ] Acessar `/leads/prospecting-import`
- [ ] Selecionar ICP no seletor
- [ ] Fazer upload de CSV com empresas
- [ ] Mapear colunas corretamente
- [ ] Verificar preview dos dados
- [ ] Confirmar importação
- [ ] **Validar:**
  - ✅ Quantidade importada correta
  - ✅ ICP selecionado exibido
  - ✅ Job de qualificação criado automaticamente
  - ✅ Botão "Ver Job de Qualificação" funcional

### ETAPA 2: Motor de Qualificação
- [ ] Acessar `/leads/qualification-engine`
- [ ] Verificar job criado na lista
- [ ] Verificar status: "pending"
- [ ] Selecionar job
- [ ] Clicar em "Rodar Qualificação"
- [ ] **Validar:**
  - ✅ Status muda para "processing" → "completed"
  - ✅ Estatísticas atualizadas (processadas, qualificadas)
  - ✅ Distribuição por grade (A+, A, B, C, D)
  - ✅ Botão "Ir para Estoque Qualificado" aparece

### ETAPA 3: Estoque de Empresas Qualificadas
- [ ] Acessar `/leads/qualified-stock`
- [ ] Verificar empresas qualificadas aparecem
- [ ] Testar filtros:
  - [ ] Por grade (A+, A, B, C, D)
  - [ ] Por status (new, approved, in_quarantine)
  - [ ] Por setor
  - [ ] Por estado
- [ ] Testar busca por nome/CNPJ
- [ ] Testar seleção múltipla:
  - [ ] Select all
  - [ ] Seleção individual
- [ ] **Ação 1: Enviar para Quarentena**
  - [ ] Selecionar empresas
  - [ ] Clicar em "Enviar para Quarentena"
  - [ ] Confirmar modal
  - [ ] Validar: Status muda para "in_quarantine"
- [ ] **Ação 2: Aprovar direto para CRM**
  - [ ] Selecionar empresas
  - [ ] Clicar em "Aprovar para CRM"
  - [ ] Confirmar modal
  - [ ] Validar: Empresas criadas em `empresas` table

### ETAPA 4: Quarentena
- [ ] Acessar `/leads/quarantine`
- [ ] Verificar leads em quarentena aparecem
- [ ] Verificar dados exibidos:
  - [ ] Nome da empresa
  - [ ] CNPJ
  - [ ] Setor, Estado
  - [ ] ICP Score
  - [ ] Grade
  - [ ] Temperatura
- [ ] Testar filtros e busca
- [ ] **Aprovar Lead:**
  - [ ] Clicar em "Aprovar para CRM"
  - [ ] Validar toast detalhado:
    - [ ] ✅ Empresa criada
    - [ ] ✅ Lead criado
    - [ ] ✅ Oportunidade (Deal) criada
  - [ ] Clicar em "Ver Pipeline"
  - [ ] Validar: Deal aparece no pipeline

### ETAPA 5: CRM Pipeline
- [ ] Acessar `/leads/pipeline`
- [ ] Verificar deal criado aparece
- [ ] Verificar estágio correto (Discovery)
- [ ] Testar drag & drop entre estágios
- [ ] Testar botões de ação rápida:
  - [ ] Criar Tarefa (placeholder)
  - [ ] Adicionar Nota (placeholder)
  - [ ] Rodar Sequência (navega para /sequences)
- [ ] Validar métricas do pipeline

### ETAPA 6: Sequências Comerciais
- [ ] Acessar `/sequences`
- [ ] Criar nova sequência:
  - [ ] Nome
  - [ ] Descrição
  - [ ] Status (ativa/inativa)
- [ ] Adicionar passos:
  - [ ] Passo 1: Email (dia 0)
  - [ ] Passo 2: WhatsApp (dia 3)
  - [ ] Passo 3: Tarefa (dia 7)
- [ ] Verificar preview visual
- [ ] Testar duplicação de sequência
- [ ] Validar: Sequência salva corretamente

---

## 🔍 VALIDAÇÕES MULTI-TENANT

### Isolamento de Dados
- [ ] Criar 2 tenants diferentes
- [ ] Importar empresas diferentes em cada tenant
- [ ] Validar: Tenant A não vê dados do Tenant B
- [ ] Validar: ICPs são isolados por tenant

### Múltiplos ICPs
- [ ] Criar 2-3 ICPs no mesmo tenant
- [ ] Importar empresas com ICP 1
- [ ] Importar empresas com ICP 2
- [ ] Validar: Empresas qualificam corretamente por ICP
- [ ] Validar: Filtros por ICP funcionam

---

## 🐛 PONTOS DE ATENÇÃO

### Durante os Testes, Verificar:
1. **Performance:**
   - Tempo de resposta das queries
   - Tempo de processamento de qualificação
   - Tempo de importação

2. **Erros:**
   - Console do navegador (F12)
   - Logs do Supabase
   - Mensagens de erro na UI

3. **Dados:**
   - Consistência entre tabelas
   - RLS funcionando corretamente
   - Validações de tenant_id

4. **UI/UX:**
   - Navegação entre páginas
   - Feedback visual (toasts, loading)
   - Mensagens de erro claras

---

## 📝 NOTAS DURANTE OS TESTES

### Problemas Encontrados:
```
[Data/Hora] - [Módulo] - [Problema] - [Solução]
```

### Ajustes Necessários:
```
[Data/Hora] - [Módulo] - [Ajuste solicitado]
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Fluxo Completo Funcional:
- [ ] Importação → Job → Qualificação → Estoque → Quarentena → CRM → Sequências
- [ ] Todos os módulos conectados
- [ ] Dados fluem corretamente
- [ ] Multi-tenant isolado
- [ ] Multi-ICP funcionando

### UI/UX:
- [ ] Navegação intuitiva
- [ ] Feedback claro em todas as ações
- [ ] Erros tratados adequadamente
- [ ] Performance aceitável

---

**Boa sorte nos testes! 🚀**

*Documento criado para acompanhamento durante os testes de guerra*

