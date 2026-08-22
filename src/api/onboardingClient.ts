import { apiClient } from '@/api/axiosClient'
import { metodosPagoApi } from '@/api/metodosPagoApi'

const onboardingClient = apiClient

// Las fotos de INE/llegada se sirven en una ruta protegida por JWT, que un
// <img src="..."> no puede enviar. Se descargan con el cliente autenticado y
// se exponen como blob URL para usarlas en <img>.
async function fetchFotoBlobUrl(carpeta: 'identificaciones' | 'llegadas', registroId: string) {
  const { data } = await onboardingClient.get(`/uploads/${carpeta}/${registroId}.jpg`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(data)
}

export function fetchFotoIneUrl(registroId: string): Promise<string> {
  return fetchFotoBlobUrl('identificaciones', registroId)
}

export function fetchFotoLlegadaUrl(registroId: string): Promise<string> {
  return fetchFotoBlobUrl('llegadas', registroId)
}

export interface FotosUploadResponse {
  fotoIneUrl?: string
  fotoLlegadaUrl?: string
}

export interface ProductoDto {
  id: string
  nombre: string
  precioUnitario: number
  descripcion: string
}

export interface PulseraDto {
  id: string
  pulseraRfid: string
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
  nombreSegundoTutor: string | null
  pulseraTutorId: string
  parentesco: string
  detalles: OnboardingDetalle[]
  pagos: OnboardingPago[]
  cambio?: number
  reservacionId?: string | null
}

export interface OnboardingResponse {
  registroId: string
  total: number
  pagado: number
  estado: string
}

export interface ActivoDto {
  registroId: string
  nombreSegundoTutor: string | null
  pulseraTutorId: string
  pulseraTutorRfid: string
  detalleId: string
  nino: string
  notas: string | null
  edad: number
  tutor: string
  telefono: string
  parentesco: string
  pulsera: string
  minutosPagados: number
  minutosTranscurridos: number
}

export interface CheckoutResponse {
  detalleId: string
  registroId: string
  horasExtra: number
  totalExtra: number
  ninosRestantes: number
}

export interface CotizacionCheckoutResponse {
  detalleId: string
  horasExtra: number
  totalExtra: number
  cotizadoEn: string
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

// GET /estancias/{detalleId}/checkout/cotizacion
// Solo lectura: no registra hora_salida ni cargo. Se llama al entrar a la
// pantalla de checkout y de nuevo justo antes de confirmar la salida, porque
// el monto puede cambiar entre una llamada y otra (el backend recalcula con
// la hora real al confirmar, y rechaza si lo pagado ya no alcanza).
export async function cotizarCheckout(detalleId: string): Promise<CotizacionCheckoutResponse> {
  const { data } = await onboardingClient.get(`/estancias/${detalleId}/checkout/cotizacion`)
  return data
}

// POST /estancias/{detalleId}/checkout
// Si hay cargo extra (> 0), 'pagos' debe cubrir exactamente el monto vigente
// en el momento de esta llamada (recalculado en el backend) o responde 409.
export async function checkout(
  detalleId: string,
  pulseraTutorId: string,
  pagos: OnboardingPago[] = [],
): Promise<CheckoutResponse> {
  const { data } = await onboardingClient.post(`/estancias/${detalleId}/checkout`, {
    pulseraTutorId: pulseraTutorId,
    pagos,
  })

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
