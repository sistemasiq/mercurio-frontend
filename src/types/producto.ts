// Coincide con el enum tipo_producto del backend: A (Alimento), B (Bebida),
// S (Servicio), E (Estancia), C (Combo).
export type TipoProducto = 'A' | 'B' | 'S' | 'E' | 'C'

export const TIPO_LABELS: Record<TipoProducto, string> = {
  A: 'Alimento',
  B: 'Bebida',
  E: 'Estancia',
  S: 'Servicio',
  C: 'Combo',
}

export interface ComboItemCreate {
  producto_id: string
  cantidad: number
}

export interface TramoEstancia {
  min_horas: number
  max_horas: number
  precio: number
}

export interface PrecioEstancia {
  id: string
  config_estancia: TramoEstancia[]
}

export interface ProductoBase {
  id: string
  nombre: string
  precio_unitario: string | number
  tipo: TipoProducto
  imagen: string | null
  sucursal_id: string
  descripcion: string | null
  es_combo: boolean
  productos_combo?: ComboItemCreate[]
  config_estancia?: TramoEstancia[]
}

export interface Producto extends Omit<ProductoBase, 'precio_unitario'> {
  precio_unitario: number
}

export interface ProductoAdmin extends ProductoBase {
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
  es_combo?: boolean
  productos_combo?: ComboItemCreate[] | null
  config_estancia?: TramoEstancia[] | null
}

export interface ProductoUpdate {
  nombre?: string
  precio_unitario?: string
  tipo?: TipoProducto
  descripcion?: string | null
  imagen?: string | null
  activo?: boolean
  es_combo?: boolean
  productos_combo?: ComboItemCreate[] | null
  config_estancia?: TramoEstancia[] | null
}

export interface ProductoComboHijo {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
}
