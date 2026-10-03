import { apiClient } from './axiosClient'
import type { UserListItem, CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'

interface BackendUserResponse {
  id: string
  full_name: string
  apellidos: string | null
  telefono: string | null
  email: string
  role: UserRole
  branch_id: string | null
  is_active: boolean
  ultimo_acceso: string | null
  tiene_pin?: boolean
}

function mapUser(raw: BackendUserResponse): UserListItem {
  return {
    id: raw.id,
    name: raw.full_name,
    lastName: raw.apellidos,
    phone: raw.telefono,
    email: raw.email,
    role: raw.role,
    branchId: raw.branch_id,
    isActive: raw.is_active,
    lastAccess: raw.ultimo_acceso,
    tienePin: raw.tiene_pin ?? false,
  }
}

export const usersApi = {
  async list(): Promise<UserListItem[]> {
    const { data } = await apiClient.get<BackendUserResponse[]>('/usuarios')
    return data.map(mapUser)
  },

  async getById(id: string): Promise<UserListItem> {
    const { data } = await apiClient.get<BackendUserResponse>(`/usuarios/${id}`)
    return mapUser(data)
  },

  async create(payload: CreateUserPayload): Promise<UserListItem> {
    const { data } = await apiClient.post<BackendUserResponse>('/usuarios', {
      full_name: payload.name,
      apellidos: payload.lastName ?? null,
      telefono: payload.phone ?? null,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      branch_id: payload.branchId ?? null,
      pin: payload.pin || null,
    })
    return mapUser(data)
  },

  async update(id: string, payload: UpdateUserPayload): Promise<UserListItem> {
    const { data } = await apiClient.put<BackendUserResponse>(`/usuarios/${id}`, {
      full_name: payload.name,
      apellidos: payload.lastName ?? null,
      telefono: payload.phone ?? null,
      email: payload.email,
      role: payload.role,
      branch_id: payload.branchId ?? null,
      password: payload.password || null,
      is_active: payload.isActive ?? null,
      pin: payload.pin || null,
    })
    return mapUser(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/usuarios/${id}`)
  },

  /** C1: PUT /usuarios/me/pin — el usuario cambia su propio PIN de caja. */
  async cambiarMiPin(actual: string, pinNuevo: string): Promise<void> {
    await apiClient.put('/usuarios/me/pin', { actual, pin_nuevo: pinNuevo })
  },
}
