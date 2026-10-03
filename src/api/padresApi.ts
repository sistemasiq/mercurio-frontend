import { normalizeAxiosError, rawApiClient } from './axiosClient'
import type { PadreDashboardResponse, PadreNinosActivosResponse } from '@/types/padres'

export const padresApi = {
  async loginConCode(code: string): Promise<PadreDashboardResponse> {
    try {
      const { data } = await rawApiClient.post<PadreDashboardResponse>('/padres/auth', { code })
      return data
    } catch (err) {
      throw normalizeAxiosError(err)
    }
  },

  // QA #31: polling autenticado con el token de la sesión (Authorization:
  // Bearer), no con el código. rawApiClient (no apiClient) porque el token
  // del padre no es el del staff que el interceptor global inyecta.
  async ninosActivos(token: string): Promise<PadreNinosActivosResponse> {
    try {
      const { data } = await rawApiClient.get<PadreNinosActivosResponse>('/padres/ninos-activos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    } catch (err) {
      throw normalizeAxiosError(err)
    }
  },
}
