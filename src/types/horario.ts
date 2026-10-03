// 0 = lunes ... 6 = domingo; null/undefined = todos los días.
export const DIAS_SEMANA = [
  { label: 'Lun', fullLabel: 'Lunes', value: 0 },
  { label: 'Mar', fullLabel: 'Martes', value: 1 },
  { label: 'Mié', fullLabel: 'Miércoles', value: 2 },
  { label: 'Jue', fullLabel: 'Jueves', value: 3 },
  { label: 'Vie', fullLabel: 'Viernes', value: 4 },
  { label: 'Sáb', fullLabel: 'Sábado', value: 5 },
  { label: 'Dom', fullLabel: 'Domingo', value: 6 },
] as const

export interface Horario {
  id: string
  nombre: string
  horaInicio: string
  horaFin: string
  activo: boolean
  dias: number[] | null
}

export interface HorarioCreate {
  nombre: string
  horaInicio: string
  horaFin: string
  dias?: number[] | null
}

export interface HorarioUpdate {
  nombre?: string
  horaInicio?: string
  horaFin?: string
  activo?: boolean
  dias?: number[] | null
}
