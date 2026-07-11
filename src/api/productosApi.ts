import { apiClient } from '@/api/axiosClient'
import type { Producto, ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

export function getProductoImagenUrl(imagen?: string | null): string | undefined {
  return imagen ? `${API_BASE_URL}/api/${imagen}` : undefined
}

export const productosApi = {
  async listar(sucursalId: string, signal?: AbortSignal): Promise<Producto[]> {
    const { data } = await apiClient.get<Producto[]>('/productos', {
      params: { sucursal_id: sucursalId },
      signal,
    })
    return data
  },

  async listarAdmin(sucursalId: string): Promise<ProductoAdmin[]> {
    const { data } = await apiClient.get<ProductoAdmin[]>('/productos/admin', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async crear(body: ProductoCreate, imagen?: File | null): Promise<ProductoAdmin> {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(body))
    if (imagen) formData.append('imagen', imagen)

    const { data } = await apiClient.post<ProductoAdmin>('/productos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async actualizar(
    productoId: string,
    body: ProductoUpdate,
    imagen?: File | null,
  ): Promise<ProductoAdmin> {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(body))
    if (imagen) formData.append('imagen', imagen)

    const { data } = await apiClient.patch<ProductoAdmin>(`/productos/${productoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async eliminar(productoId: string): Promise<void> {
    await apiClient.delete(`/productos/${productoId}`)
  },

  async reactivar(productoId: string): Promise<ProductoAdmin> {
    const formData = new FormData()
    formData.append('payload', JSON.stringify({ activo: true }))

    const { data } = await apiClient.patch<ProductoAdmin>(`/productos/${productoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
