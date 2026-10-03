import { apiClient } from './axiosClient'
import type { Paquetes, PaquetesCreate, PaquetesUpdate } from '@/types/paquetes'

export const paquetesApi = {
  listar: (sucursal_id?: string) =>
    apiClient
      //Enlistamos los activos
      .get<Paquetes[]>('/paquetes', { params: sucursal_id ? { sucursal_id } : undefined })
      .then((r) => r.data),

  //Obtener paquete
  obtener: (id: string) => apiClient.get<Paquetes>(`/paquetes/${id}`).then((r) => r.data),

  //POST paquetes
  crear: (body: PaquetesCreate) =>
    apiClient.post<PaquetesCreate>('/paquetes', body).then((r) => r.data),

  //PATCH
  actualizar: (id: string, body: PaquetesUpdate) =>
    apiClient.patch<PaquetesUpdate>(`/paquetes/${id}`, body).then((r) => r.data),

  //DELETE
  borrar: (id: string) => apiClient.delete(`/paquetes/${id}`),
}
