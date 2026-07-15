<!-- src/components/historial/DetalleOrdenCancelada.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { obtenerDetalleOrden } from '@/services/historialService'
import type { DetalleOrden } from '@/api/historialApi'

const props = defineProps<{ idTransaccion: string }>()
defineEmits(['close'])

const isLoading = ref(true)
const orden = ref<DetalleOrden | null>(null)

onMounted(async () => {
  try {
    orden.value = await obtenerDetalleOrden(props.idTransaccion)
  } finally {
    isLoading.value = false
  }
})

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
  <div class="modal-backdrop-blur">
    <div class="order-detail-card">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-container">
        <q-spinner size="32px" color="primary" />
        <p class="loading-text">Cargando detalle...</p>
      </div>

      <!-- Contenido -->
      <template v-else-if="orden">
        <!-- Header -->
        <div class="order-detail-header">
          <div class="header-left">
            <div class="title-row">
              <h2 class="order-title">Detalle de Orden #{{ orden.ticket_numero }}</h2>
              <span class="badge badge-cancelado">CANCELADO</span>
            </div>
            <p class="order-meta">{{ formatearFecha(orden.fecha_hora) }}</p>
          </div>
          <button type="button" class="btn-close-x" @click="$emit('close')">
            <q-icon name="close" size="xs" />
          </button>
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

        <!-- Cancel Alert Banner -->
        <div class="cancel-alert-banner">
          <q-icon name="error_outline" size="sm" class="alert-icon" />
          <div class="alert-content">
            <span class="alert-label">MOTIVO DE CANCELLACIÓN</span>
            <p class="alert-reason-text">{{ orden.pago_notas ?? 'Sin motivo registrado' }}</p>
          </div>
        </div>

        <!-- Productos List -->
        <div class="products-section">
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
                <p class="product-unit-price">${{ Number(item.precio_unitario).toFixed(2) }} c/u</p>
              </div>
              <p class="product-total-price">${{ Number(item.importe).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Payment & Summary -->
        <div class="summary-section bg-gray-light">
          <div class="summary-layout">
            <div class="payment-method-block">
              <span class="info-label">MÉTODO DE PAGO</span>
              <div class="payment-card-box">
                <q-icon :name="metodoIcono(orden.metodo_pago_nombre)" size="sm" class="card-icon" />
                <div class="card-info">
                  <p class="card-type-text">{{ orden.metodo_pago_nombre }}</p>
                </div>
              </div>
            </div>

            <div class="totals-breakdown">
              <div class="total-row">
                <span class="total-label">Pago registrado</span>
                <span class="total-val">${{ Number(orden.pago_monto).toFixed(2) }}</span>
              </div>
              <div class="divider-dash"></div>
              <div class="total-final-row">
                <div class="final-label-stack">
                  <span class="final-label">Total</span>
                  <span class="anulado-tag">Final ANULADO</span>
                </div>
                <span class="final-val color-cancel">
                  ${{ Number(orden.total_final).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer Buttons -->
        <div class="modal-actions-footer">
          <button type="button" class="btn-action-outline" @click="ejecutarImpresion()">
            <q-icon name="print" size="xs" class="q-mr-xs" /> Imprimir Ticket
          </button>
          <button type="button" class="btn-action-solid-blue" @click="$emit('close')">
            Cerrar
          </button>
        </div>
      </template>
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
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
  z-index: 99999;
  font-family: 'Inter', sans-serif;
}

.order-detail-card {
  background-color: #ffffff;
  width: 100%;
  max-width: 540px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.2),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
  padding: 32px;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  position: relative;
  z-index: 10;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  gap: 12px;
}
.loading-text {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.order-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.order-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
}
.badge-cancelado {
  background-color: #ba1a1a;
  color: #ffffff;
}
.order-meta {
  font-size: 12px;
  color: #64748b;
  margin: 6px 0 0 0;
}
.btn-close-x {
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}

.info-blocks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}
.info-block {
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid #f1f5f9;
}
.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}
.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 4px 0 0 0;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.user-icon {
  color: #0059bb;
  margin-top: 4px;
}

.cancel-alert-banner {
  background-color: #fff1f2;
  border: 1px solid #ffe4e6;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}
.alert-icon {
  color: #ba1a1a;
  margin-top: 2px;
}
.alert-content {
  display: flex;
  flex-direction: column;
}
.alert-label {
  font-size: 9px;
  font-weight: 800;
  color: #ba1a1a;
  letter-spacing: 0.06em;
}
.alert-reason-text {
  font-size: 13px;
  font-weight: 700;
  color: #9f1239;
  margin: 2px 0 0 0;
}

.products-section {
  margin-bottom: 28px;
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
  gap: 12px;
}
.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.product-qty-box {
  width: 28px;
  height: 28px;
  background-color: #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0059bb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
.product-total-price {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.bg-gray-light {
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}
.summary-layout {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}
.payment-method-block {
  flex: 1;
}
.payment-card-box {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
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

.totals-breakdown {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  align-items: center;
}
.final-label-stack {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.final-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}
.anulado-tag {
  font-size: 11px;
  font-weight: 800;
  color: #ba1a1a;
  text-transform: uppercase;
  margin-top: 2px;
}
.color-cancel {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #0059bb;
  text-decoration: line-through;
  opacity: 0.6;
}

.modal-actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.btn-action-outline {
  height: 44px;
  padding: 0 20px;
  background: transparent;
  border: 1px solid #0059bb;
  color: #0059bb;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.btn-action-solid-blue {
  height: 44px;
  padding: 0 28px;
  background-color: #0059bb;
  border: none;
  color: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
</style>
