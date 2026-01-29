/**
 * Modal de integração olv-dataenrich - Decisores Apollo / LinkedIn / Lusha.
 * Popula abas por fonte para o Dossiê Estratégico.
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, ExternalLink, Mail, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import {
  enrichSingle,
  getStatus,
  getCompany,
  getContacts,
  isDataEnrichConfigured,
  type EnrichSingleInput,
  type DataEnrichContact,
} from '@/services/dataEnrichApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface DataEnrichModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id?: string;
    name: string;
    domain?: string;
    cnpj?: string;
    trade_name?: string;
    fantasia?: string;
    city?: string;
    state?: string;
    industry?: string;
  };
  onDecisorsLoaded?: (contacts: DataEnrichContact[], bySource: { apollo: DataEnrichContact[]; linkedin: DataEnrichContact[]; lusha: DataEnrichContact[] }) => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 min

export function DataEnrichModal({ isOpen, onClose, company, onDecisorsLoaded }: DataEnrichModalProps) {
  const [status, setStatus] = useState<'idle' | 'enriching' | 'completed' | 'error'>('idle');
  const [contacts, setContacts] = useState<DataEnrichContact[]>([]);
  const [companyData, setCompanyData] = useState<Record<string, unknown> | null>(null);
  const [enrichedCompanyId, setEnrichedCompanyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apolloContacts = contacts.filter((c) => c.data_sources?.includes('apollo'));
  const linkedinContacts = contacts.filter((c) => c.data_sources?.includes('linkedin'));
  const lushaContacts = contacts.filter((c) => c.data_sources?.includes('lusha'));

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setContacts([]);
      setCompanyData(null);
      setEnrichedCompanyId(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleEnrich = async () => {
    if (!isDataEnrichConfigured()) {
      toast.error('API Key não configurada', {
        description: 'Defina VITE_DATAENRICH_API_KEY ou VITE_STRATEVO_API_KEY no ambiente.',
      });
      setStatus('error');
      setErrorMessage('API Key não configurada');
      return;
    }
    setStatus('enriching');
    setErrorMessage(null);
    try {
      const payload: EnrichSingleInput = {
        name: company.name,
        domain: company.domain,
        cnpj: company.cnpj,
        trade_name: company.trade_name ?? company.fantasia,
        city: company.city,
        state: company.state,
        country: 'Brazil',
        industry: company.industry,
      };
      if (company.id) payload.company_id = company.id;

      const enrichResult = await enrichSingle(payload);
      if (!enrichResult.success || !enrichResult.company_id) {
        setStatus('error');
        setErrorMessage(enrichResult.message ?? 'Falha ao iniciar enriquecimento');
        toast.error(enrichResult.message ?? 'Falha ao iniciar enriquecimento');
        return;
      }

      const companyId = enrichResult.company_id;
      setEnrichedCompanyId(companyId);
      toast.info('Enriquecimento iniciado. Aguardando conclusão...');

      let attempts = 0;
      let completed = false;
      while (!completed && attempts < MAX_POLL_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const statusResult = await getStatus(companyId);
        if (statusResult.status === 'completed' || statusResult.status === 'partial') {
          completed = true;
        }
        attempts++;
      }

      const [companyResult, contactsResult] = await Promise.all([
        getCompany(companyId),
        getContacts(companyId),
      ]);

      if (companyResult.company) setCompanyData(companyResult.company);
      const list = contactsResult.contacts ?? [];
      setContacts(list);
      setStatus('completed');
      const byApollo = list.filter((c) => c.data_sources?.includes('apollo'));
      const byLinkedIn = list.filter((c) => c.data_sources?.includes('linkedin'));
      const byLusha = list.filter((c) => c.data_sources?.includes('lusha'));
      onDecisorsLoaded?.(list, { apollo: byApollo, linkedin: byLinkedIn, lusha: byLusha });
      toast.success(`${list.length} contato(s) encontrado(s).`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao enriquecer';
      setStatus('error');
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center gap-4 flex-shrink-0">
            <h2 className="text-xl font-bold truncate">{company.name}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              {company.domain && (
                <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">
                  {company.domain}
                </span>
              )}
              <Button
                onClick={handleEnrich}
                disabled={status === 'enriching'}
                className="gap-2"
              >
                {status === 'enriching' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extraindo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extrair Decisores
                  </>
                )}
              </Button>
            </div>
          </div>

          {errorMessage && (
            <Card className="p-3 bg-destructive/10 text-destructive text-sm">
              {errorMessage}
            </Card>
          )}

          {status === 'completed' && (
            <Tabs defaultValue="apollo" className="flex-1 overflow-hidden flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="apollo">
                  Decisores Apollo ({apolloContacts.length})
                </TabsTrigger>
                <TabsTrigger value="linkedin">
                  Decisores LinkedIn ({linkedinContacts.length})
                </TabsTrigger>
                <TabsTrigger value="lusha">
                  Decisores Lusha ({lushaContacts.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="apollo" className="mt-4 flex-1 overflow-auto min-h-0">
                <ContactsTable contacts={apolloContacts} source="apollo" />
              </TabsContent>
              <TabsContent value="linkedin" className="mt-4 flex-1 overflow-auto min-h-0">
                <ContactsTable contacts={linkedinContacts} source="linkedin" />
              </TabsContent>
              <TabsContent value="lusha" className="mt-4 flex-1 overflow-auto min-h-0">
                <ContactsTable contacts={lushaContacts} source="lusha" />
              </TabsContent>
            </Tabs>
          )}

          {status === 'idle' && (
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Extrair Decisores&quot; para buscar contatos na API olv-dataenrich (Apollo, LinkedIn, Lusha).
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactsTable({
  contacts,
  source,
}: {
  contacts: DataEnrichContact[];
  source: string;
}) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nenhum contato encontrado para a fonte {source}.
      </p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>LinkedIn</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {contact.full_name}
                {contact.confidence_score != null && (
                  <Badge variant="secondary" className="text-xs">
                    {(contact.confidence_score * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                {contact.job_title ?? '—'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {contact.email ? (
                  <>
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {contact.email}
                    {contact.email_verified && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        Verificado
                      </Badge>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {contact.phone ?? contact.mobile_phone ? (
                  <>
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {contact.phone ?? contact.mobile_phone}
                  </>
                ) : (
                  '—'
                )}
              </div>
            </TableCell>
            <TableCell>
              {contact.linkedin_url ? (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Perfil
                </a>
              ) : (
                '—'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
