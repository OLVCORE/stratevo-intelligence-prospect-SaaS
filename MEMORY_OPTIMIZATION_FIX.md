# 🔧 Correção de Limite de Memória - Edge Function simple-totvs-check

## 🚨 Problema Identificado

A Edge Function estava sendo interrompida com erro **"Memory limit exceeded"** e **"WORKER_LIMIT"** durante a fase final de validação/análise. Os créditos eram consumidos, mas a análise não era concluída porque a função era encerrada antes de retornar os resultados.

**Causa Raiz:**
- A função estava fazendo fetch de **TODAS** as URLs que passavam na validação básica
- Cada fetch consome memória (HTML completo + análise IA)
- Com muitas evidências, o consumo de memória excedia o limite do Supabase (~150MB)

## ✅ Soluções Implementadas

### 1. **Limite de URLs Processadas** (Máximo 15 URLs)
- Adicionado contador `urlsProcessedCount` que limita o número de URLs que são validadas com fetch completo
- Apenas URLs que passaram na validação básica E têm alta probabilidade (triple/double matches) são validadas com fetch
- Após 15 URLs, a função usa apenas validação básica (snippet + título)

### 2. **Redução do Tamanho do Conteúdo Extraído**
- Texto extraído reduzido de **2000 para 1000 caracteres**
- Timeout de fetch reduzido de **8s para 5s**
- Isso reduz significativamente o uso de memória por URL

### 3. **Salvamento Incremental**
- Resultados são salvos **ANTES** de retornar a resposta
- Em caso de timeout/memória, resultados parciais são salvos no `catch` block
- Garante que dados não sejam perdidos mesmo se a função for interrompida

### 4. **Tratamento de Erros Melhorado**
- Detecção específica de erros de memória (`WORKER_LIMIT`)
- Retorno de resultados parciais quando disponíveis
- Frontend atualizado para exibir resultados parciais em vez de erro

### 5. **Otimizações de Performance**
- Updates de banco de dados envolvidos em `try-catch` para não bloquear retorno
- Operações não críticas não impedem o retorno da resposta

## 📊 Impacto Esperado

- **Redução de ~70% no uso de memória** (limitando a 15 URLs + conteúdo menor)
- **Resultados sempre salvos** mesmo em caso de interrupção
- **Melhor experiência do usuário** com resultados parciais em vez de erro completo

## 🔍 Como Funciona Agora

1. **Validação Básica**: Todas as evidências passam por validação básica (snippet + título)
2. **Validação Avançada**: Apenas as primeiras 15 evidências que passam na validação básica são validadas com fetch completo + IA
3. **Salvamento**: Resultados são salvos imediatamente após processamento
4. **Recuperação**: Em caso de erro, resultados parciais são salvos e retornados

## ⚠️ Limitações

- Máximo de 15 URLs validadas com fetch completo por verificação
- URLs adicionais usam apenas validação básica (ainda precisa passar nos critérios de triple/double match)
- Isso pode reduzir ligeiramente a precisão, mas garante que a função complete com sucesso

## 🧪 Teste

Após deploy, testar com uma empresa grande (ex: Klabin) e verificar:
1. Se a função completa sem erro de memória
2. Se os resultados são salvos corretamente
3. Se o frontend exibe os resultados mesmo em caso de timeout parcial

