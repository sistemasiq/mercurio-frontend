import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tutor, NinoActivo, PadresAuthState } from '@/types/padres'
import { padresApi } from '@/api/padresApi'

const STORAGE_KEY = 'padres_token'

export const usePadresAuthStore = defineStore('padresAuth', () => {
  const token = ref<PadresAuthState['token']>(null)
  const tokenType = ref<PadresAuthState['tokenType']>(null)
  const expiresIn = ref<PadresAuthState['expiresIn']>(null)
  const tutor = ref<PadresAuthState['tutor']>(null)
  const ninosActivos = ref<PadresAuthState['ninosActivos']>([])
  const loading = ref(false)
  const error = ref<PadresAuthState['error']>(null)

  const isAuthenticated = computed(() => !!token.value)

  const currentTutor = computed<Tutor | null>(() => tutor.value)

  const activeChildren = computed<NinoActivo[]>(() => ninosActivos.value)

  function _persistToken(newToken: string): void {
    localStorage.setItem(STORAGE_KEY, newToken)
  }

  function _clearPersistedToken(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  function _loadPersistedToken(): string | null {
    return localStorage.getItem(STORAGE_KEY)
  }

  async function loginConToken(rawToken: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await padresApi.loginConToken(rawToken)

      token.value = data.token
      tokenType.value = data.token_type
      expiresIn.value = data.expires_in
      tutor.value = data.tutor
      ninosActivos.value = data.ninosActivos

      _persistToken(data.token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function restoreSession(): boolean {
    const savedToken = _loadPersistedToken()
    if (!savedToken) return false

    token.value = savedToken
    return true
  }

  function logout(): void {
    token.value = null
    tokenType.value = null
    expiresIn.value = null
    tutor.value = null
    ninosActivos.value = []
    error.value = null
    _clearPersistedToken()
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
    loginConToken,
    restoreSession,
    logout,
    clearError,
  }
})
