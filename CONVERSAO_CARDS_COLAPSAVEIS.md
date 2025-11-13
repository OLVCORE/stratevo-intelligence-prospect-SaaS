# 📦 CONVERSÃO DE CARDS COLAPSÁVEIS - PROSPECT-V2

## ✅ STATUS ATUAL

- ✅ Componente `CollapsibleCard.tsx` criado
- ✅ Import adicionado em `CompanyDetailPage.tsx`
- ✅ Card 1 (Identificação Cadastral) convertido ✅
- ✅ Card 2 (Localização) convertido ✅
- ⏳ Cards 3-8 pendentes

---

## 📋 CARDS A CONVERTER:

| # | Card | Ícone | Aberto? | Linha aprox |
|---|------|-------|---------|-------------|
| 1 | ✅ Identificação Cadastral | Shield | SIM | 902 |
| 2 | ✅ Localização Completa | MapPin | SIM | 928 |
| 3 | ⏳ Informações de Contato | Phone | NÃO | 996 |
| 4 | ⏳ Atividade Econômica | Briefcase | NÃO | ~1100 |
| 5 | ⏳ Quadro de Pessoal | Users | NÃO | ~1200 |
| 6 | ⏳ Sócios e Administradores | UserPlus | NÃO | ~1250 |
| 7 | ⏳ Informações Financeiras | DollarSign | NÃO | ~1300 |
| 8 | ⏳ Decisores Cadastrados | Target | SIM | ~1400 |

---

## 🎯 CONVERSÕES PENDENTES:

### **Card 3: Informações de Contato** (Linha ~996)

**BUSCAR:**
```tsx
<Card className="glass-card">
  <CardHeader className="pb-4">
    <CardTitle className="flex items-center gap-2 text-lg">
      <Phone className="h-5 w-5 text-primary" />
      Informações de Contato
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
```

**SUBSTITUIR POR:**
```tsx
<CollapsibleCard
  title="Informações de Contato"
  icon={Phone}
  defaultExpanded={false}
>
  <div className="space-y-4">
```

**E NO FINAL DO CARD (antes de `</Card>`):**
```tsx
</CardContent>
</Card>
```

**SUBSTITUIR POR:**
```tsx
  </div>
</CollapsibleCard>
```

---

## 🚀 PRÓXIMOS PASSOS:

1. Converter Card 3 (Contato)
2. Converter Card 4 (Atividade Econômica)
3. Converter Card 5 (Quadro Pessoal)
4. Converter Card 6 (Sócios)
5. Converter Card 7 (Financeiro)
6. Converter Card 8 (Decisores)
7. Testar build
8. Validar visualmente

---

## ⏱️ TEMPO ESTIMADO: 10 minutos

**Deseja que eu continue automaticamente?**

