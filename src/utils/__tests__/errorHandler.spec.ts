import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import {
  isNetworkError,
  isTimeoutError,
  resolveErrorMessage,
  TIMEOUT_ERROR_CODE,
} from '@/utils/errorHandler'

describe('resolveErrorMessage', () => {
  it('traduce el 409 como conflicto y no como sesión expirada', () => {
    const msg = resolveErrorMessage({ statusCode: 409, code: '', message: '' })

    expect(msg).toBe(
      'La operación entra en conflicto con el estado actual. Actualiza e intenta de nuevo.',
    )
    expect(msg).not.toMatch(/sesión/i)
  })

  it('prioriza el mensaje del backend sobre el genérico del 409', () => {
    expect(resolveErrorMessage({ statusCode: 409, code: '', message: 'Stock insuficiente' })).toBe(
      'Stock insuficiente',
    )
  })

  it('el código TIMEOUT devuelve el aviso de verificar el historial', () => {
    const msg = resolveErrorMessage({ statusCode: 0, code: TIMEOUT_ERROR_CODE, message: 'x' })

    expect(msg).toBe(
      'El servidor no respondió a tiempo. Verifica en el historial si la operación se registró antes de reintentar.',
    )
  })
})

describe('isTimeoutError / isNetworkError', () => {
  const timeout = new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED')
  const network = new AxiosError('Network Error', 'ERR_NETWORK')

  it('detecta un timeout y no lo cuenta como falta de red', () => {
    expect(isTimeoutError(timeout)).toBe(true)
    expect(isNetworkError(timeout)).toBe(false)
  })

  it('detecta ETIMEDOUT como timeout', () => {
    expect(isTimeoutError(new AxiosError('connect', 'ETIMEDOUT'))).toBe(true)
  })

  it('detecta falta de red sin confundirla con timeout', () => {
    expect(isNetworkError(network)).toBe(true)
    expect(isTimeoutError(network)).toBe(false)
  })

  it('ignora valores que no son Error', () => {
    expect(isTimeoutError({ message: 'timeout' })).toBe(false)
    expect(isNetworkError(null)).toBe(false)
  })
})
