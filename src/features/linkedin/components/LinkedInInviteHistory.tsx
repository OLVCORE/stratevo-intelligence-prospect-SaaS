// src/features/linkedin/components/LinkedInInviteHistory.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLinkedInInvites } from "../hooks/useLinkedInInvites";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

interface LinkedInInviteHistoryProps {
  accountId: string;
}

export function LinkedInInviteHistory({ accountId }: LinkedInInviteHistoryProps) {
  const { sentLeads, isLoading } = useLinkedInInvites(accountId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'accepted': return 'Aceito';
      case 'declined': return 'Recusado';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Convites</CardTitle>
        <CardDescription>
          Acompanhe todos os convites enviados e seus status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : sentLeads && sentLeads.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Aceito em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell>{lead.job_title || lead.headline || '-'}</TableCell>
                  <TableCell>{lead.company_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.invite_status)}>
                      {getStatusLabel(lead.invite_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.invite_sent_at 
                      ? format(new Date(lead.invite_sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {lead.invite_accepted_at 
                      ? format(new Date(lead.invite_accepted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.linkedin_profile_url && (
                      <a
                        href={lead.linkedin_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum convite enviado ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

