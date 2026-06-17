import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthState, LoginRequest, User, UserRole } from '@/types/auth'
import { authService } from '@/services/authService'
import { sessionStorage } from '@/utils/session'
import { resolveErrorMessage } from '@/utils/errorHandler'
import { inactivityTimer } from '@/utils/inactivityTimer'
import { isTokenExpired } from '@/utils/tokenUtils'
import type { ApiError } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthState['user']>(null)
  const token = ref<AuthState['token']>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))

  const currentUser = computed<User | null>(() => user.value)

  const primaryRole = computed<UserRole | null>(() => user.value?.roles[0] ?? null)

  const currentBranchId = computed<string | null>(() => user.value?.branchId ?? null)

  function hasRole(role: UserRole): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  async function login(credentials: LoginRequest): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)

      token.value = response.token
      user.value = response.user

      sessionStorage.save(response.token, response.user)
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
    user.value = session.user
    return true
  }

  function clearError(): void {
    error.value = null
  }

  function _clearState(): void {
    user.value = null
    token.value = null
    error.value = null
    sessionStorage.clear()
    inactivityTimer.stop()
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    currentUser,
    primaryRole,
    currentBranchId,
    hasRole,
    login,
    logout,
    restoreSession,
    clearError,
  }
})
