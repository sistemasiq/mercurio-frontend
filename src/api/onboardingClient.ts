import { apiClient } from '@/api/axiosClient'
import { metodosPagoApi } from '@/api/metodosPagoApi'

const ONBOARDING_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

const onboardingClient = apiClient

export function getFotoIneUrl(registroId: string): string {
  return `${ONBOARDING_BASE_URL}/uploads/identificaciones/${registroId}.jpg`
}

export function getFotoLlegadaUrl(registroId: string): string {
  return `${ONBOARDING_BASE_URL}/uploads/llegadas/${registroId}.jpg`
}

export interface FotosUploadResponse {
  fotoIneUrl?: string
  fotoLlegadaUrl?: string
}

export interface ProductoDto {
  id: string
  nombre: string
  precio_unitario: number
  descripcion: string
}

export interface PulseraDto {
  id: string
  pulsera_rfid: string
}

export interface OnboardingDetalle {
  nino: {
    nombreCompleto: string
    edad: number
    notas: string | null
  }
  productoId: string
  cantidad: number
  pulseraId: string
}

export interface OnboardingPago {
  metodoPagoId: string
  monto: number
}

export interface OnboardingPayload {
  sucursalId: string
  tutor: {
    nombreCompleto: string
    telefono: string
  }
  parentesco: string
  detalles: OnboardingDetalle[]
  pagos: OnboardingPago[]
}

export interface OnboardingResponse {
  registroId: string
  total: number
  pagado: number
  estado: string
}

export interface ActivoDto {
  registro_id: string
  detalle_id: string
  nino: string
  notas: string | null
  edad: number
  tutor: string
  telefono: string
  parentesco: string
  pulsera: string
  minutos_pagados: number
  minutos_transcurridos: number
}

export interface CheckoutResponse {
  detalleId: string
  registroId: string
  horasExtra: number
  totalExtra: number
  ninosRestantes: number
}

//Llamadas a la api

// Método de pago por defecto para cobros de estancia (check-in y cargos extra
// de checkout), hasta que exista un selector de método de pago en la UI.
export async function fetchMetodoPagoPorDefecto(): Promise<string | null> {
  const metodos = await metodosPagoApi.listar()
  const activo = metodos.find((m) => m.activo)
  return activo?.id ?? null
}

// GET /estancias/productos/${sucursalId} para obtener el costo por hora
export async function fetchProductos(sucursalId: string): Promise<ProductoDto[]> {
  const { data } = await onboardingClient.get<ProductoDto[]>(`/estancias/productos/${sucursalId}`)
  return data
}

// GET /pulseras/sucursal/{sucursalId}
export async function fetchPulseras(sucursalId: string): Promise<PulseraDto[]> {
  const { data } = await onboardingClient.get<PulseraDto[]>(`/pulseras/sucursal/${sucursalId}`)
  return data
}

// POST /estancias
export async function postOnboarding(
  payload: OnboardingPayload,
  fotoIne: File | Blob,
  fotoLlegada: File | Blob,
): Promise<OnboardingResponse> {
  const formData = new FormData()

  formData.append('fotoIne', fotoIne)
  formData.append('fotoLlegada', fotoLlegada)

  formData.append('payload', JSON.stringify(payload))

  const { data } = await onboardingClient.post<OnboardingResponse>('/estancias', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}
// GET /estancias/activos/{sucursalId}

export async function fetchActivos(sucursalId: string): Promise<ActivoDto[]> {
  const { data } = await onboardingClient.get<ActivoDto[]>(`/estancias/activos/${sucursalId}`)
  return data
}

// POST /estancias/{detalleId}/checkout
export async function checkout(detalleId: string): Promise<CheckoutResponse> {
  const { data } = await onboardingClient.post(`/estancias/${detalleId}/checkout`)

  return data
}

// POST /estancias/{registro_id}/pago
export async function pagarExtra(
  registroId: string,
  sucursalId: string,
  pagos: OnboardingPago[],
): Promise<void> {
  await onboardingClient.post(`/estancias/${registroId}/pagos`, pagos, {
    params: {
      sucursal_id: sucursalId,
    },
  })
}
