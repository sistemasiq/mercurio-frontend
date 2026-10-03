import { apiClient } from '@/api/axiosClient'
import type { ITransaccion } from '@/types/transaccion'

export interface DetalleProducto {
  id: string
  producto_nombre: string
  cantidad: number
  precio_unitario: number
  importe: number
  notas_especiales: string | null
  nombre_combo_padre: string | null
  // Id de la instancia de combo a la que pertenece el hijo (puede faltar en órdenes viejas)
  id_combo_padre?: string | null
}

export interface MetodoPagoDetalle {
  metodo_pago_nombre: string
  monto: number
  notas_pago: string | null
  /** Últimos 4 dígitos de la tarjeta, opcionales (B9 B.1). */
  ultimos4?: string | null
}

export interface DetalleOrden {
  tipo_origen: 'comanda' | 'estancia' | 'reservacion'
  referencia_id: string
  titulo: string
  total_final: number
  estado_actual: string
  fecha_hora: string | null
  motivo_cancelacion: string | null
  creado_por_nombre: string | null
  metodos_pago: MetodoPagoDetalle[]
  detalles: DetalleProducto[]
  comanda_id: string | null
  ticket_numero: string | null
  nombre_cliente: string | null
  /** Puntos de lealtad ganados por esta venta; null si no aplica (B9 B.3). */
  puntos_ganados?: number | null
  /** Mesa del pedido, opcional (B9 B.2; solo aplica a comandas). */
  mesa?: string | null
}

export interface Estadisticas {
  total_ventas: number
  total_ordenes: number
  ticket_promedio: number
}

export const historialApi = {
  async listar(
    filtro: string,
    estado: string,
    signal?: AbortSignal,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<ITransaccion[]> {
    const params: Record<string, string> = { filtro, estado }
    if (fechaInicio) params.fecha_inicio = fechaInicio
    if (fechaFin) params.fecha_fin = fechaFin
    const { data } = await apiClient.get<ITransaccion[]>('/pagos/historial', {
      params,
      signal,
    })
    return data
  },

  async getDetalle(
    tipoOrigen: string,
    referenciaId: string,
    signal?: AbortSignal,
  ): Promise<DetalleOrden> {
    const { data } = await apiClient.get<DetalleOrden>(
      `/pagos/detalles/${tipoOrigen}/${referenciaId}`,
      { signal },
    )
    return data
  },

  async getEstadisticas(
    filtro: string,
    signal?: AbortSignal,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<Estadisticas> {
    const params: Record<string, string> = { filtro }
    if (fechaInicio) params.fecha_inicio = fechaInicio
    if (fechaFin) params.fecha_fin = fechaFin
    const { data } = await apiClient.get<Estadisticas>('/pagos/estadisticas', {
      params,
      signal,
    })
    return data
  },
}
