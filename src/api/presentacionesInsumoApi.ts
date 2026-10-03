import { apiClient } from '@/api/axiosClient'
import type {
  PresentacionInsumo,
  PresentacionInsumoCreate,
  PresentacionInsumoUpdate,
} from '@/types/presentacionInsumo'

export const presentacionesInsumoApi = {
  async listarPorInsumo(insumoId: string): Promise<PresentacionInsumo[]> {
    const { data } = await apiClient.get<PresentacionInsumo[]>(
      `/insumos/${insumoId}/presentaciones`,
    )
    return data
  },

  async crear(insumoId: string, body: PresentacionInsumoCreate): Promise<PresentacionInsumo> {
    const { data } = await apiClient.post<PresentacionInsumo>(
      `/insumos/${insumoId}/presentaciones`,
      body,
    )
    return data
  },

  async actualizar(
    insumoId: string,
    presentacionId: string,
    body: PresentacionInsumoUpdate,
  ): Promise<PresentacionInsumo> {
    const { data } = await apiClient.patch<PresentacionInsumo>(
      `/insumos/${insumoId}/presentaciones/${presentacionId}`,
      body,
    )
    return data
  },

  async eliminar(insumoId: string, presentacionId: string): Promise<void> {
    await apiClient.delete(`/insumos/${insumoId}/presentaciones/${presentacionId}`)
  },
}
