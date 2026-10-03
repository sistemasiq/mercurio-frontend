<template>
  <BaseDialog
    v-model="modelValue"
    :title="detalle ? `Arqueo · ${formatDia(detalle.fechaCierre)}` : 'Detalle de arqueo'"
    :subtitle="
      detalle
        ? `${detalle.terminal} · ${detalle.cajeroNombre} · autorizó ${detalle.adminNombre}`
        : undefined
    "
    icon="receipt_long"
    tone="amber"
    :width="600"
    secondary-label="Cerrar"
    primary-label="Descargar PDF"
    :primary-disabled="!detalle?.pdfUrl"
    :loading="descargando"
    @confirm="descargar"
  >
    <div v-if="cargando" class="arq-detail__state">
      <q-spinner-dots color="primary" size="40px" />
    </div>
    <div v-else-if="error" class="arq-detail__state arq-detail__state--bad">
      <q-icon name="error" size="22px" />{{ error }}
    </div>

    <template v-else-if="detalle">
      <div class="arq-list">
        <div class="arq-list__head"><span>Concepto</span><span>Diferencia</span></div>
        <div v-for="fila in detalle.balancePorMetodo" :key="fila.metodo" class="arq-list__row">
          <div class="arq-list__info">
            <span class="arq-list__name">{{ fila.label }}</span>
            <span class="arq-list__meta">
              Declarado {{ formatMXN(fila.declarado) }} · esperado {{ formatMXN(fila.esperado) }}
            </span>
          </div>
          <span class="arq-list__diff" :class="claseDiferencia(fila.diferencia)">
            {{ formatDiferencia(fila.diferencia) }}
          </span>
        </div>
      </div>

      <dl class="arq-totals">
        <div>
          <dt>Fondo inicial</dt>
          <dd>{{ formatMXN(detalle.fondoInicial) }}</dd>
        </div>
        <div>
          <dt>Total declarado</dt>
          <dd>{{ formatMXN(detalle.totalDeclarado) }}</dd>
        </div>
        <div>
          <dt>Total esperado</dt>
          <dd>{{ formatMXN(detalle.totalEsperado) }}</dd>
        </div>
        <div class="arq-totals__net">
          <dt>Diferencia neta</dt>
          <dd :class="claseDiferencia(detalle.diferenciaNeta)">
            {{ formatDiferencia(detalle.diferenciaNeta) }}
          </dd>
        </div>
      </dl>

      <q-expansion-item
        dense
        expand-separator
        icon="payments"
        label="Desglose de efectivo"
        :caption="formatMXN(detalle.desgloseEfectivo.totalEfectivo)"
        class="arq-cash"
      >
        <div class="arq-cash__grid">
          <div
            v-for="b in detalle.desgloseEfectivo.billetes.filter((x) => x.cantidad > 0)"
            :key="'b' + b.denominacion"
            class="arq-cash__row"
          >
            <span>${{ formatEntero(b.denominacion) }} × {{ b.cantidad }}</span>
            <span>{{ formatMXN(b.subtotal) }}</span>
          </div>
          <div
            v-for="m in detalle.desgloseEfectivo.monedas.filter((x) => x.cantidad > 0)"
            :key="'m' + m.denominacion"
            class="arq-cash__row"
          >
            <span>${{ m.denominacion }} × {{ m.cantidad }}</span>
            <span>{{ formatMXN(m.subtotal) }}</span>
          </div>
        </div>
      </q-expansion-item>

      <div class="arq-meta">
        <span>Apertura {{ formatFecha(detalle.fechaApertura) }}</span>
        <span>Cierre {{ formatFecha(detalle.fechaCierre) }}</span>
        <span>{{ detalle.sucursalNombre }}</span>
      </div>

      <div v-if="detalle.observaciones" class="arq-notes">
        <span class="field-label">Observaciones</span>
        <p>{{ detalle.observaciones }}</p>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { ref, watch } from 'vue'
import { formatMXN, formatEntero, formatDiferencia, claseDiferencia } from '@/utils/formatoMoneda'
import { turnoCajaService } from '@/services/turnoCajaService'
import type { DetalleArqueo } from '@/types/turnoCaja'

/**
 * Props:
 *   modelValue — controla la visibilidad del dialog (v-model)
 *   arqueoId   — ID del arqueo a cargar; cargar() se dispara automáticamente al abrirse
 */
const props = defineProps<{
  arqueoId: string | null
}>()

const modelValue = defineModel<boolean>({ default: false })

const detalle = ref<DetalleArqueo | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)
const descargando = ref(false)

// Carga el detalle cuando se abre el dialog con un ID válido
watch(
  () => [modelValue.value, props.arqueoId] as const,
  async ([visible, id]) => {
    if (!visible || !id) return
    cargando.value = true
    error.value = null
    detalle.value = null
    try {
      detalle.value = await turnoCajaService.obtenerDetalle(id)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      cargando.value = false
    }
  },
)

async function descargar() {
  if (!props.arqueoId) return
  descargando.value = true
  try {
    await turnoCajaService.descargarPdfArqueo(
      props.arqueoId,
      `arqueo_${props.arqueoId.slice(-8)}.pdf`,
    )
  } finally {
    descargando.value = false
  }
}

function formatDia(iso: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<style scoped lang="scss">
.arq-detail__state {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--bad {
    color: var(--tone-bad-fg);
    font-weight: 600;
  }
}

.arq-list {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;

  &__head {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: capitalize;
  }

  &__meta {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__diff {
    font-size: 13.5px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}

.arq-totals {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f6f8fc;
  display: flex;
  flex-direction: column;
  gap: 8px;

  div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13.5px;
    color: #475569;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  &__net {
    font-size: 20px !important;
    font-weight: 800;
    color: var(--text-strong) !important;
  }
}

.arq-cash {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 18px;
    padding: 10px 16px 14px;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
}

.arq-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.arq-notes {
  display: flex;
  flex-direction: column;

  p {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid var(--border-input);
    border-radius: 10px;
    font-size: 14px;
    white-space: pre-wrap;
  }
}
</style>
