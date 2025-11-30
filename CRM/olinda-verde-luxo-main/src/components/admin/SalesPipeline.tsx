import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface PipelineStage {
  name: string;
  status: string[];
  color: string;
  count: number;
  percentage: number;
}

export const SalesPipeline = () => {
  const [stages, setStages] = useState<PipelineStage[]>([
    { name: "Novo Lead", status: ["new"], color: "bg-blue-500", count: 0, percentage: 0 },
    { name: "Qualificado", status: ["contacted", "qualified"], color: "bg-yellow-500", count: 0, percentage: 0 },
    { name: "Visita Agendada", status: ["scheduled", "confirmed"], color: "bg-purple-500", count: 0, percentage: 0 },
    { name: "Proposta Enviada", status: ["qualified"], color: "bg-orange-500", count: 0, percentage: 0 },
    { name: "Fechado", status: ["converted", "completed"], color: "bg-green-500", count: 0, percentage: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      // Fetch leads
      const { data: leads } = await supabase
        .from("leads")
        .select("status");

      // Fetch appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("status");

      const totalItems = (leads?.length || 0) + (appointments?.length || 0);

      // Calculate counts for each stage
      const updatedStages = stages.map((stage) => {
        let count = 0;

        // Count leads in this stage
        if (stage.name === "Novo Lead") {
          count = leads?.filter((l) => l.status === "new").length || 0;
        } else if (stage.name === "Qualificado") {
          count = leads?.filter((l) => ["contacted", "qualified"].includes(l.status)).length || 0;
        } else if (stage.name === "Visita Agendada") {
          count = appointments?.filter((a) => ["scheduled", "confirmed"].includes(a.status)).length || 0;
        } else if (stage.name === "Proposta Enviada") {
          // This would come from a proposals table in the future
          count = 0;
        } else if (stage.name === "Fechado") {
          count = (leads?.filter((l) => l.status === "converted").length || 0) +
                  (appointments?.filter((a) => a.status === "completed").length || 0);
        }

        return {
          ...stage,
          count,
          percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
        };
      });

      setStages(updatedStages);
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 items-start">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex-1 group">
              {/* Stage Card */}
              <div className="relative bg-muted/30 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>

                {/* Stage Content */}
                <div className="pt-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {stage.name}
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {stage.count}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stage.percentage}% do total
                  </Badge>
                </div>

                {/* Indicator Dot */}
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${stage.color} border-4 border-background`} />
              </div>

              {/* Arrow */}
              {idx < stages.length - 1 && (
                <div className="flex justify-center items-center h-8">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-4 bg-muted/20 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total no Funil</div>
              <div className="text-2xl font-bold">
                {stages.reduce((acc, stage) => acc + stage.count, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-green-600">
                {stages.length > 0 && stages[0].count > 0
                  ? Math.round((stages[stages.length - 1].count / stages[0].count) * 100)
                  : 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Em Negociação</div>
              <div className="text-2xl font-bold text-orange-600">
                {stages[3]?.count || 0}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
