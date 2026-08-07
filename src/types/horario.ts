export interface Horario {
  id: string
  nombre: string
  horaInicio: string
  horaFin: string
  activo: boolean
}

export interface HorarioCreate {
  nombre: string
  horaInicio: string
  horaFin: string
}

export interface HorarioUpdate {
  nombre?: string
  horaInicio?: string
  horaFin?: string
  activo?: boolean
}
