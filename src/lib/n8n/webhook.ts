export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export function verifyN8nSignature(signature: string | null): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return signature === secret;
}

export async function processN8nWebhook(payload: WebhookPayload) {
  return {
    processed: true,
    event: payload.event,
    receivedAt: new Date().toISOString(),
  };
}
