/**
 * downloadBlob.ts
 *
 * Descarga silenciosa de un Blob como archivo sin abrir una nueva pestaña.
 * Compatible con todos los navegadores modernos (Chrome, Firefox, Safari, Edge).
 *
 * Uso:
 *   const blob = await turnoCajaApi.descargarPdf(id)
 *   downloadBlob(blob, `arqueo_${id}.pdf`)
 */

/**
 * Crea un enlace temporal en el DOM, lo clickea programáticamente
 * y lo destruye inmediatamente. El archivo se descarga directo al
 * directorio de descargas del navegador sin mostrar ninguna nueva ventana.
 *
 * @param blob     - El contenido binario a descargar
 * @param fileName - Nombre del archivo que verá el usuario
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()

  // Limpieza inmediata: revoca la URL de objeto y elimina el nodo del DOM
  // Usamos un timeout mínimo para garantizar que el navegador haya iniciado
  // la descarga antes de revocar la URL (recomendación de la spec).
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(anchor)
  }, 150)
}
