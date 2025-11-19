-- Criar tabela para presets de filtros
CREATE TABLE IF NOT EXISTS filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_created_at ON filter_presets(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE filter_presets ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios presets
CREATE POLICY "Users can view their own presets"
  ON filter_presets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem criar seus próprios presets
CREATE POLICY "Users can create their own presets"
  ON filter_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios presets
CREATE POLICY "Users can update their own presets"
  ON filter_presets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios presets
CREATE POLICY "Users can delete their own presets"
  ON filter_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_filter_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_filter_presets_updated_at
  BEFORE UPDATE ON filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_filter_presets_updated_at();

