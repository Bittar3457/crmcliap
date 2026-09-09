import pb from '@/lib/pocketbase/client'

export interface WhatsAppConfig {
  id?: string
  app_id: string
  phone_number_id: string
  waba_id: string
  has_token: boolean
  masked_token?: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
  webhook_verify_token: string
  status: 'desconectado' | 'conectado' | 'erro'
  last_tested_at?: string | null
  last_error?: string
}

export interface SaveWhatsAppConfigPayload {
  app_id?: string
  phone_number_id?: string
  waba_id?: string
  access_token?: string
  webhook_verify_token?: string
}

export interface TestConnectionResponse {
  success: boolean
  status: 'desconectado' | 'conectado' | 'erro'
  message?: string
  error?: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
  last_tested_at?: string
  me?: Record<string, unknown>
  phone_info?: Record<string, unknown>
  details?: Record<string, unknown>
}

export interface SendWhatsAppRealPayload {
  to: string
  content: string
  patient_id?: string
  template_id?: string
}

export interface SendWhatsAppRealResponse {
  success: boolean
  error?: string
  code?: number | string
  error_subcode?: number | string
  fallback_available?: boolean
  whatsapp_message_id?: string
  crm_message?: {
    id: string
    patient: string
    direction: string
    content: string
    sent_at: string
    status: string
  }
}

/**
 * Busca as configurações seguras de integração salvas no backend
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  return pb.send<WhatsAppConfig>('/backend/v1/whatsapp/config', {
    method: 'GET',
  })
}

/**
 * Salva ou atualiza as configurações no backend (inclui token permanente de forma segura)
 */
export async function saveWhatsAppConfig(
  payload: SaveWhatsAppConfigPayload,
): Promise<WhatsAppConfig> {
  return pb.send<WhatsAppConfig>('/backend/v1/whatsapp/config', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Dispara teste de conexão no backend (Graph API GET /v21.0/me e busca número)
 */
export async function testWhatsAppConnection(): Promise<TestConnectionResponse> {
  return pb.send<TestConnectionResponse>('/backend/v1/whatsapp/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Dispara envio real via WhatsApp Cloud API (POST /{phone_number_id}/messages)
 */
export async function sendWhatsAppMessageApi(
  payload: SendWhatsAppRealPayload,
): Promise<SendWhatsAppRealResponse> {
  return pb.send<SendWhatsAppRealResponse>('/backend/v1/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Retorna a URL pública completa do webhook para configurar no painel da Meta
 */
export function getWebhookCallbackUrl(): string {
  const backendBase = pb.baseUrl || window.location.origin
  // Remove barra final se houver
  const cleanBase = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase
  return `${cleanBase}/backend/v1/whatsapp/webhook`
}
