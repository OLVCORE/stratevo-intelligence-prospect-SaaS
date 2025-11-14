# 🤖 COMO FUNCIONA O STC AGENT

## 📊 SISTEMA DE ANÁLISE INTELIGENTE

O STC Agent faz uma **análise profunda em 6 camadas** para responder suas perguntas sobre a empresa:

---

## 🔍 CAMADAS DE ANÁLISE

### **CAMADA 1: Dados Básicos (Receita Federal)**
- **Fonte:** BrasilAPI (Receita Federal)
- **O que busca:**
  - CNPJ, Razão Social, Nome Fantasia
  - Setor (CNAE), Porte, Capital Social
  - Situação Cadastral, Data de Abertura
  - Localização (UF, Município)
- **Tipo:** Busca direta via API pública

---

### **CAMADA 2: Decisores (LinkedIn)**
- **Fonte:** Web Search (Google Custom Search)
- **O que busca:**
  - Perfis no LinkedIn de executivos
  - Cargos: CEO, CFO, CTO, Diretor de TI, Gerente de Compras, etc.
  - Links reais dos perfis do LinkedIn
  - Snippets com informações do perfil
- **Como funciona:**
  - Faz 10 buscas no Google: `site:linkedin.com/in "Nome da Empresa" "cargo"`
  - Extrai nome, cargo, área, nível (C-Level, Diretor, Gerente)
  - Prioriza por relevância (C-Level = crítica, Diretor = alta)
- **Tipo:** Busca ativa na web (tempo real)

---

### **CAMADA 3: Notícias e Sinais de Compra**
- **Fonte:** Web Search (portais de notícias)
- **O que busca:**
  - Notícias de expansão, investimento, crescimento
  - Vagas e contratações
  - Modernização e transformação digital
  - Mencionou TOTVS, Protheus, sistemas ERP
- **Portais consultados:**
  - Valor Econômico, Exame, InfoMoney, Estadão
  - Baguete, CIO Review, IT Mídia
- **Sinais de compra detectados:**
  - Score de relevância (0-100)
  - Tipo: expansão, contratação, tecnologia, modernização
  - Links das fontes verificáveis
- **Tipo:** Busca ativa na web (tempo real)

---

### **CAMADA 4: Tecnologias (Stack Tecnológico)**
- **Fonte:** Web Search
- **O que busca:**
  - ERP: TOTVS, Protheus, SAP, Oracle, Microsoft Dynamics
  - CRM: Salesforce, TOTVS CRM
  - Outros: Senior, Linx
- **Como funciona:**
  - Busca: `"Nome da Empresa" "utiliza" OR "usa" sistema OR software`
  - Busca: `"Nome da Empresa" TOTVS OR SAP OR Oracle`
  - Identifica tecnologias mencionadas em notícias/perfis
- **Tipo:** Busca ativa na web (tempo real)

---

### **CAMADA 5: Presença Digital**
- **Fonte:** Web Search
- **O que busca:**
  - Website oficial
  - LinkedIn da empresa
  - Facebook, Instagram
  - Outros perfis sociais
- **Tipo:** Busca ativa na web (tempo real)

---

### **CAMADA 6: Análise por Setor**
- **Fonte:** Dados internos + Receita Federal
- **O que analisa:**
  - Setores com alta adoção TOTVS (Indústria, Agro, Construção)
  - Porte da empresa (DEMAIS = ideal para TOTVS)
  - Calcula confiança de uso TOTVS (0-100%)

---

## 🤖 PROCESSAMENTO COM IA

Após coletar todos os dados, o STC Agent:

1. **Formata os dados** coletados (decisores, notícias, tecnologias)
2. **Envia para GPT-4o-mini** (OpenAI)
3. **Gera resposta contextual** baseada nos dados reais
4. **Cita fontes** (links do LinkedIn, URLs de notícias)
5. **Nunca inventa informações** - usa apenas dados coletados

---

## 📝 TIPOS DE PERGUNTAS SUPORTADAS

### **Decisores**
- "Quem são os decisores?"
- "Quais são os principais contatos?"
- **Resposta:** Lista de executivos com LinkedIn + cargo + área

### **Momento de Compra**
- "Qual o momento de compra?"
- "Há sinais de compra?"
- **Resposta:** Análise de sinais (expansão, contratação, modernização) com scores

### **Produtos**
- "Que produtos TOTVS recomendar?"
- "Quais produtos fazem sentido?"
- **Resposta:** Recomendações baseadas em setor, porte, tecnologias atuais

### **Estratégia**
- "Como abordar esta empresa?"
- "Qual a melhor estratégia?"
- **Resposta:** Canal, timing, mensagem sugerida baseada em sinais de compra

---

## ✅ RESPOSTA DIRETA À SUA PERGUNTA

**"Eles buscam direto estas informações?"**

**SIM!** Todas as informações são buscadas em tempo real:

1. **Decisores:** Busca no LinkedIn via Google Search → Links reais
2. **Notícias:** Busca em portais → URLs verificáveis  
3. **Tecnologias:** Busca na web → Fontes com links
4. **Sinais de Compra:** Calculado a partir de notícias encontradas

**NÃO usa dados pré-armazenados** (exceto Receita Federal que vem do banco interno).

**TUDO é buscado dinamicamente** quando você faz a pergunta!

---

## ⚡ CORREÇÕES IMPLEMENTADAS

1. ✅ Input agora usa `<input>` nativo (mais confiável)
2. ✅ Erro 409 tratado (não bloqueia mais)
3. ✅ Body da requisição corrigido (`question` ao invés de `userQuestion`)
4. ✅ Resposta da edge function parseada corretamente
5. ✅ Campo sempre habilitado (exceto durante loading)

**Teste agora!** O campo de texto deve funcionar perfeitamente.

