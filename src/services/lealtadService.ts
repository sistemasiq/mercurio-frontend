import { lealtadApi } from '@/api/lealtadApi'
import type { ConfiguracionLealtad, ConfiguracionLealtadInput } from '@/types/lealtad'

export async function obtenerConfiguracionLealtad(
  sucursalId: string,
): Promise<ConfiguracionLealtad> {
  return lealtadApi.obtenerConfiguracion(sucursalId)
}

export async function actualizarConfiguracionLealtad(
  sucursalId: string,
  body: ConfiguracionLealtadInput,
): Promise<ConfiguracionLealtad> {
  return lealtadApi.actualizarConfiguracion(sucursalId, body)
}
