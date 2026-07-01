import { usersApi } from '@/api/usersApi'
import type { CreateUserPayload, UpdateUserPayload, UserListItem } from '@/types/user'

export const userService = {
  async listUsers(): Promise<UserListItem[]> {
    return usersApi.list()
  },

  async getUser(id: string): Promise<UserListItem> {
    return usersApi.getById(id)
  },

  async createUser(payload: CreateUserPayload): Promise<UserListItem> {
    return usersApi.create(payload)
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserListItem> {
    return usersApi.update(id, payload)
  },

  async deleteUser(id: string): Promise<void> {
    return usersApi.remove(id)
  },
}
