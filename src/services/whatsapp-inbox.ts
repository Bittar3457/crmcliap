import { MOCK_CONVERSATIONS, INBOX_TEMPLATES } from './mock-inbox-data'
import type { WhatsAppChatMessage, InboxMessageTemplate } from '@/types/whatsapp-inbox'
import type { Patient, WhatsAppMessage, Appointment } from '@/types/crm'
import { getPatients } from './patients'
import { getWhatsAppMessages, createWhatsAppMessage } from './whatsapp'
import { interpolateTemplate, buildTemplateContext } from '@/lib/template-interpolator'
import { buildWhatsAppLink } from '@/lib/whatsapp-utils'
import { getWhatsAppConfig, sendWhatsAppMessageApi, type WhatsAppConfig } from './whatsapp-api'

const STORAGE_KEY_CUSTOM_MESSAGES = 'cliap_inbox_custom_messages'
const STORAGE_KEY_TEMPLATES = 'cliap_inbox_custom_templates'

/**
 * Normaliza um número de telefone para dígitos puros,
 * removendo caracteres especiais e código de país 55 inicial para matching confiável.
 */
export function normalizePhoneDigits(phone?: string | null): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2)
  }
  return digits
}

/**
 * Encontra no banco de pacientes se algum possui o número de telefone informado
 */
export function matchPatientByPhone(phone: string, patients: Patient[]): Patient | undefined {
  const target = normalizePhoneDigits(phone)
  if (!target || target.length < 8) return undefined

  return patients.find((p) => {
    const pDigits = normalizePhoneDigits(p.phone)
    if (!pDigits) return false
    return pDigits === target || pDigits.endsWith(target) || target.endsWith(pDigits)
  })
}

/**
 * Carrega mensagens customizadas criadas localmente durante a sessão
 */
function getLocalCustomMessages(): WhatsAppChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_MESSAGES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Salva mensagens adicionadas pela recepcionista no CRM
 */
function saveLocalCustomMessage(msg: WhatsAppChatMessage): void {
  try {
    const list = getLocalCustomMessages()
    list.push(msg)
    localStorage.setItem(STORAGE_KEY_CUSTOM_MESSAGES, JSON.stringify(list))
  } catch {
    // LocalStorage fallback
  }
}

export interface ConversationSummary {
  id: string
  phone: string
  contactName?: string
  patient?: Patient | null
  patientName?: string
  patientId?: string
  unreadCount: number
  lastActivity: string
  lastMessage: WhatsAppChatMessage
  messagesCount: number
  isMock: boolean
}

/**
 * Obtém a lista completa de conversas da Inbox,
 * mesclando as conversas de exemplo mockadas, os registros do PocketBase e mensagens adicionadas.
 * Realiza automaticamente a vinculação com pacientes cadastrados com base no número.
 */
