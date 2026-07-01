import { apiClient } from '@/api/axiosClient'
import type { Producto } from '@/types/producto'

export async function obtenerProductos(signal?: AbortSignal): Promise<Producto[]> {
  const response = await apiClient.get<Producto[]>('/productos/', { signal })
  return response.data.map((producto) => ({
    ...producto,
    precio_unitario: Number(producto.precio_unitario),
  }))
}
