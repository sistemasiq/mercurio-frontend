import { describe, it, expect } from 'vitest'
import { resolverMetodoPagoId } from '@/utils/metodosPago'
import type { MetodosPago, TipoMetodoPago } from '@/types/metodos_pago'

const metodo = (id: string, nombre: string, tipo: TipoMetodoPago, activo = true) =>
  ({ id, nombre, tipo, activo }) as unknown as MetodosPago

describe('resolverMetodoPagoId', () => {
  const catalogo = [
    metodo('m-e', 'Efectivo MXN', 'E'),
    metodo('m-t-off', 'Terminal vieja', 'T', false),
    metodo('m-t', 'Terminal Banorte', 'T'),
  ]

  it('resuelve por tipo aunque el nombre no coincida con la categoría', () => {
    expect(resolverMetodoPagoId('Tarjeta', catalogo)).toBe('m-t')
    expect(resolverMetodoPagoId('Efectivo', catalogo)).toBe('m-e')
  })

  it('falla si no hay método activo del tipo', () => {
    expect(() => resolverMetodoPagoId('Cupones', catalogo)).toThrow(/Cupones/)
  })

  it('falla si el catálogo está vacío', () => {
    expect(() => resolverMetodoPagoId('Tarjeta', [])).toThrow(/no se han cargado/)
  })
})
