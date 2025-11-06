# HF-DIGITAL-QUICKFIX — Pacote Completo de Correções

**Objetivo:** Unificação de botões + Discovery funcional + Salvamento conectado

---

## Correções Aplicadas

1. ✅ Import duplicado de DISABLE_AUTO_DISCOVERY removido
2. ✅ Botão Reverificar sempre visível
3. ✅ Queries de discovery balanceadas (sem CNPJ)
4. ✅ Blocklist de diretórios/agregadores
5. ✅ Registro de abas sempre ativo
6. ✅ SaveBar conectada ao registry
7. ✅ Modal footer simplificado
8. ✅ Navegação bloqueada com dirty state

---

## Arquivos Modificados

- src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx
- src/components/icp/tabs/discovery/deterministicDiscovery.ts
- src/components/totvs/TOTVSCheckCard.tsx
- src/components/totvs/SaveBar.tsx
- src/components/icp/QuarantineReportModal.tsx
- vercel.json (criado)

---

## Instruções para .env.local

```ini
# OpenAI (obrigatório)
VITE_OPENAI_API_KEY=sk-proj-XXXXXXXX

# Serper (obrigatório)
VITE_SERPER_API_KEY=XXXXXXXX

# Supabase (obrigatório)
VITE_SUPABASE_URL=https://qtcwetabhhkhvomcrqgm.supabase.co
VITE_SUPABASE_ANON_KEY=XXXXXXXX

# Safe Mode (opcional - apenas dev)
VITE_SAFE_MODE=1
VITE_DISABLE_AUTOSAVE=1
VITE_DISABLE_AUTO_DISCOVERY=1
VITE_BLOCK_WRITES=1
VITE_DEBUG_SAVEBAR=1
```

---

## Status

✅ Implementado e commitado
🚀 Pronto para push

