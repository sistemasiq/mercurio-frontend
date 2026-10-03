import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useShellIndicadoresStore } from '@/stores/shellIndicadores'
import { obtenerComandas } from '@/services/comandaService'
import { fetchActivos } from '@/api/onboardingClient'
import type { Comanda } from '@/types/comanda'
import type { ActivoDto } from '@/api/onboardingClient'

vi.mock('@/services/comandaService', () => ({
  obtenerComandas: vi.fn(),
}))
vi.mock('@/api/onboardingClient', () => ({
  fetchActivos: vi.fn(),
}))

const comandasMock = vi.mocked(obtenerComandas)
const activosMock = vi.mocked(fetchActivos)

function comanda(id: string, estado: Comanda['estado_actual']): Comanda {
  return { id, estado_actual: estado, detalles: [] }
}

function activo(id: string): ActivoDto {
  return {
    registroId: id,
    nombreSegundoTutor: null,
    detalleId: id,
    nino: id,
    notas: null,
    edad: 5,
    tutor: 'Tutor',
    telefono: '555',
    parentesco: 'Madre',
    pulsera: 'P1',
    minutosPagados: 60,
    minutosTranscurridos: 10,
    horaEntrada: '2026-01-01T00:00:00Z',
    cargoExtra: 0,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('useShellIndicadoresStore', () => {
  it('cuenta solo las comandas abiertas (P, E, L) como pendientes', async () => {
    comandasMock.mockResolvedValueOnce([
      comanda('1', 'P'),
      comanda('2', 'E'),
      comanda('3', 'L'),
      comanda('4', 'T'),
      comanda('5', 'C'),
    ])
    const store = useShellIndicadoresStore()

    await store.refrescarComandas()

    expect(store.comandasPendientes).toBe(3)
  })

  it('cuenta los niños activos de la sucursal', async () => {
    activosMock.mockResolvedValueOnce([activo('a1'), activo('a2')])
    const store = useShellIndicadoresStore()

    await store.refrescarNinosActivos('suc-1')

    expect(store.ninosActivos).toBe(2)
    expect(activosMock).toHaveBeenCalledWith('suc-1')
  })

  it('ignora errores del polling sin romper el estado actual', async () => {
    comandasMock.mockRejectedValueOnce(new Error('red caída'))
    const store = useShellIndicadoresStore()
    store.ninosActivos = 4

    await expect(store.refrescarComandas()).resolves.toBeUndefined()
    expect(store.comandasPendientes).toBe(0)
    expect(store.ninosActivos).toBe(4)
  })

  it('limpiar reinicia ambos contadores', () => {
    const store = useShellIndicadoresStore()
    store.comandasPendientes = 3
    store.ninosActivos = 5

    store.limpiar()

    expect(store.comandasPendientes).toBe(0)
    expect(store.ninosActivos).toBe(0)
  })
})
