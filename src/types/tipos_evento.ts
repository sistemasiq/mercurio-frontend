import AuditFields from '@/types/shared'

export interface Tipos_evento extends AuditFields {
  sucursal_id: string | null
  nombre: string
  descripcion: string | null
}

export interface Tipos_evento_create {
  nombre: string
  descripcion?: string | null
  sucursal_id?: string | null
}

export interface Tipos_evento_update extends Partial<Tipos_evento_create> {
  activo?: boolean
}
