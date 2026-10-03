import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiError } from '@/types/auth'
import type { Tutor, NinoActivo, PadresAuthState } from '@/types/padres'
import { padresApi } from '@/api/padresApi'
import { mensajeDeError } from '@/utils/errorHandler'

// QA #31: el backend ahora canjea el código una sola vez por `/padres/auth`
// y entrega un token de sesión corto (2h, scope PadreVisor) que el polling
// usa via Authorization: Bearer (GET /padres/ninos-activos), sin volver a
// mandar el código. Por eso aquí se persiste el TOKEN (no el código) en
// sessionStorage: un F5 ya no saca al padre (sobrevive a la recarga, pero no
// a cerrar la pestaña, que es lo que se busca -- no es una credencial de
// larga duración como el código). Un 401/403 del polling revoca la sesión.
const SESSION_KEY = 'padresAuth:sesion'

interface PadresSesionPersistida {
  token: string
  tokenType: string
  expiresIn: number
  issuedAt: number
  tutor: Tutor
}

function persistirSesion(data: PadresSesionPersistida): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // Sin sessionStorage disponible: la sesión solo vive en memoria.
  }
}

function cargarSesionPersistida(): PadresSesionPersistida | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PadresSesionPersistida
  } catch {
    return null
  }
}

function limpiarSesionPersistida(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // nada que limpiar
  }
}

export const usePadresAuthStore = defineStore('padresAuth', () => {
  const token = ref<PadresAuthState['token']>(null)
  const tokenType = ref<PadresAuthState['tokenType']>(null)
  const expiresIn = ref<PadresAuthState['expiresIn']>(null)
  const tutor = ref<PadresAuthState['tutor']>(null)
  const ninosActivos = ref<PadresAuthState['ninosActivos']>([])
  const loading = ref(false)
  const error = ref<PadresAuthState['error']>(null)
  let issuedAt: number | null = null

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    return true
  })

  function _isTokenExpired(): boolean {
    if (!expiresIn.value) return false
    if (!issuedAt) return false
    const elapsed = (Date.now() - issuedAt) / 1000
    return elapsed > expiresIn.value
  }

  const currentTutor = computed<Tutor | null>(() => tutor.value)

  const activeChildren = computed<NinoActivo[]>(() =>
    ninosActivos.value.filter((n) => (n.estadoVisita ?? '').toLowerCase() === 'activo'),
  )

  const terminatedChildren = computed<NinoActivo[]>(() =>
    ninosActivos.value.filter((n) => (n.estadoVisita ?? '').toLowerCase() === 'terminado'),
  )

  const allChildren = computed<NinoActivo[]>(() => ninosActivos.value)

  async function loginConCode(rawCode: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await padresApi.loginConCode(rawCode)

      token.value = data.token
      tokenType.value = data.token_type
      expiresIn.value = data.expires_in
      tutor.value = data.tutor
      ninosActivos.value = data.ninosActivos
      issuedAt = Date.now()

      persistirSesion({
        token: data.token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        issuedAt,
        tutor: data.tutor,
      })
    } catch (err) {
      error.value = mensajeDeError(err, 'Error al iniciar sesión')
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Restaura la sesión guardada (sobrevive a un F5) con el token, sin
   * volver a canjear el código -- pide el estado actual de los niños. */
  async function restoreOrFetchSession(): Promise<boolean> {
    const sesion = cargarSesionPersistida()
    if (!sesion) return false

    token.value = sesion.token
    tokenType.value = sesion.tokenType
    expiresIn.value = sesion.expiresIn
    tutor.value = sesion.tutor
    issuedAt = sesion.issuedAt

    if (_isTokenExpired()) {
      logout()
      return false
    }

    try {
      const data = await padresApi.ninosActivos(sesion.token)
      ninosActivos.value = data.ninosActivos
      return true
    } catch (err) {
      const statusCode = (err as Partial<ApiError> | null)?.statusCode
      if (statusCode === 401 || statusCode === 403) {
        logout()
        return false
      }
      // Error transitorio (red, 5xx): la sesión se mantiene restaurada, el
      // próximo polling reintenta.
      return true
    }
  }

  async function refrescarNinos(): Promise<void> {
    if (!token.value) return
    if (_isTokenExpired()) {
      logout()
      return
    }
    try {
      const data = await padresApi.ninosActivos(token.value)
      ninosActivos.value = data.ninosActivos
    } catch (err) {
      const statusCode = (err as Partial<ApiError> | null)?.statusCode
      // El token se revocó o expiró en el backend: no hay nada que el
      // polling pueda reintentar, así que se propaga para que quien llama
      // (refrescarSesion en el dashboard) cierre la sesión.
      if (statusCode === 401 || statusCode === 403) throw err
      // Cualquier otro error (red, 5xx) es transitorio — el próximo tick
      // del polling reintenta solo.
    }
  }

  function logout(): void {
    token.value = null
    tokenType.value = null
    expiresIn.value = null
    tutor.value = null
    ninosActivos.value = []
    error.value = null
    issuedAt = null
    limpiarSesionPersistida()
  }

  function clearError(): void {
    error.value = null
  }

  return {
    token,
    tokenType,
    expiresIn,
    tutor,
    ninosActivos,
    loading,
    error,
    isAuthenticated,
    currentTutor,
    activeChildren,
    terminatedChildren,
    allChildren,
    loginConCode,
    restoreOrFetchSession,
    refrescarNinos,
    logout,
    clearError,
  }
})
