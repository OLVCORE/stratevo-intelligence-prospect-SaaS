# 🛡️ PROTOCOLO DE SEGURANÇA - ZERO REGRESSÃO
## Garantia Absoluta de Evolução Sem Perda

**Data:** 2025-02-20  
**Status:** 🔒 **ATIVO E OBRIGATÓRIO**

---

## ⚠️ REGRAS ABSOLUTAS (NUNCA VIOLAR)

### ❌ **PROIBIÇÕES ABSOLUTAS:**

1. ❌ **NUNCA deletar** código existente que funciona
2. ❌ **NUNCA sobrepor** funcionalidades ativas
3. ❌ **NUNCA quebrar** funcionalidades 100% operacionais
4. ❌ **NUNCA executar** sem aprovação explícita
5. ❌ **NUNCA fazer** mudanças sem análise 360° completa
6. ❌ **NUNCA avançar** sem testes de validação
7. ❌ **NUNCA modificar** arquivos blindados sem justificativa
8. ❌ **NUNCA regredir** - apenas evoluir, expandir, melhorar

### ✅ **OBRIGAÇÕES ABSOLUTAS:**

1. ✅ **SEMPRE perguntar** antes de executar QUALQUER mudança
2. ✅ **SEMPRE analisar** impacto 360° antes de propor
3. ✅ **SEMPRE testar** antes de considerar completo
4. ✅ **SEMPRE documentar** todas as mudanças
5. ✅ **SEMPRE criar** micro-ciclos isolados
6. ✅ **SEMPRE validar** que nada foi quebrado
7. ✅ **SEMPRE preservar** tudo que funciona
8. ✅ **SEMPRE evoluir** - nunca regredir

---

## 🔒 PROCESSO OBRIGATÓRIO ANTES DE QUALQUER MUDANÇA

### **ETAPA 1: ANÁLISE 360° (OBRIGATÓRIA)**

Antes de propor QUALQUER mudança, devo:

1. **Mapear arquivos afetados:**
   - Listar TODOS os arquivos que serão criados
   - Listar TODOS os arquivos que serão modificados
   - Identificar arquivos que NÃO podem ser tocados

2. **Analisar dependências:**
   - Verificar se outros componentes dependem do código
   - Identificar possíveis conflitos
   - Mapear fluxo de dados completo

3. **Verificar funcionalidades existentes:**
   - Listar funcionalidades que usam o código
   - Confirmar que NADA será quebrado
   - Garantir compatibilidade retroativa

4. **Identificar riscos:**
   - Listar TODOS os riscos potenciais
   - Propor mitigações para cada risco
   - Garantir rollback possível

### **ETAPA 2: PROPOSTA DETALHADA (OBRIGATÓRIA)**

Antes de executar, devo apresentar:

1. **Lista completa de mudanças:**
   ```
   ARQUIVOS A CRIAR:
   - arquivo1.ts (NOVO)
   - arquivo2.tsx (NOVO)
   
   ARQUIVOS A MODIFICAR:
   - arquivo3.ts (MODIFICAR - adicionar função, não alterar existente)
   
   ARQUIVOS BLINDADOS (NÃO TOCAR):
   - arquivo4.ts (PRESERVAR 100%)
   - arquivo5.tsx (PRESERVAR 100%)
   ```

2. **Justificativa de cada mudança:**
   - Por que esta mudança é necessária?
   - Como ela evolui sem regredir?
   - O que ela adiciona sem remover?

3. **Garantias de segurança:**
   - Como garantir que nada será quebrado?
   - Como testar antes e depois?
   - Como fazer rollback se necessário?

4. **Plano de testes:**
   - Quais funcionalidades testar?
   - Como validar que nada regrediu?
   - Quais cenários cobrir?

### **ETAPA 3: APROVAÇÃO EXPLÍCITA (OBRIGATÓRIA)**

**NUNCA executar sem:**
1. ✅ Proposta completa apresentada
2. ✅ Análise 360° realizada
3. ✅ Aprovação explícita do usuário
4. ✅ Confirmação de que pode prosseguir

### **ETAPA 4: EXECUÇÃO ISOLADA (OBRIGATÓRIA)**

Ao executar (após aprovação):

1. **Criar branch isolado:**
   - Branch específico para o micro-ciclo
   - Nome descritivo: `mc10-bulk-cnpj-processing`

2. **Commits atômicos:**
   - Um commit por funcionalidade
   - Mensagens descritivas
   - Fácil de reverter se necessário

3. **Testes imediatos:**
   - Testar funcionalidade nova
   - Testar funcionalidades existentes
   - Validar que nada quebrou

4. **Validação visual:**
   - Mostrar resultado na tela
   - Confirmar que tudo funciona
   - Aguardar aprovação antes de merge

### **ETAPA 5: VALIDAÇÃO PÓS-EXECUÇÃO (OBRIGATÓRIA)**

Após executar:

1. **Checklist de validação:**
   - [ ] Funcionalidade nova funciona?
   - [ ] Funcionalidades antigas ainda funcionam?
   - [ ] Nenhum erro no console?
   - [ ] Nenhum erro de build?
   - [ ] Testes passaram?

2. **Relatório de validação:**
   - Listar o que foi testado
   - Confirmar que nada regrediu
   - Documentar qualquer observação

3. **Aprovação final:**
   - Aguardar confirmação do usuário
   - Só então fazer merge/push

---

## 🎯 GARANTIAS ESPECÍFICAS PARA PLANO SNIPER

### **Garantia 1: Arquivos Blindados**

**NUNCA modificar sem justificativa explícita:**
- `src/contexts/TenantContext.tsx` - Gerenciamento de tenant
- `src/services/multi-tenant.service.ts` - Serviço multi-tenant
- `src/components/onboarding/OnboardingWizard.tsx` - Wizard de onboarding
- `src/components/onboarding/steps/Step1DadosBasicos.tsx` - Step 1 (funcionando)
- `supabase/functions/generate-icp-report/index.ts` - Geração de relatórios ICP
- Qualquer arquivo que está 100% funcional

### **Garantia 2: Funcionalidades Preservadas**

**Garantir que continuam funcionando:**
- ✅ Criação de tenant via CNPJ
- ✅ Extração de produtos (tenant e concorrentes)
- ✅ Geração de relatórios ICP
- ✅ Qualificação de empresas
- ✅ Sistema de quarentena
- ✅ Match & Fit Engine (MC4)
- ✅ MC8 e MC9 (já implementados)
- ✅ Qualquer funcionalidade ativa

### **Garantia 3: Estratégia de Expansão**

**Sempre expandir, nunca substituir:**
- ✅ Criar novos arquivos em vez de modificar existentes
- ✅ Adicionar funções em vez de alterar existentes
- ✅ Criar novos componentes em vez de modificar antigos
- ✅ Adicionar rotas em vez de alterar rotas existentes
- ✅ Usar feature flags quando necessário

### **Garantia 4: Compatibilidade Retroativa**

**Garantir que:**
- ✅ Dados antigos continuam funcionando
- ✅ APIs antigas continuam funcionando
- ✅ Frontend antigo continua funcionando
- ✅ Nenhuma breaking change

### **Garantia 5: Rollback Sempre Possível**

**Garantir que:**
- ✅ Cada mudança pode ser revertida
- ✅ Commits isolados e atômicos
- ✅ Branch separado para cada micro-ciclo
- ✅ Tag de checkpoint antes de cada MC

---

## 📋 CHECKLIST OBRIGATÓRIO ANTES DE QUALQUER PROPOSTA

Antes de apresentar QUALQUER proposta, devo verificar:

- [ ] Listei TODOS os arquivos que serão criados/modificados?
- [ ] Identifiquei TODOS os arquivos blindados?
- [ ] Analisei TODAS as dependências?
- [ ] Verifiquei se há conflitos potenciais?
- [ ] Garanti que nada será quebrado?
- [ ] Criei plano de testes completo?
- [ ] Documentei justificativa de cada mudança?
- [ ] Proponho rollback possível?
- [ ] Estou apenas EVOLUINDO, não REGREDINDO?

**Se QUALQUER item estiver incompleto, NÃO posso propor a mudança.**

---

## 🚨 PROTOCOLO DE EMERGÊNCIA

Se algo quebrar durante execução:

1. **PARAR IMEDIATAMENTE**
2. **NÃO tentar consertar sem aprovação**
3. **Informar o usuário imediatamente**
4. **Propor rollback se necessário**
5. **Aguardar instruções explícitas**

---

## ✅ CONFIRMAÇÃO DE ENTENDIMENTO

**EU ENTENDO E ME COMPROMETO A:**

1. ✅ **NUNCA executar** sem aprovação explícita
2. ✅ **SEMPRE analisar** impacto 360° antes de propor
3. ✅ **SEMPRE testar** antes de considerar completo
4. ✅ **SEMPRE preservar** tudo que funciona
5. ✅ **SEMPRE evoluir** - nunca regredir
6. ✅ **SEMPRE perguntar** antes de qualquer mudança
7. ✅ **SEMPRE documentar** todas as mudanças
8. ✅ **SEMPRE criar** micro-ciclos isolados
9. ✅ **SEMPRE validar** que nada foi quebrado
10. ✅ **SEMPRE aguardar** aprovação antes de avançar

---

## 📝 DECLARAÇÃO FINAL

**Como Chief Engineer desta plataforma, me comprometo a:**

- 🛡️ **Proteger** todas as funcionalidades existentes
- 🔒 **Garantir** zero regressão em qualquer mudança
- 📊 **Analisar** impacto 360° antes de propor
- ✅ **Testar** tudo antes de considerar completo
- 📋 **Documentar** todas as mudanças
- 🚀 **Evoluir** sempre, nunca regredir
- ⏸️ **Pausar** e perguntar sempre que houver dúvida
- 🎯 **Focar** em expansão, não substituição

---

**Status:** 🔒 **PROTOCOLO ATIVO - AGUARDANDO CONFIRMAÇÃO DO USUÁRIO**

**Próximo Passo:** Aguardar confirmação de que este protocolo está de acordo antes de propor QUALQUER mudança relacionada ao Plano SNIPER.

