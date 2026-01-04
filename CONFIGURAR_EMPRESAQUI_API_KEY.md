# 🔑 Como Configurar EMPRESAQUI_API_KEY

## ⚠️ PROBLEMA CRÍTICO

Os logs mostram:
```
[ProspeccaoAvancada] ⚠️ EMPRESAQUI_API_KEY não configurada
- EMPRESAQUI_API_KEY configurada? false
```

**Isso significa que a busca no EmpresaQui não está funcionando!**

## ✅ SOLUÇÃO

### Passo 1: Obter API Key do EmpresaQui

1. Acesse: https://www.empresaqui.com.br/
2. Faça login ou crie uma conta
3. Vá para a seção de API/Documentação
4. Copie sua API Key

### Passo 2: Adicionar no Supabase

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Clique em **Add new secret**
4. Nome: `EMPRESAQUI_API_KEY`
5. Valor: Cole sua API Key
6. Clique em **Save**

### Passo 3: Verificar

Após adicionar, os logs devem mostrar:
```
[ProspeccaoAvancada] ✅ EmpresaQui retornou: X empresas
```

## 🚨 IMPORTANTE

- A API Key é sensível - nunca commite no código
- Ela deve estar apenas nas Secrets do Supabase
- Sem ela, a busca só funcionará via SERPER (menos preciso)

