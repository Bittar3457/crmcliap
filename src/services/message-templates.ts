import pb from '@/lib/pocketbase/client'
import type { MessageTemplate, MessageTemplateType } from '@/types/crm'

export const getMessageTemplates = (): Promise<MessageTemplate[]> => {
  return pb.collection('message_templates').getFullList<MessageTemplate>({
    sort: 'order',
  })
}

export const getMessageTemplateByType = async (
  type: MessageTemplateType,
): Promise<MessageTemplate | null> => {
  try {
    const list = await pb.collection('message_templates').getFullList<MessageTemplate>({
      filter: `type = "${type}"`,
      sort: 'order',
    })
    return list[0] || null
  } catch (err) {
    console.error(`Erro ao buscar template de tipo ${type}:`, err)
    return null
  }
}

export const updateMessageTemplate = (
  id: string,
  data: Partial<Pick<MessageTemplate, 'title' | 'content' | 'description' | 'order'>>,
): Promise<MessageTemplate> => {
  return pb.collection('message_templates').update<MessageTemplate>(id, data)
}

export const createMessageTemplate = (
  data: Omit<MessageTemplate, 'id' | 'created' | 'updated'>,
): Promise<MessageTemplate> => {
  return pb.collection('message_templates').create<MessageTemplate>(data)
}
