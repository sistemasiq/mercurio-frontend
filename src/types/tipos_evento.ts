import AuditFields from '@/types/shared'

export interface Tipos_evento extends AuditFields {
  nombre: string
  descripcion: string | null
}

export interface Tipos_evento_create {
  nombre: string
  descripcion?: string | null
}

export interface Tipos_evento_update extends Partial<Tipos_evento_create> {
  activo?: boolean
}
