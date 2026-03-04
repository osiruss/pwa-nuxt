export function cleanRut(input: string): string {
  return (input || '').toUpperCase().replace(/[^0-9K]/g, '')
}

export function formatRut(input: string): string {
  const c = cleanRut(input)
  if (c.length <= 1) return c

  const body = c.slice(0, -1)
  const dv = c.slice(-1)

  // miles con puntos
  const bodyWithDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${bodyWithDots}-${dv}`
}

export function calcRutDV(body: string): string {
  // body: solo números
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const mod = 11 - (sum % 11)
  if (mod === 11) return '0'
  if (mod === 10) return 'K'
  return String(mod)
}

export function isValidRut(input: string): boolean {
  const c = cleanRut(input)
  if (c.length < 2) return false

  const body = c.slice(0, -1)
  const dv = c.slice(-1)

  if (!/^\d+$/.test(body)) return false
  if (!/^[0-9K]$/.test(dv)) return false
  if (body.length < 7 || body.length > 8) return false // típico: 7-8 dígitos

  return calcRutDV(body) === dv
}