import { apiClient } from './axiosClient'
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/types/branch'

interface BackendBranchResponse {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  clave: string | null
  administrador_id: string | null
  administrador_name: string | null
  is_active: boolean
  creado: string | null
}

function mapBranch(raw: BackendBranchResponse): Branch {
  return {
    id: raw.id,
    nombre: raw.nombre,
    direccion: raw.direccion,
    telefono: raw.telefono,
    correo: raw.correo,
    clave: raw.clave,
    administradorId: raw.administrador_id,
    administradorName: raw.administrador_name,
    isActive: raw.is_active,
    creado: raw.creado,
  }
}

export const branchesApi = {
  async list(): Promise<Branch[]> {
    const { data } = await apiClient.get<BackendBranchResponse[]>('/branches')
    return data.map(mapBranch)
  },

  async getById(id: string): Promise<Branch> {
    const { data } = await apiClient.get<BackendBranchResponse>(`/branches/${id}`)
    return mapBranch(data)
  },

  async create(payload: CreateBranchPayload): Promise<Branch> {
    const { data } = await apiClient.post<BackendBranchResponse>('/branches', payload)
    return mapBranch(data)
  },

  async update(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const { data } = await apiClient.put<BackendBranchResponse>(`/branches/${id}`, payload)
    return mapBranch(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.patch(`/branches/${id}/deactivate`)
  },
}
