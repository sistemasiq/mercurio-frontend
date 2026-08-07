import { apiClient } from '@/api/axiosClient'
import type {
  Reservacion_productos,
  Reservacion_productos_create,
  Reservacion_productos_update,
} from '@/types/reservacion_productos'

export const reservacionProductosApi = {
  listarPorReservacion: (reservacion_id: string) =>
    apiClient
      .get<Reservacion_productos[]>(`/reservacion-productos/reservacion/${reservacion_id}`)
      .then((r) => r.data),

  obtener: (id: string) =>
    apiClient.get<Reservacion_productos>(`/reservacion-productos/${id}`).then((r) => r.data),

  crear: (body: Reservacion_productos_create) =>
    apiClient.post<Reservacion_productos>('/reservacion-productos', body).then((r) => r.data),

  actualizar: (id: string, body: Reservacion_productos_update) =>
    apiClient
      .patch<Reservacion_productos>(`/reservacion-productos/${id}`, body)
      .then((r) => r.data),

  eliminar: (id: string) => apiClient.delete(`/reservacion-productos/${id}`).then((r) => r.data),
}
