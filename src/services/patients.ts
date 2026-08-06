import pb from '@/lib/pocketbase/client'
import type { Patient } from '@/types/crm'

export const getPatients = async (query?: string): Promise<Patient[]> => {
  let filter = ''
  if (query && query.trim()) {
    const q = query.trim()
    filter = `full_name ~ "${q}" || phone ~ "${q}" || parent_name ~ "${q}"`
  }
  return pb.collection('patients').getFullList<Patient>({
    sort: 'full_name',
    filter,
  })
}

export const getPatient = (id: string): Promise<Patient> => {
  return pb.collection('patients').getOne<Patient>(id)
}

export const createPatient = (data: Partial<Patient>): Promise<Patient> => {
  return pb.collection('patients').create<Patient>(data)
}

export const updatePatient = (id: string, data: Partial<Patient>): Promise<Patient> => {
  return pb.collection('patients').update<Patient>(id, data)
}

export const deletePatient = (id: string): Promise<boolean> => {
  return pb.collection('patients').delete(id)
}
