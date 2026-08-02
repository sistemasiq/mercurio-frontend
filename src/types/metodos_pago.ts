import AuditFields from '@/types/shared'

export interface MetodosPago extends AuditFields {
  sucursal_id: string | null
  nombre: string
  descripcion: string | null
}

export interface MetodosPagoCreate {
  nombre: string
  descripcion?: string
  sucursal_id?: string | null
}

export interface MetodosPagoUpdate {
  nombre?: string
  descripcion?: string
  sucursal_id?: string | null
  activo?: boolean
}
