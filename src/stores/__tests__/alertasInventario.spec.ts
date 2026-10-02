import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { listarAlertas } from '@/services/insumoService'
import { playAlertChime } from '@/utils/notificationSound'
import type { Insumo } from '@/types/insumo'

vi.mock('@/services/insumoService', () => ({
  listarAlertas: vi.fn(),
}))
vi.mock('@/utils/notificationSound', () => ({
  playAlertChime: vi.fn(),
}))

const listar = vi.mocked(listarAlertas)
const chime = vi.mocked(playAlertChime)

function insumo(id: string): Insumo {
  return {
    id,
    sucursal_id: 'suc-1',
    nombre: id,
    descripcion: null,
    unidad_base_id: 'u1',
    unidad_compra_id: 'u1',
    stock_actual: '0',
    stock_minimo: '10',
    punto_reorden: null,
    stock_maximo: null,
    costo_unitario: null,
    proveedor_principal_id: null,
    activo: true,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('refrescar', () => {
  it('descarta una respuesta de una sucursal que ya no es la vigente', async () => {
    const store = useAlertasInventarioStore()
    let resolverA!: (v: { criticos: Insumo[]; por_reordenar: Insumo[] }) => void
    listar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverA = resolve
        }),
    )

    // Arranca el refresco de la sucursal A (queda en vuelo)...
    const pendienteA = store.refrescar('suc-A', false)
    // ...y antes de que resuelva, el usuario cambia a la sucursal B.
    listar.mockResolvedValueOnce({ criticos: [insumo('b1')], por_reordenar: [] })
    await store.refrescar('suc-B', false)

    // La respuesta tardía de A llega después.
    resolverA({ criticos: [insumo('a1')], por_reordenar: [] })
    await pendienteA

    expect(store.criticos).toEqual([insumo('b1')])
  })

  it('no hace sonar el timbre en el primer refresco tras limpiar (cambio de sucursal)', async () => {
    const store = useAlertasInventarioStore()
    listar.mockResolvedValueOnce({ criticos: [insumo('a1')], por_reordenar: [] })
    await store.refrescar('suc-A', true)
    expect(chime).not.toHaveBeenCalled()

    store.limpiar()
    listar.mockResolvedValueOnce({ criticos: [insumo('b1')], por_reordenar: [] })
    await store.refrescar('suc-B', true)

    expect(chime).not.toHaveBeenCalled()
  })

  it('toca el timbre cuando aparece una alerta nueva en la misma sucursal', async () => {
    const store = useAlertasInventarioStore()
    listar.mockResolvedValueOnce({ criticos: [insumo('a1')], por_reordenar: [] })
    await store.refrescar('suc-A', true)

    listar.mockResolvedValueOnce({ criticos: [insumo('a1'), insumo('a2')], por_reordenar: [] })
    await store.refrescar('suc-A', true)

    expect(chime).toHaveBeenCalledTimes(1)
  })
})
