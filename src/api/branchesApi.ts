import { apiClient } from './axiosClient'
import type {
  Branch,
  CreateBranchPayload,
  IndicadoresSucursal,
  UpdateBranchPayload,
} from '@/types/branch'

interface BackendBranchResponse {
  id: string
  nombre: string
  direccion: string | null
  ciudad: string | null
  estado: string | null
  codigo_postal: string | null
  zona_horaria: string
  hora_apertura: string
  hora_cierre: string
  telefono: string | null
  correo: string | null
  clave: string | null
  administrador_id: string | null
  administrador_name: string | null
  is_active: boolean
  creado: string | null
  creado_por: string | null
  creador_name: string | null
  modificado: string | null
  modificado_por: string | null
  modificador_name: string | null
}

function mapBranch(raw: BackendBranchResponse): Branch {
  return {
    id: raw.id,
    nombre: raw.nombre,
    direccion: raw.direccion,
    ciudad: raw.ciudad,
    estado: raw.estado,
    codigoPostal: raw.codigo_postal,
    zonaHoraria: raw.zona_horaria,
    horaApertura: raw.hora_apertura,
    horaCierre: raw.hora_cierre,
    telefono: raw.telefono,
    correo: raw.correo,
    clave: raw.clave,
    administradorId: raw.administrador_id,
    administradorName: raw.administrador_name,
    isActive: raw.is_active,
    creado: raw.creado,
    creadoPor: raw.creado_por,
    creadorName: raw.creador_name,
    modificado: raw.modificado,
    modificadoPor: raw.modificado_por,
    modificadorName: raw.modificador_name,
  }
}
export const branchesApi = {
  async list(): Promise<Branch[]> {
    const { data } = await apiClient.get<BackendBranchResponse[]>('/sucursales')
    return data.map(mapBranch)
  },

  async getById(id: string): Promise<Branch> {
    const { data } = await apiClient.get<BackendBranchResponse>(`/sucursales/${id}`)
    return mapBranch(data)
  },

  async create(payload: CreateBranchPayload): Promise<Branch> {
    const { data } = await apiClient.post<BackendBranchResponse>('/sucursales', payload)
    return mapBranch(data)
  },

  async update(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const { data } = await apiClient.put<BackendBranchResponse>(`/sucursales/${id}`, payload)
    return mapBranch(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.patch(`/sucursales/${id}/deactivate`)
  },

  async restore(id: string): Promise<void> {
    await apiClient.patch(`/sucursales/${id}/reactivate`)
  },

  async getIndicadores(id: string, desde: string, hasta: string): Promise<IndicadoresSucursal> {
    const { data } = await apiClient.get<{
      ventas: number
      ninos_atendidos: number
      eventos: number
      cajas_abiertas: number
    }>(`/sucursales/${id}/indicadores`, { params: { desde, hasta } })
    return {
      ventas: data.ventas,
      ninosAtendidos: data.ninos_atendidos,
      eventos: data.eventos,
      cajasAbiertas: data.cajas_abiertas,
    }
  },
}
