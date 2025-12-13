# 🔍 DIAGNÓSTICO COMPARATIVO: Extração de Produtos
## Análise da Metodologia Atual vs. Busca Direta em Websites

---

## 📊 SITES ANALISADOS

### 1. **Marluvas** (https://www.marluvas.com.br/)
**Tipo:** Fabricante de Calçados de Segurança (EPIs)
**Estrutura do Site:**
- Menu de navegação com categorias: Calçados, Componentes, Linhas, Segmento, Risco/Proteção
- Página de produtos com múltiplas categorias
- Produtos listados com referências específicas (ex: "50T18 CO ELETRICISTA")
- Catálogo organizado por linhas (New Prime, Composite, Têxtil, Vulcaflex, All Work)

**Produtos Identificados na Homepage:**
- **Calçados** (categoria principal):
  - Botas (com cadarço, elástico, velcro, PVC)
  - Coturnos (com cadarço, velcro, zíper)
  - Tênis de segurança
  - Sapatos de segurança
  - Sandálias EVA
  - Palmilhas

- **Linhas de Produtos:**
  - New Prime
  - Composite
  - Têxtil
  - Vulcaflex
  - All Work

- **Segmentos Atendidos:**
  - Agro, Alimentícia, Construção Civil, Eletricista, Eletrônica, Frigorífico, Limpeza Urbana, Madeireiras, Manobreiro, Metalurgia, Militares, Mineração, Montadoras, Motociclista, Petroquímica, Serviços Gerais, Resgate, Saúde, Siderurgia, Trekking

- **Proteções Oferecidas:**
  - Altas Temperaturas, Ambientes Frios, Choque, Energia Estática, Entorse, Perfuração, Piso Escorregadio, Produtos Químicos, Queda de Objetos, Umidade

**Produtos Específicos Encontrados:**
1. Tênis linha New Prime (Ref.: 50T18 CO ELETRICISTA)
2. Tênis linha New prime (Ref.: 50T18 CO BP)
3. Tênis da Linha New Prime (Ref.: 50T18 ELETRICISTA)
4. Sapato linha Composite (Ref.: 30S29 C)
5. Tênis linha Têxtil (Ref.: 72T18-TXT-C-AZ)
6. Bota Linha Têxtil (Ref: 72B29-TXT-E-BP-LR)
7. Bota Linha Têxtil (Ref: 72B29-TXT-E-BP-VD)
8. Bota linha All Work (Ref.: 100AWORKF CA PRA PL)
9. Sapato linha Composite (Ref.: 50S29 C)
10. Bota linha New Prime (Ref.: 50B26 CB A NUB)
11. Bota linha New Prime (Ref.: 50B29 SRV BP)
12. Sapato da linha New Prime (Ref.: 50S29 A ANTIESTÁTICO)
13. Sapato linha Vulcaflex (Ref.: 10VS48 BP)
14. Bota da linha Composite (Ref.: 70B22 VEL C)
15. Bota Marluvas (Ref.: 95B22 BP)

**Total Estimado:** 15+ produtos específicos visíveis na homepage + múltiplas categorias

---

### 2. **Uniluvas** (https://www.uniluvas.com.br/)
**Tipo:** Fabricante de Luvas de Proteção (EPIs)
**Estrutura do Site:**
- Organização por categorias de aplicação
- Produtos específicos por linha de proteção

**Categorias Identificadas:**
1. **Alta Temperatura e Solda:**
   - Max Solder
   - Master Cut Flex
   - Max Grip
   - Total Power

2. **Corte / Perfuração:**
   - Clean Cut Flex
   - Grip Defender Vulca
   - Force Cut Flex

3. **Proteção Mecânica:**
   - Helanca
   - Combate
   - Mangote sem Velcro Unileve

4. **Arco Elétrico:**
   - Arctátil

5. **Proteção Química:**
   - Max Grip

**Total Estimado:** 10+ produtos específicos por categoria

---

### 3. **Metalife Pilates** (https://metalifepilates.com.br/)
**Tipo:** Fabricante de Equipamentos para Pilates
**Estrutura do Site:**
- Organização por linhas de produtos
- Equipamentos específicos por linha

**Linhas Identificadas:**
1. **Linha Infinity** (Premium):
   - Cadillac Infinity
   - Reformer Torre Infinity
   - Step Chair Infinity
   - Ladder Barrel Infinity

2. **Linha W23eco** (Sustentável):
   - Cadillac W23eco
   - Reformer Torre W23eco
   - Step Chair W23eco
   - Ladder Barrel W23eco

3. **Linha Original** (Essência):
   - Cadillac Original
   - Reformer Original
   - Electric Chair (High Chair) Original
   - Arm Chair Original
   - Wunda Chair Original
   - Ladder Barrel Original
   - Pedi Pole Original

**Total Estimado:** 15+ equipamentos específicos

---

## 🔄 METODOLOGIA ATUAL DA PLATAFORMA STRATEVO ONE

### **Processo Atual:**

