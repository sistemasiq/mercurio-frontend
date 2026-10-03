import { recetaProductoApi } from '@/api/recetaProductoApi'
import type { RecetaItem, RecetaItemUpdate } from '@/types/recetaProducto'

export async function listarReceta(productoId: string): Promise<RecetaItem[]> {
  return recetaProductoApi.listar(productoId)
}

export async function upsertRecetaItem(
  productoId: string,
  insumoId: string,
  body: RecetaItemUpdate,
): Promise<RecetaItem> {
  return recetaProductoApi.upsert(productoId, insumoId, body)
}

export async function eliminarRecetaItem(productoId: string, insumoId: string): Promise<void> {
  return recetaProductoApi.eliminar(productoId, insumoId)
}
