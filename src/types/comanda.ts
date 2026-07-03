import type { TipoProducto } from './producto'

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

export type ComandaWsMessage =
  | { type: 'comanda_creada'; comanda: Comanda }
  | { type: 'comanda_actualizada'; comanda: Comanda }

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
