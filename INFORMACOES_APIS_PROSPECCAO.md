# 📊 Informações sobre APIs para Prospecção Avançada

**Data:** 2025-01-04  
**Status:** Pesquisa de APIs disponíveis

---

## 🔍 APIs ENCONTRADAS

### ✅ 1. BaseCNPJ (OpenCNPJ)

**Link:** https://opencnpj.org/

**O que faz:**
- Consulta dados cadastrais de empresas brasileiras por CNPJ
- Retorna: razão social, nome fantasia, situação cadastral, natureza jurídica, capital social, endereço completo
- Base atualizada mensalmente com dados da Receita Federal

**É gratuito?**
- ✅ **SIM, 100% GRATUITO**
- ✅ Uso comercial permitido
- ✅ Sem necessidade de autenticação
- ⚠️ Limite: 50 requisições por segundo por IP

**Documentação:**
- API REST simples
- Formato: JSON
- Endpoint: `GET https://opencnpj.org/api/v1/company/{cnpj}`

**Vantagens:**
- ✅ Gratuito
- ✅ Sem cadastro
- ✅ Atualização mensal
- ✅ Dados oficiais da Receita Federal

**Desvantagens:**
- ⚠️ Apenas busca por CNPJ (não permite busca por CNAE, localização, etc.)
- ⚠️ Não tem busca avançada (filtros)

**Uso no projeto:**
- ⚠️ **LIMITADO** - Só serve para enriquecimento de dados cadastrais (já temos BrasilAPI/ReceitaWS)
- ❌ **NÃO serve** para busca inicial de empresas (não tem busca por CNAE/localização)

---

### ✅ 2. Consultar.IO

**Link:** https://consultar.io/

**O que faz:**
- Plataforma empresarial para consulta de dados públicos
- Múltiplas APIs:
  - CNPJ
  - CPF
  - Inscrição Estadual
  - Inscrição Municipal
  - Registros profissionais (CRM, CRO, CRBM, CRF, CRP)
  - Endereços (CEP e geocodificação)

**É gratuito?**
- ⚠️ **PARCIALMENTE**
- ✅ Teste gratuito: R$ 5,00 em créditos válidos por 1 ano
- 💰 Após teste: necessário adquirir créditos (planos pagos)
- 📧 Contato necessário para saber preços

**Documentação:**
- API REST
- Requer cadastro e chave de acesso
- Integração com CRM/ERP

**Vantagens:**
- ✅ Múltiplas APIs em uma plataforma
- ✅ Teste gratuito disponível
- ✅ Dados profissionais (CRM, CRO, etc.)

**Desvantagens:**
- ⚠️ Pago após teste
- ⚠️ Não encontrei informação sobre busca avançada (CNAE, localização)
- ⚠️ Foco em consulta individual (CNPJ/CPF), não em busca em massa

**Uso no projeto:**
- ⚠️ **LIMITADO** - Pode ser útil para enriquecimento de dados profissionais
- ❌ **NÃO serve** para busca inicial de empresas (não tem busca por CNAE/localização)

---

### ❌ 3. Oportunidados

**Status:** ❌ **NÃO ENCONTRADO**

**Possíveis alternativas:**
- Pode ser que o nome esteja incorreto
- Pode ser uma API interna/privada
- Pode não existir mais

**Recomendação:**
- Verificar se o nome está correto
- Considerar alternativas abaixo

---

### ❌ 4. PesquisaEmpresas

**Status:** ❌ **NÃO ENCONTRADO**

**Nota:** Mencionado no plano como "68+ milhões de empresas", mas não encontrei API pública com esse nome.

**Possíveis alternativas:**
- Pode ser uma base de dados privada
- Pode ser uma referência a outra API

---

## 🔄 ALTERNATIVAS ENCONTRADAS

### ✅ BrasilAPI (JÁ ESTAMOS USANDO)

**Link:** https://brasilapi.com.br/

**O que faz:**
- ✅ CNPJ (V1 e V2) - **JÁ USAMOS**
- ✅ CEP (V1 e V2) - **JÁ USAMOS**
- ✅ NCM - **JÁ USAMOS**
- ✅ E mais 15+ endpoints

**É gratuito?**
- ✅ **SIM, 100% GRATUITO**
- ✅ Open source
- ✅ Sem autenticação

**Status no projeto:**
- ✅ **JÁ INTEGRADO** (usamos CNPJ V2, CEP V2, NCM)

---

### ✅ EmpresaQui (JÁ ESTAMOS USANDO)

**Link:** https://api.empresaqui.com.br/

**O que faz:**
- ✅ Busca empresas por CNAE, localização, porte
- ✅ Dados cadastrais e financeiros
- ✅ API completa para prospecção

