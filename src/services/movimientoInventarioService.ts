import { movimientosInventarioApi } from '@/api/movimientosInventarioApi'
import { downloadBlob } from '@/utils/downloadBlob'
import type {
  ConteoFisicoCreate,
  MovimientoInventario,
  MovimientoManualCreate,
} from '@/types/movimientoInventario'

export async function listarMovimientosPorInsumo(
  insumoId: string,
  desde?: string,
  hasta?: string,
): Promise<MovimientoInventario[]> {
  return movimientosInventarioApi.listarPorInsumo(insumoId, desde, hasta)
}

export async function registrarMovimiento(
  insumoId: string,
  body: MovimientoManualCreate,
): Promise<MovimientoInventario> {
  return movimientosInventarioApi.registrar(insumoId, body)
}

export async function registrarConteoFisico(
  insumoId: string,
  body: ConteoFisicoCreate,
): Promise<MovimientoInventario> {
  return movimientosInventarioApi.conteo(insumoId, body)
}

export async function exportarMovimientos(
  insumoId: string,
  desde?: string,
  hasta?: string,
  nombreArchivo = `kardex_${insumoId}.csv`,
): Promise<void> {
  const blob = await movimientosInventarioApi.exportar(insumoId, desde, hasta)
  downloadBlob(blob, nombreArchivo)
}
