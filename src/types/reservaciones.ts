import AuditFields from '@/types/shared'

export type EstadoReservacion = 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada'

export interface Reservaciones extends AuditFields {
  sucursal_id: string
  tipo_evento_id: string
  paquete_id: string
  nombre_cliente: string
  apellidos_cliente: string | null
  telefono_cliente: string
  email_cliente: string | null
  nombre_festejado: string | null
  edad_festejado: number | null
  fecha_evento: string
  hora_inicio: string
  hora_fin: string
  numero_personas: number
  precio_base: string
  precio_personas_extra: string
  horas_reservadas: number
  precio_horas: string
  precio_productos: string
  precio_extras: string
  descuento: string
  precio_total: string
  anticipo: string
  saldo_pendiente: string
  estado: EstadoReservacion
  comanda_enviada: boolean
  notas: string | null
}

export interface ReservacionesCreate {
  sucursal_id: string
  tipo_evento_id: string
  paquete_id: string
  nombre_cliente: string
  apellidos_cliente?: string | null
  telefono_cliente: string
  email_cliente?: string | null
  nombre_festejado?: string | null
  edad_festejado?: number | null
  fecha_evento: string
  hora_inicio: string
  hora_fin: string
  numero_personas: number
  precio_base: string
  precio_personas_extra?: string
  horas_reservadas?: number
  precio_horas?: string
  precio_productos?: string
  precio_extras?: string
  descuento?: string
  precio_total: string
  anticipo?: string
  estado?: EstadoReservacion
  notas?: string | null
}

export interface ReservacionesUpdate {
  nombre_cliente?: string | null
  apellidos_cliente?: string | null
  telefono_cliente?: string | null
  email_cliente?: string | null
  nombre_festejado?: string | null
  edad_festejado?: number | null
  fecha_evento?: string | null
  hora_inicio?: string | null
  hora_fin?: string | null
  numero_personas?: number | null
  precio_base?: string | null
  precio_personas_extra?: string | null
  horas_reservadas?: number | null
  precio_horas?: string | null
  precio_productos?: string | null
  precio_extras?: string | null
  descuento?: string | null
  precio_total?: string | null
  anticipo?: string | null
  estado?: EstadoReservacion | null
  notas?: string | null
  activo?: boolean
}
