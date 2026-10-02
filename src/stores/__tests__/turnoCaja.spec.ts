import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { turnoCajaService } from '@/services/turnoCajaService'
import type { TurnoActivoResponse } from '@/types/turnoCaja'

vi.mock('@/services/turnoCajaService', () => {
  class TurnoNoEncontradoError extends Error {
    constructor() {
      super('No se encontró un turno activo para esta sesión.')
      this.name = 'TurnoNoEncontradoError'
    }
  }
  return {
    TurnoNoEncontradoError,
    turnoCajaService: {
      abrirTurno: vi.fn(),
      cargarTurnoActivo: vi.fn(),
      iniciarConteo: vi.fn(),
      enviarConteo: vi.fn(),
      autenticarAdmin: vi.fn(),
      cancelarConteo: vi.fn(),
      registrarRetiro: vi.fn(),
      confirmarCierre: vi.fn(),
    },
  }
})

const servicio = vi.mocked(turnoCajaService)

function turnoEn(
  estado: TurnoActivoResponse['estado'],
  extra: Partial<TurnoActivoResponse> = {},
): TurnoActivoResponse {
  return {
    id: 'turno-1',
    sucursalId: 'suc-1',
    sucursalNombre: 'Centro',
    cajeroId: 'cajero-1',
    cajeroNombre: 'Ana',
    terminal: 'CAJA 01',
    estado,
    fondoInicial: 1000,
    fechaApertura: '2026-01-01T10:00:00Z',
    totalVentas: 0,
    totalRetiros: 0,
    movimientos: [],
    ...extra,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('confirmarCierre', () => {
  it('devuelve ok:false y no cambia el estado cuando el backend falla', async () => {
    const store = useTurnoCajaStore()
    servicio.cargarTurnoActivo.mockResolvedValue(turnoEn('BALANCE_REVELADO'))
    await store.cargarTurnoActivo()
    servicio.confirmarCierre.mockRejectedValue(new Error('Error interno del servidor.'))

    const resultado = await store.confirmarCierre('obs')

    expect(resultado).toEqual({ ok: false, error: 'Error interno del servidor.' })
    expect(store.estado).toBe('BALANCE_REVELADO')
    expect(store.turnoId).toBe('turno-1')
    expect(store.error).toBe('Error interno del servidor.')
  })

  it('devuelve arqueoId y pdfUrl cuando el cierre sale bien', async () => {
    const store = useTurnoCajaStore()
    servicio.cargarTurnoActivo.mockResolvedValue(turnoEn('BALANCE_REVELADO'))
    await store.cargarTurnoActivo()
    servicio.confirmarCierre.mockResolvedValue({
      arqueoId: 'arq-9',
      estado: 'CERRADO',
      pdfUrl: '/x.pdf',
      mensaje: 'ok',
    })

    const resultado = await store.confirmarCierre('obs')

    expect(resultado).toEqual({ ok: true, pdfUrl: '/x.pdf', arqueoId: 'arq-9' })
    expect(store.estado).toBe('CERRADO')
  })
})
