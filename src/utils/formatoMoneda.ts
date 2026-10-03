/**
 * formatoMoneda.ts
 *
 * Helper centralizado para formatear montos en pesos mexicanos (MXN).
 * Todos los componentes del módulo de Cierre de Caja deben importar
 * estas funciones en lugar de instanciar Intl.NumberFormat localmente.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Formateadores estáticos (instanciados una sola vez)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea un número como moneda MXN.
 * @example formatMXN(1500) → "$1,500.00"
 * @example formatMXN(null) → "$0.00"
 */
export function formatMXN(valor: number | null | undefined): string {
  return formateadorMXN.format(valor ?? 0)
}

/**
 * Formatea un entero con separadores de miles.
 * Útil para mostrar denominaciones de billetes/monedas.
 * @example formatEntero(1000) → "1,000"
 */
export function formatEntero(valor: number): string {
  return formateadorEntero.format(valor)
}

/**
 * Formatea una diferencia (positiva, negativa o cero) con signo explícito.
 * @example formatDiferencia(150)  → "+$150.00"
 * @example formatDiferencia(-75) → "-$75.00"
 * @example formatDiferencia(0)   → "$0.00"
 */
export function formatDiferencia(diferencia: number): string {
  if (diferencia === 0) return formateadorMXN.format(0)
  const signo = diferencia > 0 ? '+' : ''
  return `${signo}${formateadorMXN.format(diferencia)}`
}

/**
 * Devuelve la clase CSS semántica según el signo de la diferencia.
 * Compatible con las variables CSS del theme Material Design del proyecto.
 */
export function claseDiferencia(diferencia: number): string {
  if (diferencia > 0) return 'text-positive'
  if (diferencia < 0) return 'text-negative'
  return 'text-on-surface'
}
