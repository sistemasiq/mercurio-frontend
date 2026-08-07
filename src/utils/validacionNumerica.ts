/**
 * validacionNumerica.ts
 *
 * Los inputs numéricos nativos (type="number") permiten teclear "e", "+", "-"
 * y otros caracteres que rompen el parseo en el backend (Pydantic espera int/Decimal
 * puros). Este helper bloquea esas teclas al escribir y valida en vivo para dar
 * feedback visual (borde rojo) si algo inválido llegó de todos modos (ej. pegar texto).
 */

const REGEX_ENTERO = /^\d*$/
const REGEX_DECIMAL = /^\d*\.?\d*$/

/** Bloquea teclas no numéricas mientras se escribe. Úsalo en @keydown. */
export function filtrarTeclaEntero(evento: KeyboardEvent): void {
  if (evento.ctrlKey || evento.metaKey || evento.key.length > 1) return
  if (!/^\d$/.test(evento.key)) evento.preventDefault()
}

/** Igual que filtrarTeclaEntero pero permite un único punto decimal. */
export function filtrarTeclaDecimal(evento: KeyboardEvent): void {
  if (evento.ctrlKey || evento.metaKey || evento.key.length > 1) return
  const input = evento.target as HTMLInputElement
  if (evento.key === '.' && !input.value.includes('.')) return
  if (!/^\d$/.test(evento.key)) evento.preventDefault()
}

/** Regla Quasar (:rules) — cantidad de billetes/monedas: solo dígitos. */
export function reglaEntero(valor: string | number | null): boolean | string {
  if (valor === null || valor === '') return true
  return (
    REGEX_ENTERO.test(String(valor)) || 'Solo se permiten dígitos (0-9), sin espacios ni letras.'
  )
}

/** Regla Quasar (:rules) — montos de métodos de pago: dígitos + un punto decimal. */
export function reglaDecimal(valor: string | number | null): boolean | string {
  if (valor === null || valor === '') return true
  return (
    REGEX_DECIMAL.test(String(valor)) ||
    'Solo se permiten dígitos (0-9) y un punto decimal, sin espacios ni letras.'
  )
}
