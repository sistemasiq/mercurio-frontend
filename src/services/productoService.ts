import { productosApi } from '@/api/productosApi'
import type { Producto, ProductoAdmin, ProductoCreate, ProductoUpdate } from '@/types/producto'

function mapProductoUi(producto: ProductoAdmin): Producto {
  const { precio_unitario, ...resto } = producto
  return {
    ...resto,
    precio_unitario: Number(precio_unitario),
  }
}

export async function obtenerProductos(signal?: AbortSignal): Promise<Producto[]> {
  const productos = await productosApi.listarCatalogo(signal)
  return productos.map(mapProductoUi)
}

export async function crearProducto(body: ProductoCreate): Promise<ProductoAdmin> {
  return productosApi.crear(body)
}

export async function actualizarProducto(
  productoId: string,
  body: ProductoUpdate,
): Promise<ProductoAdmin> {
  return productosApi.actualizar(productoId, body)
}

export async function eliminarProducto(productoId: string): Promise<void> {
  return productosApi.eliminar(productoId)
}
