import { describe, it, expect, beforeEach } from 'vitest'
import { sessionStorage, viewingBranch } from '@/utils/session'
import { tokenMemory } from '@/utils/tokenMemory'
import type { User } from '@/types/auth'

const USER: User = {
  id: '1',
  name: 'x',
  email: 'x@x.com',
  roles: ['Cajero'],
  branchId: null,
  branchName: null,
  permissions: [],
}

describe('sessionStorage (C3: access token solo en memoria)', () => {
  beforeEach(() => {
    localStorage.clear()
    tokenMemory.clear()
  })

  it('save() no persiste ningún token, solo el usuario', () => {
    tokenMemory.set('vivo-en-memoria')
    sessionStorage.save(USER)

    const raw = localStorage.getItem('auth_session')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw ?? '{}')
    expect(parsed).toEqual({ user: USER })
    expect(parsed.token).toBeUndefined()
  })

  it('load() devuelve el usuario cacheado sin token', () => {
    sessionStorage.save(USER)
    expect(sessionStorage.load()).toEqual({ user: USER })
  })

  it('clear() borra la sesión guardada y el token en memoria', () => {
    sessionStorage.save(USER)
    tokenMemory.set('vivo-en-memoria')
    viewingBranch.save('suc-1')

    sessionStorage.clear()

    expect(sessionStorage.load()).toBeNull()
    expect(viewingBranch.load()).toBeNull()
    expect(tokenMemory.get()).toBeNull()
  })
})
