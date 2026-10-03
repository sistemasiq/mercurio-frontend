import { insumosApi } from '@/api/insumosApi'
import { downloadBlob } from '@/utils/downloadBlob'
import type {
  Insumo,
  InsumoAlertas,
  InsumoCreate,
  InsumoRecetaInversa,
  InsumoUpdate,
} from '@/types/insumo'
import type { CogsRenglon, ResumenCogs } from '@/types/movimientoInventario'

export async function listarInsumos(sucursalId: string): Promise<Insumo[]> {
  return insumosApi.listar(sucursalId)
}

export async function listarEstimaciones(sucursalId: string): Promise<InsumoRecetaInversa[]> {
  return insumosApi.estimaciones(sucursalId)
}

export async function listarAlertas(sucursalId: string): Promise<InsumoAlertas> {
  return insumosApi.alertas(sucursalId)
}

export async function listarReporteCogs(
  sucursalId: string,
  desde?: string,
  hasta?: string,
): Promise<CogsRenglon[]> {
  return insumosApi.reporteCogs(sucursalId, desde, hasta)
}

export async function obtenerResumenCogs(
  sucursalId: string,
  desde?: string,
  hasta?: string,
): Promise<ResumenCogs> {
  return insumosApi.resumenCogs(sucursalId, desde, hasta)
}

export async function exportarReporteStock(
  sucursalId: string,
  nombreArchivo = 'reporte_stock.csv',
): Promise<void> {
  const blob = await insumosApi.exportarStock(sucursalId)
  downloadBlob(blob, nombreArchivo)
}

export async function exportarReporteCogs(
  sucursalId: string,
  desde?: string,
  hasta?: string,
  nombreArchivo = 'costo_de_ventas.csv',
): Promise<void> {
  const blob = await insumosApi.exportarCogs(sucursalId, desde, hasta)
  downloadBlob(blob, nombreArchivo)
}

export async function crearInsumo(body: InsumoCreate): Promise<Insumo> {
  return insumosApi.crear(body)
}

export async function actualizarInsumo(insumoId: string, body: InsumoUpdate): Promise<Insumo> {
  return insumosApi.actualizar(insumoId, body)
}

export async function eliminarInsumo(insumoId: string): Promise<void> {
  return insumosApi.eliminar(insumoId)
}
