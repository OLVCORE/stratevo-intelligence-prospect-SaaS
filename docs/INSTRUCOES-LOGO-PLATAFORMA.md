# 📸 INSTRUÇÕES: Adicionar Logo STRATEVO One na Plataforma

## ✅ Alterações Realizadas

1. **Sidebar (`AppSidebar.tsx`):**
   - ✅ Removido texto "STRATEVO One"
   - ✅ Mantido apenas slogan: "A Plataforma Definitiva de Inteligência de Vendas"
   - ✅ Adicionada referência ao logo: `/logo-stratevo-one.png`
   - ✅ Fallback para ícone Building2 se logo não carregar

2. **Header (`AppLayout.tsx`):**
   - ✅ Removido texto "STRATEVO One"
   - ✅ Adicionada referência ao logo: `/logo-stratevo-one.png`
   - ✅ Fallback para texto se logo não carregar

## 📋 PRÓXIMOS PASSOS

### 1. Adicionar Logo ao Projeto

Coloque o arquivo do logo STRATEVO One na pasta `public/`:

```
public/logo-stratevo-one.png
```

**Especificações recomendadas:**
- Formato: PNG (com transparência) ou SVG
- Tamanho: 200-300px de largura (altura proporcional)
- Resolução: 2x para telas retina (400-600px se PNG)
- Fundo: Transparente ou escuro (conforme design)

### 2. Verificar Caminho

O código está configurado para buscar:
```
/public/logo-stratevo-one.png
```

Se você usar outro nome ou formato, atualize:
- `src/components/layout/AppSidebar.tsx` (linha ~366)
- `src/components/layout/AppLayout.tsx` (linha ~43)

### 3. Testar

1. Adicione o logo em `public/logo-stratevo-one.png`
2. Inicie o servidor de desenvolvimento
3. Verifique:
   - Sidebar mostra logo + slogan
   - Header mostra logo
   - Logo aparece corretamente em diferentes tamanhos de tela

## 🎨 Comportamento Esperado

### Sidebar (Expandida):
```
[LOGO] A Plataforma Definitiva de Inteligência de Vendas
```

### Sidebar (Colapsada):
```
[LOGO apenas]
```

### Header:
```
[LOGO] [Busca] [Tenant] [Menu]
```

## ⚠️ Fallback

Se o logo não carregar:
- **Sidebar:** Mostra ícone Building2
- **Header:** Mostra texto "STRATEVO One"

Isso garante que a plataforma sempre funcione, mesmo sem o logo.

---

**Status:** Código atualizado ✅  
**Ação necessária:** Adicionar arquivo do logo em `public/logo-stratevo-one.png` 📤

