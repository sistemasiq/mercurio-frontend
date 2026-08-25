<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card
      style="
        width: 900px;
        max-width: 95vw;
        max-height: 85vh;
        display: flex;
        flex-direction: row;
        border-radius: 12px;
        overflow: hidden;
      "
    >
      <!-- PANEL IZQUIERDO -->
      <div
        style="
          flex: 3;
          display: flex;
          flex-direction: column;
          padding: 16px 20px;
          background: var(--bg-card);
          overflow-y: auto;
          min-height: 0;
        "
      >
        <div class="row items-center justify-between q-mb-sm">
          <div class="row items-center q-gutter-sm">
            <q-btn
              icon="arrow_back"
              flat
              round
              dense
              class="bg-grey-2"
              @click="$emit('update:modelValue', false)"
            />
            <span class="text-h6 text-weight-bold">Pago Multimodal</span>
          </div>
        </div>

        <MethodSelector v-model="metodoSeleccionado" :metodos-disponibles="props.metodosPago" />

        <div
          style="
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          "
        >
          <div class="row justify-between items-center q-mb-sm">
            <span class="text-subtitle1 text-weight-bold">Ingresar Monto</span>
            <span class="text-grey-7 text-caption">Método: {{ metodoSeleccionado }}</span>
          </div>

          <PaymentKeypad
            class="full-width"
            style="flex-grow: 1"
            :action-label="metodoSeleccionado === 'Lealtad' ? 'Aplicar Puntos' : 'Aplicar Pago'"
            @add-payment="iniciarAbono"
          />
        </div>
      </div>

      <!-- PANEL DERECHO -->
      <div
        style="
          flex: 2;
          background: var(--bg-main);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        "
      >
        <div
          style="
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-card);
          "
        >
          <div class="field-label">Celular del cliente (opcional)</div>
          <q-input
            ref="celularInputRef"
            v-model="celularCliente"
            placeholder="10 dígitos"
            outlined
            dense
            mask="##########"
            class="q-mb-sm"
            :readonly="!!props.celularPrellenado"
            :rules="[(val: string) => !val || val.length === 10 || 'Debe tener 10 dígitos']"
            :hint="
              props.celularPrellenado
                ? 'Tel. del tutor, usado para puntos de lealtad'
                : 'Para acumular puntos de lealtad'
            "
          />

          <div
            v-if="saldoDisponible !== null && saldoDisponible > 0"
            class="row justify-between text-caption q-mb-sm"
            style="color: var(--text-secondary)"
          >
            <span>Puntos disponibles</span>
            <span>{{ saldoDisponible }} pts · ${{ valorPunto?.toFixed(2) }} c/u</span>
          </div>

          <div class="row justify-between text-grey-8 text-caption q-mb-xs">
            <span>Subtotal</span>
            <span>${{ props.totalToPay.toFixed(2) }}</span>
          </div>
          <div
            v-if="descuentoPuntos > 0"
            class="row justify-between text-positive text-caption q-mb-xs"
          >
            <span>Descuento por puntos</span>
            <span>-${{ descuentoPuntos.toFixed(2) }}</span>
          </div>
          <div class="row justify-between text-h6 text-weight-bold q-mt-xs">
            <span>Total a Pagar</span>
            <span>${{ totalNeto.toFixed(2) }}</span>
          </div>
        </div>

        <div style="flex-grow: 1; padding: 12px; overflow-y: auto; min-height: 0">
          <AppliedPaymentsList :pagos="pagosParaMostrar" @remove-payment="eliminarPago" />
        </div>

        <div
          style="
            padding: 16px;
            background: var(--bg-card);
            border-top: 1px solid var(--border-color);
          "
        >
          <!-- ESTADO 1: Hay saldo pendiente -->
          <div
            v-if="saldoPendiente > 0"
            style="
              background: rgba(63, 168, 52, 0.1);
              border: 1px solid #3fa834;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 12px;
            "
            class="row justify-between items-center"
          >
            <div class="row items-center q-gutter-x-sm text-positive">
              <q-icon name="pending" size="sm" />
              <span class="text-subtitle1 text-weight-bold">Saldo Pendiente</span>
            </div>
            <span class="text-h5 text-weight-bold text-positive"
              >${{ saldoPendiente.toFixed(2) }}</span
            >
          </div>

          <!-- ESTADO 2: Transacción Completa / Hay Cambio -->
          <div
            v-else
            style="
              background: rgba(2, 95, 224, 0.08);
              border: 1px solid #025fe0;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 12px;
            "
            class="row justify-between items-center"
          >
            <div class="row items-center q-gutter-x-sm text-primary">
              <q-icon name="monetization_on" size="sm" />
              <span class="text-subtitle1 text-weight-bold">{{
                cambioADevolver > 0 ? 'Cambio a Devolver' : 'Pagado Completamente'
              }}</span>
            </div>
            <span class="text-h5 text-weight-bold text-primary"
              >${{ cambioADevolver.toFixed(2) }}</span
            >
          </div>

          <q-btn
            class="full-width text-subtitle1 shadow-2"
            style="border-radius: 8px; font-weight: 600; height: 50px"
            :color="saldoPendiente <= 0 ? 'primary' : 'grey-5'"
            :icon="saldoPendiente <= 0 ? 'receipt_long' : 'lock'"
            :label="saldoPendiente <= 0 ? 'Finalizar Transacción' : 'Falta Pago'"
            unelevated
            :disable="saldoPendiente > 0"
            @click="finalizarPago"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>

  <!-- MINI MODAL PARA DATOS DE TARJETA (Sin Cambios) -->
  <q-dialog v-model="mostrarModalTarjeta" persistent>
    <q-card style="min-width: 350px; border-radius: 12px">
      <q-card-section class="bg-primary text-white row items-center q-pb-sm">
        <div class="text-subtitle1 text-weight-bold">Detalles de Tarjeta</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense @click="limpiarModalTarjeta" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="text-center q-mb-md">
          Monto a cobrar: <br />
          <span class="text-h5 text-weight-bold">${{ tarjetaMontoTemporal.toFixed(2) }}</span>
        </div>

        <div class="field-label">Tipo de tarjeta</div>
        <q-select
          v-model="tarjetaTipo"
          :options="['DEBITO', 'CREDITO']"
          outlined
          dense
          class="q-mb-md"
        />
        <div class="field-label">Folio de autorización</div>
        <q-input v-model="tarjetaAutorizacion" outlined dense autofocus />
      </q-card-section>

      <q-card-actions align="right" class="text-primary bg-grey-1 border-top">
        <q-btn
          v-close-popup
          flat
          no-caps
          label="Cancelar"
          color="grey-7"
          @click="limpiarModalTarjeta"
        />
        <q-btn
          v-close-popup
          unelevated
          no-caps
          color="primary"
          label="Agregar Pago"
          style="border-radius: 8px; font-weight: 600"
          :disable="!tarjetaTipo || !tarjetaAutorizacion"
          @click="confirmarPagoTarjeta"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar, type QInput } from 'quasar'
