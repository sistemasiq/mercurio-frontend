import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthState, BranchOption, LoginRequest, User, UserRole } from '@/types/auth'
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
  const pendingBranchSelection = ref<BranchOption[] | null>(null)
  const pendingCredentials = ref<LoginRequest | null>(null)

  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))

  const currentUser = computed<User | null>(() => user.value)

  const primaryRole = computed<UserRole | null>(() => user.value?.roles[0] ?? null)

  const currentBranchId = computed<string | null>(() => user.value?.branchId ?? null)

  const currentBranchName = computed<string | null>(() => user.value?.branchName ?? null)

  const permissions = computed<string[]>(() => user.value?.permissions ?? [])

  function hasRole(role: UserRole): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  /** true si la sesión quedó iniciada; false si falta elegir sucursal activa. */
  async function login(credentials: LoginRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const result = await authService.login(credentials)

      if (result.kind === 'selection_required') {
        pendingCredentials.value = credentials
        pendingBranchSelection.value = result.sucursales
        return false
      }

      pendingCredentials.value = null
      pendingBranchSelection.value = null
      token.value = result.data.token
      user.value = result.data.user

      sessionStorage.save(result.data.token, result.data.refreshToken, result.data.user)
      return true
    } catch (err) {
      error.value = resolveErrorMessage(err as ApiError)
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Reintenta el login guardado con la sucursal elegida en el selector. */
  async function selectBranchAndLogin(sucursalId: string): Promise<boolean> {
    if (!pendingCredentials.value) return false
    return login({ ...pendingCredentials.value, sucursalId })
  }

  function cancelBranchSelection(): void {
    pendingBranchSelection.value = null
    pendingCredentials.value = null
  }

  async function logout(): Promise<void> {
    const refreshToken = sessionStorage.load()?.refreshToken ?? ''
    try {
      await authService.logout(refreshToken)
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

    // Refrescar datos del usuario en segundo plano
    authService
      .me()
      .then((freshUser) => {
        user.value = freshUser
      })
      .catch(() => {
        // El interceptor de 401 maneja la renovación o el logout
      })

    return true
  }

  async function tryRefresh(): Promise<boolean> {
    const session = sessionStorage.load()
    if (!session?.refreshToken) return false

    try {
      const response = await authService.refresh(session.refreshToken)
      token.value = response.token
      user.value = response.user
      sessionStorage.save(response.token, response.refreshToken, response.user)
      return true
    } catch {
      sessionStorage.clear()
      _clearState()
      return false
    }
  }

  function updateToken(newToken: string): void {
    token.value = newToken
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
    pendingBranchSelection,
    isAuthenticated,
    currentUser,
    primaryRole,
    currentBranchId,
    currentBranchName,
    permissions,
    hasRole,
    hasPermission,
    login,
    selectBranchAndLogin,
    cancelBranchSelection,
    logout,
    restoreSession,
    tryRefresh,
    updateToken,
    clearError,
    // Helper DEV: inyecta usuario y token sin pasar por el backend
    ...(import.meta.env.DEV
      ? {
          /* v8 ignore next 5 */
          _setDevSession(mockUser: typeof user.value, mockToken: string) {
            user.value = mockUser
            token.value = mockToken
          },
        }
      : {}),
  }
})
