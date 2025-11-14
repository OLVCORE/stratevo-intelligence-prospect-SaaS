import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Building2, MapPin, Users, Globe, Mail, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import apolloIcon from "@/assets/logos/apollo-icon.ico";

interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  primary_domain?: string;
  city?: string;
  state?: string;
  country?: string;
  estimated_num_employees?: number;
  employee_range?: string;
  industry?: string;
  linkedin_url?: string;
  match_score?: number;
}

interface DecisionMakerSearchDialogProps {
  companyId: string;
  companyName: string;
  companyDomain?: string;
  apolloOrganizationId?: string;
  city?: string;
  country?: string;
  onPeopleFound?: (people: any[]) => void;
  trigger?: React.ReactNode;
}

export function DecisionMakerSearchDialog({
  companyId,
  companyName,
  companyDomain,
  apolloOrganizationId,
  city,
  country,
  onPeopleFound,
  trigger
}: DecisionMakerSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [searchName, setSearchName] = useState(companyName);
  const [results, setResults] = useState<ApolloOrganization[]>([]);
  const [apolloUrl, setApolloUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<ApolloOrganization | null>(null);

  // 🔍 BUSCAR ORGANIZAÇÕES NO APOLLO
  const handleSearch = async () => {
    if (!searchName.trim()) {
      toast.error("Digite um nome para buscar");
      return;
    }

    setSearching(true);
    setResults([]);
    setShowUrlInput(false);
    
    try {
      console.log('[DecisionMakerSearch] 🔍 Buscando organizações no Apollo:', searchName);

      // Usar edge function enrich-apollo para buscar organizações
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          type: 'search_organizations',
          name: searchName.trim(),
          domain: companyDomain
        }
      });

      if (error) throw error;

      if (data?.organizations && data.organizations.length > 0) {
        setResults(data.organizations);
        setShowUrlInput(false);
        toast.success(`✅ ${data.organizations.length} organização(ões) encontrada(s)!`);
      } else {
        setResults([]);
        setShowUrlInput(true);
        
        // ABRIR APOLLO AUTOMATICAMENTE para busca manual
        toast.info("Nenhuma empresa encontrada. Abrindo Apollo para busca manual...");
        
        setTimeout(() => {
          const apolloSearchUrl = `https://app.apollo.io/#/organizations?q=${encodeURIComponent(searchName.trim())}`;
          window.open(apolloSearchUrl, '_blank');
        }, 500);
      }
    } catch (error: any) {
      console.error('[DecisionMakerSearch] ❌ Erro ao buscar no Apollo:', error);
      toast.error("Erro ao buscar no Apollo");
      setShowUrlInput(true);
    } finally {
      setSearching(false);
    }
  };

  // 🔗 BUSCAR POR URL DO APOLLO
  const handleSearchByUrl = async () => {
    if (!apolloUrl.trim()) {
      toast.error("Cole a URL do Apollo");
      return;
    }

    // Extrair org ID da URL
    const urlPattern = /organizations?\/([a-f0-9]+)/i;
    const match = apolloUrl.match(urlPattern);
    
    if (!match) {
      toast.error("URL inválida do Apollo");
      return;
    }

    const orgId = match[1];
    setSearching(true);

    try {
      // Buscar organização diretamente na API Apollo e depois enriquecer
      // Extrair ID da URL e usar para enriquecer
      setSelectedOrg({ id: orgId, name: companyName } as ApolloOrganization);
      await handleEnrich({ id: orgId, name: companyName } as ApolloOrganization);
    } catch (error: any) {
      console.error('[DecisionMakerSearch] ❌ Erro ao buscar por URL:', error);
      toast.error("Erro ao buscar empresa no Apollo");
    } finally {
      setSearching(false);
    }
  };

  // ✅ ENRIQUECER EMPRESA COM APOLLO (CICLO 3 - BUSCA DECISORES AUTOMATICAMENTE)
  const handleEnrich = async (org: ApolloOrganization) => {
    setEnriching(true);
    try {
      console.log('[DecisionMakerSearch] ✅ Enriquecendo empresa com Apollo:', org.id);

      // Chamar edge function para enriquecer COMPLETO (busca decisores automaticamente)
      const { data, error } = await supabase.functions.invoke('enrich-apollo', {
        body: {
          organization_id: org.id,
          company_id: companyId,
          modes: ['company', 'people'], // Buscar empresa + decisores
          force: false
        }
      });

      if (error) throw error;

      const decisorsCount = data?.peopleUpserted || data?.peopleFound || data?.peopleLinked || 0;
      const fieldsCount = data?.companyFieldsCount || data?.companyFields?.length || 0;

      toast.success(`✅ Empresa enriquecida com Apollo!`, {
        description: `${decisorsCount} decisores encontrados · ${fieldsCount} campos atualizados`
      });

      // Notificar parent para atualizar lista
      if (onPeopleFound && decisorsCount > 0) {
        onPeopleFound([]); // Vazio, pois os dados já foram salvos no banco
      }

      // Fechar dialog e recarregar página para mostrar decisores
      setOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('[DecisionMakerSearch] ❌ Erro ao enriquecer:', error);
      toast.error(`Erro ao enriquecer: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setEnriching(false);
    }
  };

  const handleSelectOrg = (org: ApolloOrganization) => {
    setSelectedOrg(org);
    handleEnrich(org);
  };

  // Se já tem apolloOrganizationId, enriquecer diretamente ao abrir
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && apolloOrganizationId && !selectedOrg) {
      // Já tem Organization ID, pode enriquecer direto
      setSelectedOrg({ id: apolloOrganizationId, name: companyName } as ApolloOrganization);
      handleEnrich({ id: apolloOrganizationId, name: companyName } as ApolloOrganization);
    }
    // Não controlar open state aqui, deixar Dialog controlar
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      handleOpenChange(isOpen);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Buscar Decisores no Apollo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={apolloIcon} alt="Apollo" className="h-5 w-5" />
            Buscar Decisores no Apollo
          </DialogTitle>
          <DialogDescription>
            Busque a organização no Apollo.io. Os decisores serão buscados automaticamente após selecionar a organização.
          </DialogDescription>
        </DialogHeader>

        {(enriching) ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Enriquecendo empresa e buscando decisores...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search-name">Nome da Empresa</Label>
                <Input
                  id="search-name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Digite o nome da empresa..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} disabled={searching || !searchName.trim()}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Link direto para Apollo (se tiver Organization ID) */}
            {apolloOrganizationId && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      ✅ Organização já encontrada no Apollo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Organization ID: {apolloOrganizationId}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://app.apollo.io/#/organizations/${apolloOrganizationId}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir Apollo
                  </Button>
                </div>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organizações Encontradas ({results.length})
                </h4>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {results.map((org) => (
                      <Card key={org.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <h3 className="font-semibold">{org.name}</h3>
                                  {org.match_score && (
                                    <Badge variant={org.match_score >= 80 ? "default" : "secondary"}>
                                      {org.match_score}% Match
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              {org.city && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{org.city}{org.state ? `, ${org.state}` : ''} - {org.country}</span>
                                </div>
                              )}
                              {org.estimated_num_employees && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  <span>{org.employee_range || `${org.estimated_num_employees} funcionários`}</span>
                                </div>
                              )}
                              {org.primary_domain && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-3 w-3" />
                                  <span>{org.primary_domain}</span>
                                </div>
                              )}
                              {org.industry && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span>{org.industry}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://app.apollo.io/#/organizations/${org.id}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver no Apollo
                              </Button>
                              {org.linkedin_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(org.linkedin_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  LinkedIn
                                </Button>
                              )}
                              {org.website_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(org.website_url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Website
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleSelectOrg(org)}
                                className="ml-auto"
                                disabled={enriching}
                              >
                                {enriching ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Buscando...
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-3 w-3 mr-1" />
                                    Buscar Decisores
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {/* Not Found / Manual URL Input */}
            {showUrlInput && results.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm">🔍 Empresa não encontrada no Apollo</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        O Apollo foi aberto automaticamente. Busque manualmente e cole a URL abaixo.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Links de Validação Externa</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const apolloSearchUrl = `https://app.apollo.io/#/organizations?q=${encodeURIComponent(searchName)}`;
                            window.open(apolloSearchUrl, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Buscar no Apollo
                        </Button>
                        
                        {companyDomain && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://${companyDomain}`, '_blank')}
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              Website
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchName)}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              LinkedIn
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Dica:</strong> Empresas pequenas ou novas podem não estar no Apollo. 
                        Use os links acima para validar a existência da empresa nas redes sociais e buscadores.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apollo-url">
                    Cole a URL da Empresa no Apollo
                    <span className="text-xs text-muted-foreground ml-2">(Se encontrou)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="apollo-url"
                      value={apolloUrl}
                      onChange={(e) => setApolloUrl(e.target.value)}
                      placeholder="https://app.apollo.io/#/organizations/5f9e8d7c..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchByUrl()}
                    />
                    <Button onClick={handleSearchByUrl} disabled={searching || !apolloUrl.trim()}>
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Buscar"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exemplo: https://app.apollo.io/#/organizations/5f9e8d7c6b5a4f3e2d1c0b9a
                  </p>
                </div>
              </div>
            )}

            {!searching && results.length === 0 && !showUrlInput && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Digite o nome da empresa e clique em buscar para encontrar organizações no Apollo.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
