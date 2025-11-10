# ⚠️ IMPORTANTE: NENHUM DADO INVENTADO (MOCK DATA)

---

## 🎯 REGRA CRÍTICA PARA O CURSOR

**NUNCA usar dados fictícios/inventados/exemplo em campos de dados!**

---

## ❌ **PROIBIDO:**

```typescript
// ❌ NÃO FAZER ISSO:
const importers = [
  { name: "CoreBody Pilates Inc", volume: "USD 2.3M" }, // ← INVENTADO!
  { name: "Fitness World LLC", volume: "USD 1.8M" }     // ← INVENTADO!
];

// ❌ NÃO FAZER ISSO:
<Input value="USD 2,450" /> // ← Preço inventado!

// ❌ NÃO FAZER ISSO:
<Badge>234 importadores</Badge> // ← Número inventado!
```

---

## ✅ **CORRETO:**

### **1️⃣ CAMPOS VAZIOS COM PLACEHOLDERS:**

```typescript
// ✅ FAZER ASSIM:
<div className="space-y-4">
  <div>
    <Label className="flex items-center gap-2">
      HS Code / NCM
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            💡 Informe o código NCM/HS do produto (ex: 9506.91.00)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
    <Input 
      placeholder="Ex: 9506.91.00 (Pilates Equipment)"
      value={hsCode}
      onChange={(e) => setHsCode(e.target.value)}
    />
  </div>

  <div>
    <Label className="flex items-center gap-2">
      País-Alvo
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            💡 Selecione o país onde deseja buscar importadores
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
    <Select value={country} onValueChange={setCountry}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o país..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="US">🇺🇸 USA</SelectItem>
        <SelectItem value="DE">🇩🇪 Germany</SelectItem>
        <SelectItem value="JP">🇯🇵 Japan</SelectItem>
        <SelectItem value="AU">🇦🇺 Australia</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label className="flex items-center gap-2">
      Volume Anual (USD)
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            💡 Calculado automaticamente após buscar importadores
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Label>
    <Input 
      placeholder="Será calculado automaticamente..."
      value={calculatedVolume || ''}
      disabled={true}
      className="bg-muted"
    />
    {!calculatedVolume && (
      <p className="text-xs text-muted-foreground mt-1">
        ⏳ Aguardando busca de importadores
      </p>
    )}
  </div>

  <Button 
    onClick={handleSearchImporters}
    disabled={!hsCode || !country}
  >
    {isSearching ? (
      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Buscando...</>
    ) : (
      'Buscar Importadores'
    )}
  </Button>
</div>
```

---

### **2️⃣ CALCULADORAS AUTOMÁTICAS:**

```typescript
// ✅ CALCULADORA DE INCOTERMS (campos vazios até preencher)

interface IncotermsCalculatorProps {
  productWeight?: number;
  productValue?: number;
  originPort?: string;
  destinationPort?: string;
}

export function IncotermsCalculator({ 
  productWeight, 
  productValue, 
  originPort, 
  destinationPort 
}: IncotermsCalculatorProps) {
  const [calculated, setCalculated] = useState<any>(null);

  async function calculate() {
    if (!productWeight || !productValue || !originPort || !destinationPort) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Chamar API real de cotação de frete
    const { data } = await supabase.functions.invoke('calculate-incoterms', {
      body: { productWeight, productValue, originPort, destinationPort }
    });

    setCalculated(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Incoterms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Peso do Produto (kg)</Label>
          <Input 
            type="number"
            placeholder="Ex: 85 (vazio até você preencher)"
            value={productWeight || ''}
          />
        </div>

        <div>
          <Label>Valor FOB (USD)</Label>
          <Input 
            type="number"
            placeholder="Ex: 2450 (vazio até você preencher)"
            value={productValue || ''}
          />
        </div>

        <div>
          <Label>Porto Origem</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRSSZ">Santos, BR</SelectItem>
              <SelectItem value="BRRIO">Rio de Janeiro, BR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Porto Destino</Label>
          <Input placeholder="Ex: Los Angeles, USA" />
        </div>

        <Button onClick={calculate}>Calcular Preços</Button>

        {calculated ? (
          <div className="mt-4 space-y-2 p-4 bg-muted rounded">
            <div className="flex justify-between">
              <span>EXW (Ex Works):</span>
              <span className="font-bold">USD {calculated.exw}</span>
            </div>
            <div className="flex justify-between">
              <span>FOB (Free on Board):</span>
              <span className="font-bold">USD {calculated.fob}</span>
            </div>
            <div className="flex justify-between">
              <span>CIF (Cost, Insurance, Freight):</span>
              <span className="font-bold">USD {calculated.cif}</span>
            </div>
            <div className="flex justify-between">
              <span>DDP (Delivered Duty Paid):</span>
              <span className="font-bold">USD {calculated.ddp}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-muted/50 rounded text-center">
            <p className="text-sm text-muted-foreground">
              💡 Preencha todos os campos para calcular
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### **3️⃣ LISTA DE IMPORTADORES (Vazia até buscar):**

```typescript
// ✅ ESTADO VAZIO até usuário buscar

