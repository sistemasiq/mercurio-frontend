import { apiClient } from '@/api/axiosClient'
import type { Comanda, CrearComandaRequest, EstadoActualComanda } from '@/types/comanda'

export const comandasApi = {
  async listar(signal?: AbortSignal): Promise<Comanda[]> {
    const { data } = await apiClient.get<Comanda[]>('/comandas', { signal })
    return data
  },

  async cambiarEstado(
    comandaId: string,
    nuevoEstado: EstadoActualComanda,
    signal?: AbortSignal,
  ): Promise<void> {
    await apiClient.patch(
      `/comandas/${comandaId}/estado`,
      { estado_actual: nuevoEstado },
      { signal },
    )
  },

  async crear(payload: CrearComandaRequest, signal?: AbortSignal): Promise<Comanda> {
    const { data } = await apiClient.post<Comanda>('/comandas', payload, { signal })
    return data
  },
}
