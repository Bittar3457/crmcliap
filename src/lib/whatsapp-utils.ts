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

export function buildWhatsAppLink(phone: string, text?: string): string {
  let cleanPhone = phone.replace(/\D/g, '')
  if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11 && cleanPhone.length > 0) {
    cleanPhone = '55' + cleanPhone
  }
  if (!text) {
    return `https://wa.me/${cleanPhone}`
  }
  const encodedText = encodeURIComponent(text)
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Abre o deep link do WhatsApp sempre em nova aba do navegador com noopener e noreferrer.
 * Evita o erro ERR_BLOCKED_BY_RESPONSE quando a aplicação roda dentro de iframes (como a pré-visualização).
 */
export function openWhatsAppExternal(urlOrPhone: string, text?: string): Window | null {
  const finalUrl =
    urlOrPhone.startsWith('http://') || urlOrPhone.startsWith('https://')
      ? urlOrPhone
      : buildWhatsAppLink(urlOrPhone, text)

  // 1. Tenta abrir diretamente com target _blank e features de segurança
  try {
    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer')
    if (newWindow) {
      newWindow.opener = null
      return newWindow
    }
  } catch (err) {
    console.warn('Falha na tentativa direta de window.open:', err)
  }

  // 2. Fallback via elemento âncora programático para navegadores com restrição em iframe
  try {
    const a = document.createElement('a')
    a.href = finalUrl
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return null
  } catch (err) {
    console.warn('Falha no fallback de clique de âncora:', err)
    return null
  }
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
