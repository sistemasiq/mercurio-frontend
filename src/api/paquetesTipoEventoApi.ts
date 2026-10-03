import { apiClient } from '@/api/axiosClient'
import type {
  Paquetes_tipo_evento,
  Paquetes_tipo_evento_create,
} from '@/types/paquetes_tipo_evento'

export const paquetesTipoEventoApi = {
  listar: (paquete_id: string) =>
    apiClient
      .get<Paquetes_tipo_evento[]>(`/paquete-tipos-evento/${paquete_id}`)
      .then((r) => r.data),

  crear: (body: Paquetes_tipo_evento_create) =>
    apiClient.post<Paquetes_tipo_evento>('/paquete-tipos-evento', body).then((r) => r.data),

  eliminar: (paquete_id: string, tipo_evento_id: string) =>
    apiClient.delete(`/paquete-tipos-evento/${paquete_id}/${tipo_evento_id}`).then((r) => r.data),
}