export async function getInboxConversations(
  patientsList?: Patient[],
): Promise<ConversationSummary[]> {
  const patients = patientsList || (await getPatients())
  const pbMessages = await getWhatsAppMessages().catch(() => [] as WhatsAppMessage[])
  const localMessages = getLocalCustomMessages()

  // Mapa de conversas por telefone normalizado
  const conversationMap = new Map<
    string,
    {
      id: string
      phone: string
      contactName?: string
      patient?: Patient | null
      messages: WhatsAppChatMessage[]
      unreadCount: number
    }
  >()

  // 1. Inicializa com as conversas mockadas
  for (const mock of MOCK_CONVERSATIONS) {
    const norm = normalizePhoneDigits(mock.phone)
    // Busca vinculação automática com pacientes cadastrados no CRM
    const matchedPatient =
      matchPatientByPhone(mock.phone, patients) ||
      (mock.patientId ? patients.find((p) => p.id === mock.patientId) : undefined)

    conversationMap.set(norm, {
      id: mock.id,
      phone: mock.phone,
      contactName: matchedPatient?.parent_name || mock.contactName,
      patient: matchedPatient || null,
      messages: [...mock.messages],
      unreadCount: mock.unreadCount || 0,
    })
  }

  // 2. Mescla mensagens locais criadas pela recepcionista
  for (const lMsg of localMessages) {
    const norm = normalizePhoneDigits(lMsg.phone)
    const existing = conversationMap.get(norm)
    if (existing) {
      existing.messages.push(lMsg)
    } else {
      const matchedPatient = matchPatientByPhone(lMsg.phone, patients)
      conversationMap.set(norm, {
        id: `conv-${norm}`,
        phone: lMsg.phone,
        contactName: matchedPatient?.parent_name,
        patient: matchedPatient || null,
        messages: [lMsg],
        unreadCount: 0,
      })
    }
  }

  // 3. Mescla mensagens enviadas via PocketBase (se houver pacientes vinculados)
  for (const pbMsg of pbMessages) {
    const p = pbMsg.expand?.patient || patients.find((pt) => pt.id === pbMsg.patient)
    if (!p) continue
    const norm = normalizePhoneDigits(p.phone)
    const existing = conversationMap.get(norm)

    const chatMsg: WhatsAppChatMessage = {
      id: `pb-${pbMsg.id}`,
      conversationId: existing?.id || `conv-${norm}`,
      patientId: p.id,
      phone: p.phone,
      content: pbMsg.content,
      direction: pbMsg.direction || 'enviada',
      timestamp: pbMsg.sent_at || pbMsg.created,
      status: 'enviada',
      senderName: pbMsg.direction === 'enviada' ? 'Recepção Cliap' : p.parent_name || p.full_name,
    }

    if (existing) {
      // Evita duplicar se já existir com timestamp similar
      const exists = existing.messages.some(
        (m) =>
          m.id === chatMsg.id ||
          (m.content === chatMsg.content &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(chatMsg.timestamp).getTime()) <
              5000),
      )
      if (!exists) {
        existing.messages.push(chatMsg)
      }
    } else {
      conversationMap.set(norm, {
        id: `conv-${norm}`,
        phone: p.phone,
        contactName: p.parent_name,
        patient: p,
        messages: [chatMsg],
        unreadCount: 0,
      })
    }
  }

  // 4. Monta a lista formatada e ordenada pela mensagem mais recente
  const summaries: ConversationSummary[] = []

  for (const [, data] of conversationMap) {
    // Ordena mensagens cronologicamente
    data.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const lastMsg = data.messages[data.messages.length - 1]
    const lastActivity = lastMsg ? lastMsg.timestamp : new Date().toISOString()

    // Re-checa vínculo caso não tenha sido atribuído
    const resolvedPatient = data.patient || matchPatientByPhone(data.phone, patients) || null

    summaries.push({
      id: data.id,
      phone: data.phone,
      contactName: resolvedPatient?.parent_name || data.contactName,
      patient: resolvedPatient,
      patientName: resolvedPatient?.full_name,
      patientId: resolvedPatient?.id,
      unreadCount: data.unreadCount,
      lastActivity,
      lastMessage: lastMsg || {
        id: 'empty',
        conversationId: data.id,
        phone: data.phone,
        content: 'Nenhuma mensagem recente',
        direction: 'recebida',
        timestamp: new Date().toISOString(),
      },
      messagesCount: data.messages.length,
      isMock: true,
    })
  }

  // Ordena por data decrescente da última mensagem
  summaries.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

  return summaries
}

/**
 * Obtém o histórico completo de mensagens de uma conversa específica
 */
