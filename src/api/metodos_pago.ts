import { apiClient } from '@/api/axiosClient'
import type { MetodosPago, MetodosPagoCreate, MetodosPagoUpdate } from '@/types/metodos_pago'

export const metodosPagoApi = {
  listar: () =>
    apiClient.get<MetodosPago[]>('/metodos-pago').then((r) => r.data),

  obtener: (metodo_pago_id: string) =>
    apiClient.get<MetodosPago>(`/metodos-pago/${metodo_pago_id}`).then((r) => r.data),

  crear: (body: MetodosPagoCreate) =>
    apiClient.post<MetodosPago>('/metodos-pago', body).then((r) => r.data),

  actualizar: (metodo_pago_id: string, body: MetodosPagoUpdate) =>
    apiClient.patch<MetodosPago>(`/metodos-pago/${metodo_pago_id}`, body).then((r) => r.data),

  eliminar: (metodo_pago_id: string) =>
    apiClient.delete(`/metodos-pago/${metodo_pago_id}`).then((r) => r.data),
}
