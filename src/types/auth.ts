export type UserRole = 'Administrador' | 'Cajero' | 'Cocina' | 'AdministradorSistema'

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
  roles: UserRole[]
}

export interface LoginResponse {
  token: string
  tokenType: string
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
