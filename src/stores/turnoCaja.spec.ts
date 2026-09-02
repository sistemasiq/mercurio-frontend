import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTurnoCajaStore } from './turnoCaja'
import { turnoCajaService } from '@/services/turnoCajaService'

vi.mock('@/services/turnoCajaService', () => ({
  turnoCajaService: {
    registrarIngreso: vi.fn(),
    cargarTurnoActivo: vi.fn(),
  },
}))

describe('useTurnoCajaStore.registrarIngreso', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('registra el ingreso y recarga el turno activo cuando el backend responde bien', async () => {
    const store = useTurnoCajaStore()
    store.turnoId = 'turno-1'
    vi.mocked(turnoCajaService.registrarIngreso).mockResolvedValue({
      id: 'ing-1',
      turnoId: 'turno-1',
      monto: 500,
      creado: '2026-08-25T00:00:00Z',
    })
    vi.mocked(turnoCajaService.cargarTurnoActivo).mockRejectedValue(new Error('sin turno'))

    const ok = await store.registrarIngreso(500)

    expect(ok).toBe(true)
    expect(turnoCajaService.registrarIngreso).toHaveBeenCalledWith({
      turnoId: 'turno-1',
      monto: 500,
    })
    expect(turnoCajaService.cargarTurnoActivo).toHaveBeenCalled()
  })

  it('devuelve false y guarda el error cuando el backend rechaza el ingreso', async () => {
    const store = useTurnoCajaStore()
    store.turnoId = 'turno-1'
    vi.mocked(turnoCajaService.registrarIngreso).mockRejectedValue(new Error('Turno no abierto'))

    const ok = await store.registrarIngreso(500)

    expect(ok).toBe(false)
    expect(store.error).toBe('Turno no abierto')
  })
})
