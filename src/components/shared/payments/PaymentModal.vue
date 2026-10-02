<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="pay">
      <header class="pay__head">
        <div class="pay__titles">
          <span class="pay__title">{{ titulo ?? 'Cobrar' }}</span>
          <span v-if="subtitulo" class="pay__subtitle">{{ subtitulo }}</span>
        </div>
        <div class="pay__total">
          <span class="pay__total-label">Total a pagar</span>
          <span class="pay__total-value">${{ totalNeto.toFixed(2) }}</span>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="pay__close"
          aria-label="Cerrar"
          @click="$emit('update:modelValue', false)"
        />
      </header>

      <div class="pay__body">
        <section class="pay__col pay__col--methods">
          <span class="pay__label">Método</span>
          <MethodSelector v-model="metodoSeleccionado" :metodos-disponibles="metodosVisibles" />
        </section>

        <section class="pay__col pay__col--keypad">
          <PaymentKeypad
            :label="etiquetaMonto"
            :exacto="esEfectivo(metodoSeleccionado) ? saldoPendiente : null"
            :action-label="metodoSeleccionado === 'Lealtad' ? 'Aplicar puntos' : 'Aplicar'"
            @add-payment="iniciarAbono"
          />
        </section>

        <section class="pay__col pay__col--applied">
          <div v-if="permitirLealtad" class="pay__client">
            <span class="field-label">Celular del cliente (opcional)</span>
            <q-input
              ref="celularInputRef"
              v-model="celularCliente"
              placeholder="10 dígitos"
              outlined
              dense
              mask="##########"
              :readonly="!!props.celularPrellenado"
              :rules="[(val: string) => !val || val.length === 10 || 'Debe tener 10 dígitos']"
              :hint="
                props.celularPrellenado
                  ? 'Tel. del tutor, usado para puntos de lealtad'
                  : 'Para acumular puntos de lealtad'
              "
            />
            <span v-if="saldoDisponible !== null && saldoDisponible > 0" class="pay__points">
              {{ saldoDisponible }} pts disponibles · ${{ valorPunto?.toFixed(2) }} c/u
            </span>
          </div>

          <AppliedPaymentsList
            class="pay__applied"
            :pagos="pagosParaMostrar"
            @remove-payment="eliminarPago"
          />

          <dl class="pay__summary">
            <template v-if="descuentoPuntos > 0">
              <div>
                <dt>Subtotal</dt>
                <dd>${{ props.totalToPay.toFixed(2) }}</dd>
              </div>
              <div class="pay__summary--ok">
                <dt>Descuento por puntos</dt>
                <dd>−${{ descuentoPuntos.toFixed(2) }}</dd>
              </div>
            </template>
            <div>
              <dt>Aplicado</dt>
              <dd>${{ totalPagado.toFixed(2) }}</dd>
            </div>
            <div class="pay__summary--bad">
              <dt>Restante</dt>
              <dd>${{ saldoPendiente.toFixed(2) }}</dd>
            </div>
            <div class="pay__summary--ok">
              <dt>Cambio</dt>
              <dd>${{ cambioADevolver.toFixed(2) }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <footer class="pay__foot">
        <q-btn outline label="Cancelar" @click="$emit('update:modelValue', false)" />
        <q-btn
          unelevated
          color="primary"
          label="Confirmar pago"
          class="pay__confirm"
          :disable="saldoPendiente > TOLERANCIA_MONTO"
          @click="finalizarPago"
        />
      </footer>
    </q-card>
  </q-dialog>

  <BaseDialog
    v-model="mostrarModalTarjeta"
    title="Pago con tarjeta"
    subtitle="Cobra en la terminal bancaria y captura los datos"
    icon="credit_card"
    tone="pink"
    :width="480"
    persistent
    primary-label="Agregar pago"
    :primary-disabled="!tarjetaTipo || !tarjetaAutorizacion"
    @cancel="limpiarModalTarjeta"
    @confirm="onConfirmarTarjeta"
  >
    <div class="card-form">
      <div class="card-form__field">
        <span class="field-label">Monto</span>
        <q-input
          :model-value="tarjetaMontoTemporal.toFixed(2)"
          outlined
          dense
          readonly
          prefix="$"
        />
      </div>
      <div class="card-form__field">
        <span class="field-label">Tipo</span>
        <q-select
          v-model="tarjetaTipo"
          :options="OPCIONES_TARJETA"
          emit-value
          map-options
          outlined
          dense
        />
      </div>
      <div class="card-form__field card-form__field--full">
        <span class="field-label">Autorización</span>
        <q-input
          v-model="tarjetaAutorizacion"
          outlined
          dense
          autofocus
          placeholder="Folio del voucher"
        />
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar, type QInput } from 'quasar'
import type { PaymentProps, AppliedPayment } from '@/types/payments'
import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import { TOLERANCIA_MONTO, redondear2 } from '@/utils/dinero'