1. **Acesso à Homepage** ✅
   - Acessa a homepage primeiro (15.000 caracteres)
   - Extrai texto básico (remove HTML, scripts, styles)

2. **Busca via SERPER** ✅
   - Busca: `site:domain (produtos OR serviços OR catálogo OR soluções OR linha OR equipamentos OR EPI OR luvas OR produtos em destaque)`
   - Limite: 15 resultados
   - Extrai snippets das páginas encontradas

3. **Tentativa de Páginas Comuns** ✅
   - Testa URLs comuns: `/produtos`, `/servicos`, `/solucoes`, `/catalogo`, `/products`, `/services`, `/linha-produtos`, `/nossos-produtos`, `/produtos-em-destaque`
   - Extrai até 10.000 caracteres de cada página encontrada

4. **Extração via OpenAI GPT-4o-mini** ✅
   - Prompt especializado em produtos industriais, EPIs, equipamentos
   - Extrai: nome, descrição, categoria, setores_alvo, diferenciais
   - Temperature: 0.2 (precisão)
   - Max tokens: 6.000

5. **Inserção no Banco** ✅
   - Verifica duplicatas (case-insensitive)
   - Insere em `tenant_products` ou `tenant_competitor_products`
   - Salva metadados de extração

---

## ⚖️ COMPARAÇÃO: METODOLOGIA ATUAL vs. BUSCA DIRETA

### ✅ **PONTOS FORTES DA METODOLOGIA ATUAL:**

1. **Homepage First** ✅
   - Acessa homepage primeiro (onde há produtos em destaque)
   - Extrai 15.000 caracteres (suficiente para maioria dos sites)

2. **SERPER Inteligente** ✅
   - Busca contextual com palavras-chave relevantes
   - Encontra páginas de produtos automaticamente

3. **IA Especializada** ✅
   - Prompt focado em produtos industriais/EPIs
   - Extrai categorias automaticamente
   - Identifica setores-alvo

4. **Tratamento de Duplicatas** ✅
   - Comparação case-insensitive
   - Evita produtos repetidos

### ⚠️ **LIMITAÇÕES IDENTIFICADAS:**

#### 1. **Estrutura de Navegação Não Explorada**
**Problema:** Não explora menu de navegação para encontrar categorias
**Exemplo Marluvas:**
- Menu tem: "Calçados", "Componentes", "Linhas", "Segmento", "Risco/Proteção"
- Cada item do menu pode ter subcategorias
- **Solução:** Extrair links do menu e acessar cada categoria

#### 2. **Produtos com Referências Específicas Não Capturados**
**Problema:** Produtos com códigos de referência (ex: "50T18 CO ELETRICISTA") podem não ser extraídos como produtos únicos
**Exemplo Marluvas:**
- "Tênis linha New Prime (Ref.: 50T18 CO ELETRICISTA)" é um produto específico
- "Tênis linha New prime (Ref.: 50T18 CO BP)" é outro produto
- **Solução:** Identificar referências como parte do nome do produto

#### 3. **Categorias Hierárquicas Não Mapeadas**
**Problema:** Sites têm categorias principais e subcategorias
**Exemplo Marluvas:**
- Categoria: "Calçados" → Subcategorias: "Botas", "Tênis", "Sapatos"
- Categoria: "Linhas" → Subcategorias: "New Prime", "Composite", "Têxtil"
- **Solução:** Extrair hierarquia de categorias (categoria + subcategoria)

#### 4. **Páginas de Produtos Individuais Não Acessadas**
**Problema:** Não acessa páginas individuais de cada produto
**Exemplo Marluvas:**
- Cada produto pode ter uma página própria com mais detalhes
- **Solução:** Identificar links de produtos e acessar páginas individuais

#### 5. **Imagens e Dados Estruturados Não Extraídos**
**Problema:** Não extrai dados de imagens, schema.org, ou JSON-LD
**Exemplo:**
- Sites podem ter dados estruturados (schema.org) com informações de produtos
- Imagens podem ter alt text com nomes de produtos
- **Solução:** Extrair schema.org, JSON-LD, e alt text de imagens

#### 6. **Limite de Caracteres Pode Cortar Produtos**
**Problema:** Limite de 15.000 caracteres na homepage pode cortar produtos
**Exemplo:**
- Sites com muitos produtos podem ter mais de 15.000 caracteres
- **Solução:** Aumentar limite ou processar em chunks

#### 7. **SERPER Pode Não Encontrar Todas as Páginas**
**Problema:** SERPER pode não indexar todas as páginas de produtos
**Exemplo:**
- Páginas dinâmicas (JavaScript) podem não ser indexadas
- **Solução:** Usar headless browser (Puppeteer) para páginas dinâmicas

---

## 🎯 DIFERENÇAS IDENTIFICADAS

### **BUSCA DIRETA (Manual/Web Search):**
1. ✅ Acessa menu de navegação
2. ✅ Explora categorias hierárquicas
3. ✅ Acessa páginas individuais de produtos
4. ✅ Extrai dados de imagens (alt text)
5. ✅ Identifica referências/códigos de produtos
6. ✅ Mapeia relacionamentos (categoria → subcategoria → produto)

