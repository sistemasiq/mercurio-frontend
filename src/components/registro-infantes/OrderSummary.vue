<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRegistrationStore } from '@/stores/registration'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import { CATEGORIAS_METODO_PAGO, type MetodosPago } from '@/types/metodos_pago'
import type { AppliedPayment } from '@/types/payments'
import type { OnboardingPago } from '@/api/onboardingClient'

const store = useRegistrationStore()
const $q = useQuasar()

const mostrarModalPago = ref(false)
const metodosPagoDisponibles = ref<MetodosPago[]>([])

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

const cargarMetodosPago = async () => {
  try {
    metodosPagoDisponibles.value = await metodosPagoApi.listar()
  } catch (err) {
    console.error('[OrderSummary] cargarMetodosPago:', err)
    $q.notify({
      type: 'warning',
      message: 'No se pudieron cargar los métodos de pago.',
      caption: 'El cobro no estará disponible hasta recargar la página.',
      position: 'top-right',
      timeout: 6000,
    })
  }
}

onMounted(() => {
  void cargarMetodosPago()
})

const abrirModalPago = () => {
  mostrarModalPago.value = true
}

const mapearMetodoPago = (categoriaSeleccionada: string): string => {
  if (!metodosPagoDisponibles.value || metodosPagoDisponibles.value.length === 0) {
    throw new Error('Los métodos de pago no se han cargado correctamente desde el servidor.')
  }

  const categoria = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoriaSeleccionada)
  const metodo = metodosPagoDisponibles.value.find((m) => m.activo && m.tipo === categoria?.tipo)

  if (!metodo) {
    throw new Error(
      `No hay un método de pago activo de tipo "${categoriaSeleccionada}" configurado para esta sucursal.`,
    )
  }
  return metodo.id
}

const onPagoExitoso = (pagos: AppliedPayment[]) => {
  try {
    const pagosMapeados: OnboardingPago[] = pagos.map((p) => ({
      metodoPagoId: mapearMetodoPago(p.method),
      monto: p.amount,
    }))
    store.proceedToRFID(pagosMapeados)
  } catch (err) {
    console.error('[OrderSummary] onPagoExitoso:', err)
    $q.notify({
      type: 'negative',
      message: 'No se pudo registrar el pago.',
      caption: err instanceof Error ? err.message : 'Error desconocido.',
      position: 'top-right',
      timeout: 4000,
    })
  }
}
</script>

<template>
  <q-card flat bordered class="summary-card">
    <q-card-section>
      <div class="text-subtitle1 text-weight-bold q-mb-md">Resumen</div>

      <div
        v-if="store.savedChildren.length === 0"
        class="text-caption text-grey-6 text-center q-py-md"
      >
        Guarda un niño para ver el resumen
      </div>

      <template v-else>
        <div
          v-for="child in store.savedChildren"
          :key="child.id"
          class="row justify-between items-center q-mb-xs"
        >
          <span class="text-body2 text-grey-8">
            1× ({{ child.name }}) ({{ store.tutor.estimatedTime }})
          </span>
          <span class="text-body2">{{ formatCurrency(store.pricePerChild) }}</span>
        </div>

        <q-separator class="q-my-sm" />

        <div class="row justify-between items-center q-mb-md">
          <span class="text-subtitle2 text-weight-bold">Total a Pagar</span>
          <span class="text-h5 text-primary text-weight-bold">{{
            formatCurrency(store.total)
          }}</span>
        </div>
      </template>

      <template v-if="store.step === 'form'">
        <q-btn
          unelevated
          color="primary"
          class="full-width q-mb-xs"
          :label="store.isEventoMode ? 'Continuar a pulseras' : 'Completar pago'"
          :icon="store.isEventoMode ? 'nfc' : 'payment'"
          :disable="!store.canProceedToRFID"
          @click="store.isEventoMode ? store.proceedToRFID() : abrirModalPago()"
        />

        <PaymentModal
          v-if="!store.isEventoMode"
          v-model="mostrarModalPago"
          :total-to-pay="store.total"
          :metodos-pago="metodosPagoDisponibles"
          @pago-exitoso="onPagoExitoso"
        />
        <ul
          v-if="store.motivosPendientes.length > 0"
          class="text-caption text-grey-8 q-mt-xs q-mb-none q-pl-md"
        >
          <li v-for="motivo in store.motivosPendientes" :key="motivo">{{ motivo }}</li>
        </ul>
      </template>

      <template v-if="store.step === 'rfid'">
        <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md" style="font-size: 12px">
          <template #avatar>
            <q-icon name="nfc" color="primary" />
          </template>
          Pago registrado. Asigna las pulseras a cada niño para finalizar.
        </q-banner>

        <q-btn
          unelevated
          color="positive"
          class="full-width"
          label="Completar registro e Imprimir Comprobante"
          icon="print"
          :loading="store.isSubmitting"
          :disable="!store.allChildrenHaveBracelet"
          @click="store.completeRegistration()"
        />
        <div
          v-if="!store.allChildrenHaveBracelet"
          class="text-caption text-grey-6 text-center q-mt-xs"
        >
          Asigna una pulsera a cada niño registrado
        </div>
        <q-banner
          v-if="store.submitError"
          dense
          rounded
          class="bg-red-1 text-red-9 q-mt-sm"
          style="font-size: 12px"
        >
          <template #avatar><q-icon name="error_outline" color="negative" /></template>
          {{ store.submitError }}
        </q-banner>
      </template>

      <template v-if="store.step === 'complete'">
        <q-banner dense rounded class="bg-green-1 text-green-9" style="font-size: 12px">
          <template #avatar>
            <q-icon name="check_circle" color="positive" />
          </template>
          Registro completado correctamente.
        </q-banner>
      </template>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.summary-card {
  border-radius: 12px;
  position: sticky;
  top: 80px;
}
</style>
