import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BaseDialog from '@/components/ui/BaseDialog.vue'
import AppliedPaymentsList from './AppliedPaymentsList.vue'
import MethodSelector from './MethodSelector.vue'
import PaymentKeypad from './PaymentKeypad.vue'
import PaymentModal from './PaymentModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import type { MetodosPago } from '@/types/metodos_pago'

// Catálogo de prueba con las 4 categorías activas -- "Efectivo" queda primera
// para que el default siga siendo igual que antes de exigir el prop.
const METODOS_PAGO_TEST: MetodosPago[] = [
  { id: 'e', nombre: 'Efectivo', descripcion: null, tipo: 'E', activo: true },
  { id: 't', nombre: 'Tarjeta', descripcion: null, tipo: 'T', activo: true },
  { id: 'c', nombre: 'Cupones', descripcion: null, tipo: 'C', activo: true },
  { id: 'l', nombre: 'Lealtad', descripcion: null, tipo: 'L', activo: true },
]

/**
 * El modal queda montado permanentemente en sus cuatro consumidores (ninguno lo
 * envuelve en v-if), así que su estado interno sobrevive a cerrarlo. Estos tests
 * cubren que cancelar no deje pagos fantasma que se apliquen en el siguiente cobro.
 */
const montar = (totalToPay = 5000) =>
  mount(PaymentModal, {
    props: { modelValue: true, totalToPay, metodosPago: METODOS_PAGO_TEST },
    global: {
      // QDialog renderiza su contenido en un portal fuera del wrapper, así que
      // sin este stub findComponent() no encuentra nada del interior del modal.
      stubs: { QDialog: { template: '<div><slot /></div>' } },
    },
  })

/** Simula capturar un monto en el teclado numérico. */
const capturarMonto = async (wrapper: ReturnType<typeof montar>, monto: number) => {
  await wrapper.findComponent(PaymentKeypad).vm.$emit('add-payment', monto)
  await wrapper.vm.$nextTick()
}

/** Cambia el método de pago activo, como al tocar un botón del selector. */
const seleccionarMetodo = async (wrapper: ReturnType<typeof montar>, metodo: string) => {
  await wrapper.findComponent(MethodSelector).vm.$emit('update:modelValue', metodo)
  await wrapper.vm.$nextTick()
}

const pagosEnLista = (wrapper: ReturnType<typeof montar>) =>
  wrapper.findComponent(AppliedPaymentsList).props('pagos')

