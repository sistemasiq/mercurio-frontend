import { lealtadApi } from '@/api/lealtadApi'
import type {
  ConfiguracionLealtad,
  ConfiguracionLealtadInput,
  MovimientoPuntos,
  ReporteLealtad,
  SaldoPuntos,
} from '@/types/lealtad'

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

export async function obtenerSaldoLealtad(
  sucursalId: string,
  celular: string,
): Promise<SaldoPuntos> {
  return lealtadApi.obtenerSaldo(sucursalId, celular)
}

export async function listarMovimientosLealtad(
  sucursalId: string,
  celular: string,
  desde?: string,
  hasta?: string,
): Promise<MovimientoPuntos[]> {
  return lealtadApi.listarMovimientos(sucursalId, celular, desde, hasta)
}

export async function obtenerReporteLealtad(sucursalId: string): Promise<ReporteLealtad> {
  return lealtadApi.obtenerReporte(sucursalId)
}
