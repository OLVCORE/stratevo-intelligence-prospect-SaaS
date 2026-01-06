import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, Settings, Linkedin, CheckCircle2, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LinkedInCredentialsDialog } from '@/components/icp/LinkedInCredentialsDialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  telegram_username: string | null;
  facebook_url: string | null;
}

interface ICPMetadata {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'core' | 'mercado' | string;
  setor_foco: string | null;
  nicho_foco: string | null;
  icp_principal: boolean;
  ativo: boolean;
  updated_at: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const { tenant } = useTenant();
  const [icps, setIcps] = useState<ICPMetadata[]>([]);
  const [icpsLoading, setIcpLoading] = useState(false);
  const [generatedIcpCount, setGeneratedIcpCount] = useState<number | null>(null);
  const [linkedInAuthOpen, setLinkedInAuthOpen] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);

  useEffect(() => {
    loadProfile();
    checkLinkedInStatus();
  }, [user]);

  useEffect(() => {
    loadIcpData();
  }, [tenant]);

  const checkLinkedInStatus = async () => {
    try {
      // ✅ USAR VALIDAÇÃO UNIFICADA (mesma função do modal)
      const { validateLinkedInConnection } = await import('@/services/linkedinValidation');
      const validation = await validateLinkedInConnection();
      
      setLinkedInConnected(validation.isConnected && validation.isValid);
    } catch (error) {
      console.error('[Settings] Erro ao verificar LinkedIn:', error);
      setLinkedInConnected(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      // 🔥 CORRIGIDO: Verificar se tabela profiles existe antes de consultar
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Tratar todos os tipos de erro que indicam tabela não existe ou perfil não encontrado
      if (error) {
        const errorCode = error.code || '';
        const errorMessage = error.message || '';
        const isTableNotFound = 
          errorCode === 'PGRST116' || // Row not found
          errorCode === '42P01' ||     // Table does not exist
          errorCode === 'PGRST204' ||  // No rows returned
          errorMessage.includes('404') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist');
        
        if (isTableNotFound) {
          // Tabela não existe ou perfil não encontrado - usar dados do auth.user
          console.info('[SettingsPage] Tabela profiles não disponível, usando dados do auth');
          setProfile(null);
          setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
          return;
        }
        throw error;
      }

      // Se não há dados, usar dados básicos do usuário
      if (!data) {
        setProfile(null);
        setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        return;
      }

      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setWhatsapp(data.whatsapp || '');
      setLinkedinUrl(data.linkedin_url || '');
      setInstagramUrl(data.instagram_url || '');
      setTwitterUrl(data.twitter_url || '');
      setTelegramUsername(data.telegram_username || '');
      setFacebookUrl(data.facebook_url || '');
    } catch (error: any) {
      // Tratar erro silenciosamente se for relacionado a tabela não existente
      const errorMessage = error?.message || '';
      const isExpectedError = 
        errorMessage.includes('404') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('relation');
      
      if (isExpectedError) {
        console.info('[SettingsPage] Perfil não disponível (esperado)');
        setProfile(null);
        return;
      }
      console.error('[SettingsPage] Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIcpData = async () => {
    if (!tenant?.id) {
      setIcps([]);
      setGeneratedIcpCount(null);
      return;
    }

    setIcpLoading(true);
    try {
      const [icpsResponse, counterResponse] = await Promise.all([
        supabase
          .from("icp_profiles_metadata")
          .select("id, nome, descricao, tipo, setor_foco, nicho_foco, icp_principal, ativo, updated_at")
          .eq("tenant_id", tenant.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("icp_generation_counters")
          .select("generated_count")
          .eq("tenant_id", tenant.id)
          .maybeSingle(), // 🔥 CORRIGIR: Usar maybeSingle() para evitar erro 406 quando não existe registro
      ]);

      if (icpsResponse.error) {
        throw icpsResponse.error;
      }

      setIcps(icpsResponse.data || []);
      setGeneratedIcpCount(
        counterResponse.error || !counterResponse.data
          ? null
          : counterResponse.data.generated_count ?? 0
      );
    } catch (error) {
      console.warn("Erro ao carregar ICPs:", error);
    } finally {
      setIcpLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          whatsapp: whatsapp,
          linkedin_url: linkedinUrl,
          instagram_url: instagramUrl,
          twitter_url: twitterUrl,
          telegram_username: telegramUsername,
          facebook_url: facebookUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Avatar atualizado com sucesso!');
      loadProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile?.email?.substring(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie seu perfil e informações de contato</p>
          </div>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Sua foto será exibida em todo o sistema</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Input
                type="file"
                id="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleUploadAvatar}
                disabled={uploadingAvatar}
              />
              <Label htmlFor="avatar">
                <Button type="button" asChild disabled={uploadingAvatar}>
                  <span className="cursor-pointer">
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </>
                    )}
                  </span>
                </Button>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados básicos de identificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={profile?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
          </CardContent>
        </Card>

        {/* ✅ LinkedIn Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              Conexão LinkedIn
            </CardTitle>
            <CardDescription>
              Conecte sua conta do LinkedIn para enviar conexões automaticamente (estilo Summitfy.ai)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              linkedInConnected
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {linkedInConnected ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          LinkedIn Conectado ✅
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Sua conta está conectada e pronta para enviar conexões
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          LinkedIn Não Conectado
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Conecte sua conta para enviar conexões automaticamente
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => setLinkedInAuthOpen(true)}
                  variant={linkedInConnected ? 'outline' : 'default'}
                  className={linkedInConnected ? '' : 'bg-blue-600 hover:bg-blue-700'}
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  {linkedInConnected ? 'Gerenciar Conexão' : 'Conectar LinkedIn'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
            <CardDescription>Telefone e WhatsApp para comunicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 98765-4321"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+55 11 98765-4321"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Networks */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>Suas contas em redes sociais e plataformas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/seu-perfil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input
                id="twitter"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/seu-perfil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@seu_usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/seu-perfil"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle>ICP Manager</CardTitle>
                <Badge variant="outline" className="text-xs">
                  ICPs gerados: {generatedIcpCount ?? 0}
                </Badge>
              </div>
              <CardDescription>Gerencie ICPs já gerados e revise o contador oficial.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {icpsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando ICPs...</p>
            ) : icps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ICP registrado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {icps.map((icp) => (
                  <li
                    key={icp.id}
                    className="rounded-2xl border border-border px-4 py-3 bg-background/60"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{icp.nome}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {icp.tipo === "core" ? "ICP Principal" : "ICP Mercado"}
                          </Badge>
                        </div>
                        {icp.updated_at && (
                          <span className="text-[10px] text-muted-foreground">
                            Atualizado em{" "}
                            {new Date(icp.updated_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {icp.descricao || "Sem descrição adicional."}
                      </p>
                      <div className="text-[11px] text-muted-foreground">
                        Setor: {icp.setor_foco || "—"} · Nicho: {icp.nicho_foco || "—"} · Status:{" "}
                        {icp.ativo ? "Ativo" : "Inativo"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 pt-2 md:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/central-icp">Abrir Central ICP</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/tenant-onboarding">Gerar novo ICP</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </div>

      {/* LinkedIn Auth Dialog */}
      <LinkedInCredentialsDialog
        open={linkedInAuthOpen}
        onOpenChange={setLinkedInAuthOpen}
        onAuthSuccess={() => {
          // ✅ Atualizar status após conectar
          checkLinkedInStatus();
          // Toast já é exibido pelo LinkedInCredentialsDialog
        }}
      />
    </AppLayout>
  );
}
