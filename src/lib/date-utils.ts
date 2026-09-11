/**
 * Utilitários para comparação e manipulação de datas considerando o fuso horário local.
 * Evita bugs ao comparar datas UTC com a data local do usuário.
 */

/**
 * Retorna a chave no formato "YYYY-MM-DD" baseada no horário local da data fornecida (ou de hoje se omitida).
 */
export function getLocalDateKey(dateInput: Date | string | number = new Date()): string {
  const d =
    typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna o início do dia local (00:00:00.000) como timestamp para comparações estritas de anterior/posterior.
 */
export function getLocalStartOfDay(dateInput: Date | string | number = new Date()): Date {
  const d =
    typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : new Date(dateInput)
  if (isNaN(d.getTime())) return new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/**
 * Verifica se a data corresponde estritamente ao dia de hoje (no fuso local).
 */
export function isTodayLocal(dateInput: string | Date | undefined | null): boolean {
  if (!dateInput) return false
  const targetKey = getLocalDateKey(dateInput)
  const todayKey = getLocalDateKey(new Date())
  return Boolean(targetKey && targetKey === todayKey)
}

/**
 * Verifica se a data é anterior ao dia de hoje (antes das 00:00 locais de hoje).
 */
export function isPastDayLocal(dateInput: string | Date | undefined | null): boolean {
  if (!dateInput) return false
  const targetKey = getLocalDateKey(dateInput)
  const todayKey = getLocalDateKey(new Date())
  if (!targetKey) return false
  return targetKey < todayKey
}

/**
 * Formata data e hora para exibição amigável em português.
 */
export function formatAppointmentDateBadge(dateInput: string | Date): {
  day: number
  monthShort: string
  timeStr: string
  fullDateStr: string
} {
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) {
    return { day: 0, monthShort: '', timeStr: '', fullDateStr: '' }
  }

  return {
    day: d.getDate(),
    monthShort: d.toLocaleDateString('pt-BR', { month: 'short' }),
    timeStr: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    fullDateStr: d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  }
}
