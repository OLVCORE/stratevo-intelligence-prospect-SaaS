-- ============================================
-- VERIFICAR SECRETS CONFIGURADOS
-- COPIAR E COLAR NO SUPABASE SQL EDITOR
-- ============================================

SELECT 
  name,
  CASE 
    WHEN name = 'ELEVENLABS_API_KEY' THEN '🎤 Voz IA'
    WHEN name = 'TWILIO_ACCOUNT_SID' THEN '📞 Chamadas (SID)'
    WHEN name = 'TWILIO_AUTH_TOKEN' THEN '📞 Chamadas (Token)'
    WHEN name = 'TWILIO_PHONE_NUMBER' THEN '📞 Número BR'
    WHEN name = 'OPENAI_API_KEY' THEN '🤖 IA (GPT + Whisper)'
    ELSE '❓ Outro'
  END as tipo,
  created_at,
  '✅ Configurado' as status
FROM vault.decrypted_secrets 
WHERE name IN (
  'ELEVENLABS_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY'
)
ORDER BY name;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar 5 linhas:
-- ✅ ELEVENLABS_API_KEY
-- ✅ TWILIO_ACCOUNT_SID
-- ✅ TWILIO_AUTH_TOKEN
-- ✅ TWILIO_PHONE_NUMBER
-- ✅ OPENAI_API_KEY
--
-- Se faltar algum, adicionar em:
-- Settings → Edge Functions → Secrets
-- ============================================


