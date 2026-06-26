import { apiClient } from '@/api/axiosClient'
import type { Paquetes, PaquetesCreate, PaquetesUpdate } from '@/types/paquetes'

export const paquetesApi = {
  listar: (sucursal_id?: string) =>
    apiClient
      .get<Paquetes[]>('/paquetes', { params: sucursal_id ? { sucursal_id } : undefined })
      .then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Paquetes>(`/paquetes/${id}`).then((r) => r.data),

  crear: (body: PaquetesCreate) =>
    apiClient.post<Paquetes>('/paquetes', body).then((r) => r.data),

  actualizar: (id: string, body: PaquetesUpdate) =>
    apiClient.patch<Paquetes>(`/paquetes/${id}`, body).then((r) => r.data),

  eliminar: (id: string) =>
    apiClient.delete(`/paquetes/${id}`).then((r) => r.data),
}
