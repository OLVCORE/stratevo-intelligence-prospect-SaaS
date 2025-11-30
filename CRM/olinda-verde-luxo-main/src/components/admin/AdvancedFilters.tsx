import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  statusOptions?: { value: string; label: string }[];
  typeOptions?: { value: string; label: string }[];
  sourceOptions?: { value: string; label: string }[];
  showStatusFilter?: boolean;
  showTypeFilter?: boolean;
  showSourceFilter?: boolean;
  showDateRange?: boolean;
  showScoreFilter?: boolean;
  showPriorityFilter?: boolean;
}

export interface FilterState {
  search: string;
  status: string[];
  eventType: string[];
  source: string[];
  dateRange?: DateRange;
  scoreRange?: { min: number; max: number };
  priority?: string[];
}

export const AdvancedFilters = ({
  onFilterChange,
  statusOptions = [],
  typeOptions = [],
  sourceOptions = [],
  showStatusFilter = true,
  showTypeFilter = true,
  showSourceFilter = true,
  showDateRange = true,
  showScoreFilter = true,
  showPriorityFilter = true,
}: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    eventType: [],
    source: [],
    dateRange: undefined,
    scoreRange: undefined,
    priority: [],
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleArrayFilter = (key: 'status' | 'eventType' | 'source' | 'priority', value: string) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateFilters(key, newArray);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      search: "",
      status: [],
      eventType: [],
      source: [],
      dateRange: undefined,
      scoreRange: undefined,
      priority: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFiltersCount =
    filters.status.length +
    filters.eventType.length +
    filters.source.length +
    (filters.priority?.length || 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.scoreRange ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={filters.search}
                onChange={(e) => updateFilters("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={isExpanded ? "default" : "outline"}
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="icon" onClick={clearAllFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {isExpanded && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 border-t">
              {/* Date Range */}
              {showDateRange && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                              {format(filters.dateRange.to, "dd/MM", { locale: ptBR })}
                            </>
                          ) : (
                            format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                          )
                        ) : (
                          "Selecionar período"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={filters.dateRange}
                        onSelect={(range) => updateFilters("dateRange", range)}
                        locale={ptBR}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Status Filter */}
              {showStatusFilter && statusOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={filters.status.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("status", option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Type Filter */}
              {showTypeFilter && typeOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Evento</label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={filters.eventType.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("eventType", option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Filter */}
              {showSourceFilter && sourceOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origem</label>
                  <div className="flex flex-wrap gap-2">
                    {sourceOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={filters.source.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("source", option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Filter */}
              {showPriorityFilter && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridade</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "urgent", label: "Urgente" },
                      { value: "high", label: "Alta" },
                      { value: "medium", label: "Média" },
                      { value: "low", label: "Baixa" },
                    ].map((option) => (
                      <Badge
                        key={option.value}
                        variant={filters.priority?.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("priority", option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Range Filter */}
              {showScoreFilter && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Score (Pontuação)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { min: 0, max: 30, label: "Baixo (0-30)" },
                      { min: 31, max: 60, label: "Médio (31-60)" },
                      { min: 61, max: 90, label: "Alto (61-90)" },
                      { min: 91, max: 200, label: "Muito Alto (91+)" },
                    ].map((range) => (
                      <Badge
                        key={`${range.min}-${range.max}`}
                        variant={
                          filters.scoreRange?.min === range.min && filters.scoreRange?.max === range.max
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() =>
                          updateFilters(
                            "scoreRange",
                            filters.scoreRange?.min === range.min && filters.scoreRange?.max === range.max
                              ? undefined
                              : range
                          )
                        }
                      >
                        {range.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
