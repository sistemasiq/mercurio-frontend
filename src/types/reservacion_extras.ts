export interface Reservacion_extras {
  id: string
  reservacion_id: string
  extra_id: string
  cantidad: number
  precio_unitario: string
  subtotal: string
  creado: string
  creado_por: string | null
}

export interface Reservacion_extras_create {
  reservacion_id: string
  extra_id: string
  cantidad: number
  precio_unitario: string
}

export interface Reservacion_extras_update {
  cantidad?: number | null
  precio_unitario?: string | null
}
