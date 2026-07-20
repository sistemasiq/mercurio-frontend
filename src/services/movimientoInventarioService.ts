import { movimientosInventarioApi } from '@/api/movimientosInventarioApi'
import type { MovimientoInventario, MovimientoManualCreate } from '@/types/movimientoInventario'

export async function listarMovimientosPorInsumo(
  insumoId: string,
): Promise<MovimientoInventario[]> {
  return movimientosInventarioApi.listarPorInsumo(insumoId)
}

export async function registrarMovimiento(
  insumoId: string,
  body: MovimientoManualCreate,
): Promise<MovimientoInventario> {
  return movimientosInventarioApi.registrar(insumoId, body)
}
