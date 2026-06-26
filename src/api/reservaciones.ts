import { apiClient } from './axiosClient'
import type { Reservaciones, ReservacionesCreate, ReservacionesUpdate } from '@/types/reservaciones'

export const reservacionesApi = {
  listar: () =>
    apiClient.get<Reservaciones[]>('/reservaciones').then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Reservaciones>(`/reservaciones/${id}`).then((r) => r.data),

  crear: (body: ReservacionesCreate) =>
    apiClient.post<Reservaciones>('/reservaciones', body).then((r) => r.data),

  actualizar: (id: string, body: ReservacionesUpdate) =>
    apiClient.patch<Reservaciones>(`/reservaciones/${id}`, body).then((r) => r.data),

  eliminar: (id: string) =>
    apiClient.delete(`/reservaciones/${id}`).then((r) => r.data),
}
