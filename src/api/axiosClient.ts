import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import type { ApiError } from '@/types/auth'
import { sessionStorage } from '@/utils/session'
import { isNetworkError } from '@/utils/errorHandler'

// Cliente sin interceptores — solo para endpoints de auth (refresh/login)
// que no deben pasar por el interceptor de 401 para evitar loops.
export const rawApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

interface BackendRefreshResponse {
  token: string
  refresh_token: string
  user: { id: string; full_name: string; email: string; role: string; branch_id: string | null }
}

function buildApiError(statusCode: number, code: string, message: string): ApiError {
  return { statusCode, code, message }
}

function createAxiosClient(): AxiosInstance {
  let isRefreshing = false
  const refreshQueue: Array<(token: string) => void> = []

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
    async (
      error: AxiosError<{
        detail?: string | { code?: string; message?: string } | Array<{ msg?: string }>
      }>,
    ) => {
      if (isNetworkError(error)) {
        return Promise.reject(
          buildApiError(0, 'NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red.'),
        )
      }

      const status = error.response?.status ?? 0
      // El backend envía sus errores como HTTPException(detail=...), que FastAPI serializa
      // anidado bajo "detail" — no en la raíz del body. "detail" puede ser un dict propio
      // {code, message} (nuestros errores de negocio), un string plano (algunos endpoints),
      // o un array de errores de validación de Pydantic (422 automáticos).
      const detail = error.response?.data?.detail
      let code = ''
      let message = ''
      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        code = detail.code ?? ''
        message = detail.message ?? ''
      } else if (typeof detail === 'string') {
        message = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail[0]?.msg ?? ''
      }

      if (status === 401) {
        const url = error.config?.url ?? ''
        // Si es la verificación de credenciales del admin durante el cierre de caja, retornar el error directamente
        if (
          url.includes('/turnos-caja/revision-admin') ||
          url.includes('/turnos-caja/validar-pin-admin') ||
          url.includes('/turnos-caja/validar-pin-cajero')
        ) {
          return Promise.reject(
            buildApiError(
              status,
              code || 'INVALID_CREDENTIALS',
              message || 'PIN o credenciales incorrectas.',
            ),
          )
        }

        const session = sessionStorage.load()

        if (!session?.refreshToken) {
          sessionStorage.clear()
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
          return Promise.reject(buildApiError(status, code, message))
        }

        // Si ya hay un refresh en curso, encolar esta request
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            refreshQueue.push((newToken) => {
              const config = error.config as InternalAxiosRequestConfig
              config.headers.Authorization = `Bearer ${newToken}`
              resolve(client(config))
            })
            void reject // satisface el tipo; resolve siempre se llama
          })
        }

        isRefreshing = true
        try {
          const { data } = await rawApiClient.post<BackendRefreshResponse>('/auth/refresh', {
            refreshToken: session.refreshToken,
          })

          sessionStorage.save(data.token, data.refresh_token, session.user)
          window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { token: data.token } }))

          refreshQueue.forEach((cb) => cb(data.token))
          refreshQueue.length = 0
          isRefreshing = false

          const config = error.config as InternalAxiosRequestConfig
          config.headers.Authorization = `Bearer ${data.token}`
          return client(config)
        } catch {
          isRefreshing = false
          refreshQueue.length = 0
          sessionStorage.clear()
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
          return Promise.reject(buildApiError(status, code, message))
        }
      }

      return Promise.reject(buildApiError(status, code, message))
    },
  )

  return client
}

export const apiClient = createAxiosClient()
