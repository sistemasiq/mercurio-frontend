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

function badgeClase(): string {
  return esCancelado.value ? 'badge-cancelado' : 'badge-pagado'
}

function textoEstado(): string {
  return esCancelado.value ? 'CANCELADO' : 'PAGADO'
}

function metodoIcono(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('tarjeta') || n.includes('credito') || n.includes('debito')) return 'credit_card'
  if (n.includes('efectivo') || n.includes('cash')) return 'payments'
  return 'account_balance_wallet'
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

const ejecutarImpresion = () => {
  window.print()
}
</script>

<template>
  <div :class="posMode ? 'ticket-pos-root' : 'modal-backdrop-blur'" @click="onBackdropClick">
    <div class="order-detail-card" @click.stop>
      <!-- Header compacto -->
      <header class="pos-header">
        <span v-if="orden" class="pos-header__title">Pago Registrado</span>
        <q-btn
          icon="close"
          round
          unelevated
          class="close-styled-btn"
          aria-label="Cerrar detalle de orden"
          @click="emit('close')"
        />
      </header>

      <div class="detail-scroll-area">
        <div class="detail-content">
          <!-- Loading -->
          <div v-if="isLoading" class="loading-container">
            <q-spinner size="32px" color="primary" />
            <p class="loading-text">Cargando detalle...</p>
          </div>

          <!-- Contenido -->
          <template v-else-if="orden">
            <!-- Encabezado ticket -->
            <div class="pos-ticket-head">
              <div class="pos-ticket-head__row">
                <span class="pos-ticket-head__label">{{ referenciaLabel }}</span>
                <span class="pos-ticket-head__value">{{ orden.titulo }}</span>
              </div>
              <div class="pos-ticket-head__row">
                <span class="pos-ticket-head__label">FECHA</span>
                <span class="pos-ticket-head__value">{{ formatearFecha(orden.fecha_hora) }}</span>
              </div>
              <div class="pos-ticket-head__row">
                <span class="pos-ticket-head__label">ESTADO</span>
                <span :class="['badge', badgeClase()]">
                  {{ textoEstado() }}
                </span>
              </div>
              <div v-if="orden.creado_por_nombre" class="pos-ticket-head__row">
                <span class="pos-ticket-head__label">CAJERO</span>
                <span class="pos-ticket-head__value">{{ orden.creado_por_nombre }}</span>
              </div>
              <div v-if="orden.nombre_cliente" class="pos-ticket-head__row">
                <span class="pos-ticket-head__label">CLIENTE</span>
                <span class="pos-ticket-head__value">{{ orden.nombre_cliente }}</span>
              </div>
            </div>

            <!-- Motivo de cancelación -->
            <div v-if="esCancelado" class="cancel-reason-banner">
              <q-icon name="warning" color="negative" size="sm" />
              <div>
                <strong>Motivo de cancelación:</strong>
                <p>{{ orden.motivo_cancelacion || 'Cancelación sin motivo especificado' }}</p>
              </div>
            </div>

            <!-- Productos List -->
            <section class="products-section">
              <h3 class="section-subtitle">Productos</h3>
              <div class="products-list">
                <div
                  v-for="(item, idx) in orden.detalles"
                  :key="idx"
                  class="product-item"
                  :class="{ 'product-item--combo-child': item.nombre_combo_padre }"
                >
                  <div v-if="!item.nombre_combo_padre" class="product-qty-box">
                    {{ item.cantidad }}x
                  </div>
                  <div v-else class="product-qty-box product-qty-box--child">
                    <q-icon name="check" size="14px" />
                  </div>
                  <div class="product-details">
                    <p class="product-name">
                      {{ item.producto_nombre }}
                      <span v-if="item.nombre_combo_padre" class="combo-tag">
                        ({{ item.nombre_combo_padre }})
                      </span>
                    </p>
                    <p v-if="item.nombre_combo_padre" class="product-included">
                      <q-icon name="check_circle" size="11px" class="q-mr-xs" />Incluido en combo
                    </p>
                    <p v-else-if="item.notas_especiales" class="product-meta">
                      {{ item.notas_especiales }}
                    </p>
                    <p v-else class="product-unit-price">
                      ${{ Number(item.precio_unitario).toFixed(2) }} c/u
                    </p>
                  </div>
                  <p v-if="!item.nombre_combo_padre" class="product-total-price">
                    ${{ Number(item.importe).toFixed(2) }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Payment & Financial Summary -->
            <section class="summary-section bg-gray-light">
              <div class="summary-layout">
                <!-- Left: Payment Methods List -->
                <div class="payment-method-block">
                  <span class="info-label">MÉTODOS DE PAGO</span>
                  <div class="payment-methods-list">
                    <div
                      v-for="(mp, idx) in orden.metodos_pago"
                      :key="idx"
                      class="payment-card-box"
                    >
                      <q-icon
                        :name="metodoIcono(mp.metodo_pago_nombre)"
                        size="sm"
                        class="card-icon"
                      />
                      <div class="card-info">
                        <p class="card-type-text">{{ mp.metodo_pago_nombre }}</p>
                        <p v-if="mp.notas_pago" class="card-meta-text">{{ mp.notas_pago }}</p>
                      </div>
                      <span class="card-amount">${{ Number(mp.monto).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Right: Totals Breakdown -->
                <div class="totals-breakdown">
                  <div class="total-row">
                    <span class="total-label">Total Pagado</span>
                    <span class="total-val">
                      ${{ Number(orden.metodos_pago.reduce((s, m) => s + m.monto, 0)).toFixed(2) }}
                    </span>
                  </div>
                  <div class="divider-dash"></div>
                  <div class="total-final-row">
                    <span class="final-label">Total Venta</span>
                    <span class="final-val">${{ Number(orden.total_final).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Botones: imprimir + cerrar -->
            <div class="pos-actions">
              <button type="button" class="btn-pos-print" @click="ejecutarImpresion()">
                <q-icon name="print" size="sm" class="q-mr-xs" /> Imprimir Ticket
              </button>
              <button type="button" class="btn-pos-close" @click="emit('close')">Cerrar</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

.modal-backdrop-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 4000;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
}
.modal-backdrop-blur .order-detail-card {
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  background-color: #ffffff;
  border: none;
  box-shadow: none;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ticket-pos-root {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: transparent;
  display: flex;
  flex-direction: column;
}
.ticket-pos-root .order-detail-card {
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  border: none;
  box-shadow: none;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.pos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background-color: #ffffff;
  flex-shrink: 0;
}
.pos-header__title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.close-styled-btn {
  background: transparent;
  color: #025fe0;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.close-styled-btn:hover {
  background: #025fe0;
  color: #ffffff;
}
.pos-ticket-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.pos-ticket-head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pos-ticket-head__label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}
.pos-ticket-head__value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.pos-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-pos-print {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border: 1px solid #0059bb;
  background: transparent;
  color: #0059bb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-pos-print:hover {
  background-color: #f0f6ff;
}
.btn-pos-close {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border: none;
  background-color: #0059bb;
  color: #ffffff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-pos-close:hover {
  background-color: #004a9c;
}
.ticket-pos-root .detail-content {
  padding: 20px 20px 24px;
}

/* ── Scroll ─────────────────────────────────────── */
.detail-scroll-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.detail-content {
  padding: 20px 20px 24px;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  gap: 12px;
}
.loading-text {
  font-size: 14px;
  color: #64748b;
}

.cancel-reason-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: #7f1d1d;
}
.cancel-reason-banner strong {
  font-size: 11px;
  text-transform: uppercase;
  color: #991b1b;
}
.cancel-reason-banner p {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.4;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}

.products-section {
  margin-bottom: 24px;
}
.section-subtitle {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
}
.products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.product-item {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
}
.product-item--combo-child {
  background-color: rgba(2, 95, 224, 0.03);
  border-color: rgba(2, 95, 224, 0.15);
  border-left: 3px solid #025fe0;
  padding: 8px 12px 8px 10px;
}
.product-qty-box {
  width: 36px;
  height: 36px;
  background-color: #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0059bb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.product-qty-box--child {
  width: 28px;
  height: 28px;
  background-color: rgba(2, 95, 224, 0.1);
  color: #025fe0;
  border-radius: 6px;
}
.product-details {
  flex-grow: 1;
}
.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.combo-tag {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}
.product-unit-price {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.product-included {
  font-size: 11px;
  font-weight: 600;
  color: #025fe0;
  margin: 2px 0 0 0;
  display: flex;
  align-items: center;
  opacity: 0.85;
}
.product-meta {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.product-total-price {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

/* ── Payment summary ──────────────────────────────── */
.bg-gray-light {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}
.summary-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.payment-method-block {
  display: flex;
  flex-direction: column;
}
.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.payment-card-box {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-icon {
  color: #0059bb;
}
.card-info {
  display: flex;
  flex-direction: column;
}
.card-type-text {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.card-meta-text {
  font-size: 10px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.card-amount {
  margin-left: auto;
  font-size: 14px;
  font-weight: 700;
  color: #0059bb;
  white-space: nowrap;
}

.totals-breakdown {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.divider-dash {
  border-top: 1px dashed #cbd5e1;
  margin: 4px 0;
}
.total-final-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.final-label {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
}
.final-val {
  font-size: 22px;
  font-weight: 800;
  color: #025fe0;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
}
.badge-pagado {
  background-color: #008645;
  color: #ffffff;
}
.badge-cancelado {
  background-color: #dc2626;
  color: #ffffff;
}

/* ── Print styles ──────────────────────────────────────── */
@media print {
  .pos-header {
    display: none !important;
  }
  .pos-actions {
    display: none !important;
  }
  .modal-backdrop-blur,
  .ticket-pos-root {
    position: static !important;
    width: auto !important;
    height: auto !important;
    background: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  .order-detail-card {
    background: white !important;
    height: auto !important;
    border-radius: 0 !important;
  }
  .detail-scroll-area {
    overflow: visible !important;
  }
  .detail-content {
    padding: 0 !important;
  }
}
</style>

<style>
/* Impresión: ocultar todo el historial y mostrar solo el ticket */
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
