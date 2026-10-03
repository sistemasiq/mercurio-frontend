import { apiClient } from '@/api/axiosClient'
import type { Compra, CompraCreate, CompraEditar, RecibirCompraRequest } from '@/types/compra'

export const comprasApi = {
  async listar(sucursalId: string): Promise<Compra[]> {
    const { data } = await apiClient.get<Compra[]>('/compras', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async obtener(compraId: string): Promise<Compra> {
    const { data } = await apiClient.get<Compra>(`/compras/${compraId}`)
    return data
  },

  async crear(body: CompraCreate): Promise<Compra> {
    const { data } = await apiClient.post<Compra>('/compras', body)
    return data
  },

  async editar(compraId: string, body: CompraEditar): Promise<Compra> {
    const { data } = await apiClient.put<Compra>(`/compras/${compraId}`, body)
    return data
  },

  async recibir(compraId: string, body?: RecibirCompraRequest): Promise<Compra> {
    const { data } = await apiClient.post<Compra>(`/compras/${compraId}/recibir`, body ?? {})
    return data
  },

  async cancelar(compraId: string): Promise<Compra> {
    const { data } = await apiClient.post<Compra>(`/compras/${compraId}/cancelar`)
    return data
  },
}
