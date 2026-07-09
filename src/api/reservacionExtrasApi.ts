import { apiClient } from '@/api/axiosClient'
import type {
  Reservacion_extras,
  Reservacion_extras_create,
  Reservacion_extras_update,
} from '@/types/reservacion_extras'

export const reservacionExtrasApi = {
  listarPorReservacion: (reservacion_id: string) =>
    apiClient
      .get<Reservacion_extras[]>(`/reservacion-extras/reservacion/${reservacion_id}`)
      .then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Reservacion_extras>(`/reservacion-extras/${id}`).then((r) => r.data),

  crear: (body: Reservacion_extras_create) =>
    apiClient.post<Reservacion_extras>('/reservacion-extras', body).then((r) => r.data),

  actualizar: (id: string, body: Reservacion_extras_update) =>
    apiClient.patch<Reservacion_extras>(`/reservacion-extras/${id}`, body).then((r) => r.data),

  eliminar: (id: string) => apiClient.delete(`/reservacion-extras/${id}`).then((r) => r.data),
}
