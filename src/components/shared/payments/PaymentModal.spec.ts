import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppliedPaymentsList from './AppliedPaymentsList.vue'
import MethodSelector from './MethodSelector.vue'
import PaymentKeypad from './PaymentKeypad.vue'
import PaymentModal from './PaymentModal.vue'

/**
 * El modal queda montado permanentemente en sus cuatro consumidores (ninguno lo
 * envuelve en v-if), así que su estado interno sobrevive a cerrarlo. Estos tests
 * cubren que cancelar no deje pagos fantasma que se apliquen en el siguiente cobro.
 */
const montar = (totalToPay = 5000) =>
  mount(PaymentModal, {
    props: { modelValue: true, totalToPay },
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
      .find((b) => b.props('label') === 'Finalizar Transacción')
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
})
