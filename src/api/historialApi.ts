import { apiClient } from '@/api/axiosClient'
import type { ITransaccion } from '@/types/transaccion'

export interface DetalleProducto {
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
  async listar(filtro: string, estado: string, signal?: AbortSignal): Promise<ITransaccion[]> {
    const { data } = await apiClient.get<ITransaccion[]>('/pagos/historial', {
      params: { filtro, estado },
      signal,
    })
    return data
  },

  async getDetalle(comandaId: string, signal?: AbortSignal): Promise<DetalleOrden> {
    const { data } = await apiClient.get<DetalleOrden>(`/pagos/detalles/${comandaId}`, { signal })
    return data
  },

  async getEstadisticas(filtro: string, signal?: AbortSignal): Promise<Estadisticas> {
    const { data } = await apiClient.get<Estadisticas>('/pagos/estadisticas', {
      params: { filtro },
      signal,
    })
    return data
  },
}
