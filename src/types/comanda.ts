import type { TipoProducto } from './producto'

export type EstadoComanda = 'pendiente' | 'en_proceso' | 'listo' | 'entregado'

export interface IItemComanda {
  id: string
  nombre: string
  cantidad: number
  precioUnitario: number
  observaciones?: string
}

export interface IComanda {
  id: string
  folio: string
  mesa: string
  meseroId: string
  meseroNombre: string
  estado: EstadoComanda
  items: IItemComanda[]
  notasGenerales?: string
  createdAt: string
  updatedAt: string
}

export type EstadoActualComanda = 'P' | 'E' | 'L'

export interface DetalleComanda {
  id: string
  producto_id: string
  producto_nombre: string | null
  producto_tipo?: TipoProducto | null
  cantidad: number
  precio_unitario: number
  notas_especiales?: string | null
}

export interface Comanda {
  id: string
  ticket_numero?: string
  total_final?: number
  folio?: string
  mesa?: string
  notas_generales?: string
  estado_actual: EstadoActualComanda
  detalles: DetalleComanda[]
  created_at?: string
  updated_at?: string
}

export interface CrearComandaRequest {
  ticket_numero: string
  total_final: number
  sucursal_id: string
  estado_actual: EstadoActualComanda
  detalles_comanda: DetalleComandaRequest[]
}

export interface DetalleComandaRequest {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  observaciones?: string
}