**É gratuito?**
- ❌ **NÃO** - Requer API key (você já tem: `a8725d0dbe...`)

**Status no projeto:**
- ✅ **JÁ INTEGRADO** (fonte principal atual)

---

## 📊 COMPARAÇÃO DAS APIs

| API | Gratuito? | Busca Avançada? | Enriquecimento? | Status |
|-----|-----------|-----------------|------------------|--------|
| **EmpresaQui** | ❌ Pago | ✅ Sim (CNAE, localização, porte) | ✅ Sim | ✅ **USANDO** |
| **BrasilAPI** | ✅ Sim | ❌ Não (só por CNPJ) | ✅ Sim (dados cadastrais) | ✅ **USANDO** |
| **BaseCNPJ** | ✅ Sim | ❌ Não (só por CNPJ) | ✅ Sim (dados cadastrais) | ⚠️ Redundante |
| **Consultar.IO** | ⚠️ Teste | ❌ Não (só por CNPJ/CPF) | ✅ Sim (dados profissionais) | ⚠️ Opcional |
| **Oportunidados** | ❓ ? | ❓ ? | ❓ ? | ❌ Não encontrado |
| **PesquisaEmpresas** | ❓ ? | ❓ ? | ❓ ? | ❌ Não encontrado |

---

## 💡 RECOMENDAÇÕES

### ❌ NÃO RECOMENDADO para busca inicial:
- **BaseCNPJ** - Só busca por CNPJ (não tem busca por CNAE/localização)
- **Consultar.IO** - Foco em consulta individual, não busca em massa

### ✅ RECOMENDADO para enriquecimento:
- **BrasilAPI** - ✅ Já estamos usando (melhor que BaseCNPJ)
- **Consultar.IO** - ⚠️ Opcional (dados profissionais - CRM, CRO, etc.)

### 🔍 ALTERNATIVAS para busca inicial (além de EmpresaQui):

1. **Serper API** (Google Search) - ✅ **JÁ ESTAMOS USANDO**
   - Busca empresas na web
   - Pode filtrar por localização, setor
   - Limitação: resultados de busca, não base estruturada

2. **Apollo.io** - ✅ **JÁ ESTAMOS USANDO**
   - Busca empresas B2B
   - Filtros avançados (setor, localização, porte)
   - Limitação: Foco em empresas B2B, não todas as empresas

3. **PhantomBuster** - ✅ **JÁ ESTAMOS USANDO**
   - Scraping de LinkedIn
   - Busca empresas por setor
   - Limitação: Depende do LinkedIn

---

## 🎯 CONCLUSÃO

### APIs que NÃO precisamos integrar:
- ❌ **BaseCNPJ** - Redundante (já temos BrasilAPI que é melhor)
- ❌ **Consultar.IO** - Opcional (só se precisarmos de dados profissionais específicos)
- ❌ **Oportunidados** - Não encontrado
- ❌ **PesquisaEmpresas** - Não encontrado

### APIs que JÁ ESTAMOS USANDO (e são suficientes):
- ✅ **EmpresaQui** - Busca inicial (CNAE, localização, porte)
- ✅ **BrasilAPI** - Enriquecimento cadastral (CNPJ, CEP, NCM)
- ✅ **Apollo.io** - Decisores e contatos
- ✅ **Hunter.io** - E-mails
- ✅ **PhantomBuster** - LinkedIn
- ✅ **Serper** - Busca web

---

## 📝 PRÓXIMOS PASSOS

### Opção 1: Manter estrutura atual (RECOMENDADO)
- ✅ EmpresaQui já faz busca avançada (CNAE, localização, porte)
- ✅ BrasilAPI já faz enriquecimento cadastral
- ✅ Apollo + Hunter + PhantomBuster já fazem enriquecimento de contatos
- ✅ **Não precisamos de mais APIs para busca inicial**

### Opção 2: Adicionar Consultar.IO (opcional)
- ⚠️ Apenas se precisarmos de dados profissionais específicos (CRM, CRO, etc.)
- ⚠️ Requer créditos (pago)
- ⚠️ Não adiciona busca inicial (só enriquecimento)

### Opção 3: Remover funções não utilizadas
- ❌ Remover `buscarViaBaseCNPJ()` (redundante)
- ❌ Remover `buscarViaOportunidados()` (não existe)
- ⚠️ Manter `buscarViaConsultarIO()` apenas se decidirmos usar

---

## 🔗 LINKS ÚTEIS

- **BaseCNPJ:** https://opencnpj.org/
- **Consultar.IO:** https://consultar.io/
- **BrasilAPI:** https://brasilapi.com.br/
- **EmpresaQui:** https://api.empresaqui.com.br/

---

**Recomendação Final:** ✅ **Manter estrutura atual** - Já temos todas as APIs necessárias!

