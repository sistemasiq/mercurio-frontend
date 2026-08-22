export interface Pagos_reservacion {
  id: string
  reservacion_id: string
  metodo_pago_id: string
  monto: string
  notas: string | null
  fecha_pago: string
  creado_por: string | null
}

export interface Pagos_reservacion_create {
  reservacion_id: string
  metodo_pago_id: string
  monto: string
  notas?: string | null
}

export interface Pagos_reservacion_update {
  metodo_pago_id?: string | null
  monto?: string | null
  notas?: string | null
}

export interface PagoReservacionItem {
  metodo_pago_id: string
  monto: string
  notas?: string | null
}

export interface Pagos_reservacion_completar_request {
  reservacion_id: string
  pagos: PagoReservacionItem[]
  cambio?: string
}

export interface Pagos_reservacion_completar_response {
  pagos: Pagos_reservacion[]
  cambio: string
}
