import { onBeforeUnmount, ref } from 'vue'
import { sessionStorage } from '@/utils/session'
import type { ComandaWsMessage } from '@/types/comanda'

export type EstadoSocket = 'conectando' | 'conectado' | 'reconectando' | 'caido'

const MAX_INTENTOS_ANTES_DE_FALLBACK = 5
const MAX_INTENTOS_TOTALES = 20
const BACKOFF_INICIAL_MS = 1000
const BACKOFF_MAX_MS = 30000

function construirUrlWs(): string | null {
  const token = sessionStorage.load()?.token
  if (!token) return null

  const base = import.meta.env.VITE_API_BASE_URL as string
  const protocolo = window.location.protocol === 'https:' ? 'wss' : 'ws'

  let origen: string
  let path: string
  if (base.startsWith('http')) {
    const url = new URL(base)
    origen = `${protocolo}://${url.host}`
    path = url.pathname
  } else {
    origen = `${protocolo}://${window.location.host}`
    path = base
  }

  const basePath = path.endsWith('/') ? path.slice(0, -1) : path
  return `${origen}${basePath}/comandas/ws?token=${encodeURIComponent(token)}`
}

/**
 * Canal WS de comandas con reconexion (backoff exponencial). Tras
 * MAX_INTENTOS_ANTES_DE_FALLBACK intentos fallidos seguidos, expone
 * estado === 'caido' para que el componente active un fallback (ej. polling),
 * pero sigue reintentando en segundo plano a intervalos de BACKOFF_MAX_MS.
 */
export function useComandasSocket(onMessage: (msg: ComandaWsMessage) => void) {
  const estado = ref<EstadoSocket>('conectando')
  let socket: WebSocket | null = null
  let intentos = 0
  let reconectarTimeout: ReturnType<typeof setTimeout> | null = null
  let cerradoManualmente = false

  function limpiarTimeout() {
    if (reconectarTimeout !== null) {
      clearTimeout(reconectarTimeout)
      reconectarTimeout = null
    }
  }

  function programarReconexion() {
    intentos++
    if (intentos > MAX_INTENTOS_TOTALES) {
      estado.value = 'caido'
      return
    }
    estado.value = intentos > MAX_INTENTOS_ANTES_DE_FALLBACK ? 'caido' : 'reconectando'
    const espera = Math.min(BACKOFF_INICIAL_MS * 2 ** Math.min(intentos - 1, 10), BACKOFF_MAX_MS)
    limpiarTimeout()
    reconectarTimeout = setTimeout(conectar, espera)
  }

  function conectar() {
    if (cerradoManualmente) return

    if (socket) {
      socket.onclose = null
      socket.onerror = null
      socket.close()
      socket = null
    }

    const url = construirUrlWs()
    if (!url) {
      estado.value = 'caido'
      return
    }

    socket = new WebSocket(url)

    socket.onopen = () => {
      intentos = 0
      estado.value = 'conectado'
    }

    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as ComandaWsMessage
        onMessage(msg)
      } catch (err) {
        console.error('[useComandasSocket] mensaje invalido', err)
      }
    }

    socket.onclose = () => {
      if (!cerradoManualmente) programarReconexion()
    }

    socket.onerror = () => {
      socket?.close()
    }
  }

  function close() {
    cerradoManualmente = true
    limpiarTimeout()
    socket?.close()
    socket = null
  }

  conectar()
  onBeforeUnmount(close)

  return { estado, close }
}
