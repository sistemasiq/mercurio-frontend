import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TicketReservacion from './TicketReservacion.vue'
import type { TicketReservacionProps } from '@/types/ticketReservacion'

const BASE: TicketReservacionProps = {
  folio: 'c82b16d2-0f90-40b4-a36c-23ad92c0a77f',
  sucursal: 'La Piedad Centro',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '3310000000',
  clienteEmail: null,
  tipoEvento: 'Cumpleaños Infantil',
  fechaEvento: '20 de agosto, 2026',
  horario: '15:00 - 18:00',
  numeroNinos: 9,
  paqueteNombre: 'PAQUETE HERO',
  conceptos: [
    { descripcion: 'Paquete PAQUETE HERO', importe: 5000 },
    { descripcion: 'Pulseras (9)', importe: 900 },
  ],
  total: 5900,
  anticipo: 1770,
  metodosPago: 'Efectivo',
}

const montar = (extra: Partial<TicketReservacionProps> = {}) =>
  mount(TicketReservacion, { props: { ...BASE, ...extra } })

describe('TicketReservacion', () => {
  it('muestra un folio corto en mayúsculas, dictable por teléfono', () => {
    // El UUID completo es inservible para leerlo en voz alta al cliente.
    expect(montar().text()).toContain('C82B16D2')
  })

  it('imprime cada renglón del desglose con su importe', () => {
    const texto = montar().text()
    expect(texto).toContain('Paquete PAQUETE HERO')
    expect(texto).toContain('$5,000.00')
    expect(texto).toContain('Pulseras (9)')
    expect(texto).toContain('$900.00')
    expect(texto).toContain('$5,900.00')
  })

  it('calcula el saldo pendiente cuando el anticipo es parcial', () => {
    const texto = montar().text()
    expect(texto).toContain('Anticipo recibido')
    expect(texto).toContain('Saldo pendiente')
    expect(texto).toContain('$4,130.00') // 5900 - 1770
    expect(texto).toContain('El saldo se liquida el día del evento.')
  })

  it('marca el evento como liquidado cuando se cubre el total', () => {
    const texto = montar({ anticipo: 5900 }).text()
    expect(texto).toContain('Liquidado')
    expect(texto).toContain('Sin saldo pendiente')
    // La nota de liquidar después no debe aparecer si ya no se debe nada.
    expect(texto).not.toContain('El saldo se liquida el día del evento.')
  })

  it('nunca muestra un saldo negativo si se cobró de más', () => {
    // El cajero puede capturar un monto mayor al total; el ticket no debe
    // imprimir "-$100.00" como si el evento debiera dinero al cliente.
    const texto = montar({ anticipo: 6000 }).text()
    expect(texto).toContain('$0.00')
    expect(texto).not.toContain('-$')
  })

  it('omite el correo cuando el cliente no lo dio', () => {
    expect(montar().text()).not.toContain('Correo')
    expect(montar({ clienteEmail: 'juan@ejemplo.com' }).text()).toContain('juan@ejemplo.com')
  })
})
