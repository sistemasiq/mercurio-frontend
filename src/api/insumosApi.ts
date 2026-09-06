import { apiClient } from '@/api/axiosClient'
import type {
  Insumo,
  InsumoAlertas,
  InsumoCreate,
  InsumoRecetaInversa,
  InsumoUpdate,
} from '@/types/insumo'
import type { CogsRenglon } from '@/types/movimientoInventario'

export const insumosApi = {
  async listar(sucursalId: string): Promise<Insumo[]> {
    const { data } = await apiClient.get<Insumo[]>('/insumos', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async estimaciones(sucursalId: string): Promise<InsumoRecetaInversa[]> {
    const { data } = await apiClient.get<InsumoRecetaInversa[]>('/insumos/estimaciones', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async alertas(sucursalId: string): Promise<InsumoAlertas> {
    const { data } = await apiClient.get<InsumoAlertas>('/insumos/alertas', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async reporteCogs(sucursalId: string, desde?: string, hasta?: string): Promise<CogsRenglon[]> {
    const { data } = await apiClient.get<CogsRenglon[]>('/insumos/reporte-cogs', {
      params: { sucursal_id: sucursalId, desde, hasta },
    })
    return data
  },

  async obtener(insumoId: string): Promise<Insumo> {
    const { data } = await apiClient.get<Insumo>(`/insumos/${insumoId}`)
    return data
  },

  async crear(body: InsumoCreate): Promise<Insumo> {
    const { data } = await apiClient.post<Insumo>('/insumos', body)
    return data
  },

  async actualizar(insumoId: string, body: InsumoUpdate): Promise<Insumo> {
    const { data } = await apiClient.patch<Insumo>(`/insumos/${insumoId}`, body)
    return data
  },

  async eliminar(insumoId: string): Promise<void> {
    await apiClient.delete(`/insumos/${insumoId}`)
  },
}
