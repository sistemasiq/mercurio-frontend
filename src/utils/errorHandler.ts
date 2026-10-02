import type { ApiError } from '@/types/auth'

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'La solicitud contiene datos inválidos.',
  401: 'Credenciales incorrectas. Verifica tu usuario y contraseña.',
  403: 'Tu cuenta no tiene permisos para acceder.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con el estado actual. Actualiza e intenta de nuevo.',
  422: 'Los datos enviados no son válidos.',
  423: 'Tu cuenta ha sido bloqueada. Contacta al administrador.',
  429: 'Demasiados intentos. Espera un momento antes de volver a intentar.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'El servicio no está disponible temporalmente.',
  503: 'El servicio se encuentra en mantenimiento.',
}

export const TIMEOUT_ERROR_CODE = 'TIMEOUT'
export const TIMEOUT_ERROR_MESSAGE =
  'El servidor no respondió a tiempo. Verifica en el historial si la operación se registró antes de reintentar.'

const API_ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Cuenta bloqueada. Contacta al administrador.',
  ACCOUNT_DISABLED: 'Cuenta desactivada. Contacta al administrador.',
  [TIMEOUT_ERROR_CODE]: TIMEOUT_ERROR_MESSAGE,
  TOKEN_EXPIRED: 'Tu sesión expiró. Inicia sesión nuevamente.',
  TOKEN_INVALID: 'Sesión inválida. Inicia sesión nuevamente.',
  EMAIL_NOT_VERIFIED: 'Verifica tu correo electrónico antes de continuar.',
}

export function resolveErrorMessage(error: ApiError | null): string {
  if (!error) return 'Ocurrió un error inesperado.'

  if (error.code && API_ERROR_CODE_MESSAGES[error.code]) {
    return API_ERROR_CODE_MESSAGES[error.code]
  }

  // El mensaje real del backend (ej. "No hay stock suficiente de «Harina»...",
  // extraído correctamente de "detail") tiene prioridad sobre el texto genérico
  // por código HTTP — ese texto es solo un último recurso cuando el backend no
  // mandó ningún detalle específico.
  if (error.message) return error.message

  if (error.statusCode && HTTP_ERROR_MESSAGES[error.statusCode]) {
    return HTTP_ERROR_MESSAGES[error.statusCode]
  }

  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}

/** `true` si `value` tiene la forma de `ApiError` (lo que rechaza `apiClient`). */
function isApiErrorLike(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'code' in value &&
    'message' in value
  )
}

/**
 * Timeout de axios o de `apiClient`: la petición pudo haber llegado al
 * servidor y registrarse. Cubre tanto el `AxiosError` original (código
 * `ECONNABORTED`/`ETIMEDOUT`) como el `ApiError` plano con el que
 * `apiClient` ya lo tradujo (`code: TIMEOUT_ERROR_CODE`), directo o envuelto
 * en un `Error` con `cause`.
 */
export function isTimeoutError(error: unknown): boolean {
  if (isApiErrorLike(error)) return error.code === TIMEOUT_ERROR_CODE
  if (!(error instanceof Error)) return false
  const cause = (error as Error & { cause?: unknown }).cause
  if (isApiErrorLike(cause)) return cause.code === TIMEOUT_ERROR_CODE
  const code = (error as Error & { code?: string }).code
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || error.message.includes('timeout')
}

/** Falta de red real; un timeout se distingue con `isTimeoutError`. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && !isTimeoutError(error) && error.message === 'Network Error'
}

/**
 * Extrae un mensaje de usuario de cualquier error de la capa de datos:
 * - `ApiError` plano (lo que rechaza `apiClient` directamente) → `resolveErrorMessage`.
 * - `Error` cuya `cause` es un `ApiError` (algunos services envuelven así,
 *   ej. `turnoCajaService`) → `resolveErrorMessage` sobre la causa.
 * - `Error` con mensaje no vacío → ese mensaje.
 * - Cualquier otro caso (incluye `message === ''`) → `fallback`.
 */
export function mensajeDeError(err: unknown, fallback: string): string {
  if (isApiErrorLike(err)) return resolveErrorMessage(err)

  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause
    if (isApiErrorLike(cause)) return resolveErrorMessage(cause)
    if (err.message) return err.message
  }

  return fallback
}
