import { apiClient } from './axiosClient'
import type { UserListItem, CreateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'

interface BackendUserResponse {
  id: string
  full_name: string
  email: string
  role: UserRole
  branch_id: string | null
  is_active: boolean
}

interface BackendCreateUserRequest {
  full_name: string
  email: string
  password: string
  role: UserRole
  branch_id?: string | null
}

function mapUser(raw: BackendUserResponse): UserListItem {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    role: raw.role,
    branchId: raw.branch_id,
    isActive: raw.is_active,
  }
}

export const usersApi = {
  async list(): Promise<UserListItem[]> {
    const { data } = await apiClient.get<BackendUserResponse[]>('/users')
    return data.map(mapUser)
  },

  async create(payload: CreateUserPayload): Promise<UserListItem> {
    const body: BackendCreateUserRequest = {
      full_name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      branch_id: payload.branchId ?? null,
    }
    const { data } = await apiClient.post<BackendUserResponse>('/users', body)
    return mapUser(data)
  },
}
