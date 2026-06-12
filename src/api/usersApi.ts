import { apiClient } from './axiosClient'
import type { CreateUserPayload, UserListItem, UserListResponse, SystemStats } from '@/types/user'

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

export const usersApi = {
  async list(params?: ListUsersParams): Promise<UserListResponse> {
    const { data } = await apiClient.get<UserListResponse>('/admin/users', { params })
    return data
  },

  async create(payload: CreateUserPayload): Promise<UserListItem> {
    const { data } = await apiClient.post<UserListItem>('/admin/users', payload)
    return data
  },

  async setActive(userId: number, isActive: boolean): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/status`, { isActive })
  },

  async getStats(): Promise<SystemStats> {
    const { data } = await apiClient.get<SystemStats>('/admin/stats')
    return data
  },
}
