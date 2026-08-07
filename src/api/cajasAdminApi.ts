import { apiClient } from './axiosClient'
import type { CajaAdmin, CajaCreate, CajaUpdate } from '@/types/caja-admin'

interface BackendCaja {
  id: string
  nombre: string
  numero: number
  activo: boolean
}

function mapCaja(raw: BackendCaja): CajaAdmin {
  return {
    id: raw.id,
    nombre: raw.nombre,
    numero: raw.numero,
    activo: raw.activo,
  }
}

export const cajasAdminApi = {
  async list(): Promise<CajaAdmin[]> {
    const { data } = await apiClient.get<BackendCaja[]>('/cajas')
    return data.map(mapCaja)
  },

  async create(payload: CajaCreate): Promise<CajaAdmin> {
    const { data } = await apiClient.post<BackendCaja>('/cajas', {
      nombre: payload.nombre,
      numero: payload.numero,
    })
    return mapCaja(data)
  },

  async update(id: string, payload: CajaUpdate): Promise<CajaAdmin> {
    const { data } = await apiClient.patch<BackendCaja>(`/cajas/${id}`, payload)
    return mapCaja(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/cajas/${id}`)
  },
}
