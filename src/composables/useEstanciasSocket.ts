import { onBeforeUnmount, ref } from 'vue'
import { tokenMemory } from '@/utils/tokenMemory'
import { authApi } from '@/api/authApi'
import type { EstanciaWsMessage } from '@/types/estancia'

export type EstadoSocket = 'conectando' | 'conectado' | 'reconectando' | 'caido'

const MAX_INTENTOS_ANTES_DE_FALLBACK = 5
// Tope total de reintentos (mismo criterio que useComandasSocket).
const MAX_INTENTOS_TOTALES = 20
// Cierres por autenticacion/politica: reintentar con el mismo token no sirve.
const CODIGOS_SIN_REINTENTO = [1008, 4401]
const BACKOFF_INICIAL_MS = 1000
const BACKOFF_MAX_MS = 30000

/**
 * QA #32: antes de cada conexión/reconexión se pide un ticket efímero de un
 * solo uso (POST /auth/ws-ticket) para no exponer el JWT crudo en la URL del
 * WebSocket. Si el backend todavía no lo soporta (o la petición falla), cae
 * al JWT crudo (?token=...) -- el backend sigue aceptándolo mientras
 * settings.WS_ACEPTA_JWT siga activo.
 */
async function construirUrlWs(): Promise<string | null> {
  const token = tokenMemory.get()
  if (!token) return null

  let ticket: string | null = null
  try {
    ticket = (await authApi.wsTicket()).ticket
  } catch {
    // Sin ticket disponible: se usa el JWT crudo como respaldo.
  }

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
  const query = ticket
    ? `ticket=${encodeURIComponent(ticket)}`
    : `token=${encodeURIComponent(token)}`
  return `${origen}${basePath}/estancias/ws?${query}`
}

export function useEstanciasSocket(onMessage: (msg: EstanciaWsMessage) => void) {
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

  async function conectar() {
    if (cerradoManualmente) return

    const url = await construirUrlWs()
    if (cerradoManualmente) return
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
        const msg = JSON.parse(event.data) as EstanciaWsMessage
        onMessage(msg)
      } catch (err) {
        console.error('[useEstanciasSocket] mensaje invalido', err)
      }
    }

    socket.onclose = (event: CloseEvent) => {
      if (cerradoManualmente) return
      if (CODIGOS_SIN_REINTENTO.includes(event.code)) {
        estado.value = 'caido'
        return
      }
      programarReconexion()
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
