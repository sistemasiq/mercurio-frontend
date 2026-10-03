import { describe, it, expect, beforeEach } from 'vitest'
import { tokenMemory } from '@/utils/tokenMemory'

describe('tokenMemory (C3)', () => {
  beforeEach(() => {
    tokenMemory.clear()
  })

  it('arranca vacío', () => {
    expect(tokenMemory.get()).toBeNull()
  })

  it('guarda y devuelve el token', () => {
    tokenMemory.set('abc')
    expect(tokenMemory.get()).toBe('abc')
  })

  it('clear lo borra', () => {
    tokenMemory.set('abc')
    tokenMemory.clear()
    expect(tokenMemory.get()).toBeNull()
  })
})
