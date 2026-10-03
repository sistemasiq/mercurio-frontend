import { apiClient } from '@/api/axiosClient'
import type {
  Insumo,
  InsumoAlertas,
  InsumoCreate,
  InsumoRecetaInversa,
  InsumoUpdate,
} from '@/types/insumo'
import type { CogsRenglon, ResumenCogs } from '@/types/movimientoInventario'

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

  async resumenCogs(sucursalId: string, desde?: string, hasta?: string): Promise<ResumenCogs> {
    const { data } = await apiClient.get('/insumos/reporte-cogs/resumen', {
      params: { sucursal_id: sucursalId, desde, hasta },
    })
    return {
      ventasTotales: Number(data.ventas_totales),
      costoVentas: Number(data.costo_ventas),
      margen: Number(data.margen),
      merma: Number(data.merma),
    }
  },

  async exportarStock(sucursalId: string): Promise<Blob> {
    const { data } = await apiClient.get('/insumos/export', {
      params: { sucursal_id: sucursalId },
      responseType: 'blob',
    })
    return data as Blob
  },

  async exportarCogs(sucursalId: string, desde?: string, hasta?: string): Promise<Blob> {
    const { data } = await apiClient.get('/insumos/reporte-cogs/export', {
      params: { sucursal_id: sucursalId, desde, hasta },
      responseType: 'blob',
    })
    return data as Blob
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
