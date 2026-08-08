<template>
  <q-dialog v-model="modelValue" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="detalle-dialog-card">
      <!-- ── Toolbar ── -->
      <q-toolbar class="dialog-toolbar">
        <q-btn flat round icon="close" @click="modelValue = false" />
        <q-toolbar-title class="text-weight-semibold">
          Detalle de Arqueo
          <span v-if="detalle" class="text-subtitle2 text-on-surface-variant q-ml-sm">
            #{{ detalle.id.slice(-8).toUpperCase() }}
          </span>
        </q-toolbar-title>
        <q-btn
          v-if="detalle?.pdfUrl"
          flat
          no-caps
          icon="download"
          label="Descargar PDF"
          :loading="descargando"
          @click="descargar"
        />
      </q-toolbar>

      <q-separator />

      <!-- ── Estado de carga ── -->
      <div v-if="cargando" class="full-height flex flex-center q-pa-xl">
        <div class="text-center">
          <q-spinner-dots color="primary" size="48px" />
          <div class="text-body2 text-on-surface-variant q-mt-md">Cargando detalle...</div>
        </div>
      </div>

      <div v-else-if="error" class="q-pa-xl text-center">
        <q-icon name="error_outline" color="negative" size="48px" />
        <div class="text-body1 q-mt-md">{{ error }}</div>
      </div>

      <!-- ── Contenido ── -->
      <q-scroll-area v-else-if="detalle" class="dialog-body">
        <div class="q-pa-lg row q-col-gutter-lg">
          <!-- Columna izquierda -->
          <div class="col-12 col-md-6">
            <!-- Meta del arqueo -->
            <q-card flat bordered class="info-card q-mb-md">
              <q-card-section class="info-header">
                <q-icon name="info" size="18px" class="q-mr-xs" />
                Información del Turno
              </q-card-section>
              <q-card-section class="q-gutter-y-xs">
                <div class="info-row">
                  <span class="info-label">Cajero</span>
                  <span class="info-value">{{ detalle.cajeroNombre }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Terminal</span>
                  <span class="info-value">{{ detalle.terminal }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Sucursal</span>
                  <span class="info-value">{{ detalle.sucursalNombre }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Apertura</span>
                  <span class="info-value">{{ formatFecha(detalle.fechaApertura) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cierre</span>
                  <span class="info-value">{{ formatFecha(detalle.fechaCierre) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Autorizado por</span>
                  <span class="info-value">{{ detalle.adminNombre }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fondo Inicial</span>
                  <span class="info-value">{{ formatMXN(detalle.fondoInicial) }}</span>
                </div>
              </q-card-section>
            </q-card>

            <!-- Desglose de efectivo -->
            <q-card flat bordered class="info-card">
              <q-card-section class="info-header">
                <q-icon name="payments" size="18px" class="q-mr-xs" />
                Desglose de Efectivo
              </q-card-section>
              <q-card-section>
                <div class="text-caption text-on-surface-variant q-mb-xs">Billetes</div>
                <div
                  v-for="b in detalle.desgloseEfectivo.billetes.filter((x) => x.cantidad > 0)"
                  :key="'b' + b.denominacion"
                  class="denom-row"
                >
                  <span>${{ formatEntero(b.denominacion) }} × {{ b.cantidad }}</span>
                  <span>{{ formatMXN(b.subtotal) }}</span>
                </div>
                <q-separator spaced="xs" />
                <div class="text-caption text-on-surface-variant q-mb-xs">Monedas</div>
                <div
                  v-for="m in detalle.desgloseEfectivo.monedas.filter((x) => x.cantidad > 0)"
                  :key="'m' + m.denominacion"
                  class="denom-row"
                >
                  <span>${{ m.denominacion }} × {{ m.cantidad }}</span>
                  <span>{{ formatMXN(m.subtotal) }}</span>
                </div>
                <q-separator spaced="xs" />
                <div class="denom-row denom-row--total">
                  <span>Total Efectivo</span>
                  <span>{{ formatMXN(detalle.desgloseEfectivo.totalEfectivo) }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Columna derecha -->
          <div class="col-12 col-md-6">
            <!-- Balance comparativo -->
            <q-card flat bordered class="info-card q-mb-md">
              <q-card-section class="info-header">
                <q-icon name="balance" size="18px" class="q-mr-xs" />
                Balance por Método de Pago
              </q-card-section>
              <q-markup-table flat dense>
                <thead>
                  <tr>
                    <th class="text-left">Método</th>
                    <th class="text-right">Declarado</th>
                    <th class="text-right">Esperado</th>
                    <th class="text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fila in detalle.balancePorMetodo" :key="fila.metodo">
                    <td class="text-left">{{ fila.label }}</td>
                    <td class="text-right">{{ formatMXN(fila.declarado) }}</td>
                    <td class="text-right text-on-surface-variant">
                      {{ formatMXN(fila.esperado) }}
                    </td>
                    <td class="text-right" :class="claseDiferencia(fila.diferencia)">
                      {{ formatDiferencia(fila.diferencia) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td class="text-weight-bold">Total</td>
                    <td class="text-right text-weight-bold">
                      {{ formatMXN(detalle.totalDeclarado) }}
                    </td>
                    <td class="text-right text-weight-bold text-on-surface-variant">
                      {{ formatMXN(detalle.totalEsperado) }}
                    </td>
                    <td
                      class="text-right text-weight-bold"
                      :class="claseDiferencia(detalle.diferenciaNeta)"
                    >
                      {{ formatDiferencia(detalle.diferenciaNeta) }}
                    </td>
                  </tr>
                </tfoot>
              </q-markup-table>
            </q-card>

            <!-- Observaciones -->
            <q-card v-if="detalle.observaciones" flat bordered class="info-card">
              <q-card-section class="info-header">
                <q-icon name="edit_note" size="18px" class="q-mr-xs" />
                Observaciones
              </q-card-section>
              <q-card-section>
                <p class="text-body2" style="white-space: pre-wrap">{{ detalle.observaciones }}</p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
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

function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<style scoped>
.detalle-dialog-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.dialog-toolbar {
  background: var(--bg-card);
  color: var(--text-primary);
}
.dialog-body {
  flex: 1;
  height: 0; /* necesario para que q-scroll-area funcione dentro de flex */
}
.info-card {
  border-radius: 12px;
  border-color: var(--border-color);
}
.info-header {
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--q-primary);
  background: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  padding: 10px 16px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.875rem;
}
.info-label {
  color: var(--text-secondary);
}
.info-value {
  font-weight: 500;
}
.denom-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  padding: 3px 0;
  color: var(--text-secondary);
}
.denom-row--total {
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 4px;
}
.total-row td {
  border-top: 2px solid var(--border-color);
  background: var(--bg-main);
  padding: 8px 12px;
}
</style>