import type { PaymentProps, AppliedPayment } from '@/types/payments'
import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'

import MethodSelector from './MethodSelector.vue'
import PaymentKeypad from './PaymentKeypad.vue'
import AppliedPaymentsList from './AppliedPaymentsList.vue'

const props = defineProps<PaymentProps & { modelValue: boolean; metodosPago: MetodosPago[] }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
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

// Primera categoría con al menos un método activo de ese tipo en el
// catálogo real de la sucursal -- no asumir que "Efectivo" siempre existe.
const primeraCategoriaDisponible = computed(
  () =>
    CATEGORIAS_METODO_PAGO.find((cat) =>
      props.metodosPago.some((m) => m.activo && m.tipo === cat.tipo),
    )?.valor ?? '',
)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && !metodoSeleccionado.value) {
      metodoSeleccionado.value = primeraCategoriaDisponible.value
    }
    if (visible && props.celularPrellenado) {
      celularCliente.value = props.celularPrellenado
    }
    if (!visible) {
      // El componente queda montado en todos sus consumidores (ninguno usa v-if),
      // así que al cerrar sin finalizar hay que descartar los pagos capturados.
      // Si no, reaparecen en el siguiente cobro y se aplican como pagos reales
      // por dinero que nunca se recibió. finalizarPago() ya emitió una copia
      // antes de cerrar, así que limpiar aquí no le quita nada.
      pagosAplicados.value = []
      celularCliente.value = ''
      saldoDisponible.value = null
      valorPunto.value = null
      puntosARedimir.value = 0
    }
  },
  { immediate: true },
)

watch(celularCliente, async (val) => {
  if (val.length !== 10 || !authStore.currentBranchId) {
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
  return puntos * valorPunto.value
})

const totalNeto = computed(() => props.totalToPay - descuentoPuntos.value)

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

const mostrarModalTarjeta = ref(false)
const tarjetaMontoTemporal = ref(0)
const tarjetaTipo = ref<'DEBITO' | 'CREDITO'>('CREDITO')
const tarjetaAutorizacion = ref('')

const totalPagado = computed(() => {
  return pagosAplicados.value.reduce((suma, pago) => suma + pago.amount, 0)
})

const saldoPendiente = computed(() => {
  const restante = totalNeto.value - totalPagado.value
  return restante > 0 ? restante : 0
})

const cambioADevolver = computed(() => {
  const excedente = totalPagado.value - totalNeto.value
  return excedente > 0 ? excedente : 0
})

const iniciarAbono = (monto: number) => {
  if (monto <= 0 || !metodoSeleccionado.value) return

  if (esLealtad(metodoSeleccionado.value)) {
    aplicarRedencionLealtad(monto)
    return
  }

  if (!esEfectivo(metodoSeleccionado.value) && monto > saldoPendiente.value) {
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
      existente.amount += monto
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

const finalizarPago = () => {
  emit(
    'pago-exitoso',
    pagosAplicados.value.map((p) => ({ ...p })),
    celularCliente.value.length === 10 ? celularCliente.value : null,
    Math.min(puntosARedimir.value, maxPuntosRedimibles.value),
    descuentoPuntos.value,
  )
  emit('update:modelValue', false)
  pagosAplicados.value = []
  celularCliente.value = ''
  puntosARedimir.value = 0
  saldoDisponible.value = null
  valorPunto.value = null
}
</script>
