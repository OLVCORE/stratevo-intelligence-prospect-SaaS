# 📊 SISTEMA DE FIT DE PRODUTOS - EXPLICAÇÃO COMPLETA

## ⚠️ IMPORTANTE: DESCRIÇÃO VS REALIDADE

A descrição na tela diz:
> "Calcula a aderência entre seus produtos e a empresa prospectada: Match CNAE/Setor | Capital Social | Porte | Localização"

**MAS na prática, o sistema NÃO faz isso!** 

Na verdade, o sistema faz uma **BUSCA DE EVIDÊNCIAS DE USO** para detectar se a empresa **JÁ usa produtos do tenant** (especialmente TOTVS).

---

## 🎯 O QUE O SISTEMA REALMENTE FAZ

O sistema de "Fit de Produtos" é na verdade um sistema de **Verificação de Uso** (usage-verification) que:

1. **Busca evidências** de que a empresa JÁ usa produtos do tenant
2. **Classifica** como **GO** (não cliente) ou **NO-GO** (cliente identificado)
3. **Desbloqueia** as outras abas após a verificação ser concluída e salva

---

## 🔄 FLUXO COMPLETO

### **1. Usuário clica em "Verificar Agora"**

```
Botão "Verificar Agora" 
  → handleVerify() 
  → setEnabled(true) 
  → useUsageVerification hook é ativado
```

### **2. Hook chama Edge Function**

```typescript
useUsageVerification({
  companyId,
  companyName,
  cnpj,
  domain,
  tenantId,
  enabled: true
})
  → supabase.functions.invoke('usage-verification', {
      body: {
        company_id,
        company_name,
        cnpj,
        domain,
        tenant_id
      }
    })
```

### **3. Edge Function faz busca massiva (50+ fontes)**

A Edge Function `usage-verification` usa **Serper API** para buscar em:

#### **FASE 1: Portais de Vagas** (4 portais)
- LinkedIn Jobs
- LinkedIn Posts
- Gupy
- Indeed

#### **FASE 2: Cases Oficiais TOTVS** (3 fontes)
- Blog TOTVS
- Cases TOTVS
- Notícias TOTVS

#### **FASE 3: Fontes Oficiais** (10 fontes) - Peso 100 = AUTO NO-GO
- CVM (Comissão de Valores Mobiliários)
- B3 (Bolsa de Valores)
- TJSP (Tribunal de Justiça SP)
- Diários Oficiais
- Processos Judiciais

#### **FASE 4: Notícias Premium** (15 fontes)
- Valor Econômico
- Exame
- Estadão
- InfoMoney
- StartSe

#### **FASE 5: Portais de Tecnologia** (7 fontes)
- Baguete
- CIO Review
- Canaltech
- etc.

#### **FASE 6: Vídeos** (2 fontes)
- YouTube
- Vimeo

#### **FASE 7: Redes Sociais** (3 fontes)
- Instagram
- Facebook
- LinkedIn

#### **FASE 8: Parceiros TOTVS** (1 fonte)
- Fusion by NSTech

### **4. Validação rigorosa de evidências**

Para cada resultado encontrado, a função `isValidTOTVSEvidence` valida:

#### **Triple Match** (Empresa + TOTVS + Produto)
- Empresa, TOTVS e produto mencionados no mesmo texto
- **Peso:** 100 pontos
- **Classificação:** NO-GO automático se encontrado

#### **Double Match** (Empresa + TOTVS OU Empresa + Produto)
- Empresa e TOTVS OU Empresa e Produto no mesmo texto
- **Peso:** 50-84 pontos
- **Classificação:** NO-GO se score total >= 50%

#### **Single Match** (Menção isolada)
- Menção isolada sem contexto claro
- **Peso:** 1-49 pontos
- **Classificação:** GO (pode prosseguir)

### **5. Classificação final**

```typescript
// Classificação baseada em matches encontrados

if (hasOfficialSource) {
  // CVM, B3, TJSP = AUTO NO-GO 100%
  status = 'no-go';
  confidencePercent = 100;
} else if (tripleMatches >= 5) {
  status = 'no-go';
  confidencePercent = 100;
} else if (tripleMatches >= 3) {
  status = 'no-go';
  confidencePercent = 90;
} else if (tripleMatches >= 2) {
  status = 'no-go';
  confidencePercent = 85;
} else if (tripleMatches >= 1) {
  status = 'no-go';
  confidencePercent = 80;
} else if (doubleMatches >= 3) {
  status = 'no-go';
  confidencePercent = 70;
} else if (doubleMatches >= 2) {
  status = 'no-go';
  confidencePercent = 60;
} else if (doubleMatches >= 1) {
  status = 'no-go';
  confidencePercent = 50; // Limite NO-GO
} else {
  // 0 Matches = GO (não é cliente)
  status = 'go';
  confidencePercent = 95; // Alta confiança
}
```

### **6. Resultado salvo em 3 lugares**

1. **`simple_totvs_checks`** (cache, válido por 24h)
2. **`companies.totvs_status`** (status da empresa)
3. **`stc_verification_history.full_report.detection_report`** (relatório completo)

### **7. Desbloqueio de abas**

Quando `detection_report` é salvo:
```typescript
setVerificationSaved(true); // Desbloqueia todas as outras abas
```

Todas as abas têm `disabled={!verificationSaved}`, então só ficam habilitadas após a verificação ser salva.

---

## 🐛 ERROS IDENTIFICADOS

### **1. Erro de CORS na Edge Function**

**Sintoma:**
```
Access to fetch at 'https://...supabase.co/functions/v1/usage-verification' 
from origin 'http://localhost:5174' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**Causa:**
- Edge Function precisa retornar status **200** (não 204) para requisições OPTIONS
- Headers CORS precisam estar corretos

**Status:**
- ✅ Código já corrigido localmente (status 200 para OPTIONS)
- ❌ **PRECISA SER DEPLOYADO no Supabase** para funcionar

### **2. Erro 400 em `tenant_products`**

**Sintoma:**
```
Failed to load resource: the server responded with a status of 400
tenant_products?select=*&tenant_id=eq...&is_active=eq.true&order=display_order.asc
```

**Causa:**
- Tabela `tenant_products` pode não existir ou não ter RLS configurado
- Coluna `display_order` pode não existir

### **3. Erro 406 em `tenant_search_configs`**

**Sintoma:**
```
Failed to load resource: the server responded with a status of 406
tenant_search_configs?select=*&tenant_id=eq...
```

**Causa:**
- Tabela pode não existir ou não ter RLS configurado
- Header Accept pode estar incorreto

---

## 📋 RESUMO DO FUNCIONAMENTO

1. **Sistema NÃO calcula fit** baseado em CNAE/Setor/Capital/Porte (como a descrição diz)
2. **Sistema BUSCA evidências** de uso de produtos do tenant
3. **Sistema CLASSIFICA** como GO (não cliente) ou NO-GO (cliente)
4. **Sistema DESBLOQUEIA** outras abas após verificação ser salva
5. **Sistema USA Serper API** para buscar em 50+ fontes
6. **Sistema VALIDA** evidências com triple/double/single match
7. **Sistema SALVA** resultado em 3 tabelas diferentes

---

## 🔧 PRÓXIMOS PASSOS PARA CORRIGIR

1. ✅ **Corrigir descrição na tela** (dizer o que realmente faz)
2. ✅ **Deployar Edge Functions** no Supabase (corrigir CORS)
3. ✅ **Verificar tabelas** `tenant_products` e `tenant_search_configs`
4. ✅ **Testar fluxo completo** após correções