import MethodSelector from './MethodSelector.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import PaymentKeypad from './PaymentKeypad.vue'
import AppliedPaymentsList from './AppliedPaymentsList.vue'

const props = withDefaults(
  defineProps<
    PaymentProps & {
      modelValue: boolean
      metodosPago: MetodosPago[]
      /** Encabezado del cobro (p. ej. "Cobrar pedido"). */
      titulo?: string
      /** Línea secundaria (cliente, mesa, folio). */
      subtitulo?: string
      /**
       * Si es false oculta la categoría Lealtad y la captura de celular, y no
       * emite puntos. Usar en flujos que no pueden procesar la redención.
       * Por defecto true.
       */
      permitirLealtad?: boolean
    }
  >(),
  { permitirLealtad: true, titulo: undefined, subtitulo: undefined },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  /**
   * Se emite al confirmar el cobro. `amount` de cada pago es SIEMPRE el monto
   * aplicado al cargo (en efectivo ya descontado el cambio); el efectivo
   * entregado por el cliente va en `recibido`. Nunca sumes `recibido` al cargo.
   */
  (
    e: 'pago-exitoso',
    pagos: AppliedPayment[],
    celularCliente: string | null,
    puntosARedimir: number,
    descuentoPuntos: number,
  ): void
}>()

const $q = useQuasar()
const authStore = useAuthStore()
const lealtadStore = useLealtadStore()

const metodoSeleccionado = ref('')
const pagosAplicados = ref<AppliedPayment[]>([])
const celularInputRef = ref<QInput | null>(null)
const celularCliente = ref('')
const puntosARedimir = ref(0)
const saldoDisponible = ref<number | null>(null)
const valorPunto = ref<number | null>(null)
const mostrarModalTarjeta = ref(false)
const tarjetaMontoTemporal = ref(0)
const tarjetaTipo = ref<'DEBITO' | 'CREDITO'>('CREDITO')
const tarjetaAutorizacion = ref('')

// Catálogo que se ofrece en el selector: sin Lealtad si el flujo no la admite.
const metodosVisibles = computed(() =>
  props.permitirLealtad ? props.metodosPago : props.metodosPago.filter((m) => m.tipo !== 'L'),
)

// Primera categoría con al menos un método activo de ese tipo en el
// catálogo real de la sucursal -- no asumir que "Efectivo" siempre existe.
const primeraCategoriaDisponible = computed(
  () =>
    CATEGORIAS_METODO_PAGO.find((cat) =>
      metodosVisibles.value.some((m) => m.activo && m.tipo === cat.tipo),
    )?.valor ?? '',
)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      metodoSeleccionado.value = primeraCategoriaDisponible.value
      if (props.permitirLealtad && props.celularPrellenado) {
        celularCliente.value = props.celularPrellenado
      }
    } else {
      // El componente queda montado en todos sus consumidores (ninguno usa v-if),
      // así que al cerrar sin finalizar hay que descartar los pagos capturados.
      // Si no, reaparecen en el siguiente cobro y se aplican como pagos reales
      // por dinero que nunca se recibió. finalizarPago() ya emitió una copia
      // antes de cerrar, así que limpiar aquí no le quita nada.
      pagosAplicados.value = []
      metodoSeleccionado.value = ''
      celularCliente.value = ''
      saldoDisponible.value = null
      valorPunto.value = null
      puntosARedimir.value = 0
      mostrarModalTarjeta.value = false
      tarjetaMontoTemporal.value = 0
      tarjetaTipo.value = 'CREDITO'
      tarjetaAutorizacion.value = ''
    }
  },
  { immediate: true },
)

watch(celularCliente, async (val) => {
  if (!props.permitirLealtad || val.length !== 10 || !authStore.currentBranchId) {
    saldoDisponible.value = null
    puntosARedimir.value = 0
    return
  }
  const sucursalId = authStore.currentBranchId
  const [saldo] = await Promise.all([
    lealtadStore.cargarSaldo(sucursalId, val),
    lealtadStore.cargarConfiguracion(sucursalId),
  ])
  saldoDisponible.value = saldo.saldo
  valorPunto.value = lealtadStore.configuracion?.valor_punto ?? null
})

const maxPuntosRedimibles = computed(() => {
  if (saldoDisponible.value === null || !valorPunto.value) return 0
  const maxPorTotal = Math.floor(props.totalToPay / valorPunto.value)
  return Math.max(0, Math.min(saldoDisponible.value, maxPorTotal))
})

const descuentoPuntos = computed(() => {
  if (!valorPunto.value) return 0
  const puntos = Math.min(puntosARedimir.value, maxPuntosRedimibles.value)
  return redondear2(puntos * valorPunto.value)
})

