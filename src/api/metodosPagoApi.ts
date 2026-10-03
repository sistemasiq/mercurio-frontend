import { apiClient } from '@/api/axiosClient'
import type { MetodosPago, MetodosPagoActivacion, MetodosPagoUpdate } from '@/types/metodos_pago'

export const metodosPagoApi = {
  listar: () => apiClient.get<MetodosPago[]>('/metodos-pago').then((r) => r.data),

  obtener: (metodo_pago_id: string) =>
    apiClient.get<MetodosPago>(`/metodos-pago/${metodo_pago_id}`).then((r) => r.data),

  actualizar: (metodo_pago_id: string, body: MetodosPagoUpdate) =>
    apiClient.patch<MetodosPago>(`/metodos-pago/${metodo_pago_id}`, body).then((r) => r.data),

  activar: (metodo_pago_id: string, body: MetodosPagoActivacion) =>
    apiClient
      .patch<MetodosPago>(`/metodos-pago/${metodo_pago_id}/activacion`, body)
      .then((r) => r.data),
}
