# 🔴 PROBLEMA CRÍTICO: Aba Digital Não Persiste

## Problema Identificado
A aba **Digital Intelligence** não está persistindo quando o usuário salva o relatório.

## Causa Raiz
1. **DigitalIntelligenceTab** usa `onDataChange` (linha 171) para notificar mudanças
2. **MAS NÃO ESTÁ REGISTRADA** no `tabsRegistry` (sistema de salvamento por aba)
3. Quando o usuário clica em "Salvar" no SaveBar, a aba Digital não é incluída no salvamento

## Comparação com Outras Abas

### ✅ Abas que FUNCIONAM (registradas):
- `RecommendedProductsTab` - usa `registerTab('products', { flushSave, getStatus })`
- `DecisorsTab` - provavelmente registrada
- Outras abas que persistem

### ❌ Aba que NÃO FUNCIONA:
- `DigitalIntelligenceTab` - **NÃO registrada** no `tabsRegistry`
- Apenas chama `onDataChange?.(data)` mas não se registra no sistema

## Localização do Problema
- **Arquivo**: `src/components/intelligence/DigitalIntelligenceTab.tsx`
- **Linha**: ~171 (useEffect que chama onDataChange)
- **Falta**: Registro no `tabsRegistry` (ver `src/components/icp/tabs/tabsRegistry.ts`)

## Solução Necessária

### Passo 1: Registrar a aba Digital no tabsRegistry
```typescript
useEffect(() => {
  registerTab('digital', {
    flushSave: async () => {
      // Garantir que os dados sejam salvos em raw_data.digital_intelligence
      const dataToSave = {
        ...data,
        urls: data?.analyzed_urls || [],
        discovered_urls: data?.analyzed_urls?.map(u => u.url) || [],
        digital_intelligence: data
      };
      onDataChange?.(dataToSave);
    },
    getStatus: () => data ? 'completed' : 'idle',
  });

  return () => {
    unregisterTab('digital');
  };
}, [data, onDataChange]);
```

### Passo 2: Garantir que TOTVSCheckCard salve corretamente
- Verificar se `tabDataRef.current.digital` está sendo atualizado
- Verificar se o salvamento inclui `digital_report` ou `digital_intelligence` no raw_data

### Passo 3: Testar
1. Abrir aba Digital
2. Executar análise (se necessário)
3. Clicar em "Salvar" no SaveBar
4. Recarregar página
5. **Verificar se os dados persistem**

## Arquivos para Modificar

1. `src/components/intelligence/DigitalIntelligenceTab.tsx`
   - Adicionar import de `registerTab, unregisterTab`
   - Adicionar useEffect para registro

2. `src/components/totvs/TOTVSCheckCard.tsx`
   - Verificar se `digital_report` está sendo salvo corretamente
   - Verificar estrutura de salvamento em `raw_data.digital_intelligence`

## ⚠️ IMPORTANTE
**NÃO FAZER MUDANÇAS SEM TESTAR PRIMEIRO**
- Testar em ambiente local
- Verificar estrutura de dados no Supabase
- Garantir que não quebra outras abas

## Status
- ❌ **NÃO CORRIGIDO** (documentado apenas)
- 🕐 Aguardando aprovação para correção

