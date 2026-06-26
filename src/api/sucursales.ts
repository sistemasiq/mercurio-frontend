import { apiClient } from './axiosClient'
import type { Sucursales, SucursalCreate, SucursalUpdate } from '@/types/sucursales'

export const sucursalesApi = {
  listar: () =>
    apiClient.get<Sucursales[]>('/sucursales').then((r) => r.data),

  obtener: (sucursal_id: string) =>
    apiClient.get<Sucursales>(`/sucursales/${sucursal_id}`).then((r) => r.data),

  crear: (body: SucursalCreate) =>
    apiClient.post<Sucursales>('/sucursales', body).then((r) => r.data),

  actualizar: (sucursal_id: string, body: SucursalUpdate) =>
    apiClient.patch<Sucursales>(`/sucursales/${sucursal_id}`, body).then((r) => r.data),

  eliminar: (sucursal_id: string) =>
    apiClient.delete(`/sucursales/${sucursal_id}`).then((r) => r.data),
}
