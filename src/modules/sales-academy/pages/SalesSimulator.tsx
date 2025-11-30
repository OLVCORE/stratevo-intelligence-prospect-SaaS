// src/modules/sales-academy/pages/SalesSimulator.tsx
// Simulador de vendas com IA

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Play, MessageSquare, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalesSimulator() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [conversation, setConversation] = useState<any[]>([]);

  // Criar nova simulação
  const createSimulation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !tenant?.id) throw new Error("Dados incompletos");
      if (!scenario.trim()) throw new Error("Selecione um cenário");

      const { data, error } = await supabase
        .from("sales_simulations")
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          scenario_name: scenario,
          scenario_type: scenario.toLowerCase().replace(" ", "_"),
          total_steps: 5,
          status: "in_progress",
          simulation_data: {
            conversation: [],
            steps: [],
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentStep(1);
      setConversation([
        {
          type: "ai",
          message: "Olá! Como posso ajudá-lo hoje?",
          timestamp: new Date(),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["sales-simulations"] });
      toast({
        title: "Simulação iniciada!",
        description: "Comece a conversa.",
      });
    },
  });

  const sendResponse = () => {
    if (!userResponse.trim()) return;

    const newConversation = [
      ...conversation,
      {
        type: "user",
        message: userResponse,
        timestamp: new Date(),
      },
      {
        type: "ai",
        message: "Resposta simulada da IA...",
        timestamp: new Date(),
      },
    ];

    setConversation(newConversation);
    setUserResponse("");
    setCurrentStep(currentStep + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Simulador de Vendas</h1>
        <p className="text-muted-foreground">
          Pratique suas habilidades de vendas em cenários realistas
        </p>
      </div>

      {conversation.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Simulação</CardTitle>
            <CardDescription>
              Escolha um cenário para praticar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Objeção de Preço",
                "Descoberta de Necessidades",
                "Fechamento de Negócio",
                "Follow-up Após Apresentação",
              ].map((scen) => (
                <Button
                  key={scen}
                  variant={scenario === scen ? "default" : "outline"}
                  onClick={() => setScenario(scen)}
                  className="h-auto p-4 flex flex-col items-start"
                >
                  <span className="font-semibold">{scen}</span>
                </Button>
              ))}
            </div>

            <Button
              onClick={() => createSimulation.mutate()}
              disabled={createSimulation.isPending || !scenario}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {createSimulation.isPending ? "Iniciando..." : "Iniciar Simulação"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{scenario}</CardTitle>
                  <CardDescription>
                    Passo {currentStep} de 5
                  </CardDescription>
                </div>
                <Badge variant="outline">Em Progresso</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conversa */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {conversation.map((msg: any, index: number) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.type === "ai" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    {msg.type === "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input de Resposta */}
              <div className="flex gap-2">
                <Input
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendResponse()}
                  placeholder="Digite sua resposta..."
                />
                <Button onClick={sendResponse}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

