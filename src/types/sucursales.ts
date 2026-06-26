import AuditFields from '@/types/shared'

export interface Sucursales extends AuditFields {
  nombre: string
  direccion: string | null
  telefono: string | null
}

export interface SucursalCreate {
  nombre: string
  direccion?: string | null
  telefono?: string | null
}

export interface SucursalUpdate extends Partial<SucursalCreate> {
  activo?: boolean
}
