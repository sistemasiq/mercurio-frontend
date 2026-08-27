import { apiClient } from '@/api/axiosClient'
import type { PulseraAdmin, PulseraCreate, PulseraUpdate } from '@/types/pulsera'

export interface InventarioPulseras {
  sucursal_id: string
  total_activas: number
}

export const pulserasApi = {
  listarAdmin: (sucursalId: string) =>
    apiClient.get<PulseraAdmin[]>(`/pulseras/admin/${sucursalId}`).then((r) => r.data),

  /**
   * Sólo el conteo de pulseras activas de la sucursal. Existe aparte de
   * listarAdmin porque ése exige `pulseras:listar`, permiso que el Cajero no
   * tiene: el asistente de reservación necesita el número, no el inventario.
   */
  obtenerInventario: (sucursalId: string) =>
    apiClient.get<InventarioPulseras>(`/pulseras/inventario/${sucursalId}`).then((r) => r.data),

  crear: (body: PulseraCreate) =>
    apiClient.post<PulseraAdmin>('/pulseras', body).then((r) => r.data),

  actualizar: (pulseraId: string, body: PulseraUpdate) =>
    apiClient.patch<PulseraAdmin>(`/pulseras/${pulseraId}`, body).then((r) => r.data),

  eliminar: (pulseraId: string) => apiClient.delete(`/pulseras/${pulseraId}`).then((r) => r.data),
}
