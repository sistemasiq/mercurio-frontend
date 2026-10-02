<template>
  <q-page v-if="child" class="page-content checkout">
    <PageHeader
      :title="`Checkout · ${child.nino}`"
      :subtitle="`Pulsera ${child.pulsera} · ${child.tutor} (${child.parentesco}) · ${child.telefono}`"
      back-label="Control de Acceso"
      :back-to="{ name: 'estancias-control-acceso' }"
    />

    <div class="checkout__grid">
      <div class="checkout__main">
        <section class="time-card" :class="`time-card--${tono}`">
          <div class="time-card__stats">
            <div>
              <span class="time-card__label">Entrada</span>
              <span class="time-card__value">{{ horaEntrada }}</span>
            </div>
            <div>
              <span class="time-card__label">Tiempo contratado</span>
              <span class="time-card__value">{{ horasContratadas }}</span>
            </div>
            <div>
              <span class="time-card__label time-card__label--tone">{{ etiquetaTiempo }}</span>
              <span class="time-card__value time-card__value--tone">{{ valorTiempo }}</span>
            </div>
          </div>
          <div class="time-card__bar">
            <div class="time-card__fill" :style="{ width: `${child.progressPercent}%` }" />
          </div>
        </section>

        <section class="verify">
          <h2 class="verify__title">Verificación de salida</h2>
          <div class="verify__grid">
            <div class="verify__item">
              <span class="field-label">Tutor</span>
              <span class="verify__value">{{ child.tutor }} · {{ child.parentesco }}</span>
            </div>
            <div class="verify__item">
              <span class="field-label">Segundo tutor</span>
              <span class="verify__value">{{
                child.nombreSegundoTutor || 'Sin segundo tutor'
              }}</span>
            </div>
            <div class="verify__item">
              <span class="field-label">Edad</span>
              <span class="verify__value">{{ child.edad }} años</span>
            </div>
            <div class="verify__item">
              <span class="field-label">Teléfono</span>
              <span class="verify__value">{{ child.telefono }}</span>
            </div>
          </div>
          <button type="button" class="verify__photos" @click="showFotos = true">
            <q-icon name="photo_library" size="24px" />
            Comparar con la foto de llegada e INE del tutor
          </button>
        </section>
      </div>

      <aside class="charges">
        <h2 class="charges__title">Cargos pendientes</h2>
        <template v-if="cotizacion && cotizacion.totalExtra > 0">
          <div class="charges__line">
            <span>Tiempo excedente · {{ cotizacion.horasExtra }} h</span>
            <span>${{ cotizacion.totalExtra.toFixed(2) }}</span>
          </div>
          <div class="charges__total">
            <span>Por cobrar</span>
            <span class="charges__total-value">${{ cotizacion.totalExtra.toFixed(2) }}</span>
          </div>
          <p class="charges__hint">
            El monto puede cambiar si pasa más tiempo antes de confirmar la salida.
          </p>
        </template>
        <div v-else class="charges__note">
          <q-icon name="info" size="19px" />
          El monto final se calcula al confirmar la salida, considerando recargos por tiempo
          excedente.
        </div>
        <p v-if="mostrarModalPagoExtra" class="charges__hint">
          El niño ya realizó checkout. Falta cobrar el cargo extra para cerrar la operación.
        </p>

        <footer class="charges__actions">
          <q-btn
            outline
            label="Cancelar"
            :disable="isLoading || mostrarModalPagoExtra"
            @click="cancelar"
          />
          <q-btn
            unelevated
            color="primary"
            label="Confirmar salida"
            class="charges__confirm"
            :loading="isLoading"
            :disable="mostrarModalPagoExtra"
            @click="confirmarSalida"
          />
        </footer>
      </aside>
    </div>

    <FotosRegistroDialog
      v-model="showFotos"
      :registro-id="child.registroId"
      :titulo="child.nino"
      :subtitulo="`Registro ${horaEntrada} · ${child.tutor} (${child.parentesco})`"
    />

    <PaymentModal
      v-model="mostrarModalPagoExtra"
      titulo="Cobrar tiempo excedente"
      :subtitulo="child.nino"
      :total-to-pay="cotizacion?.totalExtra ?? 0"
      :metodos-pago="metodosPagoDisponibles"
      :permitir-lealtad="false"
      @pago-exitoso="onPagoExtraExitoso"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import FotosRegistroDialog from '@/components/control-acceso/FotosRegistroDialog.vue'
