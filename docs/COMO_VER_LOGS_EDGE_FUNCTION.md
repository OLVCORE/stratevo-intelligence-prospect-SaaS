# 📋 Como Ver os Logs da Edge Function

## 🎯 Edge Function: `generate-icp-report`

Esta é a função que gera os relatórios ICP e onde você verá os logs detalhados.

## 📍 ONDE VER OS LOGS

### Opção 1: Supabase Dashboard (Mais Fácil)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral esquerdo, clique em **Edge Functions**
4. Clique na função **`generate-icp-report`**
5. Clique na aba **Logs** (ou **Invoke logs**)
6. Você verá todos os logs em tempo real

### Opção 2: Via Terminal (CLI)

```bash
# Ver logs em tempo real
supabase functions logs generate-icp-report --follow

# Ver últimos 100 logs
supabase functions logs generate-icp-report --limit 100
```

## 🔍 O QUE PROCURAR NOS LOGS

Quando você gerar um relatório, procure por estas linhas específicas:

### 1. Logs de Verificação de Dados
```
[GENERATE-ICP-REPORT] 🔥 VERIFICAÇÃO CRÍTICA DE DADOS NO REPORT MODEL:
```

Este log mostra:
- `step1_razaoSocial`: Nome da empresa (deve ser real, não `null`)
- `step4_diferenciais`: Quantidade de diferenciais (deve ser > 0)
- `step5_clientes`: Quantidade de clientes (deve ser > 0)

### 2. Log do JSON Completo Enviado para LLM
```
[BUILD-LLM-PROMPT] 🔥🔥🔥 ONBOARDING DATA COMPLETO ENVIADO PARA LLM:
```

Este log mostra o JSON completo com TODOS os dados das 6 etapas que estão sendo enviados para a LLM.

### 3. Log do Report Model Completo
```
[GENERATE-ICP-REPORT] 📊 Report Model COMPLETO (primeiros 2000 chars):
```

Este log mostra os primeiros 2000 caracteres do `reportModel` completo.

## 📊 EXEMPLO DO QUE VOCÊ DEVE VER

### ✅ SE OS DADOS ESTÃO CHEGANDO (BOM):
```json
{
  "step1_razaoSocial": "UNI LUVAS CONFECCAO DE LUVAS LTDA",
  "step1_concorrentes": 3,
  "step4_diferenciais": 5,
  "step5_clientes": 8
}
```

### ❌ SE OS DADOS NÃO ESTÃO CHEGANDO (PROBLEMA):
```json
{
  "step1_razaoSocial": null,
  "step1_concorrentes": 0,
  "step4_diferenciais": 0,
  "step5_clientes": 0
}
```

## 🚀 PRÓXIMO PASSO

1. Gere um novo relatório pela interface do STRATEVO
2. Imediatamente vá para os logs da Edge Function `generate-icp-report`
3. Procure pelas linhas com `🔥🔥🔥`
4. Copie e me envie:
   - O que aparece em `step1_razaoSocial`
   - O que aparece em `step4_diferenciais`
   - Um trecho do JSON do `onboardingData` (se aparecer)

Com isso, identifico EXATAMENTE onde está o problema!

## 💡 DICA

Se você não ver os logs aparecendo:
- Verifique se o relatório foi realmente gerado (não deu erro)
- Aguarde alguns segundos (os logs podem demorar para aparecer)
- Tente gerar o relatório novamente





