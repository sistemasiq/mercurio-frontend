import { proveedoresApi } from '@/api/proveedoresApi'
import type { Proveedor, ProveedorCreate, ProveedorUpdate } from '@/types/proveedor'

export async function listarProveedores(sucursalId: string): Promise<Proveedor[]> {
  return proveedoresApi.listar(sucursalId)
}

export async function crearProveedor(body: ProveedorCreate): Promise<Proveedor> {
  return proveedoresApi.crear(body)
}

export async function actualizarProveedor(
  proveedorId: string,
  body: ProveedorUpdate,
): Promise<Proveedor> {
  return proveedoresApi.actualizar(proveedorId, body)
}

export async function eliminarProveedor(proveedorId: string): Promise<void> {
  return proveedoresApi.eliminar(proveedorId)
}
