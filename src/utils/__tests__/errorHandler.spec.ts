import { describe, it, expect } from 'vitest'
import { AxiosError } from 'axios'
import {
  isNetworkError,
  isTimeoutError,
  mensajeDeError,
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

  it('detecta el ApiError plano que apiClient emite para un timeout', () => {
    expect(isTimeoutError({ statusCode: 0, code: TIMEOUT_ERROR_CODE, message: 'x' })).toBe(true)
  })

  it('detecta el timeout cuando el ApiError viaja como cause de un Error', () => {
    const apiErr = { statusCode: 0, code: TIMEOUT_ERROR_CODE, message: 'x' }
    const wrapped = new Error('x', { cause: apiErr })
    expect(isTimeoutError(wrapped)).toBe(true)
  })

  it('no confunde un ApiError con otro code como timeout', () => {
    expect(isTimeoutError({ statusCode: 404, code: 'NOT_FOUND', message: 'x' })).toBe(false)
  })
})

describe('mensajeDeError', () => {
  it('usa resolveErrorMessage cuando el error es un ApiError plano', () => {
    expect(mensajeDeError({ statusCode: 409, code: '', message: 'Stock insuficiente' }, 'x')).toBe(
      'Stock insuficiente',
    )
  })

  it('usa la causa cuando es un Error que envuelve un ApiError', () => {
    const apiErr = { statusCode: 404, code: '', message: 'No existe' }
    const wrapped = new Error('No existe', { cause: apiErr })
    expect(mensajeDeError(wrapped, 'fallback')).toBe('No existe')
  })

  it('usa el mensaje del Error cuando no es vacío', () => {
    expect(mensajeDeError(new Error('algo falló'), 'fallback')).toBe('algo falló')
  })

  it('devuelve el fallback si el Error no tiene mensaje', () => {
    expect(mensajeDeError(new Error(''), 'fallback')).toBe('fallback')
  })

  it('devuelve el fallback para cualquier otro valor', () => {
    expect(mensajeDeError('texto plano', 'fallback')).toBe('fallback')
    expect(mensajeDeError(null, 'fallback')).toBe('fallback')
  })
})
