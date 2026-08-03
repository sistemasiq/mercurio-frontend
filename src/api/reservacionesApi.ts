import { apiClient } from '@/api/axiosClient'
import type {
  Reservaciones,
  ReservacionesCreate,
  ReservacionesUpdate,
  EventoDelDia,
} from '@/types/reservaciones'

export const reservacionesApi = {
  listar: (sucursal_id?: string) =>
    apiClient
      .get<Reservaciones[]>('/reservaciones', { params: sucursal_id ? { sucursal_id } : undefined })
      .then((r) => r.data),

  obtener: (id: string) => apiClient.get<Reservaciones>(`/reservaciones/${id}`).then((r) => r.data),

  crear: (body: ReservacionesCreate) =>
    apiClient.post<Reservaciones>('/reservaciones', body).then((r) => r.data),

  actualizar: (id: string, body: ReservacionesUpdate) =>
    apiClient.patch<Reservaciones>(`/reservaciones/${id}`, body).then((r) => r.data),

  eliminar: (id: string) => apiClient.delete(`/reservaciones/${id}`).then((r) => r.data),

  // Como seria correcto aqui?, no es por params o si?
  // Rta:
  eventoProximo: async (sucursalId: string): Promise<EventoDelDia | null> => {
    try {
      const { data } = await apiClient.get<EventoDelDia>(
        `/reservaciones/evento-cercano/${sucursalId}`,
      )
      return data ?? null
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return null
      throw err
    }
  },
}
