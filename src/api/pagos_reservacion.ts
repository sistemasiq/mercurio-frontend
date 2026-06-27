import { apiClient } from '@/api/axiosClient'
import type { Pagos_reservacion, Pagos_reservacion_create, Pagos_reservacion_update } from '@/types/pagos_reservacion'

export const pagosReservacionApi = {
  listar: () =>
    apiClient.get<Pagos_reservacion[]>('/pagos-reservacion').then((r) => r.data),

  listarPorReservacion: (reservacion_id: string) =>
    apiClient
      .get<Pagos_reservacion[]>(`/pagos-reservacion/reservacion/${reservacion_id}`)
      .then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Pagos_reservacion>(`/pagos-reservacion/${id}`).then((r) => r.data),

  crear: (body: Pagos_reservacion_create) =>
    apiClient.post<Pagos_reservacion>('/pagos-reservacion', body).then((r) => r.data),

  actualizar: (id: string, body: Pagos_reservacion_update) =>
    apiClient.patch<Pagos_reservacion>(`/pagos-reservacion/${id}`, body).then((r) => r.data),

  eliminar: (id: string) =>
    apiClient.delete(`/pagos-reservacion/${id}`).then((r) => r.data),
}
