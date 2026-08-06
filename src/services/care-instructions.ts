import pb from '@/lib/pocketbase/client'
import type { CareInstruction } from '@/types/crm'

export const getCareInstructions = (category?: string): Promise<CareInstruction[]> => {
  let filter = ''
  if (category && category !== 'todos') {
    filter = `category = "${category}"`
  }
  return pb.collection('care_instructions').getFullList<CareInstruction>({
    sort: 'title',
    filter,
  })
}

export const searchCareInstructions = async (query: string): Promise<CareInstruction[]> => {
  try {
    const res = await pb.send('/backend/v1/instructions/search', {
      method: 'POST',
      body: JSON.stringify({ query, k: 10 }),
      headers: { 'Content-Type': 'application/json' },
    })
    return (res?.items || []) as CareInstruction[]
  } catch {
    return getCareInstructions()
  }
}

export const createCareInstruction = (data: Partial<CareInstruction>): Promise<CareInstruction> => {
  return pb.collection('care_instructions').create<CareInstruction>(data)
}

export const updateCareInstruction = (
  id: string,
  data: Partial<CareInstruction>,
): Promise<CareInstruction> => {
  return pb.collection('care_instructions').update<CareInstruction>(id, data)
}

export const deleteCareInstruction = (id: string): Promise<boolean> => {
  return pb.collection('care_instructions').delete(id)
}
