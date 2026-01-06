// src/components/icp/LinkedInCredentialsDialog.tsx
// Dialog para autenticação LinkedIn via OAuth (Similar ao Summitfy)

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Linkedin, CheckCircle2, AlertCircle, Loader2, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { initiateLinkedInOAuth, checkLinkedInOAuthStatus } from '@/services/linkedinOAuth';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export function LinkedInCredentialsDialog({
  open,
  onOpenChange,
  onAuthSuccess
}: LinkedInCredentialsDialogProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInAccount, setLinkedInAccount] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ SEMPRE VERIFICAR STATUS QUANDO O MODAL ABRIR
  useEffect(() => {
    if (open) {
      // ✅ FORÇAR RESET DO ESTADO ANTES DE VERIFICAR
      setIsConnected(false);
      setLinkedInAccount(null);
      // ✅ VERIFICAR STATUS NO BANCO
      checkLinkedInConnection();
    }
  }, [open]);

  const checkLinkedInConnection = async () => {
    setIsChecking(true);
    try {
      // ✅ FORÇAR CONSULTA DIRETA AO BANCO (sem cache)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsConnected(false);
        setLinkedInAccount(null);
        return;
      }

      // ✅ PRIMEIRO: VERIFICAR TODAS AS CONTAS DO USUÁRIO (para debug)
      const { data: allAccounts, error: allAccountsError } = await supabase
        .from('linkedin_accounts')
        .select('id, status, auth_method, linkedin_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allAccountsError) {
        console.error('[LINKEDIN-OAUTH] Erro ao buscar todas as contas:', allAccountsError);
      } else {
        console.log('[LINKEDIN-OAUTH] 🔍 TODAS as contas do usuário:', allAccounts);
        const activeAccounts = allAccounts?.filter(a => a.status === 'active') || [];
        console.log('[LINKEDIN-OAUTH] 🔍 Contas ATIVAS:', activeAccounts);
        if (activeAccounts.length > 0) {
          console.error('[LINKEDIN-OAUTH] ⚠️ PROBLEMA: Encontradas', activeAccounts.length, 'contas ATIVAS quando deveria estar DESCONECTADO!');
        }
      }

      // ✅ CONSULTAR BANCO DIRETAMENTE - APENAS STATUS 'active'
      const { data: account, error } = await supabase
        .from('linkedin_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') // ✅ APENAS ATIVAS
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[LINKEDIN-OAUTH] ❌ Erro ao consultar banco:', error);
        setIsConnected(false);
        setLinkedInAccount(null);
        return;
      }

      // ✅ SE NÃO TEM CONTA ATIVA, ESTÁ DESCONECTADO
      if (!account) {
        console.log('[LINKEDIN-OAUTH] ✅ Nenhuma conta ativa encontrada - DESCONECTADO');
        setIsConnected(false);
        setLinkedInAccount(null);
        return;
      }

      // ✅ TEM CONTA ATIVA - MAS ISSO NÃO DEVERIA ACONTECER SE DESCONECTOU!
      console.error('[LINKEDIN-OAUTH] ⚠️ PROBLEMA: Conta ativa encontrada quando deveria estar desconectada!', {
        id: account.id,
        status: account.status,
        auth_method: account.auth_method,
        name: account.linkedin_name,
        created_at: account.created_at
      });
      setIsConnected(true);
      setLinkedInAccount(account);
    } catch (error) {
      console.error('[LINKEDIN-OAUTH] Erro ao verificar conexão:', error);
      setIsConnected(false);
      setLinkedInAccount(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = async () => {
    // ✅ SEMPRE VERIFICAR STATUS ANTES DE CONECTAR (forçar consulta ao banco)
    await checkLinkedInConnection();
    
    // ✅ SE JÁ ESTÁ CONECTADO, NÃO PERMITIR
    if (isConnected) {
      toast.info('Você já está conectado', {
        description: 'Sua conta LinkedIn já está conectada. Use "Desconectar" se quiser conectar outra conta.'
      });
      return;
    }

    setIsConnecting(true);
    try {
      console.log('[LINKEDIN-OAUTH] Iniciando OAuth...');
      
      // ✅ VERIFICAR SE CLIENT_ID ESTÁ CONFIGURADO
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      if (!clientId || clientId.trim() === '') {
        throw new Error('VITE_LINKEDIN_CLIENT_ID não está configurado no Vercel. Configure a variável de ambiente primeiro.');
      }

      // ✅ INICIAR OAUTH (vai redirecionar para LinkedIn)
      await initiateLinkedInOAuth();
      
      // ✅ O redirecionamento vai acontecer automaticamente
      // Não precisa mostrar toast aqui porque a página vai mudar
    } catch (error: any) {
      console.error('[LINKEDIN-OAUTH] Erro:', error);
      toast.error('Erro ao iniciar conexão', {
        description: error.message || 'Verifique se VITE_LINKEDIN_CLIENT_ID está configurado no Vercel'
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('[LINKEDIN-OAUTH] Iniciando desconexão para user:', user.id);

      // ✅ BUSCAR TODAS AS CONTAS DO USUÁRIO (qualquer status)
      const { data: accounts, error: fetchError } = await supabase
        .from('linkedin_accounts')
        .select('id, status')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('[LINKEDIN-OAUTH] Erro ao buscar contas:', fetchError);
        throw fetchError;
      }

      console.log('[LINKEDIN-OAUTH] Contas encontradas:', accounts);

      // ✅ DESCONECTAR TODAS AS CONTAS DO USUÁRIO (QUALQUER STATUS)
      if (accounts && accounts.length > 0) {
        console.log('[LINKEDIN-OAUTH] 🔍 Contas encontradas antes de desconectar:', accounts);
        
        // ✅ ATUALIZAR TODAS AS CONTAS PARA 'disconnected' (não apenas as ativas)
        const { error: updateError, data: updated } = await supabase
          .from('linkedin_accounts')
          .update({ status: 'disconnected' })
          .eq('user_id', user.id) // ✅ TODAS AS CONTAS DO USUÁRIO
          .select('id, status');

        if (updateError) {
          console.error('[LINKEDIN-OAUTH] ❌ Erro ao atualizar status:', updateError);
          throw updateError;
        }

        console.log('[LINKEDIN-OAUTH] ✅ Contas atualizadas para disconnected:', updated);
        
        // ✅ VERIFICAR SE REALMENTE FOI ATUALIZADO
        const { data: verifyAccounts } = await supabase
          .from('linkedin_accounts')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        if (verifyAccounts && verifyAccounts.length > 0) {
          console.error('[LINKEDIN-OAUTH] ⚠️ PROBLEMA: Ainda há', verifyAccounts.length, 'contas ATIVAS após desconectar!', verifyAccounts);
          throw new Error('Falha ao desconectar: ainda há contas ativas no banco');
        } else {
          console.log('[LINKEDIN-OAUTH] ✅ Confirmado: Nenhuma conta ativa após desconectar');
        }
      } else {
        console.log('[LINKEDIN-OAUTH] ℹ️ Nenhuma conta encontrada para desconectar');
      }

      // ✅ LIMPAR DADOS ANTIGOS DA TABELA PROFILES (se existir)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            linkedin_connected: false,
            linkedin_session_cookie: null,
            linkedin_access_token: null
          })
          .eq('id', user.id);

        if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
          console.warn('[LINKEDIN-OAUTH] Aviso ao limpar dados antigos do profiles:', profileError);
          // Não lançar erro, apenas avisar
        } else {
          console.log('[LINKEDIN-OAUTH] Dados antigos do profiles limpos');
        }
      } catch (profileCleanError) {
        console.warn('[LINKEDIN-OAUTH] Erro ao limpar profiles (pode não existir):', profileCleanError);
        // Não lançar erro, apenas avisar
      }

      // ✅ FORÇAR ATUALIZAÇÃO DO ESTADO LOCAL IMEDIATAMENTE
      setIsConnected(false);
      setLinkedInAccount(null);
      
      // ✅ AGUARDAR PARA GARANTIR QUE O BANCO FOI ATUALIZADO
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // ✅ VERIFICAR NOVAMENTE O STATUS DO BANCO (deve retornar desconectado)
      await checkLinkedInConnection();
      
      // ✅ VERIFICAR MAIS UMA VEZ PARA TER CERTEZA
      const { data: verifyAccount } = await supabase
        .from('linkedin_accounts')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (verifyAccount) {
        console.error('[LINKEDIN-OAUTH] ⚠️ AINDA TEM CONTA ATIVA APÓS DESCONECTAR!', verifyAccount);
        toast.error('Erro: Ainda há conta ativa. Tente novamente.');
      } else {
        console.log('[LINKEDIN-OAUTH] ✅ Confirmado: Nenhuma conta ativa');
        toast.success('LinkedIn desconectado com sucesso');
      }
      
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('[LINKEDIN-OAUTH] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar LinkedIn: ' + (error.message || 'Erro desconhecido'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            Conectar Conta do LinkedIn
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta do LinkedIn usando OAuth 2.0 (método oficial e seguro, similar ao Summitfy)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status da Conexão */}
          {isChecking ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando conexão...</AlertTitle>
              <AlertDescription>
                Aguarde enquanto verificamos o status da sua conta LinkedIn.
              </AlertDescription>
            </Alert>
          ) : isConnected ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                LinkedIn Conectado ✅
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{linkedInAccount?.linkedin_name || 'Conta conectada'}</p>
                  {linkedInAccount?.linkedin_email && (
                    <p className="text-sm">{linkedInAccount.linkedin_email}</p>
                  )}
                  {linkedInAccount?.linkedin_profile_url && (
                    <a
                      href={linkedInAccount.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2"
                    >
                      Ver perfil no LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-xs mt-2">
                    Sua conta está conectada via OAuth e pronta para enviar conexões.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conectar com OAuth</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Conecte sua conta usando o método oficial OAuth do LinkedIn, igual ao Summitfy.
                </p>
                <ul className="list-disc ml-4 space-y-1 text-sm">
                  <li>✅ Método oficial e seguro</li>
                  <li>✅ Não precisa de senhas ou cookies</li>
                  <li>✅ Renovação automática de tokens</li>
                  <li>✅ Conformidade com termos do LinkedIn</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!isConnected && (
            <div className="space-y-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Linkedin className="w-4 h-4 mr-2" />
                    Conectar com LinkedIn (OAuth)
                  </>
                )}
              </Button>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Como Funciona
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                  <ol className="list-decimal ml-4 space-y-1 mt-2">
                    <li>Clique em "Conectar com LinkedIn"</li>
                    <li>Você será redirecionado para o LinkedIn</li>
                    <li>Autorize a conexão na tela do LinkedIn</li>
                    <li>Você será redirecionado de volta automaticamente</li>
                    <li>Sua conta estará conectada e pronta para uso</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              {/* ✅ CAMPO PARA COOKIE li_at (mesmo com OAuth) */}
              <div className="space-y-2">
                <Label htmlFor="li_at_cookie" className="text-sm font-medium">
                  Cookie li_at (Opcional - necessário para enviar conexões)
                </Label>
                <div className="space-y-2">
                  <Input
                    id="li_at_cookie"
                    type="password"
                    placeholder="Cole o cookie li_at aqui (obtido do navegador)"
                    value={linkedInAccount?.li_at_cookie || ''}
                    onChange={async (e) => {
                      const cookieValue = e.target.value.trim();
                      if (!cookieValue) return;

                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user || !linkedInAccount?.id) return;

                        const { error } = await supabase
                          .from('linkedin_accounts')
                          .update({ li_at_cookie: cookieValue })
                          .eq('id', linkedInAccount.id);

                        if (error) {
                          toast.error('Erro ao salvar cookie: ' + error.message);
                        } else {
                          toast.success('Cookie salvo com sucesso!');
                          await checkLinkedInConnection();
                        }
                      } catch (error: any) {
                        toast.error('Erro: ' + error.message);
                      }
                    }}
                    className="font-mono text-xs"
                  />
                  {!linkedInAccount?.li_at_cookie && (
                    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mt-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 dark:text-amber-200 text-xs">
                        ⚠️ Cookie necessário para enviar conexões
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                        <p className="mt-1">
                          Para enviar conexões via PhantomBuster, é necessário fornecer o cookie <strong>li_at</strong> <strong>apenas uma vez</strong>.
                        </p>
                        <p className="mt-2 font-semibold">Como obter (2 minutos):</p>
                        <ol className="list-decimal ml-4 mt-1 space-y-1">
                          <li>Abra o LinkedIn no navegador (você já está logado após OAuth)</li>
                          <li>Pressione <strong>F12</strong> → <strong>Application</strong> → <strong>Cookies</strong> → <strong>linkedin.com</strong></li>
                          <li>Copie o valor do cookie <strong>"li_at"</strong></li>
                          <li>Cole no campo acima</li>
                        </ol>
                        <p className="mt-2 text-xs font-semibold">
                          ✅ Após salvar, o sistema funcionará 100% automaticamente!
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  {linkedInAccount?.li_at_cookie && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✅ Cookie configurado - Sistema pronto para enviar conexões automaticamente!
                    </p>
                  )}
                  {linkedInAccount?.li_at_cookie && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✅ Cookie configurado - Conexões podem ser enviadas
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    // ✅ FORÇAR DESCONEXÃO TOTAL - LIMPAR TUDO
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;

                      console.log('[LINKEDIN-OAUTH] 🔥 FORÇANDO DESCONEXÃO TOTAL...');
                      
                      // 1. Desconectar TODAS as contas (qualquer status)
                      const { error: disconnectError } = await supabase
                        .from('linkedin_accounts')
                        .update({ status: 'disconnected' })
                        .eq('user_id', user.id);

                      if (disconnectError) {
                        console.error('[LINKEDIN-OAUTH] Erro ao desconectar:', disconnectError);
                      }

                      // 2. Limpar dados antigos do profiles
                      await supabase
                        .from('profiles')
                        .update({ 
                          linkedin_connected: false,
                          linkedin_session_cookie: null,
                          linkedin_access_token: null
                        })
                        .eq('id', user.id);

                      // 3. Verificar novamente
                      await checkLinkedInConnection();
                      
                      toast.success('Desconexão total realizada');
                    } catch (error: any) {
                      console.error('[LINKEDIN-OAUTH] Erro na desconexão total:', error);
                      toast.error('Erro: ' + error.message);
                    }
                  }}
                  className="text-orange-600 hover:text-orange-700"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Forçar Desconexão Total
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              </div>
            </div>
          )}

          {/* Informações Importantes */}
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Importante sobre Segurança
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
              <ul className="list-disc ml-4 space-y-1 mt-2">
                <li>OAuth é o método oficial e mais seguro do LinkedIn</li>
                <li>Você pode ver convites enviados diretamente no LinkedIn</li>
                <li>Os tokens são renovados automaticamente</li>
                <li>Você pode desconectar a qualquer momento</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
