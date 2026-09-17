import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as printerApi from '@/api/printerApi'
import type { PrinterMeta, PrinterConfig } from '@/api/printerApi'

export const usePrinterStore = defineStore('printer', () => {
  const printers = ref<PrinterMeta[]>([])
  const printersMeta = ref<PrinterMeta[]>([])
  const config = ref<PrinterConfig[]>([])
  const gdiAvailable = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pdfPreview = ref<string | null>(null)
  const diagnostico = ref<Record<string, unknown> | null>(null)
  const serverUser = ref<string | null>(null)

  async function cargarPrinters(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const meta = await printerApi.getPrintersMeta()
      printersMeta.value = meta.printers
      printers.value = meta.printers
      gdiAvailable.value = meta.gdi_available
      diagnostico.value = (meta as unknown as { diagnostico?: Record<string, unknown> }).diagnostico || null
      serverUser.value = (meta as unknown as { server?: { user: string } }).server?.user || null
    } catch (e: unknown) {
      error.value = (e as Error).message
      printers.value = []
      printersMeta.value = []
      diagnostico.value = null
    } finally {
      loading.value = false
    }
  }

  async function cargarConfig(): Promise<void> {
    try {
      config.value = await printerApi.listConfig()
    } catch {
      config.value = []
    }
  }

  function configPorTipo(tipo: 'ticket' | 'etiqueta'): PrinterConfig | undefined {
    return config.value.find((c) => c.tipo === tipo)
  }

  async function guardar(
    tipo: 'ticket' | 'etiqueta',
    nombre: string,
    ancho_mm?: number,
    alto_mm?: number | null,
    tipo_detectado?: string,
    override_manual?: boolean,
  ): Promise<void> {
    const saved = await printerApi.saveConfig({
      tipo,
      nombre_impresora: nombre,
      ancho_mm,
      alto_mm,
      tipo_detectado,
      override_manual,
    })
    const idx = config.value.findIndex((c) => c.tipo === tipo)
    if (idx >= 0) config.value[idx] = saved
    else config.value.push(saved)
  }

  async function guardarFormato(
    ancho_mm: number,
    tipo: 'ticket' | 'etiqueta' = 'ticket',
    alto_mm: number | null = null,
  ): Promise<void> {
    const saved = await printerApi.saveFormato({ tipo, ancho_mm, alto_mm })
    const idx = config.value.findIndex((c) => c.tipo === tipo)
    if (idx >= 0) config.value[idx] = saved
    else config.value.push(saved)
  }

  async function preview(payload: {
    tipo?: 'ticket' | 'etiqueta'
    ancho_mm?: number
    lineas?: string[]
    texto?: string
  }): Promise<string> {
    const res = await printerApi.previewTicket(payload)
    pdfPreview.value = res.pdfBase64
    return res.pdfBase64
  }

  async function imprimirDirecto(payload: {
    tipo?: 'ticket' | 'etiqueta'
    printerName?: string
    ancho_mm?: number
    lineas?: string[]
    texto?: string
    data?: Record<string, unknown>
  }): Promise<{ pdfBase64: string; fallback?: boolean; printer: string; ancho_mm: number }> {
    const res = await printerApi.printTicketDirecto(payload)
    pdfPreview.value = res.pdfBase64
    return res as { pdfBase64: string; fallback?: boolean; printer: string; ancho_mm: number }
  }

  return {
    printers,
    printersMeta,
    config,
    gdiAvailable,
    loading,
    error,
    pdfPreview,
    diagnostico,
    serverUser,
    cargarPrinters,
    cargarConfig,
    configPorTipo,
    guardar,
    guardarFormato,
    preview,
    imprimirDirecto,
  }
})
