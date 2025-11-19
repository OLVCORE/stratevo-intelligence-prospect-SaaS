/**
 * 🔍 FILTROS AVANÇADOS COM PRESETS E ORDENAÇÃO
 * 
 * Filtros avançados com presets salvos, filtro por data, ordenação customizável
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Save, Trash2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    sources: string[];
    products: string[];
    searchText: string;
    dateFrom?: Date;
    dateTo?: Date;
    sortBy: 'date' | 'relevance' | 'score' | 'source';
    sortOrder: 'asc' | 'desc';
  };
}

interface AdvancedFiltersProps {
  evidences: any[];
  selectedSources: string[];
  selectedProducts: string[];
  searchText: string;
  onSourcesChange: (sources: string[]) => void;
  onProductsChange: (products: string[]) => void;
  onSearchChange: (text: string) => void;
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
}

export function AdvancedFilters({
  evidences,
  selectedSources,
  selectedProducts,
  searchText,
  onSourcesChange,
  onProductsChange,
  onSearchChange,
  onDateRangeChange,
  onSortChange,
  currentSortBy = 'relevance',
  currentSortOrder = 'desc',
  dateFrom,
  dateTo,
  userId,
}: AdvancedFiltersProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Carregar presets salvos
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const { data } = await supabase
          .from('filter_presets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (data) {
          setPresets(data.map(p => ({
            id: p.id,
            name: p.name,
            filters: p.filters,
          })));
        }
      } catch (error) {
        console.error('[FILTERS] Erro ao carregar presets:', error);
      }
    })();
  }, [userId]);

  // Coletar fontes e produtos disponíveis
  const availableSources = Array.from(new Set(
    evidences.map((e: any) => e.source_name || e.source).filter(Boolean)
  )).sort();

  const availableProducts = Array.from(new Set(
    evidences.flatMap((e: any) => e.detected_products || []).filter(Boolean)
  )).sort();

  // Salvar preset
  const savePreset = async () => {
    if (!presetName.trim() || !userId) return;

    try {
      const preset: FilterPreset = {
        id: '',
        name: presetName,
        filters: {
          sources: selectedSources,
          products: selectedProducts,
          searchText,
          dateFrom,
          dateTo,
          sortBy: currentSortBy as any,
          sortOrder: currentSortOrder,
        },
      };

      const { data, error } = await supabase
        .from('filter_presets')
        .insert({
          user_id: userId,
          name: presetName,
          filters: preset.filters,
        })
        .select()
        .single();

      if (error) throw error;

      setPresets(prev => [{ ...preset, id: data.id }, ...prev]);
      setPresetName('');
      setShowPresetDialog(false);
    } catch (error: any) {
      console.error('[FILTERS] Erro ao salvar preset:', error);
    }
  };

  // Aplicar preset
  const applyPreset = (preset: FilterPreset) => {
    onSourcesChange(preset.filters.sources);
    onProductsChange(preset.filters.products);
    onSearchChange(preset.filters.searchText);
    onDateRangeChange(preset.filters.dateFrom, preset.filters.dateTo);
    onSortChange(preset.filters.sortBy, preset.filters.sortOrder);
  };

  // Deletar preset
  const deletePreset = async (presetId: string) => {
    try {
      await supabase
        .from('filter_presets')
        .delete()
        .eq('id', presetId);

      setPresets(prev => prev.filter(p => p.id !== presetId));
    } catch (error: any) {
      console.error('[FILTERS] Erro ao deletar preset:', error);
    }
  };

  return (
    <Card className="p-4 bg-muted/50">
      <div className="space-y-4">
        {/* Busca Textual */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Buscar nas evidências</Label>
          <Input
            placeholder="Digite para buscar em títulos, conteúdo, URLs..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filtro por Data */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Filtrar por Data</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP', { locale: ptBR }) : 'Data inicial'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => onDateRangeChange(date, dateTo)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP', { locale: ptBR }) : 'Data final'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => onDateRangeChange(dateFrom, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateRangeChange(undefined, undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Ordenação */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Ordenar por</Label>
          <div className="flex gap-2">
            <Select value={currentSortBy} onValueChange={(value) => onSortChange(value, currentSortOrder)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="source">Fonte</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSortChange(currentSortBy, currentSortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtro por Fonte */}
        {availableSources.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Filtrar por Fonte</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableSources.map((source) => (
                <Badge
                  key={source}
                  variant={selectedSources.includes(source) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    onSourcesChange(
                      selectedSources.includes(source)
                        ? selectedSources.filter(s => s !== source)
                        : [...selectedSources, source]
                    );
                  }}
                >
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filtro por Produto */}
        {availableProducts.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Filtrar por Produto Detectado</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableProducts.map((product) => (
                <Badge
                  key={product}
                  variant={selectedProducts.includes(product) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    onProductsChange(
                      selectedProducts.includes(product)
                        ? selectedProducts.filter(p => p !== product)
                        : [...selectedProducts, product]
                    );
                  }}
                >
                  {product}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        {presets.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Presets Salvos</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Badge
                  key={preset.id}
                  variant="secondary"
                  className="cursor-pointer flex items-center gap-1"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Salvar Preset */}
        {userId && (
          <div>
            {showPresetDialog ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do preset"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={savePreset}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowPresetDialog(false);
                    setPresetName('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowPresetDialog(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Filtros como Preset
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

