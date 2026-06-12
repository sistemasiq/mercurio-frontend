import { apiClient } from './axiosClient'
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/types/branch'

interface BackendBranchResponse {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  is_active: boolean
}

function mapBranch(raw: BackendBranchResponse): Branch {
  return {
    id: raw.id,
    nombre: raw.nombre,
    direccion: raw.direccion,
    telefono: raw.telefono,
    isActive: raw.is_active,
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
    const { data } = await apiClient.post<BackendBranchResponse>('/branches', {
      nombre: payload.nombre,
      direccion: payload.direccion ?? null,
      telefono: payload.telefono ?? null,
    })
    return mapBranch(data)
  },

  async update(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const { data } = await apiClient.put<BackendBranchResponse>(`/branches/${id}`, {
      nombre: payload.nombre,
      direccion: payload.direccion ?? null,
      telefono: payload.telefono ?? null,
    })
    return mapBranch(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/branches/${id}`)
  },
}
