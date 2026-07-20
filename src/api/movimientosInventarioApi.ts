import { apiClient } from '@/api/axiosClient'
import type { MovimientoInventario, MovimientoManualCreate } from '@/types/movimientoInventario'

export const movimientosInventarioApi = {
  async listarPorInsumo(insumoId: string): Promise<MovimientoInventario[]> {
    const { data } = await apiClient.get<MovimientoInventario[]>(`/insumos/${insumoId}/movimientos`)
    return data
  },

  async registrar(insumoId: string, body: MovimientoManualCreate): Promise<MovimientoInventario> {
    const { data } = await apiClient.post<MovimientoInventario>(
      `/insumos/${insumoId}/movimientos`,
      body,
    )
    return data
  },
}
