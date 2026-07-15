import { historialApi } from '@/api/historialApi'
import type { ITransaccion } from '@/types/transaccion'
import type { DetalleOrden, Estadisticas } from '@/api/historialApi'

export async function obtenerHistorial(
  filtro: string,
  estado: string,
  signal?: AbortSignal,
): Promise<ITransaccion[]> {
  return historialApi.listar(filtro, estado, signal)
}

export async function obtenerDetalleOrden(
  pagoId: string,
  signal?: AbortSignal,
): Promise<DetalleOrden> {
  return historialApi.getDetalle(pagoId, signal)
}

export async function obtenerEstadisticas(
  filtro: string,
  signal?: AbortSignal,
): Promise<Estadisticas> {
  return historialApi.getEstadisticas(filtro, signal)
}
