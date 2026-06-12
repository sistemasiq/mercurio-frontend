import { branchesApi } from '@/api/branchesApi'
import type { Branch, CreateBranchPayload } from '@/types/branch'

export const branchService = {
  async listBranches(): Promise<Branch[]> {
    return branchesApi.list()
  },

  async createBranch(payload: CreateBranchPayload): Promise<Branch> {
    return branchesApi.create(payload)
  },
}
