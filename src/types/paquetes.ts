import AuditFields from '@/types/shared'

export interface PaqueteProductoItem {
  producto_id: string
  cantidad: number
}

export interface PaqueteProductoIncluido extends PaqueteProductoItem {
  nombre: string
  precio_unitario: string
  tipo: string
}

export interface Paquetes extends AuditFields {
  sucursal_id: string
  nombre: string
  descripcion: string | null
  personas_incluidas: number
  precio_base: string
  precio_persona_extra: string
  precio_hora: string
  productos_incluidos: PaqueteProductoIncluido[] | null
}

export interface PaquetesCreate {
  sucursal_id: string
  nombre: string
  descripcion?: string | null
  personas_incluidas?: number
  precio_base: string
  precio_persona_extra?: string
  precio_hora?: string
  productos_incluidos?: PaqueteProductoItem[] | null
}

export interface PaquetesUpdate {
  nombre?: string | null
  descripcion?: string | null
  personas_incluidas?: number | null
  precio_base?: string | null
  precio_persona_extra?: string | null
  precio_hora?: string | null
  activo?: boolean
  productos_incluidos?: PaqueteProductoItem[] | null
}
