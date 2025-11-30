// src/modules/crm/components/smart-cadences/PersonalizationEngine.tsx
// Engine de personalização de mensagens

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User, Building2, Target } from "lucide-react";

export function PersonalizationEngine() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Engine de Personalização
        </CardTitle>
        <CardDescription>
          Configure como as mensagens serão personalizadas automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="personalization-enabled">Personalização Ativada</Label>
            <p className="text-sm text-muted-foreground">
              Personaliza mensagens baseado no perfil do lead
            </p>
          </div>
          <Switch id="personalization-enabled" defaultChecked />
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Variáveis de Personalização</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome do Contato</p>
                <p className="text-xs text-muted-foreground">{"{{contact_name}}"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome da Empresa</p>
                <p className="text-xs text-muted-foreground">{"{{company_name}}"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Indústria</p>
                <p className="text-xs text-muted-foreground">{"{{industry}}"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Insight IA</p>
                <p className="text-xs text-muted-foreground">{"{{ai_insight}}"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Exemplo de Personalização</h4>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Template original:</p>
            <p className="p-2 bg-background rounded border">
              "Olá, gostaria de apresentar nossa solução..."
            </p>
            <p className="text-muted-foreground mt-4">Personalizado:</p>
            <p className="p-2 bg-background rounded border">
              "Olá João, vi que a Empresa XYZ está expandindo na área de tecnologia.
              Nossa solução pode ajudar empresas como a sua a..."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

