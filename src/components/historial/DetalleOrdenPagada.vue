<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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

const esCancelado = computed(() => {
  const estado = orden.value?.estado_actual
  if (!estado) return false
  if (orden.value?.tipo_origen === 'reservacion') return estado === 'cancelada'
  return estado === 'C'
})

const referenciaLabel = computed(() =>
  orden.value?.tipo_origen === 'comanda' ? 'TICKET' : 'CLIENTE',
)

const puntosGanados = computed(() => orden.value?.puntos_ganados ?? null)

const ultimos4PorMetodo = computed(() => orden.value?.metodos_pago.filter((m) => m.ultimos4) ?? [])

function formatearFecha(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
    <div class="receipt-card" role="dialog" aria-modal="true" @click.stop>
      <button
        v-if="!posMode"
        type="button"
        class="receipt-card__close"
        aria-label="Cerrar detalle de orden"
        @click="emit('close')"
      >
        <q-icon name="close" size="22px" />
      </button>

      <div v-if="isLoading" class="receipt-card__loading">
        <q-spinner size="32px" color="primary" />
        <span>Cargando detalle…</span>
      </div>

      <template v-else-if="orden">
        <div class="receipt-card__hero">
          <span class="receipt-card__icon" :class="{ 'receipt-card__icon--bad': esCancelado }">
            <q-icon :name="esCancelado ? 'block' : 'check'" size="28px" />
          </span>
          <span class="receipt-card__title">
            {{ esCancelado ? 'Orden cancelada' : posMode ? 'Pago registrado' : 'Detalle de orden' }}
          </span>
          <span class="receipt-card__subtitle">
            {{ referenciaLabel === 'TICKET' ? 'Pedido' : 'Cliente' }} {{ orden.titulo }} ·
            {{ formatearFecha(orden.fecha_hora) }}
            <template v-if="orden.mesa"> · Mesa {{ orden.mesa }}</template>
          </span>
        </div>

        <div v-if="esCancelado" class="receipt-card__cancel">
          <q-icon name="warning" size="19px" />
          <span>{{ orden.motivo_cancelacion || 'Cancelación sin motivo especificado' }}</span>
        </div>

        <!-- Info en pantalla únicamente (B9 B.1/B.3): no forma parte del ticket
             térmico impreso, que no se toca. -->
        <div v-if="puntosGanados !== null" class="receipt-card__info">
          <q-icon name="stars" size="18px" />
          Puntos ganados: {{ puntosGanados }}
        </div>
        <div v-if="ultimos4PorMetodo.length" class="receipt-card__info">
          <q-icon name="credit_card" size="18px" />
          <span v-for="(m, idx) in ultimos4PorMetodo" :key="idx">
            {{ m.metodo_pago_nombre }} terminada en {{ m.ultimos4
            }}<template v-if="idx < ultimos4PorMetodo.length - 1">, </template>
          </span>
        </div>

        <!-- TICKET TÉRMICO — ancho dinámico 58/80mm, impresión universal -->
        <TicketReceipt ref="ticketRef" :orden="orden" :ancho-mm="80" />

        <div class="receipt-card__actions">
          <q-btn
            outline
            icon="print"
            :label="isPrinting ? 'Imprimiendo…' : 'Imprimir'"
            :loading="isPrinting"
            @click="ejecutarImpresion()"
          />
          <q-btn
            unelevated
            color="primary"
            :label="posMode ? 'Nuevo pedido' : 'Cerrar'"
            @click="emit('close')"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-backdrop-blur,
.ticket-pos-root {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(11, 20, 80, 0.32);
  overflow-y: auto;
}

.receipt-card {
  position: relative;
  width: 400px;
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: var(--shadow-dialog);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: var(--bg-muted);
    }
  }

  &__loading {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 26px;
    margin-bottom: 6px;
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
    display: flex;
    align-items: center;
    justify-content: center;

    &--bad {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }

  &__title {
    font-size: 19px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
    font-size: 13px;
    font-weight: 600;
  }

  &__cancel {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    :deep(.q-btn) {
      min-height: 46px;
    }
  }

  :deep(.ticket-receipt) {
    margin: 0 auto;
  }
}
</style>