const totalNeto = computed(() => redondear2(props.totalToPay - descuentoPuntos.value))

watch(totalNeto, (nuevoTotal) => {
  let excedente = 0
  for (const pago of pagosAplicados.value) {
    if (!esEfectivo(pago.method)) {
      const maxPermitido = Math.max(0, redondear2(nuevoTotal - excedente))
      if (pago.amount > maxPermitido) {
        pago.amount = maxPermitido
      }
      excedente = redondear2(excedente + pago.amount)
    }
  }
})

const etiquetaMonto = computed(() => {
  const m = metodoSeleccionado.value
  if (esEfectivo(m)) return 'Efectivo recibido'
  if (esLealtad(m)) return 'Monto en puntos'
  return m ? `Monto · ${m}` : 'Monto'
})

const esEfectivo = (nombre: string) => nombre.trim().toLowerCase().includes('efectivo')
const esLealtad = (nombre: string) => nombre.trim().toLowerCase().includes('lealtad')
const esTarjeta = (nombre: string) => {
  const n = nombre.trim().toLowerCase()
  return (
    n.includes('tarjeta') ||
    n.includes('crédito') ||
    n.includes('débito') ||
    n.includes('credito') ||
    n.includes('debito')
  )
}

const totalPagado = computed(() => {
  return redondear2(pagosAplicados.value.reduce((suma, pago) => suma + pago.amount, 0))
})

const saldoPendiente = computed(() => {
  const restante = redondear2(totalNeto.value - totalPagado.value)
  return restante > TOLERANCIA_MONTO ? restante : 0
})

const cambioADevolver = computed(() => {
  const excedente = redondear2(totalPagado.value - totalNeto.value)
  return excedente > TOLERANCIA_MONTO ? excedente : 0
})

const iniciarAbono = (monto: number) => {
  monto = redondear2(monto)
  if (monto <= TOLERANCIA_MONTO || !metodoSeleccionado.value) return

  if (esLealtad(metodoSeleccionado.value)) {
    aplicarRedencionLealtad(monto)
    return
  }

  if (!esEfectivo(metodoSeleccionado.value) && monto > saldoPendiente.value + TOLERANCIA_MONTO) {
    $q.notify({
      type: 'warning',
      message: `No se puede dar cambio en ${metodoSeleccionado.value}. El máximo es $${saldoPendiente.value.toFixed(2)}`,
      position: 'top',
      timeout: 3000,
    })
    return
  }

  if (esTarjeta(metodoSeleccionado.value)) {
    tarjetaMontoTemporal.value = monto
    mostrarModalTarjeta.value = true
  } else {
    agregarPago(monto)
  }
}

const aplicarRedencionLealtad = (monto: number) => {
  if (!saldoDisponible.value) {
    $q.notify({
      type: 'warning',
      message: 'Captura el celular del cliente en el campo de arriba para usar sus puntos.',
      position: 'top',
      timeout: 3000,
    })
    celularInputRef.value?.focus()
    return
  }

  const puntosDisponiblesRestantes = maxPuntosRedimibles.value - puntosARedimir.value
  const puntosSolicitados = Math.round(monto / (valorPunto.value ?? 1))

  if (puntosSolicitados > puntosDisponiblesRestantes) {
    $q.notify({
      type: 'warning',
      message: `Solo puede aplicar hasta $${(puntosDisponiblesRestantes * (valorPunto.value ?? 1)).toFixed(2)} en puntos.`,
      position: 'top',
      timeout: 3000,
    })
  }

  puntosARedimir.value += Math.min(puntosSolicitados, puntosDisponiblesRestantes)
}

const OPCIONES_TARJETA = [
  { label: 'Débito', value: 'DEBITO' },
  { label: 'Crédito', value: 'CREDITO' },
]

const onConfirmarTarjeta = () => {
  confirmarPagoTarjeta()
  mostrarModalTarjeta.value = false
}

const confirmarPagoTarjeta = () => {
  agregarPago(
    tarjetaMontoTemporal.value,
    tarjetaTipo.value as 'DEBITO' | 'CREDITO',
    tarjetaAutorizacion.value,
  )
  limpiarModalTarjeta()
}

// Date.now() colisiona si se agregan dos pagos dentro del mismo milisegundo, y
// como eliminarPago() filtra por id, un id repetido borra los dos renglones a la
// vez. Un contador garantiza que cada pago sea direccionable por separado.
let contadorPagos = 0
const nuevoIdPago = () => `pago-${Date.now()}-${++contadorPagos}`

const agregarPago = (monto: number, cardType?: 'DEBITO' | 'CREDITO', authCode?: string) => {
  if (esEfectivo(metodoSeleccionado.value)) {
    const existente = pagosAplicados.value.find((p) => esEfectivo(p.method))
    if (existente) {
      existente.amount = redondear2(existente.amount + monto)
      existente.timestamp = new Date()
      return
    }
  }
  pagosAplicados.value.push({
    id: nuevoIdPago(),
    method: metodoSeleccionado.value,
    amount: monto,
    timestamp: new Date(),
    cardType,
    authCode,
  })
}

