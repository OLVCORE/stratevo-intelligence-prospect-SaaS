import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ColumnFilterProps {
  column: string;
  title: string;
  values: (string | null)[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  onSort?: () => void;
}

export function ColumnFilter({
  column,
  title,
  values,
  selectedValues,
  onFilterChange,
  onSort,
}: ColumnFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  // Valores únicos (sem duplicatas e sem null/undefined)
  const uniqueValues = Array.from(new Set(
    values.filter((v) => v !== null && v !== undefined && v !== '')
  )).sort();

  // Filtrar valores com base no termo de busca
  const filteredValues = uniqueValues.filter((value) =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(selectedValues.filter((v) => v !== value));
    } else {
      onFilterChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === uniqueValues.length) {
      onFilterChange([]);
    } else {
      onFilterChange([...uniqueValues]);
    }
  };

  const handleClear = () => {
    onFilterChange([]);
    setOpen(false);
  };

  const hasFilters = selectedValues.length > 0;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex items-center gap-1 relative"
          >
            {title}
            <Filter className={`h-3 w-3 ${hasFilters ? 'text-primary' : ''}`} />
            {hasFilters && (
              <Badge
                variant="secondary"
                className="ml-1 px-1 h-4 text-[10px] leading-none"
              >
                {selectedValues.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="p-2 border-b flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              {selectedValues.length === uniqueValues.length
                ? 'Desmarcar Todos'
                : 'Selecionar Todos'}
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredValues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum valor encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {filteredValues.map((value) => (
                  <div
                    key={value}
                    className="flex items-center space-x-2 hover:bg-accent p-1 rounded cursor-pointer"
                    onClick={() => handleToggle(value)}
                  >
                    <Checkbox
                      id={`${column}-${value}`}
                      checked={selectedValues.includes(value)}
                      onCheckedChange={() => handleToggle(value)}
                    />
                    <label
                      htmlFor={`${column}-${value}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {value || '(Vazio)'}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {onSort && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSort}
          className="h-8 w-8 p-0"
        >
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

