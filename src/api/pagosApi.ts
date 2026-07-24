import { apiClient } from '@/api/axiosClient'
import type { Comanda } from '@/types/comanda'
import type { PagoCompletoRequest } from '@/types/payments'

export const pagosApi = {
  async completarPago(payload: PagoCompletoRequest, signal?: AbortSignal): Promise<Comanda> {
    const { data } = await apiClient.post<Comanda>('/pagos/completar', payload, { signal })
    return data
  },
}
