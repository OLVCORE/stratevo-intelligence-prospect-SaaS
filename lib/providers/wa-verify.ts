/**
 * Provider: WhatsApp Webhook Verification
 * Valida assinatura/HMAC de webhooks Twilio
 */
import crypto from 'crypto';

export function verifyTwilioSignature(
  url: string,
  params: Record<string, any>,
  signature: string
): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) return false;

  // Twilio usa HMAC-SHA1
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const hmac = crypto
    .createHmac('sha1', process.env.TWILIO_AUTH_TOKEN)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return hmac === signature;
}

export function verifyWebhookSecret(providedSecret: string): boolean {
  const expectedSecret = process.env.WEBHOOK_WA_SECRET || process.env.WEBHOOK_EMAIL_SECRET;
  if (!expectedSecret) return false;
  return providedSecret === expectedSecret;
}

