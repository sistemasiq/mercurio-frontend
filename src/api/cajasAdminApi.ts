import { apiClient } from './axiosClient'
import type { CajaAdmin, CajaCreate, CajaUpdate, TurnoActualCaja } from '@/types/caja-admin'

interface BackendTurnoActual {
  id: string
  cajero: string
  apertura: string
}

interface BackendCaja {
  id: string
  nombre: string
  numero: number
  activo: boolean
  impresora: string | null
  turno_actual: BackendTurnoActual | null
}

function mapTurnoActual(raw: BackendTurnoActual | null): TurnoActualCaja | null {
  if (!raw) return null
  return { id: raw.id, cajero: raw.cajero, apertura: raw.apertura }
}

function mapCaja(raw: BackendCaja): CajaAdmin {
  return {
    id: raw.id,
    nombre: raw.nombre,
    numero: raw.numero,
    activo: raw.activo,
    impresora: raw.impresora,
    turnoActual: mapTurnoActual(raw.turno_actual),
  }
}

export const cajasAdminApi = {
  async list(sucursalId?: string): Promise<CajaAdmin[]> {
    const { data } = await apiClient.get<BackendCaja[]>('/cajas', {
      params: sucursalId ? { sucursal_id: sucursalId } : undefined,
    })
    return data.map(mapCaja)
  },

  async create(payload: CajaCreate): Promise<CajaAdmin> {
    const { data } = await apiClient.post<BackendCaja>('/cajas', {
      nombre: payload.nombre,
      numero: payload.numero,
      impresora: payload.impresora ?? null,
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
