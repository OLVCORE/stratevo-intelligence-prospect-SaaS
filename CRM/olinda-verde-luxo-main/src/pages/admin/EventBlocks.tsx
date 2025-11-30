import { AdminLayout } from "@/components/admin/AdminLayout";
import { EventBlocksManager } from "@/components/admin/EventBlocksManager";
import { EventBlocksImport } from "@/components/admin/EventBlocksImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EventBlocks = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bloqueios de Calendário</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie datas bloqueadas e importe/exporte em massa
          </p>
        </div>

        <Tabs defaultValue="manager" className="w-full">
          <TabsList>
            <TabsTrigger value="manager">Gerenciar Bloqueios</TabsTrigger>
            <TabsTrigger value="import">Importação em Massa</TabsTrigger>
          </TabsList>

          <TabsContent value="manager" className="mt-6">
            <EventBlocksManager />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <EventBlocksImport />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EventBlocks;
