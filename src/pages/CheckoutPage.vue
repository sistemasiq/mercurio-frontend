<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAccessControlStore } from '@/stores/accessControl'
import { checkout, cotizarCheckout, type CotizacionCheckoutResponse } from '@/api/onboardingClient'
import { Notify } from 'quasar'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import { metodosPagoApi } from '@/api/metodosPagoApi'
import type { MetodosPago } from '@/types/metodos_pago'
import type { AppliedPayment } from '@/types/payments'

const store = useAccessControlStore()
const router = useRouter()

const child = computed(() => store.checkoutChild)

const checkoutScanActive = ref(false)
const checkoutScanInput = ref('')
const checkoutScanError = ref('')
const checkoutScanRef = ref<HTMLInputElement | null>(null)
const tutorVerified = ref(false)

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

const mapearMetodoPago = (nombreMetodo: string): string => {
  if (!metodosPagoDisponibles.value || metodosPagoDisponibles.value.length === 0) {
    throw new Error('Los métodos de pago no se han cargado correctamente desde el servidor.')
  }

  const metodo = metodosPagoDisponibles.value.find(
    (m) => m.nombre.trim().toLowerCase() === nombreMetodo.trim().toLowerCase() && m.activo,
  )

  if (!metodo) {
    const disponibles = metodosPagoDisponibles.value
      .map((m) => `${m.nombre.trim()} (${m.activo ? 'activo' : 'inactivo'})`)
      .join(', ')
    throw new Error(
      `El método de pago "${nombreMetodo}" no está configurado o no está activo. Métodos disponibles: [${disponibles}]`,
    )
  }
  return metodo.id
}

function activateCheckoutScan() {
  checkoutScanActive.value = true
  checkoutScanError.value = ''
  checkoutScanInput.value = ''
  setTimeout(() => checkoutScanRef.value?.focus(), 100)
}

function onCheckoutScanEnter() {
  const scanned = checkoutScanInput.value.trim()
  if (!scanned) return

  if (scanned === child.value?.pulseraTutorRfid) {
    tutorVerified.value = true
    checkoutScanActive.value = false
    checkoutScanError.value = ''
    checkoutScanInput.value = ''
  } else {
    checkoutScanError.value = 'Pulsera incorrecta. Debe ser la pulsera del tutor registrado.'
    checkoutScanInput.value = ''
    // re-enfocar para que pueda intentar de nuevo sin tocar nada
    setTimeout(() => checkoutScanRef.value?.focus(), 100)
  }
}

const isLoading = ref(false)

const statusColor = computed(() => {
  switch (child.value?.status) {
    case 'activo':
      return 'positive'
    case 'por_expirar':
      return 'orange'
    case 'excedido':
      return 'negative'
    default:
      return 'grey'
  }
})

const tiempoRestanteLabel = computed(() => {
  if (!child.value) return '—'
  if (child.value.status === 'excedido') {
    return `${child.value.minutosRestantes} min`
  }
  return `0 min`
})

