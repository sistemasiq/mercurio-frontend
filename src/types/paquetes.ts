import AuditFields from '@/types/shared'

export interface PaqueteProductoItem {
  producto_id: string
  cantidad: number
}

export interface PaqueteProductoIncluido extends PaqueteProductoItem {
  nombre: string
  precio_unitario: string
  tipo: string
}

export interface Paquetes extends AuditFields {
  sucursal_id: string
  nombre: string
  descripcion: string | null
  /** Rango de invitados que soporta el paquete. Filtra qué paquetes se ofrecen
   * en el paso 2 del asistente según los niños capturados en el paso 1. */
  min_invitados: number
  max_invitados: number
  precio_base: string
  /** Tarifa de la pulsera por invitado y por hora:
   * total = precio_base + precio_hora_pulsera × invitados × horas. */
  precio_hora_pulsera: string
  productos_incluidos: PaqueteProductoIncluido[] | null
  /** Reservaciones vigentes que usan este paquete. Solo lo puebla el listado. */
  contrataciones: number
  /** Fecha de la reservación más reciente del paquete. Null si nunca se ha contratado. */
  ultima_contratacion: string | null
}

export interface PaquetesCreate {
  sucursal_id: string
  nombre: string
  descripcion?: string | null
  min_invitados?: number
  max_invitados?: number
  precio_base: string
  precio_hora_pulsera?: string
  productos_incluidos?: PaqueteProductoItem[] | null
}

export interface PaquetesUpdate {
  nombre?: string | null
  descripcion?: string | null
  min_invitados?: number | null
  max_invitados?: number | null
  precio_base?: string | null
  precio_hora_pulsera?: string | null
  activo?: boolean
  productos_incluidos?: PaqueteProductoItem[] | null
}
