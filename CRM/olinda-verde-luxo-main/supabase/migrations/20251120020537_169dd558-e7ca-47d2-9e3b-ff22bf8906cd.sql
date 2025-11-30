-- Atualizar políticas RLS para permitir que todos os usuários autenticados possam gerenciar activities (tarefas)

-- Remover políticas antigas restritivas
DROP POLICY IF EXISTS "Admins/Sales can create activities" ON public.activities;
DROP POLICY IF EXISTS "Admins/Sales can update activities" ON public.activities;
DROP POLICY IF EXISTS "Admins/Sales can view activities" ON public.activities;

-- Criar novas políticas para todos os usuários autenticados
CREATE POLICY "Usuários autenticados podem criar tarefas"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver tarefas"
ON public.activities
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem atualizar tarefas"
ON public.activities
FOR UPDATE
TO authenticated
USING (true);

-- Atualizar políticas de email_history para todos os usuários autenticados
DROP POLICY IF EXISTS "Admins/Sales podem criar histórico" ON public.email_history;
DROP POLICY IF EXISTS "Admins/Sales podem ver histórico de emails" ON public.email_history;

CREATE POLICY "Usuários autenticados podem criar histórico de email"
ON public.email_history
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem ver histórico de emails"
ON public.email_history
FOR SELECT
TO authenticated
USING (true);