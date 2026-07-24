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
  return comandasApi.cambiarEstado(comandaId, nuevoEstado, undefined, signal)
}

export async function crearComanda(
  payload: CrearComandaRequest,
  signal?: AbortSignal,
): Promise<Comanda> {
  return comandasApi.crear(payload, signal)
}

export async function modificarDetallesComanda(
  comandaId: string,
  detallesIdsAEliminar: string[],
  motivoCancelacion?: string,
  signal?: AbortSignal,
): Promise<Comanda> {
  return comandasApi.modificarDetalles(comandaId, detallesIdsAEliminar, motivoCancelacion, signal)
}
