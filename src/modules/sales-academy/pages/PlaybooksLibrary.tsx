// src/modules/sales-academy/pages/PlaybooksLibrary.tsx
// Biblioteca de playbooks de vendas

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { BookOpen, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlaybooksLibrary() {
  const { tenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Buscar playbooks
  const { data: playbooks, isLoading } = useQuery({
    queryKey: ["sales-playbooks", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("sales_playbooks")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const filteredPlaybooks = playbooks?.filter((playbook: any) => {
    const matchesSearch = playbook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         playbook.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || playbook.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(playbooks?.map((p: any) => p.category).filter(Boolean) || []));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Biblioteca de Playbooks</h1>
        <p className="text-muted-foreground">
          Playbooks testados e aprovados para diferentes cenários de vendas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar playbooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Playbooks */}
      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : filteredPlaybooks && filteredPlaybooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaybooks.map((playbook: any) => (
            <Card key={playbook.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{playbook.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {playbook.description}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playbook.category && (
                    <Badge variant="outline" className="capitalize">
                      {playbook.category}
                    </Badge>
                  )}
                  
                  {playbook.scenario && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Cenário:</p>
                      <p className="text-sm">{playbook.scenario}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{playbook.usage_count || 0} usos</span>
                    {playbook.success_rate > 0 && (
                      <span>Taxa de sucesso: {playbook.success_rate}%</span>
                    )}
                  </div>

                  {playbook.tags && playbook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {playbook.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum playbook encontrado.
        </div>
      )}
    </div>
  );
}

