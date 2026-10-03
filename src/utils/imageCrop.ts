/**
 * imageCrop.ts
 *
 * Recorta una imagen al cuadrado centrado y la redimensiona a un tamaño fijo
 * en JPEG, usando <canvas> en el cliente (sin librerías nuevas). Pensado para
 * normalizar la imagen de producto a 1:1 antes de subirla (D1.4).
 */

const TAMANO_DEFECTO = 800
const CALIDAD_JPEG = 0.85

/**
 * Carga un File/Blob de imagen como HTMLImageElement.
 */
function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen seleccionada.'))
    }
    img.src = url
  })
}

/**
 * Recorta `img` a un cuadrado centrado (el lado más corto) y lo dibuja
 * redimensionado a `tamano`x`tamano` en un canvas.
 */
function dibujarCuadradoCentrado(img: HTMLImageElement, tamano: number): HTMLCanvasElement {
  const lado = Math.min(img.naturalWidth, img.naturalHeight)
  const origenX = (img.naturalWidth - lado) / 2
  const origenY = (img.naturalHeight - lado) / 2

  const canvas = document.createElement('canvas')
  canvas.width = tamano
  canvas.height = tamano
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el recorte de la imagen.')

  ctx.drawImage(img, origenX, origenY, lado, lado, 0, 0, tamano, tamano)
  return canvas
}

function canvasToJpegFile(canvas: HTMLCanvasElement, nombreBase: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar la imagen recortada.'))
          return
        }
        const nombre = `${nombreBase.replace(/\.[^.]+$/, '')}.jpg`
        resolve(new File([blob], nombre, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      CALIDAD_JPEG,
    )
  })
}

/**
 * Recorta una imagen al cuadrado centrado y la redimensiona a
 * `tamano`x`tamano` (800x800 por defecto) en JPEG.
 */
export async function recortarImagenCuadrada(
  file: File,
  tamano: number = TAMANO_DEFECTO,
): Promise<File> {
  const img = await cargarImagen(file)
  const canvas = dibujarCuadradoCentrado(img, tamano)
  return canvasToJpegFile(canvas, file.name)
}
