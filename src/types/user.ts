import type { UserRole } from './auth'

export interface UserListItem {
  id: number
  name: string
  email: string
  roles: UserRole[]
  isActive: boolean
  createdAt: string
}

export interface UserListResponse {
  items: UserListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  roles: UserRole[]
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalBranches: number
}
