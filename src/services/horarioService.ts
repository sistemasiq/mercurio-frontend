import { horariosApi } from '@/api/horariosApi'
import type { Horario, HorarioCreate, HorarioUpdate } from '@/types/horario'

export const horarioService = {
  async listHorarios(): Promise<Horario[]> {
    return horariosApi.list()
  },

  async createHorario(payload: HorarioCreate): Promise<Horario> {
    return horariosApi.create(payload)
  },

  async updateHorario(id: string, payload: HorarioUpdate): Promise<Horario> {
    return horariosApi.update(id, payload)
  },

  async deleteHorario(id: string): Promise<void> {
    return horariosApi.remove(id)
  },
}
