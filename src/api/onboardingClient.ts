import { apiClient } from '@/api/axiosClient'

// Hardcoded sucursal ID temporal
export const SUCURSAL_ID = '905ea5cf-6951-43f1-9766-75f7e61fde07'

// Hardcoded simulated payment method
// A la espera de tener el componente de pago para esto
export const METODO_PAGO_ID = 'b827363b-6453-40e4-9536-f7a004711f91'

const ONBOARDING_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

const onboardingClient = apiClient

const UPLOADS_BASE_URL = ONBOARDING_BASE_URL.replace(/\/api\/?$/, '')

export function getFotoIneUrl(registroId: string): string {
  return `${UPLOADS_BASE_URL}/uploads/identificaciones/${registroId}.jpg`
}

export function getFotoLlegadaUrl(registroId: string): string {
  return `${UPLOADS_BASE_URL}/uploads/llegadas/${registroId}.jpg`
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

// GET /estancias/productos/${sucursalId} para obtener el costo por hora
export async function fetchProductos(sucursalId: string = SUCURSAL_ID): Promise<ProductoDto[]> {
  const { data } = await onboardingClient.get<ProductoDto[]>(`/estancias/productos/${sucursalId}`)
  return data
}

// GET /pulseras/{sucursalId}
export async function fetchPulseras(sucursalId: string = SUCURSAL_ID): Promise<PulseraDto[]> {
  const { data } = await onboardingClient.get<PulseraDto[]>(`/pulseras/${sucursalId}`)
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

export async function fetchActivos(sucursalId: string = SUCURSAL_ID): Promise<ActivoDto[]> {
  const { data } = await onboardingClient.get<ActivoDto[]>(`/estancias/activos/${sucursalId}`)
  return data
}

// POST /estancias/checkout/{detalleId}
export async function checkout(detalleId: string): Promise<CheckoutResponse> {
  const { data } = await onboardingClient.post(`/estancias/checkout/${detalleId}`)

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
