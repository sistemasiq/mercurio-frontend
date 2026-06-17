import { apiClient, rawApiClient } from '@/api/axiosClient'
import type { LoginRequest, LoginResponse, TokenPayload, User, UserRole } from '@/types/auth'
import { decodeToken } from '@/utils/tokenUtils'

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
  refresh_token: string
  refresh_expires_in: number
  user: BackendUser
}

function mapUser(raw: BackendUser, payload: TokenPayload | null): User {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    roles: [payload?.role ?? raw.role],
    branchId: payload?.branch_id ?? raw.branch_id,
  }
}

function mapLoginResponse(raw: BackendLoginResponse): LoginResponse {
  const payload = decodeToken(raw.token)
  return {
    token: raw.token,
    tokenType: raw.token_type,
    expiresIn: raw.expires_in,
    refreshToken: raw.refresh_token,
    refreshExpiresIn: raw.refresh_expires_in,
    user: mapUser(raw.user, payload),
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await rawApiClient.post<BackendLoginResponse>('/auth/login', credentials)
    return mapLoginResponse(data)
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<BackendUser>('/auth/me')
    return mapUser(data, null)
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const { data } = await rawApiClient.post<BackendLoginResponse>('/auth/refresh', {
      refreshToken,
    })
    return mapLoginResponse(data)
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken })
  },
}
