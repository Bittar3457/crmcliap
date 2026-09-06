export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Desconhecido'

export interface Patient {
  id: string
  full_name: string
  birth_date?: string
  parent_name?: string
  phone: string
  email?: string
  address?: string
  blood_type?: BloodType
  medical_notes?: string
  active?: boolean
  created: string
  updated: string
}

export type AppointmentType = 'consulta' | 'vacinacao' | 'retorno' | 'telemedicina'
export type AppointmentStatus =
  | 'agendado'
  | 'confirmado'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu'

export interface Appointment {
  id: string
  patient: string
  type: AppointmentType
  date_time: string
  status: AppointmentStatus
  notes?: string
  reminder_generated?: boolean
  created: string
  updated: string
  expand?: {
    patient?: Patient
  }
}

export type VaccinationStatus = 'agendada' | 'aplicada' | 'atrasada'

export interface Vaccination {
  id: string
  patient: string
  vaccine_name: string
  dose?: string
  scheduled_date?: string
  administered_date?: string
  status: VaccinationStatus
  notes?: string
  created: string
  updated: string
  expand?: {
    patient?: Patient
  }
}

export type InstructionCategory =
  | 'pos_vacina'
  | 'geral'
  | 'medicamento'
  | 'nutricao'
  | 'acompanhamento'

export interface CareInstruction {
  id: string
  title: string
  category: InstructionCategory
  content: string
  is_template?: boolean
  created: string
  updated: string
  _distance?: number
}

export type MessageDirection = 'enviada' | 'recebida'
export type MessageStatus = 'rascunho' | 'agendada' | 'enviada'

export interface WhatsAppMessage {
  id: string
  patient: string
  direction: MessageDirection
  template?: string
  content: string
  scheduled_for?: string
  sent_at?: string
  status: MessageStatus
  created: string
  updated: string
  expand?: {
    patient?: Patient
    template?: CareInstruction
  }
}

export type MessageTemplateType = 'confirmacao' | 'lembrete' | 'orientacao' | 'livre'

export interface MessageTemplate {
  id: string
  type: MessageTemplateType
  title: string
  content: string
  description?: string
  order?: number
  created: string
  updated: string
}
