# 🗑️ Como Deletar Empresas de Teste e Começar do Zero

## ⚠️ **ATENÇÃO: Esta ação é IRREVERSÍVEL!**

Este script vai deletar **TODAS as empresas** de teste do sistema para começar do zero.

---

## 📋 **O que será deletado:**

1. ✅ Todas as empresas da **Base de Empresas** (`companies`)
2. ✅ Todas as análises em **Quarentena e Aprovadas** (`icp_analysis_results`)
3. ✅ Todos os **Deals no Pipeline** (`sdr_deals`)
4. ✅ Todos os **Leads Qualificados** (`leads_qualified`)
5. ✅ Todo o **Pool de Leads** (`leads_pool`)

---

## 🚀 **Como Executar:**

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://vkdvezuivlovzqxmnohk.supabase.co/project/_/sql/new
2. Abra o arquivo: **`DELETAR_EMPRESAS_TESTE_COMECO_ZERO.sql`**
3. Copie **TODO** o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em **"Run"** (F5)
6. Aguarde a mensagem de sucesso

### **Opção 2: Via PowerShell (Avançado)**

```powershell
cd "C:\Projects\stratevo-intelligence-prospect"

# Executar via CLI do Supabase
npx supabase db execute --file DELETAR_EMPRESAS_TESTE_COMECO_ZERO.sql
```

---

## 📊 **O que o Script Faz:**

1. ✅ Mostra contadores **ANTES** de deletar
2. ✅ Desabilita RLS temporariamente
3. ✅ Deleta em cascata (ordem correta):
   - Deals → Leads → Análises → Empresas
4. ✅ Reabilita RLS
5. ✅ Mostra contadores **DEPOIS** (todos zerados)

---

## ✅ **Resultado Esperado:**

```
┌─────────────────────┬───────────────┐
│ Tabela              │ Total (Após)  │
├─────────────────────┼───────────────┤
│ companies           │ 0             │
│ icp_analysis_results│ 0             │
│ sdr_deals           │ 0             │
│ leads_qualified     │ 0             │
│ leads_pool          │ 0             │
└─────────────────────┴───────────────┘
```

**✅ Sistema limpo! Pronto para começar do zero!**

---

## 🎯 **Depois de Executar:**

1. Recarregue a aplicação (F5)
2. Verifique que as tabelas estão vazias:
   - Base de Empresas: 0
   - Quarentena: 0
   - Aprovados: 0
   - Pipeline: 0
3. Teste o fluxo completo do início:
   - Upload CSV → Base → Quarentena → Aprovados → Pipeline

---

## 📞 **Problemas?**

Se houver erro ao executar, pode ser constraint de foreign key.  
Nesse caso, execute linha por linha no SQL Editor.

---

**🎉 Pronto para começar do zero! 🚀**

