// Coincide con el enum tipo_producto del backend: A (Alimento), B (Bebida),
// S (Servicio), E (Estancia), C (Combo).
export type TipoProducto = 'A' | 'B' | 'S' | 'E' | 'C'

export interface ComboItemCreate {
  producto_id: string
  cantidad: number
}

export interface Producto {
  id: string
  nombre: string
  precio_unitario: number
  tipo: TipoProducto
  imagen: string
  sucursal_id: string
  descripcion?: string
  productos_combo?: ComboItemCreate[]
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
  productos_combo?: ComboItemCreate[]
}

export interface ProductoCreate {
  nombre: string
  precio_unitario: string
  tipo: TipoProducto
  sucursal_id: string
  descripcion?: string | null
  imagen?: string | null
  productos_combo?: ComboItemCreate[] | null
}

export interface ProductoUpdate {
  nombre?: string
  precio_unitario?: string
  tipo?: TipoProducto
  descripcion?: string | null
  imagen?: string | null
  activo?: boolean
  productos_combo?: ComboItemCreate[] | null
}
