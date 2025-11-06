# 🔧 HOTFIX — Unificação de Botões (Solução Completa)

**Problema:** Botões duplicados, não funcionais e confusos  
**Solução:** Unificação clara com separação de responsabilidades

---

## 📊 MAPEAMENTO DE BOTÕES (Antes vs Depois)

### ANTES (Confuso)
```
QuarantineReportModal Footer:
❌ Salvar no Sistema (duplica SaveBar)
❌ Enviar para Pipeline (similar a aprovar)
❌ Descartar Empresa
❌ Aprovar e Mover para Pool (duplica SaveBar)

SaveBar (topo):
✅ Salvar Relatório
✅ Aprovar & Mover para Pool

KeywordsSEOTab:
🟡 Reverificar (só aparece SE já tiver domain)
```

### DEPOIS (Limpo)
```
SaveBar (topo - FONTE ÚNICA):
✅ Salvar Relatório → Salva full_report de TODAS as abas
✅ Aprovar & Mover para Pool → Cria snapshot + move para pipeline

Modal Footer (ações de quarentena):
✅ Descartar Empresa → Rejeita e move para descartadas
✅ Fechar → Fecha modal

KeywordsSEOTab:
✅ Descobrir Website (inicial)
✅ Reverificar (SEMPRE visível após primeira descoberta)
✅ Análise SEO
✅ Análise IA
```

---

## 🎯 REGRAS DE OURO

1. **SaveBar = Ações do Relatório** (salvar, aprovar)
2. **Modal Footer = Ações de Quarentena** (descartar, fechar)
3. **Dentro das Abas = Processamento** (discovery, SEO, IA)
4. **SEM duplicação** entre os 3 níveis

---

## 🔧 PATCHES A APLICAR

### PATCH A: QuarantineReportModal - Remover duplicatas

Remover do footer:
- ❌ "Salvar no Sistema"
- ❌ "Enviar para Pipeline" 
- ❌ "Aprovar e Mover para Pool"

Adicionar aviso:
- ✅ "💡 Use a SaveBar (topo) para salvar e aprovar"

### PATCH B: KeywordsSEOTab - Reverificar sempre visível

Mudar condição:
```typescript
// Antes
{(domain || discoveredDomain) && ( <Botão Reverificar> )}

// Depois
<Botão Reverificar>  // Sempre visível
```

### PATCH C: Conectar handlers entre componentes

Garantir que SaveBar.onSaveAll chama o handler correto do contexto.

---

**Implementação:** Próximo passo...

