export interface PulseraAdmin {
  id: string
  sucursal_id: string
  pulsera_rfid: string
  activo: boolean
  usada: boolean
  // Nombre del niño o del tutor que tiene esta pulsera en este momento,
  // solo si `usada` es true.
  asignada_a?: string | null
  creado?: string | null
  creado_por?: string | null
  modificado?: string | null
  modificado_por?: string | null
}

export type EstadoPulseraInicial = 'disponible' | 'en_revision'

export interface PulseraCreate {
  sucursal_id: string
  pulsera_rfid: string
  activo?: boolean
  numero_lote?: string
}

export interface PulseraUpdate {
  pulsera_rfid?: string
  activo?: boolean
}
