export type UserRole = 'AdministradorSistema' | 'Administrador' | 'Cajero' | 'Cocina'

export interface LoginRequest {
  branchId: string
  email: string
  password: string
  rememberMe?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  branch_id?: string | null
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  tokenExpiry: number | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface StoredSession {
  token: string
  tokenExpiry: number
  user: User
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: Record<string, string[]>
}
