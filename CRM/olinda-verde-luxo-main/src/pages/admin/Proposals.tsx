import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProposalsTable } from "@/components/admin/ProposalsTable";
import { CreateProposal } from "@/components/admin/CreateProposal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Proposals = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Propostas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie propostas comerciais e contratos
            </p>
          </div>
          <CreateProposal onProposalCreated={() => window.location.reload()} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Propostas Comerciais</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as propostas enviadas aos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProposalsTable />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Proposals;