import { useRouter } from 'vue-router'
import { useAccessControlStore } from '@/stores/accessControl'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { checkout, cotizarCheckout, type CotizacionCheckoutResponse } from '@/api/onboardingClient'
import { Notify } from 'quasar'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import type { MetodosPago } from '@/types/metodos_pago'
import type { AppliedPayment } from '@/types/payments'
import type { ApiError } from '@/types/auth'
import { resolverMetodoPagoId } from '@/utils/metodosPago'
import { resolveErrorMessage } from '@/utils/errorHandler'

const store = useAccessControlStore()
const turno = useTurnoCajaStore()
const router = useRouter()

onMounted(() => {
  // Se valida al entrar, no hasta el final del checkout: si no hay turno
  // abierto no tiene sentido dejar revisar todo el checkout para enterarse
  // hasta el final. Redirige de inmediato, sin bloquear con un panel.
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
  }
})

const child = computed(() => store.checkoutChild)

const metodosPagoDisponibles = ref<MetodosPago[]>([])

/*
  Cotización vigente del cargo extra. Se pide una sola vez, al picar
  "Confirmar salida" (así se mantiene en exactamente 2 llamadas normales:
  el GET de cotización y el POST de checkout). El POST vuelve a recalcular
  con la hora real y rechaza (409) si lo cobrado ya no coincide con lo
  debido — y esa misma respuesta 409 ya trae el monto correcto, así que un
  reintento no necesita una tercera llamada.
*/
const cotizacion = ref<CotizacionCheckoutResponse | null>(null)
const mostrarModalPagoExtra = ref(false)

onMounted(() => {
  void cargarMetodosPago()
})

const cargarMetodosPago = async () => {
  try {
    metodosPagoDisponibles.value = await metodosPagoApi.listar()
  } catch (err) {
    console.error('[CheckoutPage] cargarMetodosPago:', err)
    Notify.create({
      type: 'warning',
      message: 'No se pudieron cargar los métodos de pago.',
      caption: 'El cobro de cargos extra no estará disponible hasta recargar la página.',
      position: 'top-right',
      timeout: 6000,
    })
  }
}

const mapearMetodoPago = (categoriaSeleccionada: string): string =>
  resolverMetodoPagoId(categoriaSeleccionada, metodosPagoDisponibles.value)

const isLoading = ref(false)

const tono = computed(() =>
  child.value?.status === 'excedido'
    ? 'bad'
    : child.value?.status === 'por_expirar'
      ? 'warn'
      : 'ok',
)

const etiquetaTiempo = computed(() =>
  child.value?.status === 'excedido' ? 'Excedente' : 'Tiempo restante',
)

const valorTiempo = computed(() => {
  if (!child.value) return '—'
  const m = Math.abs(child.value.minutosRestantes)
  return child.value.status === 'excedido' ? `+${m} min` : `${m} min`
})

const horasContratadas = computed(() => {
  if (!child.value) return '—'
  const h = child.value.minutosPagados / 60
  return Number.isInteger(h) ? `${h} h` : `${child.value.minutosPagados} min`
})

const horaEntrada = computed(() => {
  if (!child.value) return '—'
  const d = new Date(Date.now() - child.value.minutosTranscurridos * 60000)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
})

const showFotos = ref(false)

