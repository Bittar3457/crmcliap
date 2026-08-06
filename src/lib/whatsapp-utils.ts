export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  return phone
}

export function buildWhatsAppLink(phone: string, text: string): string {
  let cleanPhone = phone.replace(/\D/g, '')
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
    cleanPhone = '55' + cleanPhone
  }
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

export function calculateAge(birthDateStr?: string): string {
  if (!birthDateStr) return 'Não informada'
  const birth = new Date(birthDateStr)
  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  if (years === 1) {
    return `1 ano e ${months} ${months === 1 ? 'mês' : 'meses'}`
  }
  return `${years} anos`
}
