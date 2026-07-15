<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import DetalleOrdenPagada from './DetalleOrdenPagada.vue'
import DetalleOrdenCancelada from './DetalleOrdenCancelada.vue'
import { obtenerHistorial, obtenerEstadisticas } from '@/services/historialService'
import type { ITransaccion } from '@/types/transaccion'
import type { Estadisticas } from '@/api/historialApi'

const mostrarModalPagado = ref(false)
const mostrarModalCancelado = ref(false)
const isLoading = ref(false)
const filtroTiempo = ref<'hoy' | 'semana' | 'mes'>('hoy')
const filtroEstado = ref<'todos' | 'pagado' | 'cancelado'>('todos')
const transacciones = ref<ITransaccion[]>([])
const pagoSeleccionadoId = ref('')
const estadisticas = ref<Estadisticas>({ total_ventas: 0, total_ordenes: 0, ticket_promedio: 0 })

async function cargarDatos() {
  isLoading.value = true
  try {
    const [txs, stats] = await Promise.all([
      obtenerHistorial(filtroTiempo.value, filtroEstado.value),
      obtenerEstadisticas(filtroTiempo.value),
    ])
    transacciones.value = txs
    estadisticas.value = stats
  } finally {
    isLoading.value = false
  }
}

onMounted(cargarDatos)

watch([filtroTiempo, filtroEstado], cargarDatos)

function obtenerIconoMetodo(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('tarjeta') || n.includes('credito') || n.includes('debito') || n.includes('card'))
    return 'credit_card'
  if (n.includes('efectivo') || n.includes('cash')) return 'payments'
  return 'account_balance_wallet'
}

function obtenerClaseEstado(estado: string): string {
  const e = estado.toUpperCase()
  if (e === 'P' || e === 'PAGADO' || e === 'L' || e === 'T') return 'status-pagado'
  if (e === 'C' || e === 'CANCELADO') return 'status-cancelado'
  return 'status-reembolsado'
}

function textoEstado(estado: string): string {
  const map: Record<string, string> = {
    P: 'Pendiente',
    E: 'En preparación',
    L: 'Listo',
    T: 'Entregado',
    C: 'Cancelado',
  }
  return map[estado] ?? estado
}

const verDetalleOrden = (id: string, estado: string) => {
  pagoSeleccionadoId.value = id
  const e = estado.toUpperCase()
  if (e === 'C' || e === 'CANCELADO') {
    mostrarModalCancelado.value = true
  } else {
    mostrarModalPagado.value = true
  }
}

function formatearFecha(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mes = d.toLocaleString('es', { month: 'short' })
  return `${hh}:${mm} - ${dd} ${mes}`
}

const imprimirDirecto = () => {
  window.print()
}
</script>

