// src/modules/crm/pages/Customization.tsx
// Página de customização (Custom Fields e Views)

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Eye } from "lucide-react";
import { CustomFieldsManager } from "../components/custom/CustomFieldsManager";
import { CustomViewsManager } from "../components/custom/CustomViewsManager";

export default function Customization() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customização</h1>
        <p className="text-muted-foreground">
          Crie campos e visualizações personalizados para seu CRM
        </p>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Campos Customizados
          </TabsTrigger>
          <TabsTrigger value="views" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualizações Customizadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-6">
          <CustomFieldsManager />
        </TabsContent>

        <TabsContent value="views" className="mt-6">
          <CustomViewsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

