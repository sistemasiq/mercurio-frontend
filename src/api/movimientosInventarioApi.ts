import { apiClient } from '@/api/axiosClient'
import type {
  ConteoFisicoCreate,
  MovimientoInventario,
  MovimientoManualCreate,
} from '@/types/movimientoInventario'

export const movimientosInventarioApi = {
  async listarPorInsumo(
    insumoId: string,
    desde?: string,
    hasta?: string,
  ): Promise<MovimientoInventario[]> {
    const { data } = await apiClient.get<MovimientoInventario[]>(
      `/insumos/${insumoId}/movimientos`,
      { params: { desde, hasta } },
    )
    return data
  },

  async registrar(insumoId: string, body: MovimientoManualCreate): Promise<MovimientoInventario> {
    const { data } = await apiClient.post<MovimientoInventario>(
      `/insumos/${insumoId}/movimientos`,
      body,
    )
    return data
  },

  async conteo(insumoId: string, body: ConteoFisicoCreate): Promise<MovimientoInventario> {
    const { data } = await apiClient.post<MovimientoInventario>(`/insumos/${insumoId}/conteo`, body)
    return data
  },
}