<template>
  <div class="historial-layout-wrapper">
    <main class="historial-main-content">
      <header class="historial-header-panel">
        <div>
          <h2 class="section-title">Historial de Transacciones</h2>
          <p class="section-subtitle">Gestione y revise todas las operaciones del centro hoy.</p>
        </div>

        <div class="header-actions">
          <div class="time-toggle-group">
            <button
              type="button"
              :class="{ 'active-toggle': filtroTiempo === 'hoy' }"
              class="toggle-btn"
              @click="filtroTiempo = 'hoy'"
            >
              Hoy
            </button>
            <button
              type="button"
              :class="{ 'active-toggle': filtroTiempo === 'semana' }"
              class="toggle-btn"
              @click="filtroTiempo = 'semana'"
            >
              Semana
            </button>
            <button
              type="button"
              :class="{ 'active-toggle': filtroTiempo === 'mes' }"
              class="toggle-btn"
              @click="filtroTiempo = 'mes'"
            >
              Mes
            </button>
          </div>
          <button type="button" class="btn-sync-circle" @click="cargarDatos">
            <q-icon name="sync" size="xs" />
          </button>
        </div>
      </header>

      <section class="metrics-grid">
        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Ventas Totales</span>
            <h3 class="metric-value text-blue-primary">
              ${{ Number(estadisticas.total_ventas || 0).toFixed(2) }}
            </h3>
          </div>
          <div class="metric-icon-box bg-blue-fixed text-blue-primary">
            <q-icon name="monetization_on" size="sm" />
          </div>
        </div>

        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Órdenes</span>
            <h3 class="metric-value">{{ estadisticas.total_ordenes }}</h3>
          </div>
          <div class="metric-icon-box bg-orange-fixed text-orange-deep">
            <q-icon name="shopping_basket" size="sm" />
          </div>
        </div>

        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Ticket Prom.</span>
            <h3 class="metric-value text-orange-deep">
              ${{ Number(estadisticas.ticket_promedio || 0).toFixed(2) }}
            </h3>
          </div>
          <div class="metric-icon-box bg-slate-gray">
            <q-icon name="analytics" size="sm" />
          </div>
        </div>
      </section>

      <div class="table-card border-slate shadow-box">
        <div class="filter-action-bar">
          <div class="search-input-wrapper">
            <q-icon name="search" class="search-icon" size="xs" />
            <input type="text" placeholder="Buscar orden..." class="search-box-native" />
          </div>

          <div class="selects-actions-group">
            <select v-model="filtroEstado" class="select-filter-native">
              <option value="todos">Todos</option>
              <option value="pagado">Pagado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button type="button" class="btn-filter-advanced">
              <q-icon name="filter_list" size="xs" /> Filtros
            </button>
          </div>
        </div>

        <div class="table-responsive-container">
          <table class="stitch-table-native">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Ticket</th>
                <th>Método</th>
                <th>Estado</th>
                <th class="text-right">Monto</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="7" class="text-center" style="padding: 32px">
                  <q-spinner size="24px" color="primary" />
                </td>
              </tr>
              <tr v-else-if="transacciones.length === 0">
                <td colspan="7" class="text-center text-slate-muted" style="padding: 32px">
                  No hay transacciones para este período.
                </td>
              </tr>
              <tr v-for="tx in transacciones" :key="tx.id" class="table-row-hover">
                <td
                  class="font-bold text-blue-primary text-xs"
                  style="
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  "
                  :title="tx.id"
                >
                  {{ tx.id }}
                </td>
                <td class="text-xs text-slate-muted">{{ formatearFecha(tx.creado) }}</td>
                <td>
                  <div class="flex-column-cell">
                    <span class="font-bold text-slate-dark">{{ tx.ticket_numero }}</span>
                    <span class="subtext-cell">Pedido</span>
                  </div>
                </td>
                <td>
                  <div class="flex-row-cell gap-sm text-xs text-slate-dark">
                    <q-icon
                      :name="obtenerIconoMetodo(tx.metodo_pago_nombre)"
                      size="xs"
                      class="text-slate-muted"
                    />
                    {{ tx.metodo_pago_nombre }}
                  </div>
                </td>
                <td>
                  <span :class="obtenerClaseEstado(tx.estado_actual)" class="status-badge-native">
                    {{ textoEstado(tx.estado_actual) }}
                  </span>
                </td>
                <td class="text-right font-bold text-slate-dark">
                  ${{ Number(tx.monto || 0).toFixed(2) }}
                </td>
                <td>
                  <div class="actions-cell-group">
                    <button
                      type="button"
                      class="btn-cell-action text-blue-primary"
                      @click="verDetalleOrden(tx.id, tx.estado_actual)"
                    >
                      <q-icon name="visibility" size="xs" />
                    </button>

                    <button
                      type="button"
                      class="btn-cell-action text-orange-deep"
                      :disabled="tx.estado_actual === 'C'"
                      @click="imprimirDirecto()"
                    >
                      <q-icon name="print" size="xs" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-footer-bar">
          <span class="pagination-counter-text">
            Mostrando {{ transacciones.length }} transacciones
          </span>
        </div>
      </div>
    </main>

    <DetalleOrdenPagada
      v-if="mostrarModalPagado"
      :id-transaccion="pagoSeleccionadoId"
      @close="mostrarModalPagado = false"
    />
    <DetalleOrdenCancelada
      v-if="mostrarModalCancelado"
      :id-transaccion="pagoSeleccionadoId"
      @close="mostrarModalCancelado = false"
    />
  </div>
</template>

<style>
/* 🌐 ESTILOS GLOBALES TEMPORALES */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined' !important;
  font-size: 24px !important;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24 !important;
  display: inline-block !important;
  line-height: 1 !important;
  width: 24px !important;
  height: 24px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  word-wrap: normal !important;
  white-space: nowrap !important;
  direction: ltr !important;
  -webkit-font-smoothing: antialiased !important;
}
</style>

<style scoped>
.historial-layout-wrapper {
  display: block;
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family:
    'Inter',
    -apple-system,
    sans-serif !important;
}

