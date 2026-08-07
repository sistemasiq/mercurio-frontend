import { apiClient } from './axiosClient'
import type { Horario, HorarioCreate, HorarioUpdate } from '@/types/horario'

interface BackendHorario {
  id: string
  nombre: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

function mapHorario(raw: BackendHorario): Horario {
  return {
    id: raw.id,
    nombre: raw.nombre,
    horaInicio: raw.hora_inicio,
    horaFin: raw.hora_fin,
    activo: raw.activo,
  }
}

export const horariosApi = {
  async list(): Promise<Horario[]> {
    const { data } = await apiClient.get<BackendHorario[]>('/horarios')
    return data.map(mapHorario)
  },

  async create(payload: HorarioCreate): Promise<Horario> {
    const { data } = await apiClient.post<BackendHorario>('/horarios', {
      nombre: payload.nombre,
      hora_inicio: payload.horaInicio,
      hora_fin: payload.horaFin,
    })
    return mapHorario(data)
  },

  async update(id: string, payload: HorarioUpdate): Promise<Horario> {
    const body: Partial<BackendHorario> = {}
    if (payload.nombre !== undefined) body.nombre = payload.nombre
    if (payload.horaInicio !== undefined) body.hora_inicio = payload.horaInicio
    if (payload.horaFin !== undefined) body.hora_fin = payload.horaFin
    if (payload.activo !== undefined) body.activo = payload.activo
    const { data } = await apiClient.patch<BackendHorario>(`/horarios/${id}`, body)
    return mapHorario(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/horarios/${id}`)
  },
}
