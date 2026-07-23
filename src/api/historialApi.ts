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
}

export interface MetodoPagoDetalle {
  metodo_pago_nombre: string
  monto: number
  notas_pago: string | null
}

export interface DetalleOrden {
  comanda_id: string
  ticket_numero: string
  total_final: number
  estado_actual: string
  fecha_hora: string | null
  motivo_cancelacion: string | null
  creado_por_nombre: string | null
  metodos_pago: MetodoPagoDetalle[]
  detalles: DetalleProducto[]
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

  async getDetalle(comandaId: string, signal?: AbortSignal): Promise<DetalleOrden> {
    const { data } = await apiClient.get<DetalleOrden>(`/pagos/detalles/${comandaId}`, { signal })
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
