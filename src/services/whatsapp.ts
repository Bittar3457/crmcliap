import pb from '@/lib/pocketbase/client'
import type { WhatsAppMessage } from '@/types/crm'

export const getWhatsAppMessages = (patientId?: string): Promise<WhatsAppMessage[]> => {
  let filter = ''
  if (patientId) {
    filter = `patient = "${patientId}"`
  }
  return pb.collection('whatsapp_messages').getFullList<WhatsAppMessage>({
    sort: '-created',
    expand: 'patient,template',
    filter,
  })
}

export const createWhatsAppMessage = (data: Partial<WhatsAppMessage>): Promise<WhatsAppMessage> => {
  return pb
    .collection('whatsapp_messages')
    .create<WhatsAppMessage>(data, { expand: 'patient,template' })
}

export const updateWhatsAppMessage = (
  id: string,
  data: Partial<WhatsAppMessage>,
): Promise<WhatsAppMessage> => {
  return pb
    .collection('whatsapp_messages')
    .update<WhatsAppMessage>(id, data, { expand: 'patient,template' })
}

export const generateAiDraft = async (params: {
  patient_id: string
  instruction_id?: string
  notes?: string
}): Promise<string> => {
  const res = await pb.send('/backend/v1/whatsapp/draft', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
  return res?.draft || ''
}
