import { describe, expect, it } from 'vitest'

import { descontarCambio, resolverMetodoPagoId, totalPagado } from './pagos'
import type { AppliedPayment } from '@/types/payments'
import type { MetodosPago } from '@/types/metodos_pago'

const pago = (method: string, amount: number): AppliedPayment => ({
  id: `${method}-${amount}`,
  method,
  amount,
  timestamp: new Date(),
})

describe('descontarCambio', () => {
  it('deja los pagos intactos cuando se cobró el monto exacto', () => {
    const pagos = [pago('Efectivo', 5920)]
    expect(totalPagado(descontarCambio(pagos, 5920))).toBe(5920)
  })

  it('descuenta el cambio devuelto para que no se registre como ingreso', () => {
    // Caso real que rompía el alta: $6,000 entregados por un evento de $5,920.
    // La BD rechaza anticipo > precio_total (chk_reservaciones_anticipo).
    const ajustados = descontarCambio([pago('Efectivo', 6000)], 5920)
    expect(totalPagado(ajustados)).toBe(5920)
  })

  it('nunca deja el total cobrado por encima del total del evento', () => {
    for (const entregado of [5920, 6000, 7000, 10000]) {
      const ajustados = descontarCambio([pago('Efectivo', entregado)], 5920)
      expect(totalPagado(ajustados)).toBeLessThanOrEqual(5920)
    }
  })

  it('descuenta el cambio del efectivo y respeta los otros métodos', () => {
    // De tarjeta no se da cambio, así que el excedente solo puede salir del
    // efectivo: la tarjeta debe conservar su importe íntegro.
    const ajustados = descontarCambio([pago('Tarjeta', 3000), pago('Efectivo', 3000)], 5920)

    expect(totalPagado(ajustados)).toBe(5920)
    expect(ajustados.find((p) => p.method === 'Tarjeta')?.amount).toBe(3000)
    expect(ajustados.find((p) => p.method === 'Efectivo')?.amount).toBe(2920)
  })

  it('elimina el pago que resulta ser puro cambio', () => {
    // $200 en efectivo sobre un evento ya cubierto por tarjeta: los $200 se
    // devuelven completos, así que no debe quedar un movimiento de caja de $0.
    const ajustados = descontarCambio([pago('Tarjeta', 5920), pago('Efectivo', 200)], 5920)

    expect(ajustados).toHaveLength(1)
    expect(ajustados[0]?.method).toBe('Tarjeta')
    expect(totalPagado(ajustados)).toBe(5920)
  })

  it('no altera los pagos originales', () => {
    const pagos = [pago('Efectivo', 6000)]
    descontarCambio(pagos, 5920)
    expect(pagos[0]?.amount).toBe(6000)
  })

  it('deja pasar un anticipo parcial sin tocarlo', () => {
    const ajustados = descontarCambio([pago('Efectivo', 1770)], 5900)
    expect(totalPagado(ajustados)).toBe(1770)
  })
})

describe('resolverMetodoPagoId', () => {
  const metodos: MetodosPago[] = [
    { id: 'id-efectivo', nombre: 'Efectivo', descripcion: null, tipo: 'E', activo: true },
    { id: 'id-tarjeta', nombre: 'Tarjeta', descripcion: null, tipo: 'T', activo: true },
    { id: 'id-cupon-viejo', nombre: 'Cupones', descripcion: null, tipo: 'C', activo: false },
  ]

  it('traduce la categoría del teclado al id del método configurado', () => {
    expect(resolverMetodoPagoId('Efectivo', metodos)).toBe('id-efectivo')
    expect(resolverMetodoPagoId('Tarjeta', metodos)).toBe('id-tarjeta')
  })

  it('ignora los métodos inactivos', () => {
    // Cobrar contra un método dado de baja descuadraría el corte por método.
    expect(() => resolverMetodoPagoId('Cupones', metodos)).toThrow(/Cupones/)
  })

  it('falla con un mensaje accionable si la sucursal no tiene ese método', () => {
    expect(() => resolverMetodoPagoId('Lealtad', metodos)).toThrow(
      /No hay un método de pago activo de tipo "Lealtad"/,
    )
  })
})
