import axios, { type AxiosInstance, type AxiosResponse, AxiosError } from 'axios'
import type { ApiError } from '@/types/auth'
import { sessionStorage } from '@/utils/session'
import { isNetworkError } from '@/utils/errorHandler'

function createAxiosClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    const session = sessionStorage.load()
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ message?: string; code?: string }>) => {
      if (isNetworkError(error)) {
        return Promise.reject(buildApiError(0, 'NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red.'))
      }

      const status = error.response?.status ?? 0
      const code = error.response?.data?.code ?? ''
      const message = error.response?.data?.message ?? ''

      if (status === 401) {
        sessionStorage.clear()
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }

      return Promise.reject(buildApiError(status, code, message))
    }
  )

  return client
}

function buildApiError(statusCode: number, code: string, message: string): ApiError {
  return { statusCode, code, message }
}

export const apiClient = createAxiosClient()
