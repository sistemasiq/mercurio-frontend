import { apiClient } from '@/api/axiosClient'
import type { Tipos_evento, Tipos_evento_create, Tipos_evento_update } from '@/types/tipos_evento'

export const tiposEventoApi = {
  listar: () =>
    apiClient.get<Tipos_evento[]>('/tipos-evento').then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Tipos_evento>(`/tipos-evento/${id}`).then((r) => r.data),

  crear: (body: Tipos_evento_create) =>
    apiClient.post<Tipos_evento>('/tipos-evento', body).then((r) => r.data),

  actualizar: (id: string, body: Tipos_evento_update) =>
    apiClient.patch<Tipos_evento>(`/tipos-evento/${id}`, body).then((r) => r.data),

  eliminar: (id: string) =>
    apiClient.delete(`/tipos-evento/${id}`).then((r) => r.data),
}
