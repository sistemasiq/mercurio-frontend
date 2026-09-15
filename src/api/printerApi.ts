import { apiClient } from '@/api/axiosClient'

export interface PrinterMeta {
  Name: string
  DriverName: string
  PortName: string
  PaperNames: string[]
  tipo_detectado: string
  paper?: { ancho_mm: number; alto_mm?: number; papel: string }
  badge?: string
}

export interface PrinterConfig {
  id: string
  sucursal_id: string
  tipo: 'ticket' | 'etiqueta'
  nombre_impresora: string
  ancho_mm: number
  alto_mm: number | null
  driver_detectado: string | null
  tipo_detectado: string
  paper_names: string[]
  override_manual: boolean
}

export async function listPrinters(): Promise<PrinterMeta[]> {
  const { data } = await apiClient.get<PrinterMeta[]>('/printers')
  return data
}

export async function getPrintersMeta(): Promise<{
  printers: PrinterMeta[]
  count: number
  gdi_available: boolean
}> {
  const { data } = await apiClient.get('/printers/meta')
  return data
}

export async function listConfig(): Promise<PrinterConfig[]> {
  const { data } = await apiClient.get<PrinterConfig[]>('/config-impresora')
  return data
}

export async function saveConfig(payload: {
  tipo: 'ticket' | 'etiqueta'
  nombre_impresora: string
  ancho_mm?: number
  alto_mm?: number | null
  tipo_detectado?: string
  override_manual?: boolean
}): Promise<PrinterConfig> {
  const { data } = await apiClient.put<PrinterConfig>('/config-impresora', payload)
  return data
}

export async function deleteConfig(tipo: 'ticket' | 'etiqueta'): Promise<void> {
  await apiClient.delete(`/config-impresora/${tipo}`)
}

export async function previewTicket(payload: {
  printerName?: string
  tipo?: 'ticket' | 'etiqueta'
  ancho_mm?: number
  lineas?: string[]
  texto?: string
}): Promise<{ pdfBase64: string; ancho_mm: number }> {
  const { data } = await apiClient.post('/print/ticket/preview', payload)
  return data
}

export async function printTicketDirecto(payload: {
  printerName?: string
  tipo?: 'ticket' | 'etiqueta'
  ancho_mm?: number
  lineas?: string[]
  texto?: string
  data?: Record<string, unknown>
}): Promise<{
  pdfBase64: string
  printer: string
  ancho_mm: number
  fallback?: boolean
  error?: string
}> {
  const { data } = await apiClient.post('/print/ticket', payload)
  return data
}
