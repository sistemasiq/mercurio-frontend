import { describe, expect, it } from 'vitest'
import { horasFacturables } from '@/utils/horario'

describe('horasFacturables', () => {
  it('calcula horas exactas', () => {
    expect(horasFacturables('10:00', '12:00')).toBe(2)
  })

  it('redondea hacia arriba por hora iniciada, considerando minutos', () => {
    expect(horasFacturables('10:30', '12:00')).toBe(2)
    expect(horasFacturables('10:00', '11:30')).toBe(2)
    expect(horasFacturables('10:00', '10:15')).toBe(1)
  })

  it('acepta el formato HH:mm:ss', () => {
    expect(horasFacturables('10:00:00', '13:00:00')).toBe(3)
  })

  it('cruza la medianoche', () => {
    expect(horasFacturables('22:00', '01:00')).toBe(3)
  })

  it('devuelve el minimo (sin NaN) con entradas vacias o mal formadas', () => {
    expect(horasFacturables('', '')).toBe(1)
    expect(horasFacturables('abc', '12:00')).toBe(1)
    expect(horasFacturables('10:00', 'xx:yy')).toBe(1)
  })
})
