export interface Reservacion_productos {
  id: string
  reservacion_id: string
  producto_id: string
  cantidad: number
  precio_unitario: string
  subtotal: string
  notas: string | null
  creado: string
  creado_por: string | null
}

export interface Reservacion_productos_create {
  reservacion_id: string
  producto_id: string
  cantidad: number
  precio_unitario: string
  notas?: string | null
}

export interface Reservacion_productos_update {
  cantidad?: number | null
  precio_unitario?: string | null
  notas?: string | null
}