async function confirmarSalida() {
  if (!child.value) return

  isLoading.value = true
  try {
    // Única llamada GET del flujo: cotiza justo antes de cobrar, para que el
    // monto que ve el cajero esté lo más fresco posible.
    const cotizacionActual = await cotizarCheckout(child.value.detalleId)
    cotizacion.value = cotizacionActual

    if (cotizacionActual.totalExtra > 0) {
      mostrarModalPagoExtra.value = true
      return
    }

    await ejecutarCheckout([])
  } catch (err) {
    console.error(err)
    Notify.create({
      type: 'negative',
      message: 'Error al realizar el checkout.',
      icon: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

async function ejecutarCheckout(pagos: { metodoPagoId: string; monto: number }[]) {
  if (!child.value) return

  const result = await checkout(child.value.detalleId, pagos)

  Notify.create({
    type: 'positive',
    message:
      result.totalExtra > 0
        ? `Se cobró $${result.totalExtra} y se completó el checkout.`
        : 'Checkout realizado correctamente.',
    icon: 'check_circle',
  })

  mostrarModalPagoExtra.value = false
  cotizacion.value = null
  store.clearCheckoutChild()
  router.back()
}

async function onPagoExtraExitoso(pagos: AppliedPayment[]) {
  isLoading.value = true
  try {
    const pagosMapeados = pagos.map((p) => ({
      metodoPagoId: mapearMetodoPago(p.method),
      monto: p.amount,
    }))

    await ejecutarCheckout(pagosMapeados)
  } catch (err) {
    console.error('[CheckoutPage] onPagoExtraExitoso:', err)

    // apiClient siempre rechaza con un ApiError plano (nunca con
    // err.response): el 409 trae el monto recalculado en `details`.
    const apiErr = err as ApiError & { details?: { totalExtra?: number; horasExtra?: number } }

    if (
      apiErr?.statusCode === 409 &&
      child.value &&
      typeof apiErr.details?.totalExtra === 'number' &&
      typeof apiErr.details?.horasExtra === 'number'
    ) {
      /*
        El 409 ya trae el monto correcto (horasExtra/totalExtra), así que el
        reintento no necesita una llamada GET adicional: se actualiza la
        cotización local con esos mismos datos y el modal queda abierto con
        :total-to-pay ya apuntando al nuevo cotizacion.totalExtra.
      */
      cotizacion.value = {
        detalleId: child.value.detalleId,
        totalExtra: apiErr.details.totalExtra,
        horasExtra: apiErr.details.horasExtra,
        cotizadoEn: new Date().toISOString(),
      }
      Notify.create({
        type: 'warning',
        message: `El monto cambió a $${apiErr.details.totalExtra.toFixed(2)}. Vuelve a cobrar.`,
        caption: 'Se actualizó el monto, vuelve a intentar el cobro.',
        icon: 'schedule',
        timeout: 6000,
      })
    } else {
      mostrarModalPagoExtra.value = false
      Notify.create({
        type: 'negative',
        message: 'No se pudo registrar el pago del cargo extra.',
        caption: apiErr?.statusCode
          ? resolveErrorMessage(apiErr)
          : err instanceof Error
            ? err.message
            : 'Error desconocido.',
        position: 'top-right',
        timeout: 4000,
      })
    }
  } finally {
    isLoading.value = false
  }
}

function cancelar() {
  store.clearCheckoutChild()
  router.back()
}
</script>

<style scoped lang="scss">
.checkout {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 466px;
    gap: 18px;
    align-items: stretch;

    @media (max-width: 1100px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
}

.time-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  --fg: var(--tone-ok-fg);
  --bar: var(--tone-ok-dot);

  &--warn {
    border-color: #fbe2b0;
    --fg: var(--tone-warn-fg);
    --bar: var(--tone-warn-dot);
  }

  &--bad {
    border-color: #f5c2c2;
    --fg: var(--tone-bad-fg);
    --bar: var(--tone-bad-dot);
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);

    &--tone {
      color: var(--fg);
    }
  }

  &__value {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;

    &--tone {
      color: var(--fg);
    }
  }

  &__bar {
    height: 8px;
    border-radius: 4px;
    background: #eef1f5;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
    background: var(--bar);
  }
}

.verify {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
  }

  &__item {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__photos {
    height: 120px;
    border: 1px dashed #cbd2de;
    border-radius: 12px;
    background: repeating-linear-gradient(135deg, #f5f7fb 0 8px, #eef1f6 8px 16px);
    color: var(--text-secondary);
    font: inherit;
    font-size: 13.5px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;

    &:hover {
      border-color: var(--q-primary);
      color: var(--q-primary);
    }
  }
}

.charges {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__line {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--text-primary);

    span:last-child {
      font-weight: 700;
    }
  }

  &__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--border-soft);
    font-size: 15px;
    font-weight: 700;
  }

  &__total-value {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
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
  }

  &__hint {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__actions {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    gap: 10px;

    :deep(.q-btn) {
      min-height: 52px;
    }
  }

  &__confirm {
    flex: 1;
    font-size: 15px;
    font-weight: 800;
  }
}
</style>