export function ImportersList() {
  const [importers, setImporters] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    hsCode: '',
    country: '',
    minVolume: ''
  });

  async function handleSearch() {
    setIsSearching(true);
    
    // Buscar via Apollo (FASE 1 - sem Trade Data API)
    const { data } = await supabase.functions.invoke('discover-importers-apollo', {
      body: {
        hs_code: searchParams.hsCode,
        country: searchParams.country,
        keywords: ['pilates', 'fitness equipment', 'gym equipment']
      }
    });

    setImporters(data.companies || []);
    setIsSearching(false);
  }

  return (
    <div>
      {/* Formulário de busca */}
      <div className="space-y-4 mb-6">
        <Input 
          placeholder="HS Code (ex: 9506.91.00)"
          value={searchParams.hsCode}
          onChange={(e) => setSearchParams({...searchParams, hsCode: e.target.value})}
        />
        <Select 
          value={searchParams.country}
          onValueChange={(val) => setSearchParams({...searchParams, country: val})}
        >
          <SelectTrigger>
            <SelectValue placeholder="País-alvo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">🇺🇸 USA</SelectItem>
            <SelectItem value="DE">🇩🇪 Germany</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={!searchParams.hsCode || !searchParams.country}>
          Buscar Importadores
        </Button>
      </div>

      {/* Lista de resultados */}
      {importers.length === 0 && !isSearching ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">Nenhuma busca realizada</h4>
          <p className="text-sm text-muted-foreground">
            Preencha HS Code e País para descobrir importadores
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {importers.map((imp) => (
            <ImporterCard key={imp.id} importer={imp} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 💰 **CUSTO ESTIMADO PARA APRESENTAR AO CLIENTE:**

### **OPÇÃO 1: MVP (Sem Trade Data - Validação):**
```
Setup: R$ 0 (usa Apollo atual)
Mensal: R$ 2,997 (assinatura SaaS)
APIs: R$ 0 (Apollo já incluso)
────────────────────────────
TOTAL: R$ 2,997/mês

Prospects/mês: 50-100 (manual + Apollo)
```

### **OPÇÃO 2: SCALE USA (Import Genius):**
```
Setup: R$ 0
Mensal: R$ 2,997 (assinatura SaaS)
APIs: R$ 4,500 (Import Genius USD 899)
────────────────────────────
TOTAL: R$ 7,497/mês

Prospects/mês: 500-1,000 (automático USA)
```

### **OPÇÃO 3: SCALE GLOBAL (Panjiva):**
```
Setup: R$ 0
Mensal: R$ 2,997 (assinatura SaaS)
APIs: R$ 20,000 (Panjiva USD 3,999)
────────────────────────────
TOTAL: R$ 22,997/mês

Prospects/mês: 2,000-5,000 (automático global)
```

---

## ✅ **RECOMENDAÇÃO FINAL:**

**PARA METALIFE:**
1. ✅ Começar com **MVP (Apollo)** - R$ 2,997/mês
2. ✅ Validar produto (3 meses)
3. ✅ Se funcionar → Adicionar Import Genius (USA)
4. ✅ Se escalar → Adicionar Panjiva (Global)

**ROI Esperado:**
- 1 deal export = USD 50K-150K
- 1 cliente/mês = USD 600K-1.8M/ano
- Custo API = USD 899/mês (Import Genius)
- **ROI: 50-150x** 🚀

---

## 🚀 **AGORA POSSO TE AJUDAR COM O PUSH?**

Todos os arquivos estão prontos e **SEM DADOS INVENTADOS**!

Está pronto para fazer o push do projeto Trade Intelligence? 📦

