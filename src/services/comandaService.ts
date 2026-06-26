import axios, { type AxiosInstance } from 'axios'
import type { Comanda, CrearComandaRequest, EstadoActualComanda } from '@/types/comanda'

const comandaApi: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function obtenerComandas(signal?: AbortSignal): Promise<Comanda[]> {
  const response = await comandaApi.get<Comanda[]>('/comandas/', { signal })
  return response.data
}



export async function cambiarEstadoComanda(
  comandaId: string,
  nuevoEstado: Exclude<EstadoActualComanda, 'P'>,
  signal?: AbortSignal
): Promise<void> {
  await comandaApi.patch(`/comandas/${comandaId}/estado`, {
    estado_actual: nuevoEstado,
  }, { signal })
}

export async function crearComanda(
  payload: CrearComandaRequest,
  signal?: AbortSignal
): Promise<Comanda> {
  const response = await comandaApi.post<Comanda>('/comandas/', payload, { signal })
  return response.data
}