import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthState, BranchOption, LoginRequest, User, UserRole } from '@/types/auth'
import { refreshAccessToken } from '@/api/axiosClient'
import { authService } from '@/services/authService'
import { sessionStorage, viewingBranch } from '@/utils/session'
import { tokenMemory } from '@/utils/tokenMemory'
import { resolveErrorMessage } from '@/utils/errorHandler'
import { resetAllStores } from '@/utils/piniaReset'
import { inactivityTimer } from '@/utils/inactivityTimer'
import { isTokenExpired } from '@/utils/tokenUtils'
import type { ApiError } from '@/types/auth'

// Tiempo máximo que la contraseña puede quedar en memoria esperando a que el
// usuario elija sucursal.
const PENDING_CREDENTIALS_TTL_MS = 2 * 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthState['user']>(null)
  const token = ref<AuthState['token']>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pendingBranchSelection = ref<BranchOption[] | null>(null)
  const pendingCredentials = ref<LoginRequest | null>(null)
  let pendingCredentialsTimer: ReturnType<typeof setTimeout> | null = null
  /** Sucursal en la que AdministradorSistema se "paró" para ver catálogos y
   * listados de esa sucursal, sin reautenticarse. null para cualquier otro rol. */
  const viewingBranchId = ref<string | null>(viewingBranch.load())

  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))

  const currentUser = computed<User | null>(() => user.value)

  const primaryRole = computed<UserRole | null>(() => user.value?.roles[0] ?? null)

  function clearPendingCredentials(): void {
    if (pendingCredentialsTimer) clearTimeout(pendingCredentialsTimer)
    pendingCredentialsTimer = null
    pendingCredentials.value = null
  }

  function hasRole(role: UserRole): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  const isSistema = computed(() => hasRole('AdministradorSistema'))

  // Para AdministradorSistema, la sucursal "efectiva" es la que eligió en el
  // selector del header (o ninguna, viendo todas sin filtrar) -- no tiene
  // sucursal propia en el token. El resto de la app ya consume
  // currentBranchId para pedir/crear datos con alcance de sucursal, así que
  // este único cambio hace que "ver todos los catálogos por sucursal"
  // funcione en todas esas pantallas sin tocarlas una por una.
  const currentBranchId = computed<string | null>(() =>
    isSistema.value ? viewingBranchId.value : (user.value?.branchId ?? null),
  )

  const currentBranchName = computed<string | null>(() => user.value?.branchName ?? null)

  const permissions = computed<string[]>(() => user.value?.permissions ?? [])

  function setViewingBranch(sucursalId: string | null): void {
    viewingBranchId.value = sucursalId
    viewingBranch.save(sucursalId)
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
        clearPendingCredentials()
        pendingCredentials.value = credentials
        pendingCredentialsTimer = setTimeout(() => {
          clearPendingCredentials()
          pendingBranchSelection.value = null
        }, PENDING_CREDENTIALS_TTL_MS)
        pendingBranchSelection.value = result.sucursales
        return false
      }

      clearPendingCredentials()
      pendingBranchSelection.value = null
      token.value = result.data.token
      user.value = result.data.user

      // C3: el access token nunca toca localStorage -- solo vive en memoria.
      tokenMemory.set(result.data.token)
      sessionStorage.save(result.data.user)
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
    try {
      return await login({ ...pendingCredentials.value, sucursalId })
    } catch (err) {
      // Un intento fallido no deja la contraseña en memoria: hay que reingresarla.
      clearPendingCredentials()
      pendingBranchSelection.value = null
      throw err
    }
  }

  function cancelBranchSelection(): void {
    pendingBranchSelection.value = null
    clearPendingCredentials()
  }

  async function logout(): Promise<void> {
    // QA #32: el refresh token ya no se manda -- el backend lo lee de la
    // cookie HttpOnly y la borra al salir.
    try {
      await authService.logout()
    } catch {
      // El logout local procede aunque falle el endpoint
    } finally {
      _clearState()
    }
  }

  // C3: al recargar la página el access token se pierde (vivía solo en
  // memoria); lo único que sobrevive es el usuario cacheado en localStorage.
  // Se muestra de inmediato (evita el parpadeo a "sin sesión") mientras se
  // confirma la sesión real con un refresh vía la cookie HttpOnly.
  async function restoreSession(): Promise<boolean> {
    const session = sessionStorage.load()
    if (!session) return false

    user.value = session.user

    return tryRefresh()
  }

  async function tryRefresh(): Promise<boolean> {
    const session = sessionStorage.load()
    // QA #32: sin refresh token local que chequear -- si hubo sesión alguna
    // vez (hay `session`), se intenta; el backend decide con la cookie.
    if (!session) return false

    try {
      // Mismo refresh compartido que usa el interceptor de axios. Ya deja el
      // token en memoria (tokenMemory) y el usuario en localStorage.
      const newToken = await refreshAccessToken()
      token.value = newToken
      user.value = sessionStorage.load()?.user ?? user.value
      return true
    } catch {
      sessionStorage.clear()
      _clearState()
      return false
    }
  }

  function updateToken(newToken: string): void {
    token.value = newToken
    tokenMemory.set(newToken)
  }

  function clearError(): void {
    error.value = null
  }

  function _clearState(): void {
    user.value = null
    token.value = null
    error.value = null
    viewingBranchId.value = null
    pendingBranchSelection.value = null
    clearPendingCredentials()
    sessionStorage.clear()
    inactivityTimer.stop()
    // Los demás stores conservan datos del usuario anterior (comandas, cajas,
    // reservaciones...); en una terminal compartida pasarían al siguiente.
    resetAllStores(['auth'])
  }

  return {
    user,
    token,
    loading,
    error,
    pendingBranchSelection,
    viewingBranchId,
    isAuthenticated,
    currentUser,
    primaryRole,
    isSistema,
    currentBranchId,
    currentBranchName,
    permissions,
    hasRole,
    hasPermission,
    setViewingBranch,
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
          /* v8 ignore next 6 */
          _setDevSession(mockUser: typeof user.value, mockToken: string) {
            user.value = mockUser
            token.value = mockToken
            tokenMemory.set(mockToken)
          },
        }
      : {}),
  }
})
