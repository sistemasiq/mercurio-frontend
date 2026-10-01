<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'
import { printTicketElement } from '@/utils/ticketPrinting'
import TicketReceipt from '@/components/shared/TicketReceipt.vue'
const props = withDefaults(
  defineProps<{
    tipoOrigen?: 'comanda' | 'estancia' | 'reservacion'
    referenciaId?: string
    comandaId?: string
    posMode?: boolean
    autoPrint?: boolean
  }>(),
  { tipoOrigen: 'comanda', referenciaId: '', comandaId: '', posMode: false, autoPrint: false },
)
const emit = defineEmits(['close'])

const $q = useQuasar()
// El comprobante se imprime mediante el diálogo del navegador.

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)
const isPrinting = ref(false)
const ticketRef = ref<InstanceType<typeof TicketReceipt> | null>(null)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

const onBackdropClick = () => {
  if (!props.posMode) emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  try {
    orden.value = await obtenerDetalleOrden(props.tipoOrigen, props.referenciaId || props.comandaId)
  } finally {
    isLoading.value = false
  }
  if (props.autoPrint && orden.value) {
    // esperar a que el DOM del ticket (v-else-if="orden") se monte con isLoading=false
    await nextTick()
    await nextTick()
    ejecutarImpresion()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

async function ejecutarImpresion() {
  if (!orden.value || isPrinting.value) return
  isPrinting.value = true
  try {
    await printTicketElement(ticketRef.value?.$el as HTMLElement | null)
  } catch (e: unknown) {
    $q.notify({
      type: 'negative',
      message: (e as Error).message || 'No se pudo preparar el ticket.',
    })
  } finally {
    isPrinting.value = false
  }
}
</script>

<template>
  <div :class="posMode ? 'ticket-pos-root' : 'modal-backdrop-blur'" @click="onBackdropClick">
    <div class="order-detail-card" @click.stop>
      <!-- Header de la ventana (Oculto al imprimir) -->
      <header class="pos-header print-hide">
        <span v-if="orden" class="pos-header__title">Pago Registrado</span>
        <q-btn icon="close" round unelevated class="close-styled-btn" @click="emit('close')" />
      </header>

      <div class="detail-scroll-area">
        <div class="detail-content">
          <div v-if="isLoading" class="loading-state print-hide">
            <q-spinner size="32px" color="primary" />
            <p>Cargando detalle...</p>
          </div>

          <!-- TICKET TÉRMICO — ancho dinámico 58/80mm unificado con PDF -->
          <TicketReceipt v-else-if="orden" ref="ticketRef" :orden="orden" :ancho-mm="80" />

          <!-- Botones de Acción (Ocultos al imprimir) -->
          <div v-if="orden" class="pos-actions print-hide">
            <button
              type="button"
              class="btn-pos-print"
              :disabled="isPrinting"
              @click="ejecutarImpresion()"
            >
              <q-icon name="print" size="sm" class="q-mr-xs" />
              {{ isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket' }}
            </button>
            <button type="button" class="btn-pos-close" @click="emit('close')">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── UI Del Modal ── */
.modal-backdrop-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 4000;
}
.order-detail-card {
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  background-color: #f8fafc;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ticket-pos-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.ticket-pos-root .order-detail-card {
  max-width: 450px;
  margin: 0 auto;
  border-radius: 16px;
  flex: 1;
}
.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}
.pos-header__title {
  font-size: 16px;
  font-weight: bold;
  color: #0f172a;
}
.detail-scroll-area {
  flex: 1;
  overflow-y: auto;
}
.detail-content {
  padding: 20px;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #64748b;
}
.pos-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-pos-print,
.btn-pos-close {
  flex: 1;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
}
.btn-pos-print {
  background: transparent;
  border: 1px solid #0059bb;
  color: #0059bb;
}
.btn-pos-close {
  background: #0059bb;
  border: none;
  color: white;
}
</style>
