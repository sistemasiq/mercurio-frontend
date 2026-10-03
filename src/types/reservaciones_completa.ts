/**
 * Shapes de POST /reservaciones/completa (QA #10): alta atómica de la
 * reservación junto con sus extras, productos y pagos en una sola
 * transacción. Sustituye al loop de requests sueltos que hacía
 * NuevaReservacionPage.vue (ver `confirmarReservacion`).
 */

import type { Reservaciones, ReservacionesCreate } from '@/types/reservaciones'
import type { Reservacion_extras } from '@/types/reservacion_extras'
import type { Reservacion_productos } from '@/types/reservacion_productos'
import type { Pagos_reservacion, PagoReservacionItem } from '@/types/pagos_reservacion'

export interface ReservacionCompletaExtraItem {
  extra_id: string
  cantidad: number
  precio_unitario: string
}

export interface ReservacionCompletaProductoItem {
  producto_id: string
  cantidad: number
  precio_unitario: string
  notas?: string | null
}

export interface ReservacionCompletaRequest {
  reservacion: ReservacionesCreate
  extras?: ReservacionCompletaExtraItem[]
  productos?: ReservacionCompletaProductoItem[]
  pagos?: PagoReservacionItem[]
  cambio?: string
}

export interface ReservacionCompletaResponse {
  reservacion: Reservaciones
  extras: Reservacion_extras[]
  productos: Reservacion_productos[]
  pagos: Pagos_reservacion[]
  cambio: string
  advertencia_efectivo?: string | null
}
