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
    motivoCancelacion?: string,
    signal?: AbortSignal,
  ): Promise<void> {
    await apiClient.patch(
      `/comandas/${comandaId}/estado`,
      {
        estado_actual: nuevoEstado,
        ...(motivoCancelacion ? { motivo_cancelacion: motivoCancelacion } : {}),
      },
      { signal },
    )
  },

  async crear(payload: CrearComandaRequest, signal?: AbortSignal): Promise<Comanda> {
    const { data } = await apiClient.post<Comanda>('/comandas', payload, { signal })
    return data
  },

  async modificarDetalles(
    comandaId: string,
    detallesIdsAEliminar: string[],
    motivoCancelacion?: string,
    signal?: AbortSignal,
  ): Promise<Comanda> {
    const { data } = await apiClient.patch<Comanda>(
      `/comandas/${comandaId}/detalles`,
      {
        detalles_ids_a_eliminar: detallesIdsAEliminar,
        ...(motivoCancelacion ? { motivo_cancelacion: motivoCancelacion } : {}),
      },
      { signal },
    )
    return data
  },
}
