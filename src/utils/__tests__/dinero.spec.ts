import { describe, expect, it } from 'vitest'

import { TOLERANCIA_MONTO, aCentavos, desdeCentavos, redondear2 } from '../dinero'

describe('dinero', () => {
  it('redondear2 elimina el residuo flotante de 0.1 + 0.2', () => {
    expect(redondear2(0.1 + 0.2)).toBe(0.3)
  })

  it('redondear2 corrige 3 × 33.30', () => {
    expect(3 * 33.3).not.toBe(99.9)
    expect(redondear2(3 * 33.3)).toBe(99.9)
  })

  it('redondear2 maneja negativos', () => {
    expect(redondear2(-0.1 - 0.2)).toBe(-0.3)
    expect(redondear2(-12.344)).toBe(-12.34)
  })

  it('redondear2 devuelve 0 con NaN o Infinity', () => {
    expect(redondear2(NaN)).toBe(0)
    expect(redondear2(Infinity)).toBe(0)
  })

  it('aCentavos y desdeCentavos son inversas', () => {
    expect(aCentavos(99.9)).toBe(9990)
    expect(aCentavos(3 * 33.3)).toBe(9990)
    expect(aCentavos(-0.3)).toBe(-30)
    expect(aCentavos(NaN)).toBe(0)
    expect(desdeCentavos(9990)).toBe(99.9)
    expect(desdeCentavos(NaN)).toBe(0)
  })

  it('TOLERANCIA_MONTO es medio centavo', () => {
    expect(TOLERANCIA_MONTO).toBe(0.005)
  })
})
