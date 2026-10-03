import type { UserRole } from './auth'

export interface UserListItem {
  id: string
  name: string
  lastName: string | null
  phone: string | null
  email: string
  role: UserRole
  branchId: string | null
  isActive: boolean
  lastAccess: string | null
  /** C1: true si el usuario ya tiene PIN de caja configurado. */
  tienePin: boolean
}

export interface CreateUserPayload {
  name: string
  lastName?: string | null
  phone?: string | null
  email: string
  password: string
  role: UserRole
  branchId?: string | null
  /** PIN de caja de 4 dígitos, opcional. */
  pin?: string | null
}

export interface UpdateUserPayload {
  name: string
  lastName?: string | null
  phone?: string | null
  email: string
  role: UserRole
  branchId?: string | null
  password?: string | null
  isActive?: boolean | null
  /** PIN de caja de 4 dígitos. null/omitido = no cambiar. */
  pin?: string | null
}
