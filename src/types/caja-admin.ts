export interface CajaAdmin {
  id: string
  nombre: string
  numero: number
  activo: boolean
}

export interface CajaCreate {
  nombre: string
  numero: number
}

export interface CajaUpdate {
  nombre?: string
  numero?: number
  activo?: boolean
}
