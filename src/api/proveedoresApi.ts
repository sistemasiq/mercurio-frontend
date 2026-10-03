import { apiClient } from '@/api/axiosClient'
import type { Proveedor, ProveedorCreate, ProveedorUpdate } from '@/types/proveedor'

export const proveedoresApi = {
  async listar(sucursalId: string): Promise<Proveedor[]> {
    const { data } = await apiClient.get<Proveedor[]>('/proveedores', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async obtener(proveedorId: string): Promise<Proveedor> {
    const { data } = await apiClient.get<Proveedor>(`/proveedores/${proveedorId}`)
    return data
  },

  async crear(body: ProveedorCreate): Promise<Proveedor> {
    const { data } = await apiClient.post<Proveedor>('/proveedores', body)
    return data
  },

  async actualizar(proveedorId: string, body: ProveedorUpdate): Promise<Proveedor> {
    const { data } = await apiClient.patch<Proveedor>(`/proveedores/${proveedorId}`, body)
    return data
  },

  async eliminar(proveedorId: string): Promise<void> {
    await apiClient.delete(`/proveedores/${proveedorId}`)
  },
}
