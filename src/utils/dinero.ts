/**
 * dinero.ts
 *
 * Utilidades para aritmética monetaria. Los montos se manejan en pesos con dos
 * decimales; sin redondear, sumas como 0.1 + 0.2 o 3 × 33.30 dejan residuos
 * flotantes (0.30000000000000004, 99.8999…) que rompen comparaciones exactas.
 */

/** Diferencia máxima (medio centavo) para considerar dos montos iguales. */
export const TOLERANCIA_MONTO = 0.005

/** Redondea a 2 decimales. Valores no finitos (NaN, Infinity) devuelven 0. */
export const redondear2 = (n: number): number => {
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Convierte pesos a centavos enteros. */
export const aCentavos = (n: number): number => Math.round(redondear2(n) * 100)

/** Convierte centavos enteros a pesos con 2 decimales. */
export const desdeCentavos = (c: number): number => (Number.isFinite(c) ? Math.round(c) / 100 : 0)
