/**
 * src/types/comanda.ts
 *
 * Contratos TypeScript que reflejan exactamente el shape que retorna el backend
 * (app/models/comanda.py y app/repositories/comanda_repository.py).
 *
 * Reglas:
 *  - EstadoActualComanda incluye 'T' (ENTREGADO) porque el backend lo soporta
 *    y el KDS necesita hacer la transición L → T.
 *  - DetalleComanda incluye producto_tipo (viene del JOIN con public.productos).
 *  - Comanda incluye fecha_hora (viene del backend, se usa para el timer en KDS).
 *  - DetalleComandaRequest usa notas_especiales (nombre exacto del schema
 *    DetalleCreate en el backend — no 'observaciones').
 */

import type { TipoProducto } from './producto'

// Estados del ciclo de vida de una comanda (códigos del backend)
export type EstadoActualComanda = 'P' | 'E' | 'L' | 'T'

// Detalle de un ítem dentro de una comanda — shape exacto del backend
export interface DetalleComanda {
  id: string
  producto_id: string
  producto_nombre: string | null
  // Viene del JOIN LEFT con public.productos (p.tipo AS producto_tipo)
  // Necesario para que el KDS filtre ítems no consumibles (S, E)
  producto_tipo?: TipoProducto | null
  cantidad: number
  precio_unitario: number
  notas_especiales?: string | null
}

// Shape de la comanda tal como la retorna el backend (asdict de models/Comanda)
export interface Comanda {
  id: string
  ticket_numero?: string
  total_final?: number
  folio?: string
  mesa?: string
  notas_generales?: string
  estado_actual: EstadoActualComanda
  detalles: DetalleComanda[]
  // fecha_hora viene del backend; se usa para el timer de tiempo transcurrido en el KDS
  fecha_hora?: string | null
  // Alias legacy que puede llegar en algunos payloads del WS
  created_at?: string
  updated_at?: string
}

// Mensajes WebSocket del canal de comandas (app/api/routers/comandas.py)
export type ComandaWsMessage =
  { type: 'comanda_creada'; comanda: Comanda } | { type: 'comanda_actualizada'; comanda: Comanda }

// Payload para crear una comanda (POST /api/comandas/)
export interface CrearComandaRequest {
  ticket_numero: string
  total_final: number
  sucursal_id: string
  estado_actual: EstadoActualComanda
  detalles_comanda: DetalleComandaRequest[]
}

// Contrato exacto con DetalleCreate (app/schemas/comanda.py)
// El campo 'producto_id' se mapea al alias 'id' en Pydantic (Field alias).
// notas_especiales: nombre exacto en el backend — NO usar 'observaciones'.
export interface DetalleComandaRequest {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  notas_especiales?: string
}
