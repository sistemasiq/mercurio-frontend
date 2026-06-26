import { apiClient } from '@/api/axiosClient'
import type { Extras, ExtrasCreate, ExtrasUpdate } from '@/types/extras'

export const extrasApi = {
  listar: (sucursal_id?: string) =>
    apiClient
      .get<Extras[]>('/extras', { params: sucursal_id ? { sucursal_id } : undefined })
      .then((r) => r.data),

  obtener: (extra_id: string) =>
    apiClient.get<Extras>(`/extras/${extra_id}`).then((r) => r.data),

  crear: (body: ExtrasCreate) =>
    apiClient.post<Extras>('/extras', body).then((r) => r.data),

  actualizar: (extra_id: string, body: ExtrasUpdate) =>
    apiClient.patch<Extras>(`/extras/${extra_id}`, body).then((r) => r.data),

  eliminar: (extra_id: string) =>
    apiClient.delete(`/extras/${extra_id}`).then((r) => r.data),
}
