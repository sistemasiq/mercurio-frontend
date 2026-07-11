import { apiClient, rawApiClient } from '@/api/axiosClient'
import type { BranchOption, LoginRequest, UserRole } from '@/types/auth'

export interface BackendUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  branch_id: string | null
  branch_name: string | null
  permissions: string[]
}

export interface BackendLoginResponse {
  requires_branch_selection: false
  token: string
  token_type: string
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
  user: BackendUser
}

export interface BackendBranchSelectionRequired {
  requires_branch_selection: true
  sucursales: BranchOption[]
}

export type BackendLoginRawResponse = BackendLoginResponse | BackendBranchSelectionRequired

export const authApi = {
  async login(credentials: LoginRequest): Promise<BackendLoginRawResponse> {
    const { data } = await rawApiClient.post<BackendLoginRawResponse>('/auth/login', credentials)
    return data
  },

  async me(): Promise<BackendUser> {
    const { data } = await apiClient.get<BackendUser>('/auth/me')
    return data
  },

  async refresh(refreshToken: string): Promise<BackendLoginResponse> {
    const { data } = await rawApiClient.post<BackendLoginResponse>('/auth/refresh', {
      refreshToken,
    })
    return data
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken })
  },
}
