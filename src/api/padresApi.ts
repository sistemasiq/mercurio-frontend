import { rawApiClient } from './axiosClient'
import type { PadreDashboardResponse } from '@/types/padres'

export const padresApi = {
  async loginConToken(token: string): Promise<PadreDashboardResponse> {
    const { data } = await rawApiClient.post<PadreDashboardResponse>('/padres/auth', { token })
    return data
  },
}
