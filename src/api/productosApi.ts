import { apiClient } from '@/api/axiosClient'
import type {
  ProductoAdmin,
  ProductoComboHijo,
  ProductoCreate,
  ProductoUpdate,
} from '@/types/producto'

/**
 * Catálogo visible para quien cobra. A diferencia de /productos/admin, no exige
 * el permiso `inventario:ver` — que el Cajero no tiene — y ya viene acotado a la
 * sucursal del usuario y a productos activos.
 *
 * La respuesta NO trae `activo` ni los campos de auditoría, así que se completa
 * aquí: sin esto, cualquier consumidor que filtre por `p.activo` recibiría
 * `undefined` y descartaría la lista entera en silencio.
 */
async function fetchProductosCatalogo(signal?: AbortSignal): Promise<ProductoAdmin[]> {
  const { data } = await apiClient.get<Omit<ProductoAdmin, 'activo'>[]>('/productos/catalogo', {
    signal,
  })
  return data.map((p) => ({ ...p, activo: true }))
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api'

export function getProductoImagenUrl(imagen?: string | null): string | undefined {
  if (!imagen) return undefined
  if (/^https?:\/\//i.test(imagen)) return imagen
  return `${API_BASE_URL}/${imagen}`
}

export const productosApi = {
  async listarCatalogo(signal?: AbortSignal): Promise<ProductoAdmin[]> {
    return fetchProductosCatalogo(signal)
  },

  async listarAdmin(sucursalId?: string | null, signal?: AbortSignal): Promise<ProductoAdmin[]> {
    const { data } = await apiClient.get<ProductoAdmin[]>('/productos/admin', {
      params: sucursalId ? { sucursal_id: sucursalId } : undefined,
      signal,
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

  async obtenerComboHijos(comboId: string): Promise<ProductoComboHijo[]> {
    const { data } = await apiClient.get<ProductoComboHijo[]>(`/productos/${comboId}/combo-hijos`)
    return data
  },
}
