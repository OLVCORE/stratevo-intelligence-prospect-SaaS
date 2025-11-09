# 🎯 WHITE-LABEL: Substituições de Nomes de Fornecedores

## 📋 SUBSTITUIR EM TODOS OS TOASTS/ALERTS/UI:

### **Apollo.io → "Motor de Busca Empresarial"**
- ❌ "Enriquecido com Apollo"
- ✅ "Enriquecido com sucesso"

- ❌ "Buscando no Apollo..."
- ✅ "Buscando informações empresariais..."

- ❌ "Empresa encontrada no Apollo"
- ✅ "Empresa encontrada"

- ❌ "Decisores do Apollo"
- ✅ "Decisores Identificados"

### **Hunter.io → "Verificador de E-mails"**
- ❌ "Triple Fallback: Apollo → Hunter.io → PhantomBuster"
- ✅ "Sistema de Busca em 3 Camadas"

- ❌ "Email revelado via hunter_io"
- ✅ "Email verificado"

### **PhantomBuster → "Extrator de Dados"**
- ❌ "PhantomBuster"
- ✅ "Sistema de Extração"

---

## 🛠️ TERMOS GENÉRICOS APROVADOS:

| Fornecedor | WHITE-LABEL |
|-----------|-------------|
| Apollo.io | Motor de Busca / Sistema Principal |
| Hunter.io | Verificador de E-mails / Sistema Secundário |
| PhantomBuster | Extrator de Dados / Sistema Terciário |
| ReceitaWS | Dados Oficiais / Receita Federal |
| BrasilAPI | Dados Públicos / API Brasil |

---

## 📝 EXEMPLOS DE SUBSTITUIÇÃO:

### ANTES:
```typescript
toast.success('✅ Empresa enriquecida com Apollo!');
toast.info('Triple Fallback: Apollo → Hunter.io → PhantomBuster');
toast.error('Erro ao buscar no Apollo');
```

### DEPOIS:
```typescript
toast.success('✅ Empresa enriquecida com sucesso!');
toast.info('Sistema de Busca em 3 Camadas Ativado');
toast.error('Erro ao buscar informações empresariais');
```

---

## 🎯 OBJETIVO:
**100% WHITE-LABEL** - Nenhuma menção a fornecedores externos visível para o usuário final.

