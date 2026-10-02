import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import { apiClient, rawApiClient } from '@/api/axiosClient'

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
  refresh_token: 'rt2',
  user: { id: '1', full_name: 'x', email: 'x@x.com', role: 'Cajero', branch_id: null },
}

describe('axiosClient interceptor', () => {
  let refreshCalls: number

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(
      'auth_session',
      JSON.stringify({ token: 'old', tokenExpiry: 0, refreshToken: 'rt', user: USER }),
    )
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
})
