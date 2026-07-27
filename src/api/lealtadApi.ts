import { apiClient } from '@/api/axiosClient'
import type { ConfiguracionLealtad, ConfiguracionLealtadInput } from '@/types/lealtad'

export const lealtadApi = {
  async obtenerConfiguracion(sucursalId: string): Promise<ConfiguracionLealtad> {
    const { data } = await apiClient.get<ConfiguracionLealtad>('/lealtad/configuracion', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },

  async actualizarConfiguracion(
    sucursalId: string,
    body: ConfiguracionLealtadInput,
  ): Promise<ConfiguracionLealtad> {
    const { data } = await apiClient.put<ConfiguracionLealtad>('/lealtad/configuracion', body, {
      params: { sucursal_id: sucursalId },
    })
    return data
  },
}
