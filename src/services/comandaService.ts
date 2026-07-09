import { comandasApi } from '@/api/comandasApi'
import type { Comanda, CrearComandaRequest, EstadoActualComanda } from '@/types/comanda'

export async function obtenerComandas(signal?: AbortSignal): Promise<Comanda[]> {
  return comandasApi.listar(signal)
}

export async function cambiarEstadoComanda(
  comandaId: string,
  nuevoEstado: EstadoActualComanda,
  signal?: AbortSignal,
): Promise<void> {
  return comandasApi.cambiarEstado(comandaId, nuevoEstado, signal)
}

export async function crearComanda(
  payload: CrearComandaRequest,
  signal?: AbortSignal,
): Promise<Comanda> {
  return comandasApi.crear(payload, signal)
}
