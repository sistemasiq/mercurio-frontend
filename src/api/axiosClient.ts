import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import type { ApiError, User } from '@/types/auth'
import { sessionStorage, viewingBranch } from '@/utils/session'
import { tokenMemory } from '@/utils/tokenMemory'
import {
  isNetworkError,
  isTimeoutError,
  TIMEOUT_ERROR_CODE,
  TIMEOUT_ERROR_MESSAGE,
} from '@/utils/errorHandler'

// Cliente sin interceptores — solo para endpoints de auth (refresh/login)
// que no deben pasar por el interceptor de 401 para evitar loops.
// QA #32: withCredentials para que el navegador mande/reciba la cookie
// HttpOnly refresh_token (Secure; SameSite=Strict; Path=/api/auth).
export const rawApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

interface BackendRefreshResponse {
  token: string
  user: { id: string; full_name: string; email: string; role: string; branch_id: string | null }
}

export interface RefreshResult {
  token: string
  user: User
}

// QA #32: ya no recibe el refresh token -- viaja solo por la cookie HttpOnly
// que el navegador manda sola (withCredentials); el backend la lee de ahí.
type Refresher = () => Promise<RefreshResult>

// El mapeo de la respuesta (authService) se inyecta desde el arranque para que
// api/ no importe services/ (authService -> authApi -> axiosClient sería un ciclo).
let refresher: Refresher | null = null

export function configurarRefresh(fn: Refresher | null): void {
  refresher = fn
}

let refreshPromise: Promise<string> | null = null

/**
 * Renueva el access token con el refresh token de la cookie HttpOnly (QA
 * #32). Es la única vía de refresh de la app (interceptor y guard del
 * router): comparten una sola promesa en vuelo, así nunca se usan dos veces
 * refresh tokens rotados.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const session = sessionStorage.load()
    // Sin sesión guardada no hubo login en este navegador: no tiene sentido
    // intentar un refresh (con o sin cookie).
    if (!session) throw buildApiError(401, 'NO_SESSION', '')
    let result: RefreshResult
    if (refresher) {
      result = await refresher()
    } else {
      // Fallback sin refresher registrado (tests o arranque temprano): se conserva el usuario.
      const { data } = await rawApiClient.post<BackendRefreshResponse>('/auth/refresh', {})
      result = { token: data.token, user: session.user }
    }
    // C3: el access token nunca toca localStorage -- solo vive en memoria.
    tokenMemory.set(result.token)
    sessionStorage.save(result.user)
    window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { token: result.token } }))
    return result.token
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

function buildApiError(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): ApiError {
  return details === undefined
    ? { statusCode, code, message }
    : { statusCode, code, message, details }
}

// Solo se conserva `detail` cuando es un objeto (ej. { totalExtra, horasExtra }
// en un 409); los strings y arrays de validación ya viajan en `message`.
function extractDetails(data: BackendErrorBody | undefined): unknown {
  const detail = data?.detail
  return detail && typeof detail === 'object' && !Array.isArray(detail) ? detail : undefined
}

/**
 * Convierte un error de axios (o de cualquier otra fuente) en un ApiError
 * consistente. Necesario para rawApiClient, que no pasa por el interceptor
 * de respuesta de `apiClient` y por eso deja pasar AxiosError sin traducir
 * (ej. "Request failed with status code 401" en vez del mensaje del backend).
 */
export function normalizeAxiosError(error: unknown): ApiError {
  if (isTimeoutError(error)) {
    return buildApiError(0, TIMEOUT_ERROR_CODE, TIMEOUT_ERROR_MESSAGE)
  }
  if (isNetworkError(error)) {
    return buildApiError(0, 'NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red.')
  }
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const { code, message } = extractCodeAndMessage(error.response?.data as BackendErrorBody)
    return buildApiError(
      status,
      code,
      message,
      extractDetails(error.response?.data as BackendErrorBody),
    )
  }
  return buildApiError(0, 'UNKNOWN_ERROR', 'Ocurrió un error inesperado.')
}

// El backend estructura sus errores como { detail: string | { code, message } }
// (ver app/exceptions/__init__.py) — los 422 de validación de FastAPI mandan
// detail como un array de { msg }. Desempaca cualquiera de esas formas.
interface BackendErrorBody {
  detail?: string | { code?: string; message?: string } | Array<{ msg?: string }>
  code?: string
  message?: string
}

function extractCodeAndMessage(data: BackendErrorBody | undefined): {
  code: string
  message: string
} {
  const detail = data?.detail
  if (typeof detail === 'string') return { code: '', message: detail }
  if (Array.isArray(detail)) {
    return {
      code: '',
      message: detail
        .map((item) => item?.msg)
        .filter((msg): msg is string => !!msg)
        .join(', '),
    }
  }
  if (detail && typeof detail === 'object') {
    return { code: detail.code ?? '', message: detail.message ?? '' }
  }
  return { code: data?.code ?? '', message: data?.message ?? '' }
}

function createAxiosClient(): AxiosInstance {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
    // QA #32: manda la cookie HttpOnly refresh_token en /auth/* (p. ej. logout).
    withCredentials: true,
  })

  client.interceptors.request.use((config) => {
    // C3: el access token vive solo en memoria (nunca en localStorage).
    const token = tokenMemory.get()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Solo AdministradorSistema puede "pararse" en una sucursal para ver sus
    // catálogos/listados -- para cualquier otro rol el backend ignora este
    // header, pero evitamos mandarlo de más.
    const sucursalVista = viewingBranch.load()
    const session = sessionStorage.load()
    if (sucursalVista && session?.user.roles.includes('AdministradorSistema')) {
      config.headers['X-Sucursal-Vista'] = sucursalVista
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<BackendErrorBody>) => {
      if (isTimeoutError(error)) {
        return Promise.reject(buildApiError(0, TIMEOUT_ERROR_CODE, TIMEOUT_ERROR_MESSAGE))
      }
      if (isNetworkError(error)) {
        return Promise.reject(
          buildApiError(0, 'NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red.'),
        )
      }

      const status = error.response?.status ?? 0
      const { code, message } = extractCodeAndMessage(error.response?.data)

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
        const retryConfig = error.config as RetriableConfig | undefined

        // Ya se reintentó con un token recién refrescado y el servidor sigue
        // respondiendo 401: no hay nada más que renovar, cerrar la sesión.
        if (retryConfig?._retry) {
          sessionStorage.clear()
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
          return Promise.reject(buildApiError(status, code, message))
        }

        // QA #32: el refresh token ya no se guarda en el front (vive en la
        // cookie HttpOnly) -- la única señal local de "hubo sesión" es el
        // usuario guardado. Sin eso, no tiene sentido intentar un refresh.
        if (!session) {
          sessionStorage.clear()
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
          return Promise.reject(buildApiError(status, code, message))
        }

        try {
          // Todas las peticiones que reciben 401 esperan la misma promesa: si
          // el refresh falla, todas rechazan; si funciona, todas reintentan.
          const newToken = await refreshAccessToken()
          const config = error.config as RetriableConfig
          config._retry = true
          config.headers.Authorization = `Bearer ${newToken}`
          return client(config)
        } catch {
          sessionStorage.clear()
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
          return Promise.reject(buildApiError(status, code, message))
        }
      }

      return Promise.reject(
        buildApiError(status, code, message, extractDetails(error.response?.data)),
      )
    },
  )

  return client
}

export const apiClient = createAxiosClient()
