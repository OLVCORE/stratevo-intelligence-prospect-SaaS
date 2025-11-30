import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { useState } from "react";
import { EmailTemplatesList } from "@/components/admin/EmailTemplatesList";
import { CreateEmailTemplateDialog } from "@/components/admin/CreateEmailTemplateDialog";
import { EmailMetricsDashboard } from "@/components/admin/EmailMetricsDashboard";

const EmailTemplates = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Email Tracking & Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas de email e templates com variáveis dinâmicas
            </p>
          </div>
        </div>

        <EmailMetricsDashboard />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Templates Disponíveis</CardTitle>
              <CardDescription className="mt-2">
                Use variáveis como {'{{nome}}'}, {'{{email}}'}, {'{{data}}'}, {'{{evento}}'}, {'{{telefone}}'} nos seus templates
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </CardHeader>
          <CardContent>
            <EmailTemplatesList />
          </CardContent>
        </Card>

        <CreateEmailTemplateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
};

export default EmailTemplates;
