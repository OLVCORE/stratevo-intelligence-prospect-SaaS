// src/features/linkedin/components/LinkedInPersonalConnect.tsx
// ✅ CONEXÃO PESSOAL DO LINKEDIN - Método Phantombuster/Apollo (Padrão do Mercado)
// Cada usuário logado conecta SEU perfil pessoal (multi-tenant)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Linkedin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Info,
  XCircle,
} from "lucide-react";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { initiateLinkedInOAuth } from "@/services/linkedinOAuth";

type ConnectionMethod = 'url-cookie' | 'email-password' | 'oauth';

export function LinkedInPersonalConnect() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { account, isLoading, refetch } = useLinkedInAccount();
  const [open, setOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [method, setMethod] = useState<ConnectionMethod>('url-cookie');

  // Formulário URL + Cookie (MÉTODO PREFERIDO)
  const [profileUrl, setProfileUrl] = useState('');
  const [liAtCookie, setLiAtCookie] = useState('');
  const [validatingUrl, setValidatingUrl] = useState(false);

  // Formulário Email + Senha (ALTERNATIVA)
  const [linkedinEmail, setLinkedinEmail] = useState('');
  const [linkedinPassword, setLinkedinPassword] = useState('');

  // OAuth (OPCIONAL)
  const [oauthEnabled] = useState(() => {
    return !!import.meta.env.VITE_LINKEDIN_CLIENT_ID;
  });

  const isConnected = !!account && account.status === 'active';

  // Validar URL do perfil LinkedIn
  const isValidLinkedInUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return (
        urlObj.hostname === 'linkedin.com' ||
        urlObj.hostname === 'www.linkedin.com'
      ) && (
        urlObj.pathname.includes('/in/') ||
        urlObj.pathname.includes('/company/')
      );
    } catch {
      return false;
    }
  };

  // Validar cookie li_at
  const isValidLiAtCookie = (cookie: string): boolean => {
    if (!cookie.trim()) return false;
    // Cookie li_at geralmente começa com "AQED" ou similar (base64)
    return cookie.trim().length > 50 && /^[A-Za-z0-9+/=_-]+$/.test(cookie.trim());
  };

  // Conectar via URL + Cookie (MÉTODO PREFERIDO)
  const handleConnectUrlCookie = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!profileUrl.trim() || !isValidLinkedInUrl(profileUrl)) {
      toast.error('URL do perfil LinkedIn inválida');
      return;
    }

    if (!liAtCookie.trim() || !isValidLiAtCookie(liAtCookie)) {
      toast.error('Cookie li_at inválido');
      return;
    }

    setIsConnecting(true);
    setValidatingUrl(true);

    try {
      // ✅ NORMALIZAR URL
      let normalizedUrl = profileUrl.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // ✅ EXTRAIR PROFILE ID DA URL
      // Exemplos: https://linkedin.com/in/joao-silva ou https://www.linkedin.com/in/joao-silva
      const urlMatch = normalizedUrl.match(/linkedin\.com\/(?:in|company)\/([^\/\?]+)/);
      if (!urlMatch || !urlMatch[1]) {
        throw new Error('URL do perfil inválida. Use: https://linkedin.com/in/seu-perfil');
      }

      const profileId = urlMatch[1];
      const profileEmail = linkedinEmail.trim() || null;

      console.log('[LinkedIn Personal Connect] 🔗 Conectando perfil pessoal:', {
        profileUrl: normalizedUrl,
        profileId,
        userId: user.id,
        tenantId: tenant?.id,
        hasCookie: !!liAtCookie
      });

      // ✅ VALIDAR COOKIE FAZENDO REQUEST DE TESTE
      // Validar se o cookie funciona fazendo uma requisição ao LinkedIn
      const validateResponse = await supabase.functions.invoke('linkedin-validate-profile', {
        body: {
          profile_url: normalizedUrl,
          li_at_cookie: liAtCookie.trim(),
          user_id: user.id
        }
      });

      if (validateResponse.error) {
        throw validateResponse.error;
      }

      if (!validateResponse.data?.success) {
        throw new Error(validateResponse.data?.error || 'Falha ao validar perfil e cookie');
      }

      const profileData = validateResponse.data.profile;

      // ✅ DESCONECTAR CONTAS ANTIGAS DO USUÁRIO (QUALQUER STATUS)
      const { error: disconnectError } = await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id);

      if (disconnectError) {
        console.warn('[LinkedIn Personal Connect] ⚠️ Erro ao desconectar contas antigas:', disconnectError);
      }

      // ✅ CRIAR NOVA CONTA COM PERFIL PESSOAL DO USUÁRIO
      const { data: newAccount, error: createError } = await supabase
        .from('linkedin_accounts')
        .insert({
          user_id: user.id, // ✅ USUÁRIO LOGADO (multi-tenant)
          tenant_id: tenant?.id || null, // ✅ TENANT (organização)
          linkedin_profile_id: profileId,
          linkedin_profile_url: normalizedUrl,
          linkedin_name: profileData?.name || profileId,
          linkedin_headline: profileData?.headline || null,
          linkedin_avatar_url: profileData?.avatar_url || null,
          linkedin_email: profileEmail || profileData?.email || null,
          li_at_cookie: liAtCookie.trim(),
          auth_method: 'cookie', // ✅ MÉTODO PREFERIDO (Phantombuster/Apollo)
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('[LinkedIn Personal Connect] ❌ Erro ao criar conta:', createError);
        throw createError;
      }

      console.log('[LinkedIn Personal Connect] ✅ Conta criada com sucesso:', newAccount.id);

      // ✅ LIMPAR FORMULÁRIO
      setProfileUrl('');
      setLiAtCookie('');
      setLinkedinEmail('');

      // ✅ INVALIDAR CACHE
      if (refetch) {
        refetch();
      }

      toast.success('LinkedIn conectado com sucesso!', {
        description: `Perfil pessoal ${profileData?.name || profileId} conectado`
      });

      // ✅ FECHAR MODAL APÓS SUCESSO
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (error: any) {
      console.error('[LinkedIn Personal Connect] ❌ Erro:', error);
      toast.error('Erro ao conectar LinkedIn', {
        description: error.message || 'Verifique a URL e o cookie'
      });
    } finally {
      setIsConnecting(false);
      setValidatingUrl(false);
    }
  };

  // Conectar via Email + Senha (ALTERNATIVA)
  const handleConnectEmailPassword = async () => {
    toast.info('Método Email/Senha', {
      description: 'LinkedIn não permite autenticação direta via API. Use o método "URL + Cookie" para automação completa.'
    });
    
    // ✅ MOSTRAR INSTRUÇÕES DETALHADAS
    // Explicar que precisa:
    // 1. Fazer login no LinkedIn no navegador
    // 2. Obter cookie li_at
    // 3. Usar método "URL + Cookie"
    setMethod('url-cookie');
  };

  // Conectar via OAuth (OPCIONAL)
  const handleConnectOAuth = async () => {
    if (!oauthEnabled) {
      toast.error('OAuth não configurado', {
        description: 'VITE_LINKEDIN_CLIENT_ID não está configurado. Use o método "URL + Cookie"'
      });
      return;
    }

    setIsConnecting(true);
    try {
      // ✅ INICIAR OAUTH (vai redirecionar)
      await initiateLinkedInOAuth();
      // O redirecionamento vai acontecer automaticamente
    } catch (error: any) {
      console.error('[LinkedIn Personal Connect] Erro OAuth:', error);
      toast.error('Erro ao iniciar OAuth', {
        description: error.message || 'Verifique se VITE_LINKEDIN_CLIENT_ID está configurado'
      });
      setIsConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      // ✅ DESCONECTAR TODAS AS CONTAS DO USUÁRIO
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id);

      if (error) throw error;

      // ✅ INVALIDAR CACHE
      if (refetch) {
        refetch();
      }

      toast.success('LinkedIn desconectado com sucesso');
      setOpen(false);
    } catch (error: any) {
      console.error('[LinkedIn Personal Connect] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar', {
        description: error.message
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={isConnected ? "outline" : "default"}>
          <Linkedin className="h-4 w-4" />
          {isConnected ? "Gerenciar Conexão" : "Conectar LinkedIn"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            {isConnected ? "Conexão LinkedIn" : "Conectar seu Perfil LinkedIn Pessoal"}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? `Conectado como ${account?.linkedin_name || 'seu perfil pessoal'}`
              : "Conecte seu perfil LinkedIn pessoal para enviar conexões e mensagens automaticamente"}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                LinkedIn Conectado ✅
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <p className="font-medium">{account?.linkedin_name || 'Perfil conectado'}</p>
                  {account?.linkedin_email && (
                    <p className="text-sm">{account.linkedin_email}</p>
                  )}
                  {account?.linkedin_profile_url && (
                    <a
                      href={account.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2"
                    >
                      Ver perfil no LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-xs mt-2">
                    Método: {account?.auth_method === 'oauth' ? 'OAuth 2.0' : 'Cookie (Phantombuster/Apollo)'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Tabs value={method} onValueChange={(v) => setMethod(v as ConnectionMethod)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url-cookie" className="text-xs">
                  URL + Cookie ⭐
                </TabsTrigger>
                <TabsTrigger value="email-password" className="text-xs">
                  Email/Senha
                </TabsTrigger>
                {oauthEnabled && (
                  <TabsTrigger value="oauth" className="text-xs">
                    OAuth
                  </TabsTrigger>
                )}
              </TabsList>

              {/* OPÇÃO 1: URL + COOKIE (PREFERIDO) */}
              <TabsContent value="url-cookie" className="space-y-4 mt-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 dark:text-blue-200 text-sm">
                    Método Preferido (Padrão do Mercado) ⭐
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    Usado por 95% das plataformas de automação (Phantombuster, Apollo.io, etc). 
                    Funciona 100% para enviar conexões e mensagens.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-url" className="text-sm font-medium">
                      URL do seu Perfil LinkedIn Pessoal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="profile-url"
                      type="url"
                      placeholder="https://linkedin.com/in/seu-perfil"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      disabled={isConnecting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Exemplo: https://linkedin.com/in/joao-silva
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="li-at-cookie" className="text-sm font-medium">
                      Cookie li_at <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="li-at-cookie"
                      type="password"
                      placeholder="Cole o cookie li_at aqui"
                      value={liAtCookie}
                      onChange={(e) => setLiAtCookie(e.target.value)}
                      disabled={isConnecting}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cookie necessário para automação (obtido do navegador)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin-email-optional" className="text-sm font-medium">
                      Email do LinkedIn (Opcional)
                    </Label>
                    <Input
                      id="linkedin-email-optional"
                      type="email"
                      placeholder="seu@email.com"
                      value={linkedinEmail}
                      onChange={(e) => setLinkedinEmail(e.target.value)}
                      disabled={isConnecting}
                    />
                  </div>

                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200 text-xs">
                      Como obter o cookie li_at (2 minutos)
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Abra o LinkedIn no navegador e faça login</li>
                        <li>Pressione <strong>F12</strong> → Aba <strong>Application</strong></li>
                        <li><strong>Cookies</strong> → <strong>https://linkedin.com</strong></li>
                        <li>Procure pelo cookie <strong>"li_at"</strong></li>
                        <li>Copie o <strong>Value</strong> e cole no campo acima</li>
                      </ol>
                      <p className="mt-2 font-semibold">
                        ✅ Após conectar, funcionará automaticamente!
                      </p>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleConnectUrlCookie}
                    disabled={isConnecting || !profileUrl.trim() || !liAtCookie.trim() || !isValidLinkedInUrl(profileUrl) || !isValidLiAtCookie(liAtCookie)}
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] gap-2"
                    size="lg"
                  >
                    {validatingUrl ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Linkedin className="h-4 w-4" />
                        Conectar Perfil Pessoal
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* OPÇÃO 2: EMAIL + SENHA (ALTERNATIVA) */}
              <TabsContent value="email-password" className="space-y-4 mt-4">
                <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ LinkedIn não permite autenticação direta via API
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                    Por segurança, o LinkedIn não permite autenticação direta via email/senha em APIs.
                    <strong className="block mt-2">Recomendado:</strong> Use o método <strong>"URL + Cookie"</strong> (método padrão do mercado).
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin-email-alt" className="text-sm font-medium">
                      Email do LinkedIn
                    </Label>
                    <Input
                      id="linkedin-email-alt"
                      type="email"
                      placeholder="seu@email.com"
                      value={linkedinEmail}
                      onChange={(e) => setLinkedinEmail(e.target.value)}
                      disabled={true}
                    />
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Este método não está disponível por segurança
                    </p>
                  </div>

                  <Button
                    onClick={handleConnectEmailPassword}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Usar método "URL + Cookie" ⭐
                  </Button>
                </div>
              </TabsContent>

              {/* OPÇÃO 3: OAUTH (OPCIONAL) */}
              {oauthEnabled && (
                <TabsContent value="oauth" className="space-y-4 mt-4">
                  <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-800 dark:text-purple-200 text-sm">
                      OAuth 2.0 (Método Oficial)
                    </AlertTitle>
                    <AlertDescription className="text-purple-700 dark:text-purple-300 text-xs mt-1">
                      Método oficial do LinkedIn. Após OAuth, você ainda precisará fornecer o cookie li_at para enviar conexões.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleConnectOAuth}
                    disabled={isConnecting}
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] gap-2"
                    size="lg"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Linkedin className="h-4 w-4" />
                        Conectar com OAuth
                      </>
                    )}
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
