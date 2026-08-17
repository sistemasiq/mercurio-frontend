<!-- src/components/historial/DetalleOrdenPagada.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'

const props = defineProps<{ comandaId: string }>()
const emit = defineEmits(['close'])

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  try {
    orden.value = await obtenerDetalleOrden(props.comandaId)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

function badgeClase(estado: string): string {
  if (estado === 'C') return 'badge-cancelado'
  return 'badge-pagado'
}

function textoEstado(estado: string): string {
  return estado === 'C' ? 'CANCELADO' : 'PAGADO'
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
  <div class="modal-backdrop-blur" @click.self="emit('close')">
    <div class="order-detail-card">
      <!-- Header sticky siempre visible -->
      <header class="order-detail-header">
        <button
          type="button"
          class="btn-regresar"
          aria-label="Regresar al historial"
          @click="emit('close')"
        >
          <q-icon name="arrow_back" size="sm" />
          <span>Regresar</span>
        </button>

        <div v-if="orden" class="header-center">
          <h2 class="order-title">Detalle de Orden #{{ orden.ticket_numero }}</h2>
          <p class="order-meta">{{ formatearFecha(orden.fecha_hora) }}</p>
        </div>

        <div class="header-right">
          <span v-if="orden" :class="['badge', badgeClase(orden.estado_actual)]">{{
            textoEstado(orden.estado_actual)
          }}</span>
          <button
            type="button"
            class="btn-close-x"
            aria-label="Cerrar detalle de orden"
            @click="emit('close')"
          >
            <q-icon name="close" size="md" />
          </button>
        </div>
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
            <!-- Motivo de cancelación -->
            <div v-if="orden.estado_actual === 'C'" class="cancel-reason-banner">
              <q-icon name="warning" color="negative" size="sm" />
              <div>
                <strong>Motivo de cancelación:</strong>
                <p>{{ orden.motivo_cancelacion || 'Cancelación sin motivo especificado' }}</p>
              </div>
            </div>

            <!-- Info Blocks -->
            <div class="info-blocks-grid">
              <div class="info-block">
                <span class="info-label">TICKET</span>
                <p class="info-value">{{ orden.ticket_numero }}</p>
              </div>
              <div class="info-block">
                <span class="info-label">ATENDIDO POR</span>
                <div class="user-row">
                  <q-icon name="person" size="xs" class="user-icon" />
                  <p class="info-value">{{ orden.creado_por_nombre ?? '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Productos List -->
            <section class="products-section">
              <h3 class="section-subtitle">Productos</h3>
              <div class="products-list">
                <div v-for="(item, idx) in orden.detalles" :key="idx" class="product-item">
                  <div class="product-qty-box">{{ item.cantidad }}x</div>
                  <div class="product-details">
                    <p class="product-name">
                      {{ item.producto_nombre }}
                      <span v-if="item.nombre_combo_padre" class="combo-tag">
                        ({{ item.nombre_combo_padre }})
                      </span>
                    </p>
                    <p class="product-unit-price">
                      ${{ Number(item.precio_unitario).toFixed(2) }} c/u
                    </p>
                  </div>
                  <p class="product-total-price">${{ Number(item.importe).toFixed(2) }}</p>
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
                    <span class="final-label">Total Comanda</span>
                    <span class="final-val">${{ Number(orden.total_final).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>

      <!-- Footer sticky con acciones -->
      <footer v-if="orden" class="modal-actions-footer">
        <button type="button" class="btn-action-outline" @click="ejecutarImpresion()">
          <q-icon name="print" size="xs" class="q-mr-xs" /> Imprimir Ticket
        </button>
        <button type="button" class="btn-action-solid-blue" @click="emit('close')">Cerrar</button>
      </footer>
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
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
  box-sizing: border-box;
}

/* Panel a pantalla completa: sin dimensiones fijas ni scroll interno restrictivo */
.order-detail-card {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* ── Header sticky ─────────────────────────────────────── */
.order-detail-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 32px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(11, 20, 80, 0.05);
  flex-shrink: 0;
}

.btn-regresar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  background-color: #ffffff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}
.btn-regresar:hover {
  background-color: #f1f5f9;
}

.header-center {
  text-align: center;
  min-width: 0;
}
.order-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.order-meta {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 6px 14px;
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

.btn-close-x {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  background-color: #f1f5f9;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.btn-close-x:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

/* ── Área de scroll natural (pantalla completa) ─────────── */
.detail-scroll-area {
  flex: 1;
  overflow-y: auto;
}
.detail-content {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 32px;
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
  margin: 0;
}

.cancel-reason-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  color: #7f1d1d;
}
.cancel-reason-banner strong {
  font-size: 12px;
  text-transform: uppercase;
  color: #991b1b;
}
.cancel-reason-banner p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.4;
}

.info-blocks-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.info-block {
  background-color: #ffffff;
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
}
.info-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}
.info-value {
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin: 6px 0 0 0;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-icon {
  color: #0059bb;
  margin-top: 6px;
}

.products-section {
  margin-bottom: 32px;
}
.section-subtitle {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px 0;
}
.products-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
}
.product-qty-box {
  width: 40px;
  height: 40px;
  background-color: #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0059bb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.product-details {
  flex-grow: 1;
  min-width: 0;
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.combo-tag {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}
.product-unit-price {
  font-size: 12px;
  color: #64748b;
  margin: 3px 0 0 0;
}
.product-total-price {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}

.bg-gray-light {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}
.summary-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  flex-wrap: wrap;
}
.payment-method-block {
  flex: 1;
  min-width: 280px;
}
.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.payment-card-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-icon {
  color: #0059bb;
}
.card-info {
  display: flex;
  flex-direction: column;
}
.card-type-text {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.card-meta-text {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.card-amount {
  margin-left: auto;
  font-size: 15px;
  font-weight: 700;
  color: #0059bb;
  white-space: nowrap;
}

.totals-breakdown {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.divider-dash {
  border-top: 1px dashed #cbd5e1;
  margin: 6px 0;
}
.total-final-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.final-label {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
}
.final-val {
  font-size: 24px;
  font-weight: 800;
  color: #025fe0;
}

/* ── Footer sticky ─────────────────────────────────────── */
.modal-actions-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 12px rgba(11, 20, 80, 0.06);
  flex-shrink: 0;
}
.btn-action-outline {
  height: 48px;
  padding: 0 24px;
  background: transparent;
  border: 1px solid #0059bb;
  color: #0059bb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.btn-action-outline:hover {
  background-color: #f0f6ff;
}
.btn-action-solid-blue {
  height: 48px;
  padding: 0 32px;
  background-color: #0059bb;
  border: none;
  color: #ffffff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.btn-action-solid-blue:hover {
  background-color: #004a9c;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 720px) {
  .order-detail-header {
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px;
  }
  .header-center {
    order: 3;
    width: 100%;
    text-align: left;
  }
  .detail-content {
    padding: 24px 16px;
  }
  .info-blocks-grid {
    grid-template-columns: 1fr;
  }
  .summary-layout {
    flex-direction: column;
  }
  .totals-breakdown {
    width: 100%;
  }
  .modal-actions-footer {
    flex-direction: column;
    padding: 16px;
  }
  .btn-action-outline,
  .btn-action-solid-blue {
    justify-content: center;
  }
}
</style>
