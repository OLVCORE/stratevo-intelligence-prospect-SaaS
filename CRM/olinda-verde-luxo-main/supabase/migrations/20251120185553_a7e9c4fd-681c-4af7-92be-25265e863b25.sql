-- Criar bucket de storage para arquivos de leads
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-files', 'lead-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para o bucket lead-files
CREATE POLICY "Admins/Sales podem fazer upload de arquivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lead-files' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role))
);

CREATE POLICY "Admins/Sales podem ver arquivos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lead-files' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role))
);

CREATE POLICY "Admins/Sales podem deletar arquivos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lead-files' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sales'::app_role))
);