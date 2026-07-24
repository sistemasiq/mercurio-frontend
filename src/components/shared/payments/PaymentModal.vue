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
        border-radius: 16px;
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
          background: #ffffff;
          overflow: hidden;
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

        <MethodSelector v-model="metodoSeleccionado" />

        <div
          style="
            background: #ffffff;
            border: 1px solid #e1e3e4;
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

          <PaymentKeypad class="full-width" style="flex-grow: 1" @add-payment="iniciarAbono" />
        </div>
      </div>

      <!-- PANEL DERECHO -->
      <div
        style="
          flex: 2;
          background: #f8f9fa;
          border-left: 1px solid #e1e3e4;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        "
      >
        <div style="padding: 16px 20px; border-bottom: 1px solid #e1e3e4; background: #ffffff">
          <div class="row justify-between text-grey-8 text-caption q-mb-xs">
            <span>Subtotal</span>
            <span>${{ props.totalToPay.toFixed(2) }}</span>
          </div>
          <div class="row justify-between text-h6 text-weight-bold q-mt-xs">
            <span>Total a Pagar</span>
            <span>${{ props.totalToPay.toFixed(2) }}</span>
          </div>
        </div>

        <div style="flex-grow: 1; padding: 12px; overflow-y: auto; min-height: 0">
          <AppliedPaymentsList :pagos="pagosAplicados" @remove-payment="eliminarPago" />
        </div>

        <div style="padding: 16px; background: #ffffff; border-top: 1px solid #e1e3e4">
          <!-- ESTADO 1: Hay saldo pendiente -->
          <div
            v-if="saldoPendiente > 0"
            style="
              background: #e6f4ea;
              border: 1px solid #4ae183;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 12px;
            "
            class="row justify-between items-center"
          >
            <div class="row items-center q-gutter-x-sm text-green-9">
              <q-icon name="pending" size="sm" />
              <span class="text-subtitle1 text-weight-bold">Saldo Pendiente</span>
            </div>
            <span class="text-h5 text-weight-bold text-green-9"
              >${{ saldoPendiente.toFixed(2) }}</span
            >
          </div>

          <!-- ESTADO 2: Transacción Completa / Hay Cambio -->
          <div
            v-else
            style="
              background: #e6f0fa;
              border: 1px solid #0059bb;
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
            class="full-width text-subtitle1 text-weight-bold shadow-2"
            style="border-radius: 10px; height: 50px"
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

        <q-select
          v-model="tarjetaTipo"
          :options="['DEBITO', 'CREDITO']"
          label="Tipo de Tarjeta"
          outlined
          dense
          class="q-mb-md"
        />
        <q-input
          v-model="tarjetaAutorizacion"
          label="Folio de Autorización"
          outlined
          dense
          autofocus
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary bg-grey-1 border-top">
        <q-btn v-close-popup flat label="Cancelar" color="grey-7" @click="limpiarModalTarjeta" />
        <q-btn
          v-close-popup
          color="primary"
          label="Agregar Pago"
          unelevated
          :disable="!tarjetaTipo || !tarjetaAutorizacion"
          @click="confirmarPagoTarjeta"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { PaymentProps, AppliedPayment } from '@/types/payments'

import MethodSelector from './MethodSelector.vue'
import PaymentKeypad from './PaymentKeypad.vue'
import AppliedPaymentsList from './AppliedPaymentsList.vue'

const props = defineProps<PaymentProps & { modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'pago-exitoso', pagos: AppliedPayment[]): void
}>()

const $q = useQuasar()

const metodoSeleccionado = ref('')
const pagosAplicados = ref<AppliedPayment[]>([])

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && !metodoSeleccionado.value) {
      metodoSeleccionado.value = 'Efectivo'
    }
  },
  { immediate: true },
)

const esEfectivo = (nombre: string) => nombre.trim().toLowerCase().includes('efectivo')
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
  const restante = props.totalToPay - totalPagado.value
  return restante > 0 ? restante : 0
})

const cambioADevolver = computed(() => {
  const excedente = totalPagado.value - props.totalToPay
  return excedente > 0 ? excedente : 0
})

const iniciarAbono = (monto: number) => {
  if (monto <= 0) return

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

const confirmarPagoTarjeta = () => {
  agregarPago(
    tarjetaMontoTemporal.value,
    tarjetaTipo.value as 'DEBITO' | 'CREDITO',
    tarjetaAutorizacion.value,
  )
  limpiarModalTarjeta()
}

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
    id: Date.now().toString(),
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

const eliminarPago = (id: string) => {
  pagosAplicados.value = pagosAplicados.value.filter((p) => p.id !== id)
}

const finalizarPago = () => {
  emit(
    'pago-exitoso',
    pagosAplicados.value.map((p) => ({ ...p })),
  )
  emit('update:modelValue', false)
  pagosAplicados.value = []
}
</script>
