import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { LeadsPipeline } from "@/components/admin/LeadsPipeline";
import { DuplicateLeadsManager } from "@/components/admin/DuplicateLeadsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Table, Copy } from "lucide-react";

const Leads = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os leads e oportunidades de negócio
          </p>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <LeadsPipeline />
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Leads</CardTitle>
                <CardDescription>
                  Visualize todos os leads em formato de tabela
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="duplicates">
            <DuplicateLeadsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Leads;
