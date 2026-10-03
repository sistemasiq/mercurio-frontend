import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import type { ApiError } from '@/types/auth'
import { apiClient, rawApiClient, refreshAccessToken, configurarRefresh } from '@/api/axiosClient'
import { tokenMemory } from '@/utils/tokenMemory'

function makeResponse(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return { data, status, statusText: '', headers: {}, config } as AxiosResponse
}

function fail(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = makeResponse(config, status, data)
  return Promise.reject(new AxiosError('fail', String(status), config, null, response))
}

const USER = {
  id: '1',
  name: 'x',
  email: 'x@x.com',
  roles: ['Cajero'],
  branchId: null,
  branchName: null,
  permissions: [],
}

const REFRESH_BODY = {
  token: 'new',
  user: { id: '1', full_name: 'x', email: 'x@x.com', role: 'Cajero', branch_id: null },
}

describe('axiosClient interceptor', () => {
  let refreshCalls: number

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('auth_session', JSON.stringify({ user: USER }))
    // C3: el access token ya no vive en localStorage -- solo en memoria.
    tokenMemory.set('old')
    refreshCalls = 0
  })

  function setRefresh(handler: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>) {
    rawApiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
      refreshCalls++
      return handler(config)
    }) as AxiosAdapter
  }

  it('no hace bucle ante 401 -> refresh -> 401 y rechaza', async () => {
    let apiCalls = 0
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
      apiCalls++
      return fail(config, 401, { detail: 'no autorizado' })
    }) as AxiosAdapter
    setRefresh((config) => Promise.resolve(makeResponse(config, 200, REFRESH_BODY)))
    const onUnauthorized = vi.fn()
    window.addEventListener('auth:unauthorized', onUnauthorized)

    await expect(apiClient.get('/x')).rejects.toMatchObject({ statusCode: 401 })

    expect(apiCalls).toBe(2)
    expect(refreshCalls).toBe(1)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    window.removeEventListener('auth:unauthorized', onUnauthorized)
  })

  it('tres peticiones 401 en paralelo hacen un solo refresh', async () => {
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) => {
      if (config.headers.Authorization === 'Bearer new') {
        return Promise.resolve(makeResponse(config, 200, { ok: true }))
      }
      return fail(config, 401, { detail: 'expirado' })
    }) as AxiosAdapter
    setRefresh(
      (config) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(makeResponse(config, 200, REFRESH_BODY)), 10),
        ),
    )

    const results = await Promise.all([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ])

    expect(results.map((r) => r.status)).toEqual([200, 200, 200])
    expect(refreshCalls).toBe(1)
  })

  it('si el refresh falla, todas las peticiones en espera rechazan', async () => {
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) =>
      fail(config, 401, { detail: 'expirado' })) as AxiosAdapter
    setRefresh((config) => fail(config, 401, { detail: 'refresh inválido' }))

    const results = await Promise.allSettled([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ])

    expect(results.every((r) => r.status === 'rejected')).toBe(true)
    expect(refreshCalls).toBe(1)
    expect(localStorage.getItem('auth_session')).toBeNull()
  })

  it('refreshAccessToken comparte la promesa entre llamadas simultáneas', async () => {
    setRefresh((config) => Promise.resolve(makeResponse(config, 200, REFRESH_BODY)))

    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(a).toBe('new')
    expect(b).toBe('new')
    expect(refreshCalls).toBe(1)
  })

  it('propaga el detail del backend en details', async () => {
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) =>
      fail(config, 409, {
        detail: { code: 'MONTO_CAMBIO', message: 'cambió', totalExtra: 50, horasExtra: 2 },
      })) as AxiosAdapter

    const err = (await apiClient.get('/x').catch((e: ApiError) => e)) as ApiError

    expect(err.statusCode).toBe(409)
    expect(err.code).toBe('MONTO_CAMBIO')
    expect(err.message).toBe('cambió')
    expect(err.details).toMatchObject({ totalExtra: 50, horasExtra: 2 })
  })

  it('no agrega details cuando detail es un string', async () => {
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) =>
      fail(config, 400, { detail: 'dato inválido' })) as AxiosAdapter

    const err = (await apiClient.get('/x').catch((e: ApiError) => e)) as ApiError

    expect(err.message).toBe('dato inválido')
    expect(err.details).toBeUndefined()
  })

  it('con refresher registrado, guarda el usuario y permisos nuevos', async () => {
    const newUser = { ...USER, permissions: ['pos:acceder'] }
    configurarRefresh(() => Promise.resolve({ token: 'tok', user: newUser }))

    try {
      await refreshAccessToken()
    } finally {
      configurarRefresh(null)
    }

    const stored = JSON.parse(localStorage.getItem('auth_session') ?? '{}')
    expect(stored.user.permissions).toEqual(['pos:acceder'])
    expect(stored.token).toBeUndefined()
    // C3: el token nuevo queda solo en memoria, nunca en localStorage.
    expect(tokenMemory.get()).toBe('tok')
  })

  it('C3: el access token nunca se persiste en localStorage', async () => {
    setRefresh((config) => Promise.resolve(makeResponse(config, 200, REFRESH_BODY)))

    const token = await refreshAccessToken()

    expect(token).toBe('new')
    expect(tokenMemory.get()).toBe('new')
    const stored = JSON.parse(localStorage.getItem('auth_session') ?? '{}')
    expect(stored.token).toBeUndefined()
  })
})