### **METODOLOGIA ATUAL (STRATEVO ONE):**
1. ✅ Acessa homepage
2. ✅ Busca via SERPER
3. ✅ Testa URLs comuns
4. ✅ Extrai via IA
5. ❌ Não explora menu de navegação
6. ❌ Não acessa páginas individuais
7. ❌ Não extrai dados estruturados (schema.org)
8. ❌ Não mapeia hierarquia de categorias

---

## 📋 PROPOSTA DE MELHORIAS

### **FASE 1: Melhorias Imediatas (Baixo Esforço, Alto Impacto)**

1. **Extrair Links do Menu de Navegação**
   - Identificar elementos `<nav>`, `<menu>`, links com palavras-chave (produtos, categorias)
   - Acessar cada link encontrado
   - **Impacto:** +30-50% mais produtos encontrados

2. **Extrair Schema.org / JSON-LD**
   - Buscar `<script type="application/ld+json">` no HTML
   - Extrair dados estruturados de produtos
   - **Impacto:** Dados mais precisos e completos

3. **Extrair Alt Text de Imagens**
   - Buscar imagens com alt text contendo nomes de produtos
   - **Impacto:** Produtos que só aparecem em imagens

4. **Identificar Referências/Códigos**
   - Padrões: "Ref.:", "Código:", "SKU:", "Modelo:"
   - Incluir referência no nome do produto
   - **Impacto:** Produtos únicos identificados corretamente

### **FASE 2: Melhorias Intermediárias (Médio Esforço, Alto Impacto)**

5. **Mapear Hierarquia de Categorias**
   - Identificar categorias principais e subcategorias
   - Salvar como `categoria` e `subcategoria`
   - **Impacto:** Organização melhor dos produtos

6. **Acessar Páginas Individuais de Produtos**
   - Identificar links de produtos (padrões: `/produto/`, `/product/`, `/p/`)
   - Acessar até 20 páginas individuais
   - **Impacto:** +50-100% mais detalhes por produto

7. **Processar Páginas Dinâmicas (JavaScript)**
   - Usar headless browser para sites com JavaScript
   - **Impacto:** Sites modernos (React, Vue) funcionam

### **FASE 3: Melhorias Avançadas (Alto Esforço, Alto Impacto)**

8. **Crawler Completo do Site**
   - Mapear toda a estrutura do site
   - Identificar todas as páginas de produtos
   - **Impacto:** 100% dos produtos encontrados

9. **Machine Learning para Categorização**
   - Treinar modelo para categorizar produtos automaticamente
   - **Impacto:** Categorização mais precisa

---

## 📊 ESTIMATIVA DE PRODUTOS ENCONTRADOS

### **Marluvas:**
- **Metodologia Atual:** ~15-20 produtos
- **Com Melhorias Fase 1:** ~30-40 produtos
- **Com Melhorias Fase 2:** ~50-70 produtos
- **Com Melhorias Fase 3:** ~100+ produtos

### **Uniluvas:**
- **Metodologia Atual:** ~10-15 produtos
- **Com Melhorias Fase 1:** ~20-30 produtos
- **Com Melhorias Fase 2:** ~40-50 produtos
- **Com Melhorias Fase 3:** ~60+ produtos

### **Metalife:**
- **Metodologia Atual:** ~10-15 produtos
- **Com Melhorias Fase 1:** ~15-20 produtos
- **Com Melhorias Fase 2:** ~20-25 produtos
- **Com Melhorias Fase 3:** ~30+ produtos

---

## ❓ PERGUNTAS PARA DECISÃO

1. **Implementar Fase 1 (Melhorias Imediatas)?**
   - Esforço: Baixo (2-3 dias)
   - Impacto: Alto (+30-50% produtos)
   - Risco: Baixo

2. **Implementar Fase 2 (Melhorias Intermediárias)?**
   - Esforço: Médio (1-2 semanas)
   - Impacto: Alto (+50-100% produtos)
   - Risco: Médio

3. **Implementar Fase 3 (Melhorias Avançadas)?**
   - Esforço: Alto (1 mês+)
   - Impacto: Muito Alto (100% produtos)
   - Risco: Alto

---

## 🎯 RECOMENDAÇÃO

**Implementar FASE 1 imediatamente:**
- Baixo esforço, alto impacto
- Melhora significativa na extração
- Base para fases seguintes

**Avaliar FASE 2 após FASE 1:**
- Depende dos resultados da Fase 1
- Pode ser suficiente para maioria dos casos

**FASE 3 apenas se necessário:**
- Para sites muito complexos
- Quando precisar de 100% de cobertura

---

## 📝 PRÓXIMOS PASSOS

1. **Aguardar aprovação** para implementar melhorias
2. **Definir prioridade** (Fase 1, 2 ou 3)
3. **Implementar melhorias** aprovadas
4. **Testar** nos 3 sites de exemplo
5. **Comparar resultados** antes/depois

