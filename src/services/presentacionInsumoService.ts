import { presentacionesInsumoApi } from '@/api/presentacionesInsumoApi'
import type {
  PresentacionInsumo,
  PresentacionInsumoCreate,
  PresentacionInsumoUpdate,
} from '@/types/presentacionInsumo'

export async function listarPresentacionesPorInsumo(
  insumoId: string,
): Promise<PresentacionInsumo[]> {
  return presentacionesInsumoApi.listarPorInsumo(insumoId)
}

export async function crearPresentacionInsumo(
  insumoId: string,
  body: PresentacionInsumoCreate,
): Promise<PresentacionInsumo> {
  return presentacionesInsumoApi.crear(insumoId, body)
}

export async function actualizarPresentacionInsumo(
  insumoId: string,
  presentacionId: string,
  body: PresentacionInsumoUpdate,
): Promise<PresentacionInsumo> {
  return presentacionesInsumoApi.actualizar(insumoId, presentacionId, body)
}

export async function eliminarPresentacionInsumo(
  insumoId: string,
  presentacionId: string,
): Promise<void> {
  return presentacionesInsumoApi.eliminar(insumoId, presentacionId)
}
