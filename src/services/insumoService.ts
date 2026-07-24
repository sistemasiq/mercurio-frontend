import { insumosApi } from '@/api/insumosApi'
import type { Insumo, InsumoCreate, InsumoUpdate } from '@/types/insumo'

export async function listarInsumos(sucursalId: string): Promise<Insumo[]> {
  return insumosApi.listar(sucursalId)
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
