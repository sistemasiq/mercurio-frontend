import { apiClient } from '@/api/axiosClient'
import type { UnidadMedida } from '@/types/unidadMedida'

export const unidadesMedidaApi = {
  async listar(): Promise<UnidadMedida[]> {
    const { data } = await apiClient.get<UnidadMedida[]>('/unidades-medida')
    return data
  },
}
