# 🚀 CRIAR SISTEMA DE CONVITE DE USUÁRIOS

## 📋 OBJETIVO
Permitir que empresas (tenants) convidem funcionários para usar a plataforma, com diferentes níveis de acesso (roles).

---

## 🗄️ PARTE 1: BANCO DE DADOS

### 1.1 Criar Tabela de Convites

**Arquivo:** `supabase/migrations/[timestamp]_create_user_invitations.sql`

```sql
-- Tabela de Convites de Usuários
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant_id ON public.user_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON public.user_invitations(status);

-- RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant can view invitations"
  ON public.user_invitations FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenant admins can create invitations"
  ON public.user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "Tenant admins can update invitations"
  ON public.user_invitations FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('OWNER', 'ADMIN')
  );

-- Trigger para updated_at
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 💻 PARTE 2: BACKEND (Edge Functions)

### 2.1 Edge Function: `invite-user`

**Arquivo:** `supabase/functions/invite-user/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, role = 'USER', tenantId } = await req.json();

    // Obter usuário que está convidando
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se usuário tem permissão (OWNER ou ADMIN)
    const { data: inviter } = await supabaseClient
      .from('users')
      .select('id, tenant_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!inviter || !['OWNER', 'ADMIN'].includes(inviter.role)) {
      throw new Error('Sem permissão para convidar usuários');
    }

    // Gerar token único
    const invitationToken = crypto.randomUUID();

    // Criar convite
    const { data: invitation, error } = await supabaseClient
      .from('user_invitations')
      .insert({
        tenant_id: tenantId || inviter.tenant_id,
        email,
        role,
        invited_by: inviter.id,
        token: invitationToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Enviar email (usar serviço de email ou template)
    const inviteUrl = `${Deno.env.get('APP_URL')}/invite/accept/${invitationToken}`;
    
    // TODO: Implementar envio de email real
    console.log(`Convite criado: ${inviteUrl}`);

    return new Response(
      JSON.stringify({ success: true, invitation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 2.2 Edge Function: `accept-invitation`

**Arquivo:** `supabase/functions/accept-invitation/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, password, nome } = await req.json();

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'PENDING')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Convite inválido ou expirado');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirado
      await supabaseClient
        .from('user_invitations')
        .update({ status: 'EXPIRED' })
        .eq('id', invitation.id);

      throw new Error('Convite expirado');
    }

    // Verificar se email já tem conta
    const { data: existingUser } = await supabaseClient.auth.admin.getUserByEmail(invitation.email);

    let authUserId: string;

    if (existingUser?.user) {
      // Usuário já existe, usar conta existente
      authUserId = existingUser.user.id;
    } else {
      // Criar nova conta
      const { data: newUser, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
      });

      if (signUpError) {
        throw signUpError;
      }

      authUserId = newUser.user.id;
    }

    // Criar usuário no tenant
    const { error: userError } = await supabaseClient
      .from('users')
      .insert({
        email: invitation.email,
        nome: nome || invitation.email.split('@')[0],
        tenant_id: invitation.tenant_id,
        auth_user_id: authUserId,
        role: invitation.role,
      });

    if (userError) {
      throw userError;
    }

    // Marcar convite como aceito
    await supabaseClient
      .from('user_invitations')
      .update({
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🎨 PARTE 3: FRONTEND

### 3.1 Página de Gerenciamento de Usuários

**Arquivo:** `src/pages/admin/UsersManagement.tsx`

```typescript
import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function UsersManagement() {
  const { tenant } = useTenant();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER' | 'VIEWER'>('USER');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!email || !tenant) return;

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, role, tenantId: tenant.id },
      });

      if (error) throw error;

      toast.success(`Convite enviado para ${email}`);
      setEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Usuários</h1>
      
      {/* Formulário de Convite */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Convidar Novo Usuário</h2>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={role} onValueChange={(v: any) => setRole(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="USER">Usuário</SelectItem>
              <SelectItem value="VIEWER">Visualizador</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={inviting}>
            {inviting ? 'Enviando...' : 'Enviar Convite'}
          </Button>
        </div>
      </div>

      {/* Lista de Usuários */}
      {/* TODO: Implementar lista */}
    </div>
  );
}
```

### 3.2 Página de Aceitação de Convite

**Arquivo:** `src/pages/InviteAccept.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    // Buscar dados do convite
    // TODO: Implementar
  }, [token]);

  const handleAccept = async () => {
    if (!token || !nome || !password) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token, password, nome },
      });

      if (error) throw error;

      toast.success('Convite aceito! Faça login para continuar.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aceitar convite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Aceitar Convite</h1>
        <div className="space-y-4">
          <Input
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleAccept} disabled={loading} className="w-full">
            {loading ? 'Processando...' : 'Aceitar Convite'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar migration de `user_invitations`
- [ ] Criar Edge Function `invite-user`
- [ ] Criar Edge Function `accept-invitation`
- [ ] Criar página `UsersManagement.tsx`
- [ ] Criar página `InviteAccept.tsx`
- [ ] Adicionar rota `/admin/users`
- [ ] Adicionar rota `/invite/accept/:token`
- [ ] Testar fluxo completo

---

**Próximo passo:** Implementar todas as partes acima para ter sistema completo de convite!

