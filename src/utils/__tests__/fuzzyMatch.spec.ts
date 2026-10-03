import { describe, expect, it } from 'vitest'
import { fuzzyScore } from '@/utils/fuzzyMatch'

describe('fuzzyScore', () => {
  it('devuelve 0 para una consulta vacía (todo coincide)', () => {
    expect(fuzzyScore('', 'Reporte de Stock')).toBe(0)
  })

  it('encuentra las letras en orden aunque no sean contiguas', () => {
    expect(fuzzyScore('rsk', 'Reporte de Stock')).not.toBeNull()
  })

  it('devuelve null cuando alguna letra no aparece en orden', () => {
    expect(fuzzyScore('zzz', 'Reporte de Stock')).toBeNull()
    expect(fuzzyScore('kr', 'Reporte de Stock')).toBeNull()
  })

  it('puntúa mejor (menor) una coincidencia más compacta y temprana', () => {
    const compacta = fuzzyScore('abc', 'abc-resto')
    const dispersa = fuzzyScore('abc', 'a--b--c-resto')
    expect(compacta).not.toBeNull()
    expect(dispersa).not.toBeNull()
    expect(compacta as number).toBeLessThan(dispersa as number)
  })

  it('no distingue mayúsculas/minúsculas', () => {
    expect(fuzzyScore('CAJA', 'Caja (POS)')).toBe(fuzzyScore('caja', 'Caja (POS)'))
  })
})
