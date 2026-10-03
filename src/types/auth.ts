// El catálogo de roles es dinámico (ver stores/roles.ts): cualquier string
// que exista y esté activo en la tabla `roles` del backend es válido.
export type UserRole = string

export interface TokenPayload {
  sub: string
  email: string
  role: UserRole
  branch_id: string | null
  permissions: string[]
  iat: number
  exp: number
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
  sucursalId?: string | null
}

export interface BranchOption {
  id: string
  nombre: string
}

export type LoginResult =
  | { kind: 'success'; data: LoginResponse }
  | { kind: 'selection_required'; sucursales: BranchOption[] }

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  branchId: string | null
  branchName: string | null
  permissions: string[]
  /** C1: true si el usuario ya tiene PIN de caja configurado. Opcional para no
   * romper construcciones existentes de User (login/refresh no lo traían). */
  tienePin?: boolean
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresIn: number
  refreshToken: string
  refreshExpiresIn: number
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
  /** `detail` del backend cuando es un objeto (ej. { totalExtra } en un 409). */
  details?: unknown
}
