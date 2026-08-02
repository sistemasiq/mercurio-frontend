import { historialApi } from '@/api/historialApi'
import type { ITransaccion } from '@/types/transaccion'
import type { DetalleOrden, Estadisticas } from '@/api/historialApi'

export async function obtenerHistorial(
  filtro: string,
  estado: string,
  signal?: AbortSignal,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<ITransaccion[]> {
  return historialApi.listar(filtro, estado, signal, fechaInicio, fechaFin)
}

export async function obtenerDetalleOrden(
  comandaId: string,
  signal?: AbortSignal,
): Promise<DetalleOrden> {
  return historialApi.getDetalle(comandaId, signal)
}

export async function obtenerEstadisticas(
  filtro: string,
  signal?: AbortSignal,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Estadisticas> {
  return historialApi.getEstadisticas(filtro, signal, fechaInicio, fechaFin)
}
