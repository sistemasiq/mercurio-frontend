import { apiClient } from '@/api/axiosClient'
import type { ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

async function fetchProductosCatalogo(signal?: AbortSignal): Promise<ProductoAdmin[]> {
  const { data } = await apiClient.get<ProductoAdmin[]>('/productos/catalogo', { signal })
  return data
}

export const productosApi = {
  async listarCatalogo(signal?: AbortSignal): Promise<ProductoAdmin[]> {
    return fetchProductosCatalogo(signal)
  },

  async listarAdmin(signal?: AbortSignal): Promise<ProductoAdmin[]> {
    const { data } = await apiClient.get<ProductoAdmin[]>('/productos/admin', { signal })
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
