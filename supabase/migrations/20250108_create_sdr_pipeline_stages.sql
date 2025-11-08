-- Create sdr_pipeline_stages table
CREATE TABLE IF NOT EXISTS sdr_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  probability_default INTEGER NOT NULL DEFAULT 50,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stages
INSERT INTO sdr_pipeline_stages (name, key, order_index, color, probability_default, is_closed, is_won) VALUES
  ('Discovery', 'discovery', 1, '#3b82f6', 10, FALSE, FALSE),
  ('Qualification', 'qualification', 2, '#8b5cf6', 30, FALSE, FALSE),
  ('Proposal', 'proposal', 3, '#f59e0b', 50, FALSE, FALSE),
  ('Negotiation', 'negotiation', 4, '#10b981', 70, FALSE, FALSE),
  ('Closed Won', 'won', 5, '#22c55e', 100, TRUE, TRUE),
  ('Closed Lost', 'lost', 6, '#ef4444', 0, TRUE, FALSE);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sdr_pipeline_stages_order ON sdr_pipeline_stages(order_index);

-- Enable RLS
ALTER TABLE sdr_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all authenticated users to read)
CREATE POLICY "Allow authenticated users to read stages"
  ON sdr_pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

