import { apiClient, normalizeAxiosError, rawApiClient } from '@/api/axiosClient'
import type { BranchOption, LoginRequest, UserRole } from '@/types/auth'

export interface BackendUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  branch_id: string | null
  branch_name: string | null
  permissions: string[]
  /** C1: solo /auth/me lo trae poblado; login/refresh lo dejan en false. */
  tiene_pin?: boolean
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

export interface BackendWsTicketResponse {
  ticket: string
  expires_in: number
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<BackendLoginRawResponse> {
    try {
      const { data } = await rawApiClient.post<BackendLoginRawResponse>('/auth/login', credentials)
      return data
    } catch (err) {
      throw normalizeAxiosError(err)
    }
  },

  async me(): Promise<BackendUser> {
    const { data } = await apiClient.get<BackendUser>('/auth/me')
    return data
  },

  // QA #32: el refresh token ya no viaja en el body -- rawApiClient manda la
  // cookie HttpOnly (withCredentials) y el backend la lee desde ahí.
  async refresh(): Promise<BackendLoginResponse> {
    try {
      const { data } = await rawApiClient.post<BackendLoginResponse>('/auth/refresh', {})
      return data
    } catch (err) {
      throw normalizeAxiosError(err)
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {})
  },

  // QA #32: ticket efímero de un solo uso (30 s) para autenticar los
  // WebSockets de comandas/estancias sin exponer el JWT crudo en la URL.
  async wsTicket(): Promise<BackendWsTicketResponse> {
    const { data } = await apiClient.post<BackendWsTicketResponse>('/auth/ws-ticket')
    return data
  },
}
