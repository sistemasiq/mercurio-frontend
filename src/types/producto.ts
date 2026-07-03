// Coincide con el enum tipo_producto del backend: A (Alimento), B (Bebida),
// S (Servicio), E (Estancia).
export type TipoProducto = 'A' | 'B' | 'S' | 'E'

export interface Producto {
  id: string
  nombre: string
  precio_unitario: number
  tipo: TipoProducto
  imagen: string
  sucursal_id: string
  descripcion?: string
}
