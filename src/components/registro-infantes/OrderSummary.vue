<template>
  <div class="summary">
    <div class="summary__body">
      <h2 class="summary__title">Resumen</h2>

      <p v-if="store.savedChildren.length === 0" class="summary__empty">
        Guarda un niño para ver el resumen.
      </p>

      <template v-else>
        <div v-for="child in store.savedChildren" :key="child.id" class="summary__line">
          <span>{{ child.name.split(' ')[0] }} · {{ store.tutor.estimatedTime }}</span>
          <span>{{ formatCurrency(store.pricePerChild) }}</span>
        </div>
        <div class="summary__total">
          <span>Total</span>
          <span class="summary__total-value">{{ formatCurrency(store.total) }}</span>
        </div>
      </template>

      <div v-if="store.step === 'rfid'" class="summary__note">
        <q-icon name="sensors" size="19px" />
        Pago registrado. Acerca una pulsera al lector por cada niño para finalizar.
      </div>
      <div v-else-if="store.step === 'form' && store.savedChildren.length" class="summary__note">
        <q-icon name="sensors" size="19px" />
        Siguiente paso: acercar {{ store.savedChildren.length }}
        {{ store.savedChildren.length === 1 ? 'pulsera' : 'pulseras' }} al lector.
      </div>

      <ul
        v-if="store.step === 'form' && store.motivosPendientes.length > 0"
        class="summary__pending"
      >
        <li v-for="motivo in store.motivosPendientes" :key="motivo">{{ motivo }}</li>
      </ul>

      <div
        v-if="store.step === 'rfid' && store.submitError"
        class="summary__note summary__note--bad"
      >
        <q-icon name="error" size="19px" />{{ store.submitError }}
      </div>
    </div>

    <footer class="summary__foot">
      <template v-if="store.step === 'form'">
        <q-btn
          unelevated
          color="primary"
          class="summary__cta"
          :label="store.isEventoMode ? 'Continuar a pulseras' : 'Cobrar y asignar pulseras'"
          icon-right="arrow_forward"
          :disable="!store.canProceedToRFID"
          @click="store.isEventoMode ? store.proceedToRFID() : abrirModalPago()"
        />
        <PaymentModal
          v-if="!store.isEventoMode"
          v-model="mostrarModalPago"
          titulo="Cobrar registro"
          :subtitulo="store.tutor.fullName"
          :total-to-pay="store.total"
          :celular-prellenado="store.tutor.phone"
          :metodos-pago="metodosPagoDisponibles"
          @pago-exitoso="onPagoExitoso"
        />
      </template>
      <template v-if="store.step === 'rfid'">
        <q-btn
          unelevated
          color="primary"
          class="summary__cta"
          label="Finalizar registro"
          icon-right="arrow_forward"
          :loading="store.isSubmitting"
          :disable="!store.allChildrenHaveBracelet"
          @click="store.completeRegistration()"
        />
        <span v-if="!store.allChildrenHaveBracelet" class="summary__hint">
          Asigna una pulsera a cada niño registrado
        </span>
      </template>
    </footer>
  </div>
</template>

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

const onPagoExitoso = (
  pagos: AppliedPayment[],
  _celularCliente: string | null,
  puntosARedimir: number,
) => {
  try {
    const pagosMapeados: OnboardingPago[] = pagos.map((p) => ({
      metodoPagoId: mapearMetodoPago(p.method),
      monto: p.amount,
    }))
    store.proceedToRFID(pagosMapeados, puntosARedimir)
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

<style scoped lang="scss">
.summary {
  min-height: 100%;
  display: flex;
  flex-direction: column;

  &__body {
    flex: 1;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__empty {
    margin: 0;
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  &__line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--text-body);

    span:last-child {
      font-weight: 700;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }
  }

  &__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-top: 14px;
    margin-top: 4px;
    border-top: 1px solid var(--border-soft);
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__total-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__note {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }

  &__pending {
    margin: 0;
    padding-left: 18px;
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__foot {
    position: sticky;
    bottom: 0;
    padding: 16px 20px 20px;
    border-top: 1px solid var(--border-color);
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__cta {
    width: 100%;
    min-height: 52px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
  }

  &__hint {
    text-align: center;
    font-size: 12.5px;
    color: var(--text-secondary);
  }
}
</style>
