import AuditFields from '@/types/shared'

export interface Paquetes extends AuditFields {
  sucursal_id: string
  nombre: string
  descripcion: string | null
  duracion_minutos: number
  personas_incluidas: number
  precio_base: string
  precio_persona_extra: string
}

export interface PaquetesCreate {
  sucursal_id: string
  nombre: string
  descripcion?: string | null
  duracion_minutos?: number
  personas_incluidas?: number
  precio_base: string
  precio_persona_extra?: string
}

export interface PaquetesUpdate {
  nombre?: string | null
  descripcion?: string | null
  duracion_minutos?: number | null
  personas_incluidas?: number | null
  precio_base?: string | null
  precio_persona_extra?: string | null
  activo?: boolean
}
