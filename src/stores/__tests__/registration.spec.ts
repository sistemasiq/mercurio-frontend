import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRegistrationStore } from '@/stores/registration'
import { useAuthStore } from '@/stores/auth'
import { postOnboarding } from '@/api/onboardingClient'
import type { PrecioEstancia } from '@/types/producto'

vi.mock('@/api/onboardingClient', () => ({
  postOnboarding: vi.fn(),
}))

const PRODUCTO: PrecioEstancia = {
  id: 'prod-1',
  config_estancia: [{ min_horas: 1, max_horas: 1, precio: 100 }],
}

function prepararRegistroListo() {
  const store = useRegistrationStore()
  const auth = useAuthStore()

  auth.user = {
    id: 'u1',
    name: 'Cajero',
    email: 'cajero@test.com',
    roles: ['Cajero'],
    branchId: 'suc-1',
    branchName: 'Centro',
    permissions: [],
  }

  store.productoBase = PRODUCTO
  store.children[0].name = 'Niño Uno'
  store.children[0].age = 5
  store.saveChild(0)

  return store
}

describe('registration store: pagos en completeRegistration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(postOnboarding).mockReset()
    vi.mocked(postOnboarding).mockResolvedValue({
      registroId: 'r1',
      total: 100,
      pagado: 100,
      estado: 'activo',
    })
  })

  it('cuando los puntos cubren todo el total, envía pagos: [] sin ningún UUID fijo', async () => {
    const store = prepararRegistroListo()

    await store.proceedToRFID([], 100, 100)
    await store.completeRegistration()

    expect(postOnboarding).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(postOnboarding).mock.calls[0][0]
    expect(payload.pagos).toEqual([])
    expect(JSON.stringify(payload)).not.toContain('b827363b-6453-40e4-9536-f7a004711f91')
  })

  it('si los pagos no cuadran con el total, no envía nada al backend', async () => {
    const store = prepararRegistroListo()

    // Total es 100; este pago solo cubre 50 y no hay descuento de puntos.
    await store.proceedToRFID([{ metodoPagoId: 'm-1', monto: 50 }], 0, 0)
    await store.completeRegistration()

    expect(postOnboarding).not.toHaveBeenCalled()
    expect(store.submitError).toBeTruthy()
  })
})
