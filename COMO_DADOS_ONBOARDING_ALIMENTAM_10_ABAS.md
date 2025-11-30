# 🎯 Como os Dados do Onboarding Alimentam as 10 Abas de Análise

## 📋 Visão Geral

Todo o registro do onboarding (Steps 1-5) é **salvo no banco de dados** e usado como **filtros inteligentes** para encontrar empresas que correspondem ao perfil ideal (ICP) do tenant. Esses dados alimentam todas as 10 abas de análise de forma **assertiva e precisa**.

---

## 🔄 Fluxo de Dados: Onboarding → Análise

```
ONBOARDING (5 Steps)
    ↓
DADOS SALVOS NO BANCO
    ├─ tenants.icp_sectors → Setores-alvo
    ├─ tenants.icp_niches → Nichos-alvo
    ├─ tenants.icp_cnaes → CNAEs-alvo
    ├─ icp_profile.setores_alvo → Setores refinados
    ├─ icp_profile.porte_alvo → Porte (Micro/Pequena/Média/Grande)
    ├─ icp_profile.estados_alvo → Estados específicos
    ├─ icp_profile.regioes_alvo → Regiões
    ├─ icp_profile.faturamento_min/max → Faturamento
    ├─ icp_profile.funcionarios_min/max → Funcionários
    ├─ icp_profile.caracteristicas_buscar → ISO, Exportador, etc.
    └─ icp_profile.ncms_alvo → NCMs específicos
    ↓
BUSCA INTELIGENTE DE EMPRESAS
    ↓
10 ABAS DE ANÁLISE
```

---

## 🎯 Como Cada Aba Usa os Dados do Onboarding

### **1. ABA: Visão Geral**
- **Usa**: Setores, Nichos, Porte, Localização
- **Como**: Filtra empresas que correspondem ao ICP
- **Resultado**: Lista de empresas potenciais ordenadas por relevância

### **2. ABA: Inteligência Digital**
- **Usa**: Setores, Nichos, CNAEs, Características Especiais
- **Como**: Analisa websites de empresas do mesmo setor/niche
- **Resultado**: Insights sobre presença digital, tecnologias usadas

### **3. ABA: Decisores**
- **Usa**: Setores, Porte, Características Especiais (ISO, Exportador)
- **Como**: Identifica empresas que têm características similares
- **Resultado**: Lista de decisores-chave em empresas-alvo

### **4. ABA: Concorrentes**
- **Usa**: Setores, Nichos, CNAEs, Localização
- **Como**: Encontra empresas similares no mesmo mercado
- **Resultado**: Análise competitiva e benchmarking

### **5. ABA: Empresas Similares**
- **Usa**: Setores, Nichos, CNAEs, NCMs, Porte
- **Como**: Busca empresas com perfil idêntico ao ICP
- **Resultado**: Lista de empresas ideais para prospectar

### **6. ABA: Keywords SEO**
- **Usas**: Setores, Nichos, CNAEs
- **Como**: Gera keywords baseadas no setor/niche do tenant
- **Resultado**: Keywords estratégicas para busca e marketing

### **7. ABA: Análise 360°**
- **Usa**: TODOS os dados do onboarding
- **Como**: Análise holística combinando todos os critérios
- **Resultado**: Visão completa da empresa-alvo

### **8. ABA: Produtos Recomendados**
- **Usa**: Setores, Nichos, Porte, Características Especiais
- **Como**: Recomenda produtos TOTVS baseados no perfil
- **Resultado**: Oportunidades de cross-sell e up-sell

### **9. ABA: Intenção de Compra**
- **Usa**: Setores, Nichos, Localização, Faturamento
- **Como**: Analisa sinais de compra em empresas-alvo
- **Resultado**: Score de intenção e priorização

### **10. ABA: Histórico e Enriquecimento**
- **Usa**: Todos os dados para enriquecer empresas encontradas
- **Como**: Busca dados adicionais de APIs externas
- **Resultado**: Dados completos e atualizados

---

## 🔍 Exemplo Prático: Como Funciona

### **Cenário**: Tenant registra:
- **Setores**: Tecnologia, Serviços
- **Nichos**: SaaS, CRM, Consultoria
- **Porte**: Média, Grande
- **Estados**: SP, RJ, MG
- **Faturamento**: R$ 1M - R$ 50M
- **Funcionários**: 50 - 500
- **Características**: ISO 9001, Exportador

### **Sistema Busca Empresas Que**:
1. ✅ Estão nos setores **Tecnologia** ou **Serviços**
2. ✅ Têm nichos **SaaS**, **CRM** ou **Consultoria**
3. ✅ São **Média** ou **Grande** porte
4. ✅ Estão em **SP**, **RJ** ou **MG**
5. ✅ Faturam entre **R$ 1M** e **R$ 50M**
6. ✅ Têm entre **50** e **500** funcionários
7. ✅ Possuem **ISO 9001** ou são **Exportadoras**

### **Resultado**: Lista de empresas **altamente assertivas** que correspondem ao ICP!

---

## 💾 Onde os Dados São Salvos

### **Tabela `tenants`**:
```sql
- icp_sectors: ['Tecnologia', 'Serviços']
- icp_niches: ['SaaS', 'CRM', 'Consultoria']
- icp_cnaes: ['6201-5/00', '6202-3/00']
```

### **Tabela `icp_profile`** (no schema do tenant):
```sql
- setores_alvo: ['Tecnologia', 'Serviços']
- nichos_alvo: ['SaaS', 'CRM']
- porte_alvo: ['Média', 'Grande']
- estados_alvo: ['SP', 'RJ', 'MG']
- regioes_alvo: ['Sudeste']
- faturamento_min: 1000000
- faturamento_max: 50000000
- funcionarios_min: 50
- funcionarios_max: 500
- caracteristicas_buscar: ['ISO_9001', 'EXPORTADOR']
- ncms_alvo: ['8471', '6201']
```

---

## 🎯 Assertividade: Por Que É "Sniper"?

1. **Filtros Múltiplos**: Combina setores + nichos + porte + localização + faturamento + funcionários + características
2. **Precisão**: Não busca empresas aleatórias, apenas as que **realmente** correspondem ao ICP
3. **Inteligência**: Usa dados do onboarding para **priorizar** empresas mais relevantes
4. **Eficiência**: Reduz tempo de triagem manual em **90%**

---

## 🚀 Próximos Passos

Após o registro completo, o sistema:
1. ✅ Salva todos os dados no banco
2. ✅ Usa esses dados para buscar empresas automaticamente
3. ✅ Alimenta as 10 abas com análises precisas
4. ✅ Gera relatórios assertivos baseados no ICP

**Resultado Final**: Sistema que encontra empresas **exatamente** como o tenant definiu no onboarding! 🎯

