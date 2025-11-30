import { AdminLayout } from "@/components/admin/AdminLayout";
import { AppointmentsTable } from "@/components/admin/AppointmentsTable";
import { CalendarView } from "@/components/admin/CalendarView";
import { AppointmentsExport } from "@/components/admin/AppointmentsExport";
import { AppointmentTypeSelector } from "@/components/admin/AppointmentTypeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Appointments = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Agendamentos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie visitas agendadas, calendário e importação em massa
            </p>
          </div>
          <AppointmentTypeSelector />
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="import">Importar/Exportar</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos de Visitas</CardTitle>
                <CardDescription>
                  Lista completa de todas as visitas agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <AppointmentsExport />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Appointments;
