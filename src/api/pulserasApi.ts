import { apiClient } from '@/api/axiosClient'
import type { PulseraAdmin, PulseraCreate, PulseraUpdate } from '@/types/pulsera'

export const pulserasApi = {
  listarAdmin: (sucursalId: string) =>
    apiClient.get<PulseraAdmin[]>(`/pulseras/admin/${sucursalId}`).then((r) => r.data),

  crear: (body: PulseraCreate) =>
    apiClient.post<PulseraAdmin>('/pulseras', body).then((r) => r.data),

  actualizar: (pulseraId: string, body: PulseraUpdate) =>
    apiClient.patch<PulseraAdmin>(`/pulseras/${pulseraId}`, body).then((r) => r.data),

  eliminar: (pulseraId: string) => apiClient.delete(`/pulseras/${pulseraId}`).then((r) => r.data),
}
