import type { Patient, WhatsAppMessage, Appointment, CareInstruction } from './crm'

export interface WhatsAppConversationItem {
  id: string
  phone: string
  contactName?: string
  patientId?: string
  patientName?: string
  unreadCount?: number
  lastMessage: {
    content: string
    timestamp: string
    direction: 'enviada' | 'recebida'
    status?: 'enviada' | 'entregue' | 'lida' | 'falha'
    errorNote?: string
  }
}

export interface WhatsAppChatMessage {
  id: string
  conversationId: string
  patientId?: string
  phone: string
  content: string
  direction: 'enviada' | 'recebida'
  timestamp: string
  status?: 'enviada' | 'entregue' | 'lida' | 'falha'
  errorNote?: string
  senderName?: string
  templateType?: string
}

export type InboxTemplateType =
  | 'lembrete_24h'
  | 'alerta_vacina'
  | 'boas_vindas'
  | 'confirmacao'
  | 'lembrete'
  | 'orientacao'
  | 'livre'

export interface InboxMessageTemplate {
  id: string
  type: InboxTemplateType
  title: string
  category: 'automatico' | 'manual'
  description: string
  badgeLabel: string
  content: string
}
