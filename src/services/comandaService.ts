import { apiClient } from '@/api/axiosClient'
import type { Comanda, CrearComandaRequest, EstadoActualComanda } from '@/types/comanda'

export async function obtenerComandas(signal?: AbortSignal): Promise<Comanda[]> {
  const response = await apiClient.get<Comanda[]>('/comandas/', { signal })
  return response.data
}

export async function cambiarEstadoComanda(
  comandaId: string,
  nuevoEstado: Exclude<EstadoActualComanda, 'P'>,
  signal?: AbortSignal,
): Promise<void> {
  await apiClient.patch(
    `/comandas/${comandaId}/estado`,
    {
      estado_actual: nuevoEstado,
    },
    { signal },
  )
}

export async function crearComanda(
  payload: CrearComandaRequest,
  signal?: AbortSignal,
): Promise<Comanda> {
  const response = await apiClient.post<Comanda>('/comandas/', payload, { signal })
  return response.data
}
