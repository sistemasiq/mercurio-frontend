import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthState, LoginRequest, User } from '@/types/auth'
import { authService } from '@/services/authService'
import { sessionStorage } from '@/utils/session'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthState['user']>(null)
  const token = ref<AuthState['token']>(null)
  const tokenExpiry = ref<AuthState['tokenExpiry']>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(
    () => !!token.value && !!tokenExpiry.value && Date.now() < tokenExpiry.value
  )

  const currentUser = computed<User | null>(() => user.value)

  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)

      token.value = response.token
      tokenExpiry.value = Date.now() + response.expiresIn * 1000
      user.value = response.user

      sessionStorage.save(response.token, response.expiresIn, response.user)
    } catch (err) {
      error.value = resolveErrorMessage(err as ApiError)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } catch {
      // El logout local procede aunque falle el endpoint
    } finally {
      _clearState()
    }
  }

  function restoreSession(): boolean {
    const session = sessionStorage.load()
    if (!session) return false

    token.value = session.token
    tokenExpiry.value = session.tokenExpiry
    user.value = session.user
    return true
  }

  function clearError(): void {
    error.value = null
  }

  function _clearState(): void {
    user.value = null
    token.value = null
    tokenExpiry.value = null
    error.value = null
    sessionStorage.clear()
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    currentUser,
    login,
    logout,
    restoreSession,
    clearError,
  }
})
