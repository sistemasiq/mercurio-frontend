import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiError } from '@/types/auth'
import type { Tutor, NinoActivo, PadresAuthState } from '@/types/padres'
import { padresApi } from '@/api/padresApi'
import { mensajeDeError } from '@/utils/errorHandler'

// El código de acceso equivale a una credencial (ver Bug QA #31): el backend
// solo ofrece `/padres/auth` recibiéndolo de nuevo (no hay un endpoint que
// acepte el `token` de la respuesta), así que mientras no exista esa mejora
// en el backend el código no se persiste en sessionStorage ni localStorage —
// vive únicamente en esta variable de módulo, por lo que un refresh de
// página cierra la sesión (ver "Pendientes de backend" en el reporte de WP-09).
let codigoSesion: string | null = null
let codigoSesionTs: number | null = null

export const usePadresAuthStore = defineStore('padresAuth', () => {
  const token = ref<PadresAuthState['token']>(null)
  const tokenType = ref<PadresAuthState['tokenType']>(null)
  const expiresIn = ref<PadresAuthState['expiresIn']>(null)
  const tutor = ref<PadresAuthState['tutor']>(null)
  const ninosActivos = ref<PadresAuthState['ninosActivos']>([])
  const loading = ref(false)
  const error = ref<PadresAuthState['error']>(null)

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    return true
  })

  function _isTokenExpired(): boolean {
    if (!expiresIn.value) return false
    if (!codigoSesionTs) return false
    const elapsed = (Date.now() - codigoSesionTs) / 1000
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

  function _persistKey(newKey: string): void {
    codigoSesion = newKey
    codigoSesionTs = Date.now()
  }

  function _clearPersistedKey(): void {
    codigoSesion = null
    codigoSesionTs = null
  }

  function _loadPersistedKey(): string | null {
    return codigoSesion
  }

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

      _persistKey(rawCode)
    } catch (err) {
      error.value = mensajeDeError(err, 'Error al iniciar sesión')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function restoreOrFetchSession(): Promise<boolean> {
    const savedCode = _loadPersistedKey()
    if (!savedCode) return false
    if (_isTokenExpired()) {
      _clearPersistedKey()
      return false
    }

    try {
      await loginConCode(savedCode)
      return true
    } catch {
      _clearPersistedKey()
      return false
    }
  }

  async function refrescarNinos(): Promise<void> {
    const savedCode = _loadPersistedKey()
    if (!savedCode) return
    if (_isTokenExpired()) {
      logout()
      return
    }
    try {
      const data = await padresApi.loginConCode(savedCode)
      ninosActivos.value = data.ninosActivos
      tutor.value = data.tutor
    } catch (err) {
      const statusCode = (err as Partial<ApiError> | null)?.statusCode
      // El código se revocó o expiró en el backend: no hay nada que el
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
    _clearPersistedKey()
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
