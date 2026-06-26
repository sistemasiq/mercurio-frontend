import { branchesApi } from '@/api/branchesApi'
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/types/branch'

export const branchService = {
  async listBranches(): Promise<Branch[]> {
    return branchesApi.list()
  },

  async getBranch(id: string): Promise<Branch> {
    return branchesApi.getById(id)
  },

  async createBranch(payload: CreateBranchPayload): Promise<Branch> {
    return branchesApi.create(payload)
  },

  async updateBranch(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    return branchesApi.update(id, payload)
  },

  async deleteBranch(id: string): Promise<void> {
    return branchesApi.remove(id)
  },

  async restoreBranch(id: string): Promise<void> {
    return branchesApi.restore(id)
  },
}
