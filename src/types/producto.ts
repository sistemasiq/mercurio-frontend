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

export interface ProductoAdmin {
  id: string
  nombre: string
  precio_unitario: string
  tipo: TipoProducto
  sucursal_id: string
  descripcion: string | null
  imagen: string | null
  activo: boolean
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export interface ProductoCreate {
  nombre: string
  precio_unitario: string
  tipo: TipoProducto
  sucursal_id: string
  descripcion?: string | null
  imagen?: string | null
}

export interface ProductoUpdate {
  nombre?: string
  precio_unitario?: string
  tipo?: TipoProducto
  descripcion?: string | null
  imagen?: string | null
  activo?: boolean
}
