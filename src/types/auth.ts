export type UserRole = 'Administrador' | 'Cajero' | 'Cocina' | 'AdministradorSistema'

export interface TokenPayload {
  sub: string
  email: string
  role: UserRole
  branch_id: string | null
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  branchId: string | null
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
