import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tutor, NinoActivo, PadresAuthState } from '@/types/padres'
import { padresApi } from '@/api/padresApi'

const STORAGE_KEY = 'padres_registro_id'

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
    const savedAt = sessionStorage.getItem(`${STORAGE_KEY}_ts`)
    if (!savedAt) return false
    const elapsed = (Date.now() - Number(savedAt)) / 1000
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
    sessionStorage.setItem(STORAGE_KEY, newKey)
    sessionStorage.setItem(`${STORAGE_KEY}_ts`, String(Date.now()))
  }

  function _clearPersistedKey(): void {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(`${STORAGE_KEY}_ts`)
  }

  function _loadPersistedKey(): string | null {
    return sessionStorage.getItem(STORAGE_KEY)
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
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      error.value = message
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
    } catch {
      // Si falla, no hacemos logout automáticamente — el polling lo manejará
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
