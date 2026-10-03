import AuditFields from '@/types/shared'

export interface Extras extends AuditFields {
  sucursal_id: string | null
  nombre: string
  descripcion: string | null
  precio: string
  unidad: 'evento' | 'persona' | 'hora'
}

export interface ExtrasCreate {
  nombre: string
  precio: string
  unidad?: 'evento' | 'persona' | 'hora'
  descripcion?: string | null
  sucursal_id?: string | null
}

export interface ExtrasUpdate {
  nombre?: string | null
  descripcion?: string | null
  precio?: string | null
  unidad?: 'evento' | 'persona' | 'hora' | null
  sucursal_id?: string | null
  activo?: boolean
}
