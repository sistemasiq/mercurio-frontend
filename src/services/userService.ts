import { usersApi, type ListUsersParams } from '@/api/usersApi'
import type { CreateUserPayload, UserListItem, UserListResponse, SystemStats } from '@/types/user'

export const userService = {
  async listUsers(params?: ListUsersParams): Promise<UserListResponse> {
    return usersApi.list(params)
  },

  async createUser(payload: CreateUserPayload): Promise<UserListItem> {
    return usersApi.create(payload)
  },

  async toggleUserStatus(userId: number, isActive: boolean): Promise<void> {
    return usersApi.setActive(userId, isActive)
  },

  async getStats(): Promise<SystemStats> {
    return usersApi.getStats()
  },
}
