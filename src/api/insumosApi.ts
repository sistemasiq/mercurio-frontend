import { apiClient } from '@/api/axiosClient'
import type { Insumo, InsumoCreate, InsumoUpdate } from '@/types/insumo'

export const insumosApi = {
  async listar(sucursalId: string): Promise<Insumo[]> {
    const { data } = await apiClient.get<Insumo[]>('/insumos', {
      params: { sucursal_id: sucursalId },
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
