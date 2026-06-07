import type { ApiError } from '@/types/auth'

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'La solicitud contiene datos inválidos.',
  401: 'Credenciales incorrectas. Verifica tu usuario y contraseña.',
  403: 'Tu cuenta no tiene permisos para acceder.',
  404: 'El recurso solicitado no existe.',
  409: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
  422: 'Los datos enviados no son válidos.',
  423: 'Tu cuenta ha sido bloqueada. Contacta al administrador.',
  429: 'Demasiados intentos. Espera un momento antes de volver a intentar.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'El servicio no está disponible temporalmente.',
  503: 'El servicio se encuentra en mantenimiento.',
}

const API_ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  ACCOUNT_LOCKED: 'Cuenta bloqueada. Contacta al administrador.',
  ACCOUNT_DISABLED: 'Cuenta desactivada. Contacta al administrador.',
  TOKEN_EXPIRED: 'Tu sesión expiró. Inicia sesión nuevamente.',
  TOKEN_INVALID: 'Sesión inválida. Inicia sesión nuevamente.',
  EMAIL_NOT_VERIFIED: 'Verifica tu correo electrónico antes de continuar.',
}

export function resolveErrorMessage(error: ApiError | null): string {
  if (!error) return 'Ocurrió un error inesperado.'

  if (error.code && API_ERROR_CODE_MESSAGES[error.code]) {
    return API_ERROR_CODE_MESSAGES[error.code]
  }

  if (error.statusCode && HTTP_ERROR_MESSAGES[error.statusCode]) {
    return HTTP_ERROR_MESSAGES[error.statusCode]
  }

  if (error.message) return error.message

  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}

export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === 'Network Error' || error.message.includes('timeout'))
  )
}
