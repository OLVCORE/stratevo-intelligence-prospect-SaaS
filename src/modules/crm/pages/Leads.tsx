// src/modules/crm/pages/Leads.tsx
// Página de gerenciamento de leads

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Filter } from "lucide-react";
import { AIVoiceSDR } from "@/modules/crm/components/ai-voice/AIVoiceSDR";
import { RecoverOrphanLeadsButton } from "@/modules/crm/components/leads/RecoverOrphanLeadsButton";

export default function Leads() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e oportunidades
          </p>
        </div>
        <div className="flex gap-2">
          {/* 🔵 Botão Sincronizar Leads (Sistema Anti-Perda) */}
          <RecoverOrphanLeadsButton variant="default" />
          
          {/* 🟠 Botão Filtro */}
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtro
          </Button>
          
          <Button variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            IA Voice Call
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Componente de tabela de leads será implementado aqui
          </p>
        </CardContent>
      </Card>

      {/* AI Voice SDR Integration */}
      <AIVoiceSDR />
    </div>
  );
}