const limpiarModalTarjeta = () => {
  tarjetaMontoTemporal.value = 0
  tarjetaTipo.value = 'CREDITO'
  tarjetaAutorizacion.value = ''
}

const ID_REDENCION_LEALTAD = 'redencion-lealtad'

// La redención de puntos no es un pago más (pagosAplicados): es un
// descuento sobre el subtotal, ya reflejado en totalNeto. Se agrega aquí
// solo como tarjeta visual, para que el cajero la vea junto al resto de lo
// aplicado; quitarla resetea puntosARedimir en vez de filtrar un pago real.
const pagosParaMostrar = computed<AppliedPayment[]>(() => {
  if (puntosARedimir.value <= 0) return pagosAplicados.value
  return [
    ...pagosAplicados.value,
    {
      id: ID_REDENCION_LEALTAD,
      method: 'Lealtad',
      amount: descuentoPuntos.value,
      timestamp: new Date(),
    },
  ]
})

const eliminarPago = (id: string) => {
  if (id === ID_REDENCION_LEALTAD) {
    puntosARedimir.value = 0
    return
  }
  pagosAplicados.value = pagosAplicados.value.filter((p) => p.id !== id)
}

/**
 * Ajusta los pagos en efectivo al monto realmente aplicado: lo que falta por
 * cubrir después de los pagos no efectivo. El efectivo entregado se conserva en
 * `recibido` para el ticket y el cambio. Si hay varias líneas de efectivo, la
 * última absorbe la diferencia. Descarta los pagos con monto <= 0.
 */
const normalizarPagos = (): AppliedPayment[] => {
  const noEfectivo = redondear2(
    pagosAplicados.value.filter((p) => !esEfectivo(p.method)).reduce((s, p) => s + p.amount, 0),
  )
  const necesario = Math.max(0, redondear2(totalNeto.value - noEfectivo))
  let ultimaEfectivo = -1
  pagosAplicados.value.forEach((p, i) => {
    if (esEfectivo(p.method)) ultimaEfectivo = i
  })
  let asignado = 0
  const pagos = pagosAplicados.value.map((p, i) => {
    if (!esEfectivo(p.method)) return { ...p }
    const restante = Math.max(0, redondear2(necesario - asignado))
    const amount = i === ultimaEfectivo ? restante : Math.min(redondear2(p.amount), restante)
    asignado = redondear2(asignado + amount)
    return { ...p, amount, recibido: redondear2(p.amount) }
  })
  return pagos.filter((p) => p.amount > TOLERANCIA_MONTO)
}

const finalizarPago = () => {
  emit(
    'pago-exitoso',
    normalizarPagos(),
    props.permitirLealtad && celularCliente.value.length === 10 ? celularCliente.value : null,
    props.permitirLealtad ? Math.min(puntosARedimir.value, maxPuntosRedimibles.value) : 0,
    props.permitirLealtad ? descuentoPuntos.value : 0,
  )
  emit('update:modelValue', false)
  pagosAplicados.value = []
  metodoSeleccionado.value = ''
  celularCliente.value = ''
  puntosARedimir.value = 0
  saldoDisponible.value = null
  valorPunto.value = null
}
</script>
<style scoped lang="scss">
.pay {
  width: 900px;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  &__total-label {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__total-value {
    font-size: 30px;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__close {
    color: var(--text-secondary);
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 260px;
    overflow-y: auto;

    @media (max-width: 760px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__col {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &--methods {
      border-right: 1px solid var(--border-soft);
    }

    &--keypad {
      padding: 18px 24px;
    }

    &--applied {
      border-left: 1px solid var(--border-soft);
      background: var(--bg-subtle);
      gap: 16px;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__client {
    display: flex;
    flex-direction: column;
  }

  &__points {
    font-size: 12px;
    color: var(--tone-info-fg);
    font-weight: 600;
  }

  &__applied {
    flex: 1;
  }

  &__summary {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;

    div {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      color: var(--text-secondary);
    }

    dt {
      font-weight: 500;
    }

    dd {
      margin: 0;
      font-weight: 800;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }
  }

  &__summary--bad dd {
    color: var(--tone-bad-fg) !important;
  }

  &__summary--ok dd {
    color: var(--tone-ok-fg) !important;
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);

    :deep(.q-btn) {
      min-height: 46px;
    }
  }

  &__confirm {
    font-weight: 800;
    padding: 0 22px;
  }
}

.card-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &__field {
    display: flex;
    flex-direction: column;

    &--full {
      grid-column: 1 / -1;
    }
  }
}
</style>
