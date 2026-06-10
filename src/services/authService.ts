import { apiClient } from '@/api/axiosClient'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },
}
