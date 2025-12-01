/**
 * Catálogo de Produtos do Tenant
 * Permite cadastrar produtos manualmente ou via extração IA
 * Suporta upload de PDF, XLSX, DOCX, imagens
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Upload,
  Globe,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
  Sparkles,
  Star,
  StarOff,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Target,
  DollarSign,
  Building2,
  MapPin,
  Zap,
  Brain,
  FileUp,
  Link,
  Settings,
  Copy,
  Archive,
} from 'lucide-react';

interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  subcategoria?: string;
  codigo_interno?: string;
  preco_minimo?: number;
  preco_maximo?: number;
  ticket_medio?: number;
  cnaes_alvo?: string[];
  setores_alvo?: string[];
  portes_alvo?: string[];
  capital_social_minimo?: number;
  capital_social_maximo?: number;
  regioes_alvo?: string[];
  diferenciais?: string[];
  casos_uso?: string[];
  dores_resolvidas?: string[];
  beneficios?: string[];
  concorrentes_diretos?: string[];
  vantagens_competitivas?: string[];
  imagem_url?: string;
  ativo: boolean;
  destaque: boolean;
  extraido_de?: string;
  confianca_extracao?: number;
  created_at: string;
}

interface ProductDocument {
  id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  status: string;
  produtos_identificados: number;
  uploaded_at?: string;
  created_at?: string;
}

interface TenantProductsCatalogProps {
  websiteUrl?: string;
}

export function TenantProductsCatalog({ websiteUrl }: TenantProductsCatalogProps = {}) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  // Usar websiteUrl da prop ou do tenant como fallback
  const tenantWebsite = websiteUrl || (tenant as any)?.website;

  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal de novo produto
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<TenantProduct | null>(null);
  const [saving, setSaving] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    subcategoria: '',
    codigo_interno: '',
    preco_minimo: '',
    preco_maximo: '',
    ticket_medio: '',
    cnaes_alvo: '',
    setores_alvo: '',
    portes_alvo: [] as string[],
    capital_social_minimo: '',
    capital_social_maximo: '',
    regioes_alvo: '',
    diferenciais: '',
    casos_uso: '',
    dores_resolvidas: '',
    beneficios: '',
    concorrentes_diretos: '',
    vantagens_competitivas: '',
    ativo: true,
    destaque: false,
  });

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_products' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome', { ascending: true });

      if (error) throw error;
      setProducts((data || []) as unknown as TenantProduct[]);
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carregar documentos
  const loadDocuments = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Tentar ordenar por uploaded_at primeiro, fallback para created_at
      let query = supabase
        .from('tenant_product_documents' as any)
        .select('*')
        .eq('tenant_id', tenantId);
      
      // Tentar ordenar por uploaded_at, se falhar usa created_at
      try {
        const { data, error } = await query.order('uploaded_at', { ascending: false });
        if (!error && data) {
          setDocuments((data || []) as unknown as ProductDocument[]);
          return;
        }
      } catch {
        // Se uploaded_at não existir, usar created_at
      }
      
      // Fallback: ordenar por created_at
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        // Se ainda falhar, tentar sem ordenação
        const { data: dataNoOrder, error: errorNoOrder } = await supabase
          .from('tenant_product_documents' as any)
          .select('*')
          .eq('tenant_id', tenantId);
        
        if (errorNoOrder) throw errorNoOrder;
        setDocuments((dataNoOrder || []) as unknown as ProductDocument[]);
        return;
      }
      
      setDocuments((data || []) as unknown as ProductDocument[]);
    } catch (err: any) {
      console.error('Erro ao carregar documentos:', err);
      // Em caso de erro, tentar carregar sem ordenação
      try {
        const { data } = await supabase
          .from('tenant_product_documents' as any)
          .select('*')
          .eq('tenant_id', tenantId);
        setDocuments((data || []) as unknown as ProductDocument[]);
      } catch {
        setDocuments([]);
      }
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
    loadDocuments();
  }, [loadProducts, loadDocuments]);

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: '',
      subcategoria: '',
      codigo_interno: '',
      preco_minimo: '',
      preco_maximo: '',
      ticket_medio: '',
      cnaes_alvo: '',
      setores_alvo: '',
      portes_alvo: [],
      capital_social_minimo: '',
      capital_social_maximo: '',
      regioes_alvo: '',
      diferenciais: '',
      casos_uso: '',
      dores_resolvidas: '',
      beneficios: '',
      concorrentes_diretos: '',
      vantagens_competitivas: '',
      ativo: true,
      destaque: false,
    });
    setEditingProduct(null);
  };

  // Salvar produto
  const handleSaveProduct = async () => {
    if (!tenantId || !formData.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        tenant_id: tenantId,
        nome: formData.nome.trim(),
        descricao: formData.descricao || null,
        categoria: formData.categoria || null,
        subcategoria: formData.subcategoria || null,
        codigo_interno: formData.codigo_interno || null,
        preco_minimo: formData.preco_minimo ? parseFloat(formData.preco_minimo) : null,
        preco_maximo: formData.preco_maximo ? parseFloat(formData.preco_maximo) : null,
        ticket_medio: formData.ticket_medio ? parseFloat(formData.ticket_medio) : null,
        cnaes_alvo: formData.cnaes_alvo ? formData.cnaes_alvo.split(',').map(s => s.trim()).filter(Boolean) : null,
        setores_alvo: formData.setores_alvo ? formData.setores_alvo.split(',').map(s => s.trim()).filter(Boolean) : null,
        portes_alvo: formData.portes_alvo.length > 0 ? formData.portes_alvo : null,
        capital_social_minimo: formData.capital_social_minimo ? parseFloat(formData.capital_social_minimo) : null,
        capital_social_maximo: formData.capital_social_maximo ? parseFloat(formData.capital_social_maximo) : null,
        regioes_alvo: formData.regioes_alvo ? formData.regioes_alvo.split(',').map(s => s.trim()).filter(Boolean) : null,
        diferenciais: formData.diferenciais ? formData.diferenciais.split('\n').map(s => s.trim()).filter(Boolean) : null,
        casos_uso: formData.casos_uso ? formData.casos_uso.split('\n').map(s => s.trim()).filter(Boolean) : null,
        dores_resolvidas: formData.dores_resolvidas ? formData.dores_resolvidas.split('\n').map(s => s.trim()).filter(Boolean) : null,
        beneficios: formData.beneficios ? formData.beneficios.split('\n').map(s => s.trim()).filter(Boolean) : null,
        concorrentes_diretos: formData.concorrentes_diretos ? formData.concorrentes_diretos.split(',').map(s => s.trim()).filter(Boolean) : null,
        vantagens_competitivas: formData.vantagens_competitivas ? formData.vantagens_competitivas.split('\n').map(s => s.trim()).filter(Boolean) : null,
        ativo: formData.ativo,
        destaque: formData.destaque,
        extraido_de: 'manual',
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('tenant_products' as any)
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase
          .from('tenant_products' as any)
          .insert(productData);

        if (error) throw error;
        toast.success('Produto cadastrado!');
      }

      setShowNewProduct(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      toast.error('Erro ao salvar produto', { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !tenantId) return;

    setUploading(true);
    const uploadedFiles: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Determinar tipo
        const ext = file.name.split('.').pop()?.toLowerCase();
        let tipo_arquivo = 'other';
        if (ext === 'pdf') tipo_arquivo = 'pdf';
        else if (['xlsx', 'xls'].includes(ext || '')) tipo_arquivo = 'xlsx';
        else if (['docx', 'doc'].includes(ext || '')) tipo_arquivo = 'docx';
        else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) tipo_arquivo = 'image';
        else if (ext === 'txt') tipo_arquivo = 'txt';

        // Upload para storage
        const filePath = `${tenantId}/products/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          continue;
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Registrar no banco
        const { error: dbError } = await supabase
          .from('tenant_product_documents' as any)
          .insert({
            tenant_id: tenantId,
            nome_arquivo: file.name,
            tipo_arquivo,
            tamanho_bytes: file.size,
            url_storage: urlData.publicUrl,
            status: 'pending',
          });

        if (dbError) {
          console.error('Erro ao registrar documento:', dbError);
          continue;
        }

        uploadedFiles.push(file.name);
      }

      if (uploadedFiles.length > 0) {
        toast.success(`${uploadedFiles.length} arquivo(s) enviado(s)!`, {
          description: 'Clique em "Extrair Produtos" para processar',
        });
        loadDocuments();
      }
    } catch (err: any) {
      console.error('Erro no upload:', err);
      toast.error('Erro ao enviar arquivos');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Extrair produtos dos documentos via IA
  const handleExtractProducts = async () => {
    if (!tenantId) return;

    const pendingDocs = documents.filter(d => d.status === 'pending');
    if (pendingDocs.length === 0) {
      toast.info('Nenhum documento pendente para processar');
      return;
    }

    setExtracting(true);
    toast.info(`Processando ${pendingDocs.length} documento(s)...`);

    try {
      // Chamar Edge Function para extração
      const { data, error } = await supabase.functions.invoke('extract-products-from-documents', {
        body: {
          tenant_id: tenantId,
          document_ids: pendingDocs.map(d => d.id),
        },
      });

      if (error) throw error;

      toast.success(`${data.products_extracted || 0} produtos extraídos!`, {
        description: 'Revise os produtos na lista',
      });

      loadProducts();
      loadDocuments();
    } catch (err: any) {
      console.error('Erro na extração:', err);
      toast.error('Erro ao extrair produtos', { description: err.message });
    } finally {
      setExtracting(false);
    }
  };

  // Removido: handleScanWebsite - O botão oficial está no Step1DadosBasicos

  // Toggle destaque
  const toggleDestaque = async (product: TenantProduct) => {
    try {
      const { error } = await supabase
        .from('tenant_products' as any)
        .update({ destaque: !product.destaque })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, destaque: !p.destaque } : p
        )
      );

      toast.success(product.destaque ? 'Destaque removido' : 'Produto destacado!');
    } catch (err: any) {
      toast.error('Erro ao atualizar destaque');
    }
  };

  // Toggle ativo
  const toggleAtivo = async (product: TenantProduct) => {
    try {
      const { error } = await supabase
        .from('tenant_products' as any)
        .update({ ativo: !product.ativo })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, ativo: !p.ativo } : p
        )
      );

      toast.success(product.ativo ? 'Produto desativado' : 'Produto ativado!');
    } catch (err: any) {
      toast.error('Erro ao atualizar status');
    }
  };

  // Deletar produto
  const handleDelete = async (product: TenantProduct) => {
    if (!confirm(`Excluir "${product.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from('tenant_products' as any)
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Produto excluído');
    } catch (err: any) {
      toast.error('Erro ao excluir produto');
    }
  };

  // Editar produto
  const handleEdit = (product: TenantProduct) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      categoria: product.categoria || '',
      subcategoria: product.subcategoria || '',
      codigo_interno: product.codigo_interno || '',
      preco_minimo: product.preco_minimo?.toString() || '',
      preco_maximo: product.preco_maximo?.toString() || '',
      ticket_medio: product.ticket_medio?.toString() || '',
      cnaes_alvo: product.cnaes_alvo?.join(', ') || '',
      setores_alvo: product.setores_alvo?.join(', ') || '',
      portes_alvo: product.portes_alvo || [],
      capital_social_minimo: product.capital_social_minimo?.toString() || '',
      capital_social_maximo: product.capital_social_maximo?.toString() || '',
      regioes_alvo: product.regioes_alvo?.join(', ') || '',
      diferenciais: product.diferenciais?.join('\n') || '',
      casos_uso: product.casos_uso?.join('\n') || '',
      dores_resolvidas: product.dores_resolvidas?.join('\n') || '',
      beneficios: product.beneficios?.join('\n') || '',
      concorrentes_diretos: product.concorrentes_diretos?.join(', ') || '',
      vantagens_competitivas: product.vantagens_competitivas?.join('\n') || '',
      ativo: product.ativo,
      destaque: product.destaque,
    });
    setShowNewProduct(true);
  };

  // Filtrar produtos
  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm ||
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = filterCategory === 'all' || p.categoria === filterCategory;

    return matchSearch && matchCategory;
  });

  // Categorias únicas
  const categories = Array.from(new Set(products.map(p => p.categoria).filter(Boolean)));

  // Stats
  const stats = {
    total: products.length,
    ativos: products.filter(p => p.ativo).length,
    destaques: products.filter(p => p.destaque).length,
    docsPendentes: documents.filter(d => d.status === 'pending').length,
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos para cálculo de FIT com prospects
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => loadProducts()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          

          <Button onClick={() => setShowNewProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Destaques</p>
                <p className="text-2xl font-bold text-amber-600">{stats.destaques}</p>
              </div>
              <Star className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Docs Pendentes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.docsPendentes}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">📦 Catálogo</TabsTrigger>
          <TabsTrigger value="upload">📤 Upload & Extração</TabsTrigger>
          <TabsTrigger value="config">⚙️ Configuração FIT</TabsTrigger>
        </TabsList>

        {/* Tab: Catálogo */}
        <TabsContent value="catalog" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum produto cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Cadastre produtos manualmente ou faça upload de documentos
                  </p>
                  <Button onClick={() => setShowNewProduct(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Produto
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Ticket Médio</TableHead>
                      <TableHead>Portes Alvo</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
                      <TableRow key={product.id} className={!product.ativo ? 'opacity-50' : ''}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleDestaque(product)}
                            className={product.destaque ? 'text-amber-500' : 'text-muted-foreground'}
                          >
                            {product.destaque ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.nome}</p>
                            {product.descricao && (
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {product.descricao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.categoria ? (
                            <Badge variant="outline">{product.categoria}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(product.ticket_medio)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {product.portes_alvo?.slice(0, 2).map(p => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            {(product.portes_alvo?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(product.portes_alvo?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {product.extraido_de === 'manual' && '✏️ Manual'}
                            {product.extraido_de === 'website' && '🌐 Website'}
                            {product.extraido_de === 'upload_pdf' && '📄 PDF'}
                            {product.extraido_de === 'upload_xlsx' && '📊 Excel'}
                            {!product.extraido_de && '❓ Desconhecido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.ativo ? 'default' : 'secondary'}>
                            {product.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleAtivo(product)}>
                                {product.ativo ? (
                                  <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(product)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Upload */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Upload de Documentos
                </CardTitle>
                <CardDescription>
                  Envie PDFs, planilhas ou documentos para extração automática de produtos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                    <p className="font-medium">
                      {uploading ? 'Enviando...' : 'Clique ou arraste arquivos'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, Excel, Word, Imagens
                    </p>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleExtractProducts}
                    disabled={extracting || stats.docsPendentes === 0}
                    className="flex-1"
                  >
                    {extracting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Extrair Produtos ({stats.docsPendentes})
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Documentos Processados */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum documento enviado ainda
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.nome_arquivo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.tipo_arquivo === 'pdf' && '📄 PDF'}
                            {doc.tipo_arquivo === 'xlsx' && '📊 Excel'}
                            {doc.tipo_arquivo === 'docx' && '📝 Word'}
                            {doc.tipo_arquivo === 'image' && '🖼️ Imagem'}
                            {doc.tipo_arquivo === 'txt' && '📃 Texto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.status === 'completed' ? 'default' :
                              doc.status === 'processing' ? 'secondary' :
                              doc.status === 'error' ? 'destructive' :
                              'outline'
                            }
                          >
                            {doc.status === 'pending' && '⏳ Pendente'}
                            {doc.status === 'processing' && '🔄 Processando'}
                            {doc.status === 'completed' && '✅ Concluído'}
                            {doc.status === 'error' && '❌ Erro'}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.produtos_identificados || 0}</TableCell>
                        <TableCell>
                          {doc.uploaded_at 
                            ? new Date(doc.uploaded_at).toLocaleDateString('pt-BR')
                            : doc.created_at 
                            ? new Date(doc.created_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuração FIT */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Pesos FIT
              </CardTitle>
              <CardDescription>
                Ajuste os pesos dos critérios para cálculo do score de aderência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Configuração de pesos será implementada na próxima etapa
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Novo/Editar Produto */}
      <Dialog open={showNewProduct} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowNewProduct(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto para cálculo de FIT
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Dados Básicos</h4>
              
              <div>
                <Label>Nome do Produto *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Luvas Nitrílicas"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do produto..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: EPIs"
                  />
                </div>
                <div>
                  <Label>Subcategoria</Label>
                  <Input
                    value={formData.subcategoria}
                    onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                    placeholder="Ex: Proteção Mãos"
                  />
                </div>
              </div>

              <div>
                <Label>Código Interno</Label>
                <Input
                  value={formData.codigo_interno}
                  onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
            </div>

            {/* Preços */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Preços e Ticket</h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Preço Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.preco_minimo}
                    onChange={(e) => setFormData({ ...formData, preco_minimo: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <Label>Preço Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.preco_maximo}
                    onChange={(e) => setFormData({ ...formData, preco_maximo: e.target.value })}
                    placeholder="500.00"
                  />
                </div>
              </div>

              <div>
                <Label>Ticket Médio (R$)</Label>
                <Input
                  type="number"
                  value={formData.ticket_medio}
                  onChange={(e) => setFormData({ ...formData, ticket_medio: e.target.value })}
                  placeholder="250.00"
                />
              </div>

              <Separator />

              <h4 className="font-medium text-sm text-muted-foreground">Público-Alvo</h4>

              <div>
                <Label>Portes Alvo</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['MEI', 'ME', 'EPP', 'MEDIO', 'GRANDE'].map(porte => (
                    <Badge
                      key={porte}
                      variant={formData.portes_alvo.includes(porte) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          portes_alvo: prev.portes_alvo.includes(porte)
                            ? prev.portes_alvo.filter(p => p !== porte)
                            : [...prev.portes_alvo, porte]
                        }));
                      }}
                    >
                      {porte}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Capital Social Mín (R$)</Label>
                  <Input
                    type="number"
                    value={formData.capital_social_minimo}
                    onChange={(e) => setFormData({ ...formData, capital_social_minimo: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label>Capital Social Máx (R$)</Label>
                  <Input
                    type="number"
                    value={formData.capital_social_maximo}
                    onChange={(e) => setFormData({ ...formData, capital_social_maximo: e.target.value })}
                    placeholder="10000000"
                  />
                </div>
              </div>
            </div>

            {/* Critérios de Match */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Critérios de Match</h4>

              <div>
                <Label>CNAEs Alvo (separados por vírgula)</Label>
                <Input
                  value={formData.cnaes_alvo}
                  onChange={(e) => setFormData({ ...formData, cnaes_alvo: e.target.value })}
                  placeholder="4789-0, 4751-2, ..."
                />
              </div>

              <div>
                <Label>Setores Alvo (separados por vírgula)</Label>
                <Input
                  value={formData.setores_alvo}
                  onChange={(e) => setFormData({ ...formData, setores_alvo: e.target.value })}
                  placeholder="Indústria, Construção, ..."
                />
              </div>

              <div>
                <Label>Regiões Alvo (UFs separados por vírgula)</Label>
                <Input
                  value={formData.regioes_alvo}
                  onChange={(e) => setFormData({ ...formData, regioes_alvo: e.target.value })}
                  placeholder="SP, RJ, MG, ..."
                />
              </div>
            </div>

            {/* Argumentos de Venda */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Argumentos de Venda</h4>

              <div>
                <Label>Diferenciais (um por linha)</Label>
                <Textarea
                  value={formData.diferenciais}
                  onChange={(e) => setFormData({ ...formData, diferenciais: e.target.value })}
                  placeholder="Maior durabilidade&#10;Melhor custo-benefício&#10;..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Dores que Resolve (uma por linha)</Label>
                <Textarea
                  value={formData.dores_resolvidas}
                  onChange={(e) => setFormData({ ...formData, dores_resolvidas: e.target.value })}
                  placeholder="Alto custo de reposição&#10;Acidentes de trabalho&#10;..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Concorrentes Diretos (separados por vírgula)</Label>
                <Input
                  value={formData.concorrentes_diretos}
                  onChange={(e) => setFormData({ ...formData, concorrentes_diretos: e.target.value })}
                  placeholder="Marca A, Marca B, ..."
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label>Ativo</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.destaque}
                onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked })}
              />
              <Label>Produto Destaque (Carro-Chefe)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProduct(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProduct ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TenantProductsCatalog;