.historial-main-content {
  width: 100%;
  min-height: 100vh;
  padding: 32px;
  background-color: #f8f9fa;
  box-sizing: border-box;
}

.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #191c1d !important;
  line-height: 1.2 !important;
  margin: 0 !important;
}

.section-subtitle {
  font-size: 14px !important;
  color: #414754 !important;
  margin: 4px 0 0 0 !important;
}

.historial-header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-toggle-group {
  display: flex;
  background-color: #e7e8e9;
  border-radius: 9999px;
  padding: 4px;
}

.toggle-btn {
  border: none;
  background-color: transparent;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #414754;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.active-toggle {
  background-color: #0059bb !important;
  color: #ffffff !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.btn-sync-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background-color: #e1e3e4;
  color: #0059bb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 📊 Grid reajustado estructuralmente a 3 columnas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.metric-card {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}
.metric-info {
  display: flex;
  flex-direction: column;
}
.metric-label {
  font-size: 10px;
  font-weight: 700;
  color: #414754;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}
.metric-value {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 22px !important;
  font-weight: 700 !important;
  color: #191c1d !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}
.metric-trend {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}
.metric-subtext {
  font-size: 12px;
  color: #414754;
  margin-top: 4px;
}
.metric-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.text-blue-primary {
  color: #0059bb !important;
}
.text-orange-deep {
  color: #904d00 !important;
}
.text-green-success {
  color: #006a35 !important;
}
.text-red-error {
  color: #ba1a1a;
}
.bg-blue-fixed {
  background-color: #d8e2ff;
}
.bg-orange-fixed {
  background-color: #ffdcc3;
}
.bg-slate-gray {
  background-color: #e1e3e4;
}
.border-slate {
  border: 1px solid #c1c6d7;
}
.shadow-box {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.table-card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.filter-action-bar {
  padding: 16px 20px;
  border-bottom: 1px solid #c1c6d7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-input-wrapper {
  position: relative;
  width: 320px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 12px;
  color: #717786;
}
.search-box-native {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 38px;
  background-color: #f8f9fa;
  border: 1px solid #c1c6d7;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.selects-actions-group {
  display: flex;
  gap: 8px;
}
.select-filter-native {
  height: 40px;
  padding: 0 12px;
  background-color: #f8f9fa;
  border: 1px solid #c1c6d7;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  outline: none;
}
.btn-filter-advanced {
  height: 40px;
  padding: 0 16px;
  background-color: #e1e3e4;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.table-responsive-container {
  width: 100%;
  overflow-x: auto;
}
.stitch-table-native {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.stitch-table-native th {
  background-color: #edeeef;
  color: #414754;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 20px;
}
.stitch-table-native td {
  padding: 16px 20px;
  font-size: 14px;
  border-bottom: 1px solid #c1c6d7;
}
.table-row-hover:hover {
  background-color: #edeeef;
}
.flex-column-cell {
  display: flex;
  flex-direction: column;
}
.subtext-cell {
  font-size: 11px;
  color: #414754;
}
.flex-row-cell {
  display: flex;
  align-items: center;
}
.gap-sm {
  gap: 6px;
}
.text-slate-muted {
  color: #717786;
}
.text-slate-dark {
  color: #191c1d;
}
.status-badge-native {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.status-pagado {
  background-color: rgba(0, 134, 69, 0.1);
  color: #006a35;
}
.status-cancelado {
  background-color: rgba(186, 26, 26, 0.1);
  color: #ba1a1a;
}
.status-reembolsado {
  background-color: rgba(253, 139, 0, 0.1);
  color: #603100;
}
.actions-cell-group {
  display: flex;
  justify-content: center;
  gap: 4px;
}
.btn-cell-action {
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-cell-action:hover {
  background-color: #e1e3e4;
}
.pagination-footer-bar {
  padding: 16px 20px;
  background-color: #f3f4f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-counter-text {
  font-size: 11px;
  font-weight: 700;
  color: #414754;
  text-transform: uppercase;
}
.pagination-buttons-group {
  display: flex;
  gap: 6px;
}
.btn-pager-nav,
.btn-pager-num {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #c1c6d7;
  background-color: #ffffff;
  color: #191c1d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.active-page {
  background-color: #0059bb !important;
  color: #ffffff !important;
  border-color: #0059bb !important;
}
.system-brand-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #414754;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.4;
}
</style>
