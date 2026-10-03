import type { Reservaciones } from '@/types/reservaciones'

/** Días antes del evento en que debe quedar liquidado. Después ya no se edita. */
export const DIAS_LIMITE_LIQUIDACION = 7

/**
 * Fecha límite para liquidar (y para modificar) una reservación: una semana
 * antes del evento. Pasado ese punto la reservación se cancela sola si sigue
 * debiendo, así que tampoco tiene sentido seguir cambiándole el alcance.
 */
export function fechaLimiteLiquidacion(fechaEvento: string): Date {
  const limite = new Date(`${fechaEvento}T00:00:00`)
  limite.setDate(limite.getDate() - DIAS_LIMITE_LIQUIDACION)
  return limite
}

/** true si la reservación todavía está dentro del plazo para modificarse. */
export function dentroDePlazo(fechaEvento: string, hoy = new Date()): boolean {
  const inicioDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return inicioDeHoy < fechaLimiteLiquidacion(fechaEvento)
}

const num = (v: string | number): number => (typeof v === 'number' ? v : parseFloat(v) || 0)

/**
 * Recalcula el total de una reservación a partir de sus partes.
 *
 * Se reconstruye desde los componentes en vez de sumar o restar diferencias
 * sobre el total anterior: así una edición no arrastra errores de redondeo de
 * las anteriores, y el total siempre corresponde a lo que muestra el desglose.
 *
 * `precio_horas` se conserva tal cual porque es histórico: pertenece a
 * reservaciones levantadas cuando el paquete cobraba una tarifa por hora de
 * salón (antes de la migración 034). Las nuevas lo traen en cero.
 */
export function calcularTotal(partes: {
  precio_base: string | number
  precio_pulseras: string | number
  precio_horas: string | number
  precio_productos: string | number
  precio_extras: string | number
  descuento: string | number
}): number {
  return (
    num(partes.precio_base) +
    num(partes.precio_pulseras) +
    num(partes.precio_horas) +
    num(partes.precio_productos) +
    num(partes.precio_extras) -
    num(partes.descuento)
  )
}

/** Cargo de pulseras: tarifa por hora × invitados × horas del evento. */
export function calcularPulseras(
  precioHoraPulsera: string | number,
  invitados: number,
  horas: number,
): number {
  return num(precioHoraPulsera) * invitados * Math.max(1, horas)
}

export interface CambioReservacion {
  numero_personas: number
  horas_reservadas: number
  precio_personas_extra: string
  precio_total: string
}

/**
 * Calcula cómo queda una reservación al cambiarle invitados y/u horas.
 *
 * Devuelve también `anticipoExcede`: si el total nuevo queda por debajo de lo
 * ya pagado, la BD rechaza la actualización (`chk_reservaciones_anticipo`:
 * anticipo <= precio_total). Quien llame debe impedir el guardado en ese caso
 * en vez de dejar que falle contra la base.
 */
export function recalcularReservacion(
  reservacion: Reservaciones,
  precioHoraPulsera: string | number,
  cambios: { invitados?: number; horas?: number },
): CambioReservacion & { anticipoExcede: boolean; totalAnterior: number } {
  const invitados = cambios.invitados ?? reservacion.numero_personas
  const horas = Math.max(1, cambios.horas ?? reservacion.horas_reservadas)

  const pulseras = calcularPulseras(precioHoraPulsera, invitados, horas)
  const total = calcularTotal({
    precio_base: reservacion.precio_base,
    precio_pulseras: pulseras,
    precio_horas: reservacion.precio_horas,
    precio_productos: reservacion.precio_productos,
    precio_extras: reservacion.precio_extras,
    descuento: reservacion.descuento,
  })

  return {
    numero_personas: invitados,
    horas_reservadas: horas,
    precio_personas_extra: String(pulseras),
    precio_total: String(total),
    anticipoExcede: total < num(reservacion.anticipo),
    totalAnterior: num(reservacion.precio_total),
  }
}

/**
 * Suma horas a la hora de fin. Devuelve "HH:mm:ss".
 *
 * Se topa en 23:59:59 en vez de pasar al día siguiente: la reservación guarda
 * una sola fecha y un horario que debe cumplir `hora_fin > hora_inicio`, así
 * que cruzar la medianoche rompería esa restricción.
 */
export function sumarHoras(horaFin: string, horas: number): string {
  const [h = 0, m = 0] = horaFin.split(':').map(Number)
  const minutosTotales = Math.min(h * 60 + m + horas * 60, 23 * 60 + 59)
  const hh = String(Math.floor(minutosTotales / 60)).padStart(2, '0')
  const mm = String(minutosTotales % 60).padStart(2, '0')
  return `${hh}:${mm}:00`
}
