import { apiClient } from '@/api/axiosClient'
import type { LoginRequest, LoginResponse, User, UserRole } from '@/types/auth'

interface BackendUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  branch_id: string | null
}

interface BackendLoginResponse {
  token: string
  token_type: string
  expires_in: number
  user: BackendUser
}

function mapUser(raw: BackendUser): User {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    roles: [raw.role],
  }
}

function mapLoginResponse(raw: BackendLoginResponse): LoginResponse {
  return {
    token: raw.token,
    tokenType: raw.token_type,
    expiresIn: raw.expires_in,
    user: mapUser(raw.user),
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendLoginResponse>('/auth/login', credentials)
    return mapLoginResponse(data)
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },
}
