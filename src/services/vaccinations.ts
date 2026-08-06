import pb from '@/lib/pocketbase/client'
import type { Vaccination } from '@/types/crm'

export const getVaccinations = (filter?: string): Promise<Vaccination[]> => {
  return pb.collection('vaccinations').getFullList<Vaccination>({
    sort: '-created',
    expand: 'patient',
    filter,
  })
}

export const getVaccinationsForPatient = (patientId: string): Promise<Vaccination[]> => {
  return pb.collection('vaccinations').getFullList<Vaccination>({
    sort: 'scheduled_date',
    filter: `patient = "${patientId}"`,
    expand: 'patient',
  })
}

export const createVaccination = (data: Partial<Vaccination>): Promise<Vaccination> => {
  return pb.collection('vaccinations').create<Vaccination>(data, { expand: 'patient' })
}

export const updateVaccination = (id: string, data: Partial<Vaccination>): Promise<Vaccination> => {
  return pb.collection('vaccinations').update<Vaccination>(id, data, { expand: 'patient' })
}

export const deleteVaccination = (id: string): Promise<boolean> => {
  return pb.collection('vaccinations').delete(id)
}