export async function getConversationMessages(
  conversationId: string,
  phone: string,
  patientId?: string,
): Promise<WhatsAppChatMessage[]> {
  const norm = normalizePhoneDigits(phone)
  const summaries = await getInboxConversations()
  const conv = summaries.find(
    (s) => s.id === conversationId || normalizePhoneDigits(s.phone) === norm,
  )

  if (conv) {
    // Recarrega mensagens associadas
    const mock = MOCK_CONVERSATIONS.find(
      (m) => m.id === conversationId || normalizePhoneDigits(m.phone) === norm,
    )
    const local = getLocalCustomMessages().filter(
      (m) => m.conversationId === conversationId || normalizePhoneDigits(m.phone) === norm,
    )

    const all = [...(mock?.messages || []), ...local]

    // Se tiver patientId, adiciona mensagens do PocketBase
    if (patientId) {
      try {
        const pbMsgs = await getWhatsAppMessages(patientId)
        for (const pbMsg of pbMsgs) {
          const chatMsg: WhatsAppChatMessage = {
            id: `pb-${pbMsg.id}`,
            conversationId: conversationId,
            patientId,
            phone,
            content: pbMsg.content,
            direction: pbMsg.direction || 'enviada',
            timestamp: pbMsg.sent_at || pbMsg.created,
            status: 'enviada',
            senderName: pbMsg.direction === 'enviada' ? 'Recepção Cliap' : 'Responsável',
          }
          const exists = all.some(
            (m) =>
              m.id === chatMsg.id ||
              (m.content === chatMsg.content &&
                Math.abs(new Date(m.timestamp).getTime() - new Date(chatMsg.timestamp).getTime()) <
                  5000),
          )
          if (!exists) {
            all.push(chatMsg)
          }
        }
      } catch {
        // Ignora erro de rede/pb
      }
    }

    all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return all
  }

  return []
}

/**
 * Envia uma mensagem da Inbox (abre via Deep Link wa.me e persiste no histórico)
 */
export async function sendInboxMessage(params: {
  conversationId: string
  phone: string
  content: string
  patientId?: string
  senderName?: string
}): Promise<WhatsAppChatMessage> {
  const { conversationId, phone, content, patientId, senderName } = params

  const newMessage: WhatsAppChatMessage = {
    id: `msg-crm-${Date.now()}`,
    conversationId,
    patientId,
    phone,
    content,
    direction: 'enviada',
    timestamp: new Date().toISOString(),
    status: 'enviada',
    senderName: senderName || 'Recepção Cliap',
  }

  // 1. Salva localmente para feedback imediato na UI da Inbox
  saveLocalCustomMessage(newMessage)

  // 2. Checa se a integração Meta Cloud API está conectada
  let sentReal = false
  try {
    const config = await getWhatsAppConfig().catch(() => null)
    if (config?.status === 'conectado' && config?.has_token && config?.phone_number_id) {
      const res = await sendWhatsAppMessageApi({
        to: phone,
        content,
        patient_id: patientId,
      })
      if (res.success) {
        sentReal = true
      } else {
        console.warn('Envio via Meta Cloud API falhou, acionando fallback wa.me:', res.error)
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar/enviar via Meta Cloud API:', err)
  }

  // 3. Se não enviou via Cloud API (ou se falhou), persiste no banco e aciona deep link
  if (!sentReal) {
    if (patientId) {
      try {
        await createWhatsAppMessage({
          patient: patientId,
          direction: 'enviada',
          content,
          sent_at: new Date().toISOString(),
          status: 'enviada',
        })
      } catch (e) {
        console.warn('Erro ao sincronizar mensagem no PocketBase:', e)
      }
    }

    const waUrl = buildWhatsAppLink(phone, content)
    window.open(waUrl, '_blank')
  }

  return newMessage
}

/**
 * Obtém os templates da Inbox (com cache/customizações locais se houver)
 */
export function getInboxTemplates(): InboxMessageTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES)
    if (raw) {
      const custom = JSON.parse(raw) as InboxMessageTemplate[]
      return custom
    }
  } catch {
    // fallback
  }
  return INBOX_TEMPLATES
}

/**
 * Interpola um template com dados do paciente/agendamento/contexto
 */
export function formatInboxTemplate(
  templateContent: string,
  options: {
    patient?: Patient | null
    appointment?: Appointment | null
    customVars?: Record<string, string>
  },
): string {
  const { patient, appointment, customVars } = options
  const baseContext = buildTemplateContext({
    patient,
    appointment,
    customContent: customVars?.conteudo,
  })

  const merged = {
    ...baseContext,
    vacina: customVars?.vacina || 'Pentavalente + VIP',
    data_vacina: customVars?.data_vacina || '18/09/2026',
    ...customVars,
  }

  return interpolateTemplate(templateContent, merged)
}
