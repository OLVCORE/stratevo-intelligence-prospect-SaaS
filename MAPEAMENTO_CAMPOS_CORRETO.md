# 🗺️ MAPEAMENTO CORRETO DE CAMPOS - SCHEMA REAL

## ❌ **CAMPOS ERRADOS QUE ESTÁVAMOS USANDO:**

### **COMPANIES:**
| ❌ Errado | ✅ Correto | Tipo |
|-----------|-----------|------|
| `name` | `company_name` | text |
| `title` | ❌ NÃO EXISTE | - |
| `revenue` | `annual_revenue` | numeric |
| `employees` | `employee_count` | integer |

### **DECISION_MAKERS:**
| ❌ Errado | ✅ Correto | Tipo |
|-----------|-----------|------|
| `name` | `full_name` | text |
| `title` | `position` | text |
| `seniority` | `seniority_level` | text |
| `source` | `data_source` | text |

### **SDR_DEALS:**
| ❌ Errado | ✅ Correto | Tipo |
|-----------|-----------|------|
| `title` | `deal_title` | text ✅ (JÁ CORRIGIDO) |
| `stage` | `deal_stage` | text ✅ (JÁ CORRIGIDO) |

---

## ✅ **AÇÃO EM LOTE - CORRIGIR TODOS OS ARQUIVOS:**

### **1. EDGE FUNCTION: enrich-apollo-decisores**
- Linha 211: `name: d.name` → `full_name: d.name`
- Linha 214: `title: d.title` → `position: d.title`
- Linha 218: `seniority: d.seniority` → `seniority_level: d.seniority`
- Linha 219: `source: 'apollo'` → `data_source: 'apollo'`

### **2. COMPONENTES QUE USAM decision_makers:**
- Buscar: `decisor.name` → `decisor.full_name`
- Buscar: `decisor.title` → `decisor.position`
- Buscar: `decisor.seniority` → `decisor.seniority_level`

### **3. HOOKS E QUERIES:**
- `useEnrichmentStatus.ts`: ✅ Já usa schema correto
- Outros hooks: Verificar

---

## 🚀 **EXECUTANDO CORREÇÃO EM MASSA AGORA:**

