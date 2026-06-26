import AuditFields from '@/types/shared'

export interface MetodosPago extends AuditFields {
  nombre: string
  descripcion: string | null
}

export interface MetodosPagoCreate {
  nombre: string
  descripcion?: string
}

export interface MetodosPagoUpdate {
  nombre?: string
  descripcion?: string
  activo?: boolean
}
