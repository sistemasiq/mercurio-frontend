export interface TurnoActualCaja {
  id: string
  cajero: string
  apertura: string
}

export interface CajaAdmin {
  id: string
  nombre: string
  numero: number
  activo: boolean
  impresora: string | null
  turnoActual: TurnoActualCaja | null
}

export interface CajaCreate {
  nombre: string
  numero: number
  impresora?: string | null
}

export interface CajaUpdate {
  nombre?: string
  numero?: number
  activo?: boolean
  impresora?: string | null
}