const tiempoRestanteColor = computed(() => {
  switch (child.value?.status) {
    case 'activo':
      return 'positive'
    case 'por_expirar':
      return 'orange-9'
    case 'excedido':
      return 'negative'
    default:
      return 'grey-7'
  }
})

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

  const result = await checkout(child.value.detalleId, child.value.pulseraTutorId, pagos)

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
  } catch (err: unknown) {
    console.error('[CheckoutPage] onPagoExtraExitoso:', err)

    const detail = (
      err as {
        response?: {
          status?: number
          data?: { detail?: { message?: string; horasExtra?: number; totalExtra?: number } }
        }
      }
    )?.response

    if (detail?.status === 409 && detail.data?.detail) {
      /*  
        El 409 ya trae el monto correcto en su cuerpo (horasExtra/totalExtra),
        así que el reintento no necesita una llamada GET adicional: se
        actualiza la cotización local con esos mismos datos y se reabre el
        modal con el monto ya corregido.
      */
      const { totalExtra, horasExtra, message } = detail.data.detail
      if (child.value && totalExtra !== undefined && horasExtra !== undefined) {
        cotizacion.value = {
          detalleId: child.value.detalleId,
          totalExtra,
          horasExtra,
          cotizadoEn: new Date().toISOString(),
        }
      }
      Notify.create({
        type: 'warning',
        message: message ?? 'El monto a cobrar cambió porque avanzó el tiempo.',
        caption: 'Se actualizó el monto, vuelve a intentar el cobro.',
        icon: 'schedule',
        timeout: 6000,
      })
      // El modal queda abierto (o se puede reabrir) con :total-to-pay ya
      // apuntando al nuevo cotizacion.totalExtra.
    } else {
      mostrarModalPagoExtra.value = false
      Notify.create({
        type: 'negative',
        message: 'No se pudo registrar el pago del cargo extra.',
        caption: err instanceof Error ? err.message : 'Error desconocido.',
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

<template>
  <q-page v-if="child" class="checkout-page q-pa-lg">
    <!-- Header -->
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Checkout de estancia</div>
        <div class="text-caption text-grey-6">Revisión final antes de procesar la salida.</div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Panel izquierdo: info del niño -->
      <div class="col-12 col-md-8">
        <q-card flat bordered class="checkout-card">
          <q-card-section>
            <!-- Nombre, edad, pulsera, estado -->
            <div class="row justify-between items-start q-mb-md">
              <div>
                <div class="text-h5 text-weight-bold">{{ child.nino }}</div>
                <div class="row q-gutter-md q-mt-md">
                  <q-chip
                    dense
                    color="grey-3"
                    text-color="grey-9"
                    icon="cake"
                    :label="`${child.edad} años`"
                    size="md"
                  />
                  <q-chip
                    dense
                    color="blue-1"
                    text-color="blue-9"
                    icon="badge"
                    :label="child.pulsera"
                    size="md"
                  />
                </div>
              </div>
              <div class="text-right">
                <div class="info-label q-mb-xs">ESTADO DE TIEMPO</div>
                <q-icon name="circle" size="28px" :color="statusColor" />
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Tutor -->
            <div class="row items-center q-mb-lg">
              <q-avatar color="orange-2" text-color="orange-9" size="38px" class="q-mr-md">
                <q-icon name="person" />
              </q-avatar>
              <div class="col">
                <div class="row q-col-gutter-lg">
                  <div>
                    <div class="info-label">TUTOR</div>
                    <div class="text-subtitle2 text-weight-bold">{{ child.tutor }}</div>
                    <div class="text-caption text-grey-6">Parentesco: {{ child.parentesco }}</div>
                  </div>
                  <div>
                    <div class="info-label">SEGUNDO TUTOR</div>
                    <div v-if="child.nombreSegundoTutor" class="text-subtitle2 text-weight-bold">
                      {{ child.nombreSegundoTutor }}
                    </div>
                    <div v-else class="text-subtitle2 text-weight-bold">No hay segundo tutor</div>
                  </div>
                  <div>
                    <div class="info-label">NÚMERO DE TELEFONO DEL TUTOR</div>
                    <div class="text-subtitle2 text-weight-bold">{{ child.telefono }}</div>
                  </div>
                </div>
              </div>
            </div>

            <q-separator class="q-mb-lg" />

            <!-- Tiempos -->
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-4">
                <q-card flat class="tiempo-card text-center">
                  <q-card-section>
                    <div class="info-label q-mb-sm">TIEMPO PREPAGADO</div>
                    <div class="text-h6 text-weight-bold text-grey-8">
                      {{ child.minutosPagados / 60 }} hr
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat class="tiempo-card text-center">
                  <q-card-section>
                    <div class="info-label q-mb-sm">TIEMPO TRANSCURRIDO</div>
                    <div class="text-h6 text-weight-bold" :class="`text-${statusColor}`">
                      {{ child.minutosTranscurridos }} min
                    </div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat class="tiempo-card text-center">
                  <q-card-section>
                    <div class="info-label q-mb-sm">TIEMPO EXCEDIDO</div>
                    <div class="text-h6 text-weight-bold" :class="`text-${tiempoRestanteColor}`">
                      {{ tiempoRestanteLabel }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Leyenda de estados -->
            <q-separator class="q-mb-md" />
            <div class="row justify-center q-gutter-md">
              <div class="info-label q-mr-sm self-center">REFERENCIA DE ESTADOS DEL SISTEMA</div>
              <div class="row items-center q-gutter-xs">
                <q-icon name="circle" color="positive" size="12px" />
                <span class="text-caption text-grey-7">Verde: Dentro de tiempo</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon name="circle" color="orange" size="12px" />
                <span class="text-caption text-grey-7">Naranja: Cerca del límite</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon name="circle" color="negative" size="12px" />
                <span class="text-caption text-grey-7">Rojo: Tiempo excedido</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Panel derecho: aviso + acciones -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="checkout-card q-mb-md">
          <q-card-section>
            <div v-if="cotizacion && cotizacion.totalExtra > 0" class="row items-start">
              <q-icon name="payments" color="negative" size="20px" class="q-mr-sm q-mt-xs" />
              <div class="col text-caption text-grey-8" style="line-height: 1.6">
                Se deben cobrar <strong>${{ cotizacion.totalExtra }}</strong> por
                {{ cotizacion.horasExtra }} hora(s) extra. Este monto puede cambiar si pasa más
                tiempo antes de confirmar la salida.
              </div>
            </div>
            <div v-else class="row items-start">
              <q-icon name="info" color="orange-9" size="20px" class="q-mr-sm q-mt-xs" />
              <div class="col text-caption text-grey-8" style="line-height: 1.6">
                Los detalles mostrados son informativos. El monto final se calculará al confirmar la
                salida considerando recargos por tiempo excedente.
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Verificación RFID del tutor -->
        <q-card flat bordered class="checkout-card q-mb-md">
          <q-card-section>
            <div class="info-label q-mb-sm">VERIFICACIÓN DE SALIDA</div>

            <!-- Ya verificado -->
            <div v-if="tutorVerified" class="row items-center q-gutter-sm">
              <q-icon name="check_circle" color="positive" size="22px" />
              <span class="text-body2 text-positive text-weight-medium"
                >Pulsera del tutor verificada</span
              >
            </div>

            <!-- Sin verificar -->
            <template v-else>
              <div class="text-caption text-grey-7 q-mb-sm">
                Escanea la pulsera del tutor para habilitar la salida.
              </div>

              <!-- Input invisible — captura el lector en segundo plano -->
              <input
                v-if="checkoutScanActive"
                :ref="
                  (el) => {
                    if (el) checkoutScanRef = el as HTMLInputElement
                  }
                "
                v-model="checkoutScanInput"
                class="hidden-scan-input"
                autocomplete="off"
                @keydown.enter.prevent="onCheckoutScanEnter"
              />

              <!-- Botón: cambia según estado de escaneo -->
              <q-btn
                v-if="!checkoutScanActive"
                unelevated
                color="blue-8"
                icon="nfc"
                label="Escanear pulsera del tutor"
                no-caps
                dense
                class="full-width"
                @click="activateCheckoutScan"
              />
              <div v-else class="row items-center justify-between">
                <q-chip
                  dense
                  color="blue-8"
                  text-color="white"
                  icon="sensors"
                  label="Esperando escaneo..."
                  size="sm"
                  class="scanning-pulse"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  size="xs"
                  color="grey-6"
                  @click="checkoutScanActive = false"
                />
              </div>

              <!-- Error de verificación -->
              <div v-if="checkoutScanError" class="row items-center q-mt-sm">
                <q-icon name="error_outline" color="negative" size="16px" class="q-mr-xs" />
                <span class="text-caption text-negative">{{ checkoutScanError }}</span>
              </div>
            </template>
          </q-card-section>
        </q-card>

        <q-btn
          unelevated
          color="primary"
          label="Confirmar salida"
          class="full-width q-mb-sm"
          size="md"
          no-caps
          :loading="isLoading"
          :disable="!tutorVerified || mostrarModalPagoExtra"
          @click="confirmarSalida"
        />
        <q-btn
          flat
          color="grey-8"
          label="Cancelar"
          class="full-width"
          size="md"
          no-caps
          :disable="isLoading || mostrarModalPagoExtra"
          @click="cancelar"
        />

        <div v-if="mostrarModalPagoExtra" class="text-caption text-grey-6 text-center q-mt-sm">
          El niño ya realizó checkout. Falta cobrar el cargo extra para cerrar la operación.
        </div>
      </div>
    </div>

    <PaymentModal
      v-model="mostrarModalPagoExtra"
      :total-to-pay="cotizacion?.totalExtra ?? 0"
      @pago-exitoso="onPagoExtraExitoso"
    />
  </q-page>
</template>

<style scoped>
.checkout-page {
  background: #f7f8fc;
  min-height: 100vh;
}

.checkout-card {
  border-radius: 12px;
}

.page-icon-wrap {
  background: #e8f0fe;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #9e9e9e;
  text-transform: uppercase;
}

.tiempo-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fafafa;
}

.hidden-scan-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.scanning-pulse {
  animation: pulse-opacity 1.2s ease-in-out infinite;
}
</style>
