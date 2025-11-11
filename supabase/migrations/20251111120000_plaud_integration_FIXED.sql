-- =====================================================
-- PLAUD NOTEPIN INTEGRATION - COMPLETE SCHEMA (FIXED)
-- =====================================================
-- Created: 2025-11-11
-- Purpose: Store call recordings, transcripts, AI analysis
-- FIX: Changed sdr_deals to sales_deals + added schema qualifiers
-- =====================================================

-- 0. ADD MISSING COLUMN TO sales_deals (if needed)
ALTER TABLE public.sales_deals
  ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;

-- 1. CALL RECORDINGS TABLE
CREATE TABLE IF NOT EXISTS public.call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata
  plaud_recording_id TEXT UNIQUE,
  recording_url TEXT,
  recording_date TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Transcript
  transcript TEXT,
  summary TEXT,
  language TEXT DEFAULT 'pt-BR',
  
  -- Speakers
  speakers JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "João Silva", "duration_seconds": 120, "speech_segments": [...] }]
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(3,2), -- -1.00 to 1.00
  confidence_level NUMERIC(3,2), -- 0.00 to 1.00
  
  -- Extracted Insights
  key_topics TEXT[], -- ["pricing", "delivery", "objections"]
  action_items JSONB DEFAULT '[]'::jsonb,
  -- [{ "task": "Send proposal", "assignee": "João", "due_date": "2025-11-15", "priority": "high" }]
  
  objections_raised JSONB DEFAULT '[]'::jsonb,
  -- [{ "objection": "Price too high", "response": "Explained ROI", "resolved": true }]
  
  opportunities_detected JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "cross_sell", "product": "TOTVS Protheus", "confidence": 0.85 }]
  
  -- Relationships (FIXED: sdr_deals → sales_deals, added schema)
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.sales_deals(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Coaching Metrics
  talk_time_ratio NUMERIC(3,2), -- % of time seller talked (ideal: 0.30-0.40)
  questions_asked INTEGER, -- Number of discovery questions
  objection_handling_score NUMERIC(3,2), -- 0.00 to 1.00
  closing_attempts INTEGER,
  
  -- Win/Loss Signals
  buying_signals TEXT[], -- ["asked about timeline", "mentioned budget", "wanted to see demo"]
  risk_signals TEXT[], -- ["hesitant", "need to talk to team", "not urgent"]
  
  -- Processing Status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_company ON public.call_recordings(company_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_deal ON public.call_recordings(deal_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_recorded_by ON public.call_recordings(recorded_by);
CREATE INDEX IF NOT EXISTS idx_call_recordings_date ON public.call_recordings(recording_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_recordings_sentiment ON public.call_recordings(sentiment);
CREATE INDEX IF NOT EXISTS idx_call_recordings_plaud_id ON public.call_recordings(plaud_recording_id);

-- Full-text search on transcripts
CREATE INDEX IF NOT EXISTS idx_call_recordings_transcript_fts ON public.call_recordings USING gin(to_tsvector('portuguese', transcript));

-- 2. CALL ANALYTICS AGGREGATED TABLE
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Volume Metrics
  total_calls INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_call_duration_minutes NUMERIC(10,2),
  
  -- Sentiment Metrics
  positive_calls INTEGER DEFAULT 0,
  neutral_calls INTEGER DEFAULT 0,
  negative_calls INTEGER DEFAULT 0,
  avg_sentiment_score NUMERIC(3,2),
  
  -- Performance Metrics
  avg_talk_time_ratio NUMERIC(3,2),
  avg_questions_asked NUMERIC(5,2),
  avg_objection_handling_score NUMERIC(3,2),
  total_closing_attempts INTEGER DEFAULT 0,
  
  -- Outcomes
  deals_closed INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  
  -- Coaching Insights
  top_strengths TEXT[],
  areas_for_improvement TEXT[],
  best_practices_identified TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_call_analytics_user ON public.call_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_period ON public.call_analytics(period_start, period_end);

-- 3. PLAUD WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS public.plaud_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event TEXT,
  payload JSONB,
  processing_status TEXT DEFAULT 'received' CHECK (processing_status IN ('received', 'success', 'error')),
  error_message TEXT,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_status ON public.plaud_webhook_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_plaud_webhook_logs_created ON public.plaud_webhook_logs(created_at DESC);

-- 4. SALES COACHING RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.sales_coaching_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  call_recording_id UUID REFERENCES public.call_recordings(id) ON DELETE CASCADE,
  
  recommendation_type TEXT CHECK (recommendation_type IN (
    'talk_time', 'discovery_questions', 'objection_handling', 
    'closing_technique', 'active_listening', 'value_proposition'
  )),
  
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Specific Examples from Call
  timestamp_in_call INTEGER, -- seconds into the call
  transcript_excerpt TEXT,
  
  -- Action Items
  suggested_improvement TEXT,
  learning_resources JSONB DEFAULT '[]'::jsonb,
  -- [{ "type": "video", "title": "How to Handle Price Objections", "url": "..." }]
  
  -- Tracking
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  implemented BOOLEAN DEFAULT FALSE,
  implemented_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_user ON public.sales_coaching_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_call ON public.sales_coaching_recommendations(call_recording_id);
CREATE INDEX IF NOT EXISTS idx_coaching_recommendations_type ON public.sales_coaching_recommendations(recommendation_type);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaud_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_coaching_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own recordings
DROP POLICY IF EXISTS "Users can view own call recordings" ON public.call_recordings;
CREATE POLICY "Users can view own call recordings"
  ON public.call_recordings FOR SELECT
  USING (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can insert own call recordings" ON public.call_recordings;
CREATE POLICY "Users can insert own call recordings"
  ON public.call_recordings FOR INSERT
  WITH CHECK (recorded_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own call recordings" ON public.call_recordings;
CREATE POLICY "Users can update own call recordings"
  ON public.call_recordings FOR UPDATE
  USING (recorded_by = auth.uid());

-- Analytics: Users see their own data
DROP POLICY IF EXISTS "Users can view own analytics" ON public.call_analytics;
CREATE POLICY "Users can view own analytics"
  ON public.call_analytics FOR SELECT
  USING (user_id = auth.uid());

-- Webhook logs: No RLS needed (service role only)

-- Coaching: Users see their own recommendations
DROP POLICY IF EXISTS "Users can view own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can view own coaching recommendations"
  ON public.sales_coaching_recommendations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own coaching recommendations" ON public.sales_coaching_recommendations;
CREATE POLICY "Users can update own coaching recommendations"
  ON public.sales_coaching_recommendations FOR UPDATE
  USING (user_id = auth.uid());

-- 6. TRIGGERS FOR AUTOMATIC UPDATES
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_call_recordings_timestamp ON public.call_recordings;
CREATE TRIGGER update_call_recordings_timestamp
  BEFORE UPDATE ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_call_recordings_updated_at();

-- 7. FUNCTION: Auto-create tasks from action items
CREATE OR REPLACE FUNCTION auto_create_tasks_from_call()
RETURNS TRIGGER AS $$
DECLARE
  action_item JSONB;
BEGIN
  -- Only process when action_items are added/updated
  IF NEW.action_items IS NOT NULL AND jsonb_array_length(NEW.action_items) > 0 THEN
    FOR action_item IN SELECT * FROM jsonb_array_elements(NEW.action_items)
    LOOP
      -- Check if smart_tasks table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_tasks') THEN
        INSERT INTO public.smart_tasks (
          title,
          description,
          deal_id,
          assigned_to,
          due_date,
          priority,
          ai_suggested,
          ai_reasoning,
          created_by
        ) VALUES (
          action_item->>'task',
          'Action item extracted from call: ' || COALESCE(NEW.summary, 'Call recording'),
          NEW.deal_id,
          NEW.recorded_by,
          COALESCE((action_item->>'due_date')::TIMESTAMPTZ, NOW() + INTERVAL '3 days'),
          COALESCE(action_item->>'priority', 'medium'),
          TRUE,
          'Automatically extracted from call recording on ' || NEW.recording_date::DATE,
          NEW.recorded_by
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_tasks_from_call ON public.call_recordings;
CREATE TRIGGER trigger_auto_create_tasks_from_call
  AFTER INSERT OR UPDATE OF action_items ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_from_call();

-- 8. FUNCTION: Update deal based on call sentiment (FIXED: sdr_deals → sales_deals)
CREATE OR REPLACE FUNCTION update_deal_from_call_sentiment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL AND NEW.sentiment IS NOT NULL THEN
    -- Update deal's last_contact_date
    UPDATE public.sales_deals
    SET 
      last_contact_date = NEW.recording_date,
      updated_at = NOW()
    WHERE id = NEW.deal_id;
    
    -- If highly negative sentiment, add a note
    IF NEW.sentiment = 'negative' AND NEW.sentiment_score < -0.5 THEN
      -- Check if sales_deal_activities exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_deal_activities') THEN
        INSERT INTO public.sales_deal_activities (
          deal_id,
          activity_type,
          description,
          new_value
        ) VALUES (
          NEW.deal_id,
          'alert',
          'Call com sentimento negativo detectado',
          jsonb_build_object(
            'call_recording_id', NEW.id,
            'sentiment_score', NEW.sentiment_score,
            'risk_signals', NEW.risk_signals
          )
        );
      END IF;
    END IF;
    
    -- If highly positive sentiment with buying signals, increase priority
    IF NEW.sentiment = 'positive' AND NEW.sentiment_score > 0.7 AND array_length(NEW.buying_signals, 1) > 2 THEN
      UPDATE public.sales_deals
      SET priority = 'high'
      WHERE id = NEW.deal_id AND priority != 'urgent';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deal_from_call_sentiment ON public.call_recordings;
CREATE TRIGGER trigger_update_deal_from_call_sentiment
  AFTER INSERT OR UPDATE OF sentiment, sentiment_score ON public.call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_from_call_sentiment();

-- 9. VIEW: Call Performance Summary
CREATE OR REPLACE VIEW public.call_performance_summary AS
SELECT 
  u.id AS user_id,
  u.full_name AS user_name,
  COUNT(cr.id) AS total_calls,
  ROUND(AVG(cr.duration_seconds / 60.0), 2) AS avg_duration_minutes,
  ROUND(AVG(cr.sentiment_score), 2) AS avg_sentiment,
  ROUND(AVG(cr.talk_time_ratio), 2) AS avg_talk_ratio,
  ROUND(AVG(cr.questions_asked), 2) AS avg_questions,
  ROUND(AVG(cr.objection_handling_score), 2) AS avg_objection_handling,
  COUNT(CASE WHEN cr.sentiment = 'positive' THEN 1 END) AS positive_calls,
  COUNT(CASE WHEN cr.sentiment = 'negative' THEN 1 END) AS negative_calls,
  COUNT(CASE WHEN array_length(cr.buying_signals, 1) > 0 THEN 1 END) AS calls_with_buying_signals
FROM public.users u
LEFT JOIN public.call_recordings cr ON cr.recorded_by = u.id AND cr.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name;

-- 10. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON public.call_recordings TO authenticated;
GRANT SELECT ON public.call_analytics TO authenticated;
GRANT SELECT, UPDATE ON public.sales_coaching_recommendations TO authenticated;
GRANT SELECT ON public.call_performance_summary TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next Steps:
-- 1. Deploy Edge Function: plaud-webhook-receiver
-- 2. Test with sample recording
-- =====================================================

