// src/features/linkedin/components/LinkedInImportLeads.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLinkedInLeads } from "../hooks/useLinkedInLeads";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";
import { isValidLinkedInSearchUrl } from "../utils/linkedinValidation";

interface LinkedInImportLeadsProps {
  accountId: string;
  campaignId?: string;
}

export function LinkedInImportLeads({ accountId, campaignId }: LinkedInImportLeadsProps) {
  const { account } = useLinkedInAccount();
  const { import: importLeads, isImporting } = useLinkedInLeads(campaignId);
  const [searchUrl, setSearchUrl] = useState("");
  const [maxResults, setMaxResults] = useState(100);

  const handleImport = () => {
    if (!searchUrl.trim()) {
      return;
    }

    if (!isValidLinkedInSearchUrl(searchUrl)) {
      return;
    }

    importLeads({
      linkedin_account_id: accountId,
      search_url: searchUrl,
      campaign_id: campaignId,
      max_results: Math.min(maxResults, 100),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Importar Leads do LinkedIn
        </CardTitle>
        <CardDescription>
          Cole uma URL de busca do LinkedIn para importar leads automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Use uma URL de busca do LinkedIn Sales Navigator ou LinkedIn regular.
            Exemplo: https://www.linkedin.com/search/results/people/?keywords=...
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="search-url">URL de Busca do LinkedIn *</Label>
          <Input
            id="search-url"
            type="url"
            placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
            value={searchUrl}
            onChange={(e) => setSearchUrl(e.target.value)}
            disabled={isImporting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-results">Máximo de Leads (1-100)</Label>
          <Input
            id="max-results"
            type="number"
            min={1}
            max={100}
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
            disabled={isImporting}
          />
        </div>

        <Button
          onClick={handleImport}
          disabled={!searchUrl || !isValidLinkedInSearchUrl(searchUrl) || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Importar Leads
            </>
          )}
        </Button>

        {account && (
          <div className="text-sm text-muted-foreground">
            <p>Conta: {account.linkedin_name}</p>
            <p>Última atividade: {account.last_activity_at 
              ? new Date(account.last_activity_at).toLocaleString('pt-BR')
              : 'Nunca'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

