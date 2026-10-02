import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { configurarRefresh } from '@/api/axiosClient'
import { authService } from '@/services/authService'
import type { ApiError, LoginResult } from '@/types/auth'

vi.mock('@/services/authService', () => ({
  authService: { login: vi.fn(), logout: vi.fn(), me: vi.fn(), refresh: vi.fn() },
}))

const SELECTION: LoginResult = {
  kind: 'selection_required',
  sucursales: [{ id: 's1', nombre: 'Centro' }],
}

/** pendingCredentials no se expone en el store: se observa por su efecto. */
async function hasPendingCredentials(auth: ReturnType<typeof useAuthStore>): Promise<boolean> {
  vi.mocked(authService.login).mockClear()
  vi.mocked(authService.login).mockResolvedValueOnce(SELECTION)
  await auth.selectBranchAndLogin('s1')
  return vi.mocked(authService.login).mock.calls.length > 0
}

describe('auth store: pendingCredentials', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.logout).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('conserva las credenciales mientras se elige sucursal', async () => {
    vi.mocked(authService.login).mockResolvedValue(SELECTION)
    const auth = useAuthStore()

    const done = await auth.login({ email: 'a@a.com', password: 'secreto' })

    expect(done).toBe(false)
    expect(await hasPendingCredentials(auth)).toBe(true)
  })

  it('las borra a los 2 minutos si no se elige sucursal', async () => {
    vi.mocked(authService.login).mockResolvedValue(SELECTION)
    const auth = useAuthStore()
    await auth.login({ email: 'a@a.com', password: 'secreto' })

    vi.advanceTimersByTime(2 * 60 * 1000)

    expect(await hasPendingCredentials(auth)).toBe(false)
    expect(auth.pendingBranchSelection).toBeNull()
  })

  it('las borra cuando selectBranchAndLogin falla', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(SELECTION)
    const auth = useAuthStore()
    await auth.login({ email: 'a@a.com', password: 'secreto' })
    const apiError: ApiError = { statusCode: 401, code: '', message: 'mal' }
    vi.mocked(authService.login).mockRejectedValueOnce(apiError)

    await expect(auth.selectBranchAndLogin('s1')).rejects.toBe(apiError)

    expect(await hasPendingCredentials(auth)).toBe(false)
  })

  it('las borra al cerrar sesión', async () => {
    vi.mocked(authService.login).mockResolvedValue(SELECTION)
    const auth = useAuthStore()
    await auth.login({ email: 'a@a.com', password: 'secreto' })

    await auth.logout()

    expect(await hasPendingCredentials(auth)).toBe(false)
  })
})

describe('auth store: tryRefresh', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    configurarRefresh(null)
  })

  it('actualiza user y permisos con el resultado del refresh', async () => {
    const base = {
      id: '1',
      name: 'x',
      email: 'x@x.com',
      roles: ['Cajero'],
      branchId: null,
      branchName: null,
    }
    localStorage.setItem(
      'auth_session',
      JSON.stringify({
        token: 'old',
        tokenExpiry: 0,
        refreshToken: 'rt',
        user: { ...base, permissions: [] },
      }),
    )
    configurarRefresh(() =>
      Promise.resolve({
        token: 'new',
        refreshToken: 'rt2',
        user: { ...base, permissions: ['pos:acceder'] },
      }),
    )
    const auth = useAuthStore()

    expect(await auth.tryRefresh()).toBe(true)

    expect(auth.permissions).toEqual(['pos:acceder'])
    expect(JSON.parse(localStorage.getItem('auth_session') ?? '{}').user.permissions).toEqual([
      'pos:acceder',
    ])
  })
})
