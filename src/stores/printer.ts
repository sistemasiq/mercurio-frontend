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

  async function cargarPrinters(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const meta = await printerApi.getPrintersMeta()
      printersMeta.value = meta.printers
      printers.value = meta.printers
      gdiAvailable.value = meta.gdi_available
    } catch (e: unknown) {
      error.value = (e as Error).message
      printers.value = []
      printersMeta.value = []
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
    lineas?: string[]
    texto?: string
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
    cargarPrinters,
    cargarConfig,
    configPorTipo,
    guardar,
    preview,
    imprimirDirecto,
  }
})
