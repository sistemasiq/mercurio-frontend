export interface Producto {
  id: string
  nombre: string
  precio_unitario: number
  tipo: string
  imagen: string
  sucursal_id: string
  descripcion?: string
}