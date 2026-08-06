import pb from '@/lib/pocketbase/client'
import type { Appointment } from '@/types/crm'

export const getAppointments = (filter?: string): Promise<Appointment[]> => {
  return pb.collection('appointments').getFullList<Appointment>({
    sort: 'date_time',
    expand: 'patient',
    filter,
  })
}

export const getAppointmentsForPatient = (patientId: string): Promise<Appointment[]> => {
  return pb.collection('appointments').getFullList<Appointment>({
    sort: '-date_time',
    filter: `patient = "${patientId}"`,
    expand: 'patient',
  })
}

export const createAppointment = (data: Partial<Appointment>): Promise<Appointment> => {
  return pb.collection('appointments').create<Appointment>(data, { expand: 'patient' })
}

export const updateAppointment = (id: string, data: Partial<Appointment>): Promise<Appointment> => {
  return pb.collection('appointments').update<Appointment>(id, data, { expand: 'patient' })
}

export const deleteAppointment = (id: string): Promise<boolean> => {
  return pb.collection('appointments').delete(id)
}
