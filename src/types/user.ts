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
}

export interface CreateUserPayload {
  name: string
  lastName?: string | null
  phone?: string | null
  email: string
  password: string
  role: UserRole
  branchId?: string | null
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
}
