# 📋 ATUALIZAÇÃO: TOTVSCheckCard para Novo Sistema

## 🎯 OBJETIVO

Atualizar o componente `TOTVSCheckCard` para usar o novo sistema de **Fit de Produtos** ao invés do sistema antigo de verificação TOTVS.

---

## 📝 MUDANÇAS NECESSÁRIAS

### 1. **IMPORTS**
```typescript
// REMOVER:
import { useUsageVerification } from '@/hooks/useUsageVerification';
import { HeroStatusCard } from './HeroStatusCard';
import { MetricsDashboard } from './MetricsDashboard';
import { EvidencesVirtualList } from './EvidencesVirtualList';
import { VerificationProgressBar } from './VerificationProgressBar';
import { ReportComparison } from './ReportComparison';
import { IntentDashboard } from './IntentDashboard';
import { AdvancedFilters } from './AdvancedFilters';
import { exportEvidencesToCSV, exportEvidencesToExcel, exportEvidencesToJSON } from '@/services/exportService';

// ADICIONAR:
import { useProductFit } from '@/hooks/useProductFit';
import { ProductFitScoreCard } from './ProductFitScoreCard';
import { ProductRecommendationsList } from './ProductRecommendationsList';
```

### 2. **HOOK**
```typescript
// REMOVER:
const { data: liveData, isLoading: isLoadingLive, refetch, isFetching } = useUsageVerification({
  companyId,
  companyName,
  cnpj,
  domain,
  tenantId: tenant?.id,
  enabled: shouldFetchLive && (!!companyName || !!cnpj) && !!tenant?.id,
});

// ADICIONAR:
const { data: fitData, isLoading: isLoadingFit, refetch, isFetching } = useProductFit({
  companyId,
  tenantId: tenant?.id,
  enabled: enabled && !!companyId && !!tenant?.id,
});
```

### 3. **ESTADOS E LÓGICA**
```typescript
// REMOVER estados relacionados a TOTVS:
const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');
const [selectedSources, setSelectedSources] = useState<string[]>([]);
const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
const [searchText, setSearchText] = useState<string>('');
const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
const [dateFrom, setDateFrom] = useState<Date | undefined>();
const [dateTo, setDateTo] = useState<Date | undefined>();
const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'score' | 'source'>('relevance');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
const [favoriteEvidences, setFavoriteEvidences] = useState<Set<string>>(new Set());
const [verificationStartTime, setVerificationStartTime] = useState<number | null>(null);
const [currentPhase, setCurrentPhase] = useState<string | null>(null);

// MANTER apenas:
const [enabled, setEnabled] = useState(autoVerify);
const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // Para produtos recomendados
```

### 4. **HANDLEVERIFY**
```typescript
// SIMPLIFICAR handleVerify:
const handleVerify = async () => {
  // Limpar cache
  queryClient.removeQueries({ queryKey: ['product-fit', companyId, tenant?.id] });
  
  // Habilitar
  setEnabled(true);
  
  // Mostrar toast
  toast.info('🔄 Calculando fit de produtos...');
};
```

### 5. **RENDERIZAÇÃO DA ABA "detection"**
```typescript
// REMOVER toda a lógica de evidências TOTVS
// REMOVER: HeroStatusCard, MetricsDashboard, EvidencesVirtualList, etc.

// ADICIONAR:
{!fitData || !enabled ? (
  <div className="text-center py-12">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
      <Package className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">
      Análise de Fit de Produtos
    </h3>
    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
      Calcula a aderência entre seus produtos e a empresa prospectada
    </p>
    <Button onClick={handleVerify} size="lg" disabled={isLoadingFit}>
      {isLoadingFit ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Analisando...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Calcular Fit
        </>
      )}
    </Button>
  </div>
) : (
  <div className="space-y-6">
    {/* Product Fit Score Card */}
    <ProductFitScoreCard
      fitScore={fitData.fit_score}
      fitLevel={fitData.fit_level}
      confidence={fitData.metadata.confidence}
      overallJustification={fitData.analysis.overall_justification}
      cnaeMatch={fitData.analysis.cnae_match}
      sectorMatch={fitData.analysis.sector_match}
    />

    {/* Product Recommendations List */}
    <ProductRecommendationsList
      recommendations={fitData.products_recommendation}
      onProductSelect={(productId) => {
        setSelectedProducts(prev => 
          prev.includes(productId) 
            ? prev.filter(id => id !== productId)
            : [...prev, productId]
        );
      }}
      selectedProducts={selectedProducts}
    />
  </div>
)}
```

### 6. **SALVAMENTO DE DADOS**
```typescript
// ATUALIZAR handleSalvarNoSistema:
const fullReport = {
  product_fit_report: fitData, // NOVO: product_fit_report ao invés de detection_report
  decisors_report: tabDataRef.current.decisors,
  digital_report: tabDataRef.current.digital,
  competitors_report: tabDataRef.current.competitors,
  similar_companies_report: tabDataRef.current.similar,
  clients_report: tabDataRef.current.clients,
  analysis_report: tabDataRef.current.analysis,
  products_report: tabDataRef.current.products,
  opportunities_report: tabDataRef.current.opportunities,
  executive_report: tabDataRef.current.executive
};

// ATUALIZAR verificação de salvamento:
if (report.product_fit_report) {
  setVerificationSaved(true);
}
```

### 7. **LOADING DE DADOS SALVOS**
```typescript
// ATUALIZAR useEffect que carrega dados salvos:
if (report.product_fit_report) {
  tabDataRef.current.detection = report.product_fit_report;
  setVerificationSaved(true);
}

// ATUALIZAR priorização de dados:
const savedProductFitReport = (latestReport?.full_report as any)?.product_fit_report;
const freshFitData = fitData;
const data = (enabled && freshFitData) ? freshFitData : (savedProductFitReport || freshFitData);
```

---

## ✅ CHECKLIST

- [ ] Atualizar imports
- [ ] Substituir hook useUsageVerification por useProductFit
- [ ] Remover estados relacionados a TOTVS
- [ ] Simplificar handleVerify
- [ ] Atualizar renderização da aba "detection"
- [ ] Atualizar salvamento (detection_report → product_fit_report)
- [ ] Atualizar carregamento de dados salvos
- [ ] Remover componentes não utilizados
- [ ] Testar fluxo completo
- [ ] Verificar salvamento e carregamento

---

## 🚨 NOTAS IMPORTANTES

1. **Compatibilidade**: Manter compatibilidade com dados antigos (detection_report)
2. **Migração**: Criar função de migração se necessário
3. **Testes**: Testar com dados antigos e novos
4. **Performance**: Verificar performance do novo sistema
5. **UX**: Garantir que a experiência do usuário seja melhor

