export interface Permiso {
  id: number
  codigo: string
  nombre: string
  modulo: string
  descripcion: string | null
}

export interface RolConPermisos {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  requiere_sucursal: boolean
  permisos_editables: boolean
  permisos: Permiso[]
}

export interface RolCreate {
  nombre: string
  descripcion?: string | null
  permiso_ids: number[]
}

export interface RolUpdateMetadata {
  nombre?: string
  descripcion?: string | null
  activo?: boolean
}
