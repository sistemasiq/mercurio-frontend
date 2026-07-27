const formateadorMXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formateadorEntero = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatMXN(valor: number | null | undefined): string {
  return formateadorMXN.format(valor ?? 0)
}

export function formatEntero(valor: number): string {
  return formateadorEntero.format(valor)
}

export function formatDiferencia(diferencia: number): string {
  if (diferencia === 0) return formateadorMXN.format(0)
  const signo = diferencia > 0 ? '+' : ''
  return `${signo}${formateadorMXN.format(diferencia)}`
}

export function claseDiferencia(diferencia: number): string {
  if (diferencia > 0) return 'text-positive'
  if (diferencia < 0) return 'text-negative'
  return 'text-on-surface'
}
