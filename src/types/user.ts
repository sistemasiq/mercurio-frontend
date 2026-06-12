import type { UserRole } from './auth'

export interface UserListItem {
  id: string
  name: string
  email: string
  role: UserRole
  branchId: string | null
  isActive: boolean
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: UserRole
  branchId?: string | null
}

export interface UpdateUserPayload {
  name: string
  email: string
  role: UserRole
  branchId?: string | null
  password?: string | null
}
