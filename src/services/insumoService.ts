import { insumosApi } from '@/api/insumosApi'
import type {
  Insumo,
  InsumoAlertas,
  InsumoCreate,
  InsumoRecetaInversa,
  InsumoUpdate,
} from '@/types/insumo'
import type { CogsRenglon } from '@/types/movimientoInventario'

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

export async function crearInsumo(body: InsumoCreate): Promise<Insumo> {
  return insumosApi.crear(body)
}

export async function actualizarInsumo(insumoId: string, body: InsumoUpdate): Promise<Insumo> {
  return insumosApi.actualizar(insumoId, body)
}

export async function eliminarInsumo(insumoId: string): Promise<void> {
  return insumosApi.eliminar(insumoId)
}
