import type { Patient, Appointment, CareInstruction, MessageTemplateType } from '@/types/crm'

export interface InterpolationVariables {
  paciente: string
  responsavel: string
  data: string
  hora: string
  tipo_consulta?: string
  orientacao?: string
  conteudo?: string
  clinica?: string
}

export const TEMPLATE_VARIABLES_INFO = [
  {
    tag: '{{paciente}}',
    label: 'Nome do Paciente',
    description: 'Nome completo ou primeiro nome da criança atendida.',
    example: 'Maria Clara Silva',
  },
  {
    tag: '{{responsavel}}',
    label: 'Nome do Responsável',
    description: 'Nome do pai, mãe ou responsável legal registrado no prontuário.',
    example: 'Ana Silva',
  },
  {
    tag: '{{data}}',
    label: 'Data da Consulta / Procedimento',
    description: 'Data formatada (ex.: 15/08/2026) da próxima consulta ou agendamento.',
    example: '15/08/2026',
  },
  {
    tag: '{{hora}}',
    label: 'Horário do Agendamento',
    description: 'Hora formatada (ex.: 14:00) da consulta.',
    example: '14:00',
  },
  {
    tag: '{{tipo_consulta}}',
    label: 'Tipo de Consulta',
    description: 'Tipo do agendamento (Consulta, Vacinação, Retorno, Telemedicina).',
    example: 'Consulta Pediátrica',
  },
  {
    tag: '{{orientacao}}',
    label: 'Texto da Orientação',
    description: 'Conteúdo detalhado do modelo de orientação selecionado na biblioteca.',
    example: 'Orientações sobre controle de febre infantil...',
  },
  {
    tag: '{{clinica}}',
    label: 'Nome da Clínica',
    description: 'Identificação oficial da clínica ("Cliap • Pediatria e Imunização").',
    example: 'Cliap • Pediatria e Imunização',
  },
]

export const DEFAULT_FALLBACK_TEMPLATES: Record<MessageTemplateType, string> = {
  confirmacao: `Olá, {{responsavel}}! Tudo bem?

Aqui é da equipe Cliap (Pediatria e Imunização). Estamos entrando em contato para confirmar a consulta de {{paciente}} agendada para {{data}} às {{hora}}.

Poderia, por gentileza, nos confirmar se podemos manter o agendamento? Responda SIM para confirmar ou nos avise caso necessite remarcar.

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,

  lembrete: `Olá, {{responsavel}}! Tudo bem?

Lembramos que a consulta de {{paciente}} na Cliap Pediatria e Imunização está agendada para {{data}} às {{hora}}.

Pedimos a gentileza de chegar com 10 minutos de antecedência e trazer a carteirinha de vacinação. Caso ocorra algum imprevisto, favor nos avisar com antecedência. Até breve!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,

  orientacao: `Olá, {{responsavel}}!

Seguem as orientações de cuidados da Cliap para {{paciente}}:

{{orientacao}}

Qualquer dúvida ou intercorrência, nossa equipe está à total disposição para auxiliar!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,

  livre: `Olá, {{responsavel}}! Tudo bem?

Aqui é da equipe Cliap (Pediatria e Imunização).

{{conteudo}}

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
}

export function formatAppointmentDateTime(dateTimeStr?: string): {
  dateStr: string
  timeStr: string
} {
  if (!dateTimeStr) {
    return { dateStr: 'data a definir', timeStr: 'horário a confirmar' }
  }
  const dateObj = new Date(dateTimeStr)
  if (isNaN(dateObj.getTime())) {
    return { dateStr: 'data a definir', timeStr: 'horário a confirmar' }
  }
  const dateStr = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { dateStr, timeStr }
}

export function buildTemplateContext(params: {
  patient?: Patient | null
  appointment?: Appointment | null
  instruction?: CareInstruction | null
  customContent?: string
}): Record<string, string> {
  const { patient, appointment, instruction, customContent } = params

  const patientName = patient?.full_name?.trim() || 'o paciente'
  const parentName = patient?.parent_name?.trim() || 'família'
  const { dateStr, timeStr } = formatAppointmentDateTime(appointment?.date_time)

  const appointmentTypesLabel: Record<string, string> = {
    consulta: 'Consulta Pediátrica',
    vacinacao: 'Vacinação',
    retorno: 'Consulta de Retorno',
    telemedicina: 'Telemedicina',
  }

  const tipoConsulta = appointment?.type
    ? appointmentTypesLabel[appointment.type] || appointment.type
    : 'Consulta Pediátrica'

  const orientacaoText =
    instruction?.content?.trim() || 'Orientações de cuidados pediátricos gerais.'

  return {
    paciente: patientName,
    responsavel: parentName,
    data: dateStr,
    hora: timeStr,
    tipo_consulta: tipoConsulta,
    orientacao: orientacaoText,
    conteudo: customContent?.trim() || '',
    clinica: 'Cliap • Pediatria e Imunização',
  }
}

/**
 * Substitui os marcadores {{chave}} ou {chave} no template pelo valor fornecido.
 */
export function interpolateTemplate(template: string, vars: Record<string, string>): string {
  if (!template) return ''
  let result = template

  Object.entries(vars).forEach(([key, value]) => {
    // Substitui {{key}} com possíveis espaços internos
    const doubleRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
    result = result.replace(doubleRegex, value)

    // Também suporta {key} simples para tolerar digitação do usuário
    const singleRegex = new RegExp(`\\{\\s*${key}\\s*\\}`, 'gi')
    result = result.replace(singleRegex, value)
  })

  return result
}
