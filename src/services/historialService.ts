import { historialApi } from '@/api/historialApi'
import { downloadBlob } from '@/utils/downloadBlob'
import type { ITransaccion } from '@/types/transaccion'
import type { DetalleOrden, Estadisticas, FiltrosHistorialVentas } from '@/api/historialApi'

export async function obtenerHistorial(
  filtro: string,
  estado: string,
  signal?: AbortSignal,
  fechaInicio?: string,
  fechaFin?: string,
  cajaId?: string,
  metodoPagoId?: string,
): Promise<ITransaccion[]> {
  return historialApi.listar(filtro, estado, signal, fechaInicio, fechaFin, cajaId, metodoPagoId)
}

export async function exportarHistorial(
  filtro: string,
  estado: string,
  extra?: FiltrosHistorialVentas,
  nombreArchivo = 'historial_ventas.csv',
): Promise<void> {
  const blob = await historialApi.exportar(filtro, estado, extra)
  downloadBlob(blob, nombreArchivo)
}

export async function obtenerDetalleOrden(
  tipoOrigen: string,
  referenciaId: string,
  signal?: AbortSignal,
): Promise<DetalleOrden> {
  return historialApi.getDetalle(tipoOrigen, referenciaId, signal)
}

export async function obtenerEstadisticas(
  filtro: string,
  signal?: AbortSignal,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Estadisticas> {
  return historialApi.getEstadisticas(filtro, signal, fechaInicio, fechaFin)
}
