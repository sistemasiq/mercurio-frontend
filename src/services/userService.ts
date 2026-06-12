import { usersApi } from '@/api/usersApi'
import type { CreateUserPayload, UserListItem } from '@/types/user'

export const userService = {
  async listUsers(): Promise<UserListItem[]> {
    return usersApi.list()
  },

  async createUser(payload: CreateUserPayload): Promise<UserListItem> {
    return usersApi.create(payload)
  },
}