describe('PaymentModal', () => {
  afterEach(() => vi.restoreAllMocks())

  it('registra el pago capturado en la lista', async () => {
    const wrapper = montar()
    await capturarMonto(wrapper, 5000)

    expect(pagosEnLista(wrapper)).toHaveLength(1)
    expect(pagosEnLista(wrapper)[0]?.amount).toBe(5000)
  })

  it('descarta los pagos al cerrar sin finalizar, para que no se apliquen después', async () => {
    const wrapper = montar()
    await capturarMonto(wrapper, 5000)
    expect(pagosEnLista(wrapper)).toHaveLength(1)

    // El usuario cancela: el padre baja el v-model y el modal se cierra.
    await wrapper.setProps({ modelValue: false })
    // Vuelve a abrirlo para el siguiente cobro.
    await wrapper.setProps({ modelValue: true })

    expect(pagosEnLista(wrapper)).toHaveLength(0)
  })

  it('no emite pago-exitoso con pagos de una sesión cancelada', async () => {
    const wrapper = montar()
    await capturarMonto(wrapper, 5000)

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })

    // Ahora se cobra de nuevo y se finaliza.
    await capturarMonto(wrapper, 5000)
    const finalizar = wrapper
      .findAllComponents({ name: 'QBtn' })
      .find((b) => b.props('label') === 'Confirmar pago')
    expect(finalizar, 'no se encontró el botón de finalizar').toBeTruthy()
    await finalizar!.trigger('click')

    const emitido = wrapper.emitted('pago-exitoso')
    expect(emitido).toBeTruthy()
    const pagos = emitido?.[0]?.[0] as { amount: number }[]
    expect(pagos).toHaveLength(1)
    expect(pagos.reduce((s, p) => s + p.amount, 0)).toBe(5000)
  })

  it('da un id único a cada pago aunque se capturen en el mismo milisegundo', async () => {
    // Con "Cupones" cada abono genera su propio renglón; en efectivo se fusionan
    // en uno solo y la prueba no diría nada. El reloj se congela porque si no,
    // las dos capturas caen en milisegundos distintos y la colisión de
    // Date.now() no llega a reproducirse: el test pasaría con y sin el arreglo.
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    const wrapper = montar(10000)
    await seleccionarMetodo(wrapper, 'Cupones')
    await capturarMonto(wrapper, 3000)
    await capturarMonto(wrapper, 4000)

    const pagos = pagosEnLista(wrapper)
    expect(pagos).toHaveLength(2)
    // Con ids repetidos, eliminarPago() borraría los dos renglones a la vez.
    expect(new Set(pagos.map((p) => p.id)).size).toBe(2)
  })

  it('emite el cambio a devolver junto con el pago', async () => {
    const wrapper = montar(120)
    await capturarMonto(wrapper, 200)

    const confirmar = wrapper
      .findAllComponents({ name: 'QBtn' })
      .find((b) => b.props('label') === 'Confirmar pago')
    expect(confirmar, 'no se encontró el botón de confirmar').toBeTruthy()
    await confirmar!.trigger('click')

    const emitido = wrapper.emitted('pago-exitoso')
    expect(emitido).toBeTruthy()
    // El modal emite lo entregado; el cambio va aparte para no descontarlo dos veces.
    expect((emitido?.[0]?.[0] as { amount: number }[])[0]?.amount).toBe(200)
    expect(emitido?.[0]?.[4] as number).toBe(80)
  })

  it('acepta un pago con tarjeta exacto aunque el total tenga residuo flotante (3 × 33.30)', async () => {
    const wrapper = montar(3 * 33.3)
    await seleccionarMetodo(wrapper, 'Tarjeta')
    await capturarMonto(wrapper, 99.9)

    // Se abre el formulario de tarjeta en vez de rechazar el monto por exceder el saldo.
    expect(wrapper.findComponent(BaseDialog).props('modelValue')).toBe(true)
  })

  it('permitirLealtad=false oculta la categoria Lealtad y la captura de celular', () => {
    const wrapper = mount(PaymentModal, {
      props: {
        modelValue: true,
        totalToPay: 100,
        metodosPago: METODOS_PAGO_TEST,
        permitirLealtad: false,
      },
      global: { stubs: { QDialog: { template: '<div><slot /></div>' } } },
    })

    expect(wrapper.text()).not.toContain('Lealtad')
    expect(wrapper.text()).not.toContain('Celular del cliente')
  })

  it('por defecto ofrece Lealtad y la captura de celular', () => {
    const wrapper = montar(100)
    expect(wrapper.text()).toContain('Lealtad')
    expect(wrapper.text()).toContain('Celular del cliente')
  })

  it('ignora la respuesta tardia de saldo de otro celular', async () => {
    const wrapper = montar(100)
    const auth = useAuthStore()
    const lealtad = useLealtadStore()
    auth.user = {
      id: 'u1',
      name: 'Cajero',
      email: 'c@test.com',
      roles: [],
      branchId: 'suc-1',
      branchName: 'Sucursal',
      permissions: [],
    }
    lealtad.configuracion = { valor_punto: 1 } as unknown as typeof lealtad.configuracion

    type Saldo = { sucursal_id: string; celular: string; saldo: number }
    const pendientes = new Map<string, (s: Saldo) => void>()
    vi.spyOn(lealtad, 'cargarSaldo').mockImplementation(
      (_suc, celular) => new Promise<Saldo>((resolve) => pendientes.set(celular, resolve)),
    )
    vi.spyOn(lealtad, 'cargarConfiguracion').mockResolvedValue(undefined)

    const input = wrapper.findComponent({ name: 'QInput' })
    await input.vm.$emit('update:modelValue', '5511111111')
    await wrapper.vm.$nextTick()
    await input.vm.$emit('update:modelValue', '5522222222')
    await wrapper.vm.$nextTick()

    // Primero responde el celular nuevo, luego (tarde) el anterior.
    pendientes.get('5522222222')?.({ sucursal_id: 'suc-1', celular: '5522222222', saldo: 20 })
    await flushPromises()
    pendientes.get('5511111111')?.({ sucursal_id: 'suc-1', celular: '5511111111', saldo: 999 })
    await flushPromises()

    expect(wrapper.text()).toContain('20 pts disponibles')
    expect(wrapper.text()).not.toContain('999 pts')
  })
})
