/**
 * Fallback web puro: pdf-lib + window.print() en iframe.
 * Se usa cuando no hay backend GDI (Linux/Docker) o /printers vacío.
 */

export function usePrinterFallback() {
  function printPdfBase64ViaIframe(pdfBase64: string, _filename = 'ticket.pdf'): void {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    // data URL
    iframe.src = `data:application/pdf;base64,${pdfBase64}`
    document.body.appendChild(iframe)
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        // fallback: abrir en nueva pestaña
        window.open(`data:application/pdf;base64,${pdfBase64}`, '_blank')
      }
      setTimeout(() => iframe.remove(), 1500)
    }
    // si no dispara onload (algunos navegadores), remover igual
    setTimeout(() => {
      if (document.body.contains(iframe) && !iframe.contentWindow) iframe.remove()
    }, 3000)
  }

  function downloadPdfBase64(pdfBase64: string, filename = 'ticket.pdf'): void {
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdfBase64}`
    link.download = filename
    link.click()
  }

  function pdfDataUrl(pdfBase64: string): string {
    return `data:application/pdf;base64,${pdfBase64}`
  }

  return { printPdfBase64ViaIframe, downloadPdfBase64, pdfDataUrl }
}
