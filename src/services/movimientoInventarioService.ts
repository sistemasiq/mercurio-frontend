import { movimientosInventarioApi } from '@/api/movimientosInventarioApi'
import type { MovimientoInventario, MovimientoManualCreate } from '@/types/movimientoInventario'

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
