import { productosApi } from '@/api/productosApi'
import type { Producto, ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

export async function obtenerProductos(
  sucursalId: string,
  signal?: AbortSignal,
): Promise<Producto[]> {
  const productos = await productosApi.listar(sucursalId, signal)
  return productos.map((producto) => ({
    ...producto,
    precio_unitario: Number(producto.precio_unitario),
  }))
}

export async function listarProductosAdmin(sucursalId: string): Promise<ProductoAdmin[]> {
  return productosApi.listarAdmin(sucursalId)
}

export async function crearProducto(
  body: ProductoCreate,
  imagen?: File | null,
): Promise<ProductoAdmin> {
  return productosApi.crear(body, imagen)
}

export async function actualizarProducto(
  productoId: string,
  body: ProductoUpdate,
  imagen?: File | null,
): Promise<ProductoAdmin> {
  return productosApi.actualizar(productoId, body, imagen)
}

export async function eliminarProducto(productoId: string): Promise<void> {
  return productosApi.eliminar(productoId)
}

export async function reactivarProducto(productoId: string): Promise<ProductoAdmin> {
  return productosApi.reactivar(productoId)
}
