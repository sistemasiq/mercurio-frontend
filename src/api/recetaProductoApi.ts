import { apiClient } from '@/api/axiosClient'
import type { RecetaItem, RecetaItemUpdate } from '@/types/recetaProducto'

export const recetaProductoApi = {
  async listar(productoId: string): Promise<RecetaItem[]> {
    const { data } = await apiClient.get<RecetaItem[]>(`/productos/${productoId}/receta`)
    return data
  },

  async upsert(productoId: string, insumoId: string, body: RecetaItemUpdate): Promise<RecetaItem> {
    const { data } = await apiClient.put<RecetaItem>(
      `/productos/${productoId}/receta/${insumoId}`,
      body,
    )
    return data
  },

  async eliminar(productoId: string, insumoId: string): Promise<void> {
    await apiClient.delete(`/productos/${productoId}/receta/${insumoId}`)
  },
}
