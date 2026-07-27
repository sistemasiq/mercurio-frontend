import { apiClient } from '@/api/axiosClient'
import type {
  ConfiguracionLealtad,
  ConfiguracionLealtadInput,
  MovimientoPuntos,
  ReporteLealtad,
  SaldoPuntos,
} from '@/types/lealtad'

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

  async obtenerSaldo(sucursalId: string, celular: string): Promise<SaldoPuntos> {
    const { data } = await apiClient.get<SaldoPuntos>('/lealtad/saldo', {
      params: { sucursal_id: sucursalId, celular },
    })
    return data
  },

  async listarMovimientos(
    sucursalId: string,
    celular: string,
    desde?: string,
    hasta?: string,
  ): Promise<MovimientoPuntos[]> {
    const { data } = await apiClient.get<MovimientoPuntos[]>('/lealtad/movimientos', {
      params: { sucursal_id: sucursalId, celular, desde, hasta },
    })
    return data
  },

  async obtenerReporte(sucursalId: string): Promise<ReporteLealtad> {
    const { data } = await apiClient.get<ReporteLealtad>('/lealtad/reporte', {
      params: { sucursal_id: sucursalId },
    })
    return data
  },
}
