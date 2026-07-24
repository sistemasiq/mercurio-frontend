import { authApi } from '@/api/authApi'
import type { BackendLoginResponse, BackendUser } from '@/api/authApi'
import type { LoginRequest, LoginResponse, LoginResult, TokenPayload, User } from '@/types/auth'
import { decodeToken } from '@/utils/tokenUtils'

function mapUser(raw: BackendUser, payload: TokenPayload | null): User {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    roles: [payload?.role ?? raw.role],
    branchId: payload?.branch_id ?? raw.branch_id,
    branchName: raw.branch_name,
    permissions: payload?.permissions ?? raw.permissions,
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
  async login(credentials: LoginRequest): Promise<LoginResult> {
    const data = await authApi.login(credentials)
    if (data.requires_branch_selection) {
      return { kind: 'selection_required', sucursales: data.sucursales }
    }
    return { kind: 'success', data: mapLoginResponse(data) }
  },

  async me(): Promise<User> {
    const data = await authApi.me()
    return mapUser(data, null)
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const data = await authApi.refresh(refreshToken)
    return mapLoginResponse(data)
  },

  async logout(refreshToken: string): Promise<void> {
    await authApi.logout(refreshToken)
  },
}
