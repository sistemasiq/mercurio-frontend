<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'

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

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)

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
    if (props.autoPrint) {
      await nextTick()
      window.print()
    }
  } finally {
    isLoading.value = false
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

function textoEstado(): string {
  return esCancelado.value ? 'CANCELADO' : 'PAGADO'
}

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

const totalPagado = computed(() =>
  (orden.value?.metodos_pago ?? []).reduce((suma, m) => suma + Number(m.monto), 0),
)

const fmt = (n: number | string) => Number(n).toFixed(2)

const ejecutarImpresion = () => {
  window.print()
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
          </span>
        </div>

        <div v-if="esCancelado" class="receipt-card__cancel">
          <q-icon name="warning" size="19px" />
          <span>{{ orden.motivo_cancelacion || 'Cancelación sin motivo especificado' }}</span>
        </div>

        <div class="receipt">
          <div v-if="orden.creado_por_nombre || orden.nombre_cliente" class="receipt__meta">
            <div v-if="orden.nombre_cliente" class="receipt__line">
              <span>Cliente</span><span>{{ orden.nombre_cliente }}</span>
            </div>
            <div v-if="orden.creado_por_nombre" class="receipt__line">
              <span>Cajero</span><span>{{ orden.creado_por_nombre }}</span>
            </div>
            <div class="receipt__line">
              <span>Estado</span><span>{{ textoEstado() }}</span>
            </div>
          </div>

          <div
            v-for="(item, idx) in orden.detalles"
            :key="idx"
            class="receipt__line"
            :class="{ 'receipt__line--child': item.nombre_combo_padre }"
          >
            <span>
              <template v-if="!item.nombre_combo_padre">{{ item.cantidad }} </template>
              {{ item.producto_nombre }}
              <small v-if="item.notas_especiales && !item.nombre_combo_padre" class="receipt__note">
                {{ item.notas_especiales }}
              </small>
            </span>
            <span v-if="!item.nombre_combo_padre">{{ fmt(item.importe) }}</span>
          </div>

          <div class="receipt__rule" />

          <div class="receipt__line receipt__line--total">
            <span>TOTAL</span><span>${{ fmt(orden.total_final) }}</span>
          </div>
          <div v-for="(mp, idx) in orden.metodos_pago" :key="`mp-${idx}`" class="receipt__line">
            <span>
              {{ mp.metodo_pago_nombre }}
              <small v-if="mp.notas_pago" class="receipt__note receipt__note--muted">{{
                mp.notas_pago
              }}</small>
            </span>
            <span>{{ fmt(mp.monto) }}</span>
          </div>
          <div v-if="totalPagado > Number(orden.total_final)" class="receipt__line">
            <span>Cambio</span><span>{{ fmt(totalPagado - Number(orden.total_final)) }}</span>
          </div>
        </div>

        <div class="receipt-card__actions">
          <q-btn outline icon="print" label="Imprimir" @click="ejecutarImpresion()" />
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
}

.receipt {
  padding: 16px;
  border-radius: 12px;
  background: #f6f8fc;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  color: var(--text-body);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #cbd2de;
    color: var(--text-secondary);
  }

  &__line {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    span:last-child {
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    &--child {
      padding-left: 16px;
      color: var(--text-secondary);
      font-size: 12px;
    }

    &--total {
      font-weight: 800;
      color: var(--text-primary);
    }
  }

  &__note {
    display: block;
    font-size: 11.5px;
    color: #c2410c;

    &--muted {
      color: var(--text-secondary);
    }
  }

  &__rule {
    border-top: 1px dashed #cbd2de;
    margin: 4px 0;
  }
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .modal-backdrop-blur,
  .ticket-pos-root {
    position: static !important;
    background: none !important;
    padding: 0 !important;
    display: block !important;
  }

  .receipt-card {
    width: 100% !important;
    max-width: 340px !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .receipt-card__close,
  .receipt-card__actions,
  .receipt-card__icon {
    display: none !important;
  }

  .receipt {
    background: none !important;
    padding: 0 !important;
  }
}
</style>

<style>
@media print {
  .historial-layout-wrapper > * {
    display: none !important;
  }
  .historial-layout-wrapper > .modal-backdrop-blur {
    display: block !important;
    position: static !important;
    background: none !important;
  }
}
</style>
