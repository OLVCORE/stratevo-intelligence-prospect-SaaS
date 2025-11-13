# 🚀 GUIA: IMPORTAR EMPRESAS REAIS (Pós-Reset)

## ✅ **PASSO A PASSO:**

### **1️⃣ RESETAR BASE (Execute SQL)**

```sql
-- Deletar TUDO
DELETE FROM decision_makers;
DELETE FROM companies;
DELETE FROM icp_analysis_results;
DELETE FROM stc_verification_history;
DELETE FROM discarded_companies;
DELETE FROM leads_pool;
```

---

### **2️⃣ IMPORTAR EMPRESAS REAIS**

**Opções:**

**A) Via CSV Upload:**
- Ir em: Base de Empresas → Upload CSV
- Arquivo deve ter: `nome_empresa, cnpj, website, cidade, estado, setor`

**B) Via Export Dealers (se tiver no Trade Intelligence):**
- Copiar empresas reais do Trade
- Importar aqui

**C) Via ICP Discovery:**
- Fazer busca de empresas no seu ICP
- Aprovar as melhores

---

### **3️⃣ AUTO-ENRIQUECIMENTO**

Após importar, o sistema VAI:

1. ✅ Buscar no Apollo automaticamente (se tiver website)
2. ✅ Puxar LinkedIn da empresa
3. ✅ Puxar Descrição
4. ✅ Puxar Decisores CORRETOS (da empresa específica)
5. ✅ Ordenar por hierarquia brasileira (Presidente > Diretor)
6. ✅ Mostrar fotos dos decisores

---

### **4️⃣ TESTAR CARD EXPANSÍVEL**

1. Ir em: Quarentena ICP
2. Expandir empresa (▼)
3. Verificar:
   - ✅ Website com ✏️
   - ✅ LinkedIn com ✏️
   - ✅ Apollo com [VALIDADO] ✏️
   - ✅ Descrição correta
   - ✅ Decisores com fotos
   - ✅ Ordenação: Presidente/Diretor primeiro

---

## 🎯 **PRÓXIMOS PASSOS:**

1. **Execute SQL de reset** (RESETAR_BASE_COMPLETO.sql)
2. **Importe 5-10 empresas REAIS** (CSV ou ICP Discovery)
3. **Teste o card expansível**
4. **Se funcionar**, importe mais empresas

---

**Pronto para RESETAR e começar do zero!** 🚀

