-- ============================================
-- CRIAR BUCKET DE STORAGE PARA GRAVAÇÕES
-- COPIAR E COLAR NO SUPABASE SQL EDITOR
-- ============================================

-- Criar bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-recordings',
  'voice-recordings',
  true, -- Público para reproduzir gravações
  52428800, -- 50 MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/webm'];

-- Política: Leitura pública
DROP POLICY IF EXISTS "Public Access to voice recordings" ON storage.objects;
CREATE POLICY "Public Access to voice recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-recordings');

-- Política: Upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload voice recordings" ON storage.objects;
CREATE POLICY "Authenticated users can upload voice recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-recordings');

-- Política: Update autenticado
DROP POLICY IF EXISTS "Authenticated users can update voice recordings" ON storage.objects;
CREATE POLICY "Authenticated users can update voice recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'voice-recordings');

-- Política: Delete autenticado
DROP POLICY IF EXISTS "Authenticated users can delete voice recordings" ON storage.objects;
CREATE POLICY "Authenticated users can delete voice recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-recordings');

-- Verificação
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  CASE 
    WHEN id = 'voice-recordings' THEN '✅ Bucket criado'
    ELSE '❌ Erro'
  END as status
FROM storage.buckets
WHERE id = 'voice-recordings';


