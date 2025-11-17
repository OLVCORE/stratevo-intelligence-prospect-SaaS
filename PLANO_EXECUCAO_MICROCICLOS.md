# 📋 PLANO DE EXECUÇÃO - MICROCICLOS DETALHADOS

## 🎯 OBJETIVO
Corrigir problemas críticos identificados pelo usuário e implementar melhorias de forma incremental, testável e verificável.

---

## ✅ MICROCICLO 1: CORREÇÕES CRÍTICAS IMEDIATAS

### Checklist de Atividades

#### 1.1 TREVO - Posicionamento na Direita
- [x] Remover lógica de `left` dinâmico baseado em sidebar
- [x] Usar `right-4` fixo (TREVO sempre na direita)
- [x] Remover import `useSidebar`
- [x] Simplificar `getContainerClasses()` para usar apenas `right`
- [ ] **TESTE:** Verificar que TREVO aparece no top-right, não invade sidebar

#### 1.2 TREVO - Não Invadir Sidebar
- [x] TREVO usa `right-4` (16px da direita)
- [x] Sidebar empurra conteúdo automaticamente, então TREVO não invade
- [ ] **TESTE:** Abrir/fechar sidebar, verificar que TREVO não entra por baixo

#### 1.3 ScrollToTop - Restaurar Original
- [x] Restaurar `right-8` (não `right-[480px]`)
- [x] Restaurar cor `bg-muted` (cinza, não azul)
- [x] Manter lógica de aparecer ao rolar > 400px
- [ ] **TESTE:** Rolar página, verificar botão cinza aparece no bottom-right

#### 1.4 Remover Botão Azul do Meio
- [ ] Identificar qual botão azul está no meio da página
- [ ] Remover ou reposicionar
- [ ] **TESTE:** Verificar que não há botão azul flutuante no meio

#### 1.5 TREVO vs Copilot - Sobreposição
- [x] TREVO: `z-[60]` (top-right)
- [x] Copilot: `z-[50]` (bottom-left)
- [x] ScrollToTop: `z-[55]` (bottom-right)
- [ ] **TESTE:** Abrir ambos, verificar que não se sobrepõem

---

## ✅ MICROCICLO 2: UNIFIEDENRICHBUTTON - REVISÃO

### Checklist de Atividades

#### 2.1 Verificar Comportamento Atual
- [ ] Verificar que `UnifiedEnrichButton` é um botão que abre dropdown
- [ ] Verificar que dropdown mostra opções: Rápida, Completa, Receita, Apollo, 360°
- [ ] **TESTE:** Clicar no botão, verificar dropdown abre

#### 2.2 Ajustar se Necessário
- [ ] Se não estiver como dropdown, ajustar para ser dropdown
- [ ] Garantir que botão é visível nas 3 páginas principais
- [ ] **TESTE:** Verificar visibilidade e funcionalidade nas 3 páginas

---

## ✅ MICROCICLO 3: TESTES E VALIDAÇÃO

### Checklist de Atividades

#### 3.1 Teste Visual
- [ ] TREVO aparece no top-right (verde)
- [ ] TREVO não invade sidebar
- [ ] ScrollToTop aparece no bottom-right (cinza) ao rolar
- [ ] Copilot aparece no bottom-left (se aberto)
- [ ] Não há botão azul no meio da página
- [ ] UnifiedEnrichButton visível nas 3 páginas

#### 3.2 Teste Funcional
- [ ] TREVO abre/fecha corretamente
- [ ] TREVO expande/minimiza corretamente
- [ ] TREVO tela cheia funciona
- [ ] ScrollToTop funciona
- [ ] UnifiedEnrichButton dropdown funciona
- [ ] Enriquecimentos executam corretamente

---

## 📊 STATUS ATUAL

### ✅ CONCLUÍDO
1. TREVO movido para direita (removido left dinâmico)
2. ScrollToTop restaurado (cinza, right-8)
3. Copilot ajustado (z-50, bottom-left)

### ⚠️ PENDENTE
1. Identificar e remover botão azul do meio
2. Testes visuais e funcionais
3. Validação final

---

## 🚀 PRÓXIMOS PASSOS
1. Identificar botão azul
2. Executar testes
3. Validar todas as correções

