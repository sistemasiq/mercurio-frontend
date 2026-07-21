import { comprasApi } from '@/api/comprasApi'
import type { Compra, CompraCreate } from '@/types/compra'

export async function listarCompras(sucursalId: string): Promise<Compra[]> {
  return comprasApi.listar(sucursalId)
}

export async function crearCompra(body: CompraCreate): Promise<Compra> {
  return comprasApi.crear(body)
}

export async function recibirCompra(compraId: string): Promise<Compra> {
  return comprasApi.recibir(compraId)
}

export async function cancelarCompra(compraId: string): Promise<Compra> {
  return comprasApi.cancelar(compraId)
}
