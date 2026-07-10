export interface PulseraAdmin {
  id: string
  sucursal_id: string
  pulsera_rfid: string
  activo: boolean
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
