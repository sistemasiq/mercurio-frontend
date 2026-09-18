import { computed, nextTick } from 'vue'
import { usePrinterStore } from '@/stores/printer'

export type TicketSeccion = 'historial' | 'caja' | 'voucher'

/**
 * Ticket universal: cualquier impresora + respeta config_impresora.ancho_mm
 * Autoconfigure por sección: historial/caja usan ticket (58/80/210), voucher usa mismo ticket pero QR escala
 */
export function useTicketPrint(seccion: TicketSeccion = 'historial') {
  const printerStore = usePrinterStore()

  const ticketAncho = computed(() => {
    const cfg = printerStore.configPorTipo('ticket')
    const w = cfg?.ancho_mm
    if (w === 58 || w === 80 || w === 210) return w
    return 80
  })

  const ticketWidthMm = computed(() => `${ticketAncho.value}mm`)

  // Voucher QR escala con ancho para no bugea en 58mm
  const qrSize = computed(() => {
    if (seccion !== 'voucher') return 120
    if (ticketAncho.value === 58) return 90
    if (ticketAncho.value === 210) return 140
    return 110
  })

  async function asegurarConfig(): Promise<void> {
    try {
      await printerStore.cargarConfig()
    } catch {}
  }

  function printHtmlViaIframe(html: string): void {
    const w = ticketWidthMm.value
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-10000px'
    iframe.style.top = '0'
    iframe.style.width = w
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }
    const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n')
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${headStyles}
      <style>
        @page { size: ${w} auto; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .ticket-receipt, #printable-voucher, .voucher { width: ${w} !important; max-width: ${w} !important; margin: 0 auto !important; padding: 15px !important; box-sizing: border-box !important; }
      </style>
    </head><body>${html}</body></html>`)
    doc.close()
    const doPrint = () => {
      try {
        const body = doc.body
        if (body) iframe.style.height = `${Math.max(body.scrollHeight, 400) + 20}px`
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }, 1500)
      }
    }
    setTimeout(doPrint, 400)
  }

  async function imprimirDesdeRef(refEl: HTMLElement | null, fallbackHtml: string): Promise<void> {
    await nextTick()
    const html = refEl?.outerHTML || fallbackHtml
    if (!html) throw new Error('No se pudo capturar el ticket')
    printHtmlViaIframe(html)
  }

  return { ticketAncho, ticketWidthMm, qrSize, asegurarConfig, printHtmlViaIframe, imprimirDesdeRef }
}
