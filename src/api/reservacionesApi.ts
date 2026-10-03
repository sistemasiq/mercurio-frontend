import { apiClient } from '@/api/axiosClient'
import type {
  Reservaciones,
  ReservacionesCreate,
  ReservacionesUpdate,
  EventoDelDia,
  Disponibilidad,
} from '@/types/reservaciones'
import type {
  ReservacionCompletaRequest,
  ReservacionCompletaResponse,
} from '@/types/reservaciones_completa'

export const reservacionesApi = {
  /**
   * `desde`/`hasta` (YYYY-MM-DD, ambos inclusive) acotan el calendario de
   * eventos a un rango -- lo usan las vistas Semana y Día en vez de traer
   * todo el histórico de la sucursal.
   */
  listar: (sucursal_id?: string, desde?: string, hasta?: string) =>
    apiClient
      .get<Reservaciones[]>('/reservaciones', {
        params: { sucursal_id, desde, hasta },
      })
      .then((r) => r.data),

  disponibilidad: (sucursal_id: string, fecha: string) =>
    apiClient
      .get<Disponibilidad>('/reservaciones/disponibilidad', { params: { sucursal_id, fecha } })
      .then((r) => r.data),

  crearCompleta: (body: ReservacionCompletaRequest) =>
    apiClient
      .post<ReservacionCompletaResponse>('/reservaciones/completa', body)
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
