import { describe, expect, it } from 'vitest'

import {
  calcularPulseras,
  dentroDePlazo,
  fechaLimiteLiquidacion,
  recalcularReservacion,
  sumarHoras,
} from './reservacionPrecio'
import type { Reservaciones } from '@/types/reservaciones'

const RESERVACION = {
  id: 'r1',
  sucursal_id: 's1',
  tipo_evento_id: 't1',
  paquete_id: 'p1',
  nombre_cliente: 'Ana',
  apellidos_cliente: null,
  telefono_cliente: '3310000000',
  email_cliente: null,
  nombre_festejado: null,
  edad_festejado: null,
  fecha_evento: '2027-02-25',
  hora_inicio: '15:00:00',
  hora_fin: '18:00:00',
  numero_personas: 10,
  precio_base: '5000',
  precio_personas_extra: '1500', // 50/hora × 10 invitados × 3 horas
  horas_reservadas: 3,
  precio_horas: '0',
  precio_productos: '200',
  precio_extras: '0',
  descuento: '0',
  precio_total: '6700',
  anticipo: '2010',
  saldo_pendiente: '4690',
  estado: 'confirmada',
  comanda_enviada: false,
  notas: null,
  activo: true,
  creado: '2026-08-01T00:00:00Z',
  creado_por: null,
  modificado: null,
  modificado_por: null,
} as unknown as Reservaciones

describe('calcularPulseras', () => {
  it('multiplica tarifa por invitados y por horas', () => {
    expect(calcularPulseras(50, 10, 3)).toBe(1500)
  })

  it('cobra al menos una hora aunque llegue cero', () => {
    // Un horario mal capturado no debe anular el cargo de pulseras.
    expect(calcularPulseras(50, 10, 0)).toBe(500)
  })
})

describe('recalcularReservacion', () => {
  it('reconstruye el total al subir el número de invitados', () => {
    const r = recalcularReservacion(RESERVACION, 50, { invitados: 20 })
    // 5000 base + (50 × 20 × 3) pulseras + 200 productos = 8200
    expect(r.precio_personas_extra).toBe('3000')
    expect(r.precio_total).toBe('8200')
    expect(r.anticipoExcede).toBe(false)
  })

  it('reconstruye el total al agregar horas', () => {
    const r = recalcularReservacion(RESERVACION, 50, { horas: 5 })
    // 5000 + (50 × 10 × 5) + 200 = 7700
    expect(r.horas_reservadas).toBe(5)
    expect(r.precio_total).toBe('7700')
  })

  it('avisa cuando el total nuevo quedaría por debajo de lo ya pagado', () => {
    // Con un anticipo de 2010, bajar a 1 invitado deja el total en 5250...
    expect(recalcularReservacion(RESERVACION, 50, { invitados: 1 }).anticipoExcede).toBe(false)
    // ...pero con un evento casi liquidado sí se rompe la restricción de la BD.
    const casiLiquidada = { ...RESERVACION, anticipo: '6600' } as Reservaciones
    expect(recalcularReservacion(casiLiquidada, 50, { invitados: 1 }).anticipoExcede).toBe(true)
  })

  it('reevalúa las pulseras con la tarifa vigente del paquete', () => {
    // La fórmula es tarifa × invitados × horas sobre el total, no un
    // incremental: si el paquete cambió de tarifa, el evento se recalcula
    // completo a la tarifa de hoy.
    const r = recalcularReservacion(RESERVACION, 125, { horas: 4 })
    expect(r.precio_personas_extra).toBe('5000') // 125 × 10 × 4
    expect(r.precio_total).toBe('10200') // 5000 + 5000 + 200
  })

  it('trata como una hora las reservaciones antiguas con 0 horas', () => {
    const legado = { ...RESERVACION, horas_reservadas: 0 } as Reservaciones
    expect(recalcularReservacion(legado, 50, {}).precio_personas_extra).toBe('500')
  })

  it('no arrastra el total anterior: lo reconstruye desde las partes', () => {
    // Volver al valor original tras varios cambios debe dar exactamente el total
    // original, sin desviaciones acumuladas.
    const subida = recalcularReservacion(RESERVACION, 50, { invitados: 40 })
    expect(subida.precio_total).toBe('11200')
    const regreso = recalcularReservacion(RESERVACION, 50, { invitados: 10 })
    expect(regreso.precio_total).toBe(RESERVACION.precio_total)
  })
})

describe('sumarHoras', () => {
  it('suma horas al horario de fin', () => {
    expect(sumarHoras('18:00:00', 2)).toBe('20:00:00')
  })

  it('se topa antes de medianoche en vez de pasar al día siguiente', () => {
    // La reservación guarda una sola fecha y exige hora_fin > hora_inicio;
    // cruzar la medianoche rompería esa restricción.
    expect(sumarHoras('22:00:00', 5)).toBe('23:59:00')
  })
})

describe('plazo de liquidación', () => {
  it('la fecha límite es una semana antes del evento', () => {
    expect(fechaLimiteLiquidacion('2027-02-25').toISOString().slice(0, 10)).toBe('2027-02-18')
  })

  it('permite editar mientras falte más de una semana', () => {
    expect(dentroDePlazo('2027-02-25', new Date(2027, 1, 17))).toBe(true)
  })

  it('bloquea el mismo día del límite y después', () => {
    expect(dentroDePlazo('2027-02-25', new Date(2027, 1, 18))).toBe(false)
    expect(dentroDePlazo('2027-02-25', new Date(2027, 1, 24))).toBe(false)
  })
})
