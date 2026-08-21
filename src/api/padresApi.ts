import { normalizeAxiosError, rawApiClient } from './axiosClient'
import type { PadreDashboardResponse } from '@/types/padres'

export const padresApi = {
  async loginConCode(code: string): Promise<PadreDashboardResponse> {
    try {
      const { data } = await rawApiClient.post<PadreDashboardResponse>('/padres/auth', { code })
      return data
    } catch (err) {
      throw normalizeAxiosError(err)
    }
  },
}
