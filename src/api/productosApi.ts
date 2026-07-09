import { apiClient } from '@/api/axiosClient'
import type { Producto, ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

export const productosApi = {
  async listar(signal?: AbortSignal): Promise<Producto[]> {
    const { data } = await apiClient.get<Producto[]>('/productos', { signal })
    return data
  },

  async listarAdmin(sucursalId: string): Promise<ProductoAdmin[]> {
    const { data } = await apiClient.get<ProductoAdmin[]>('/productos/admin', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async crear(body: ProductoCreate): Promise<ProductoAdmin> {
    const { data } = await apiClient.post<ProductoAdmin>('/productos', body)
    return data
  },

  async actualizar(productoId: string, body: ProductoUpdate): Promise<ProductoAdmin> {
    const { data } = await apiClient.patch<ProductoAdmin>(`/productos/${productoId}`, body)
    return data
  },

  async eliminar(productoId: string): Promise<void> {
    await apiClient.delete(`/productos/${productoId}`)
  },
}
