<script setup lang="ts">
import { ref } from 'vue'
import DetalleOrdenPagada from './DetalleOrdenPagada.vue'
import DetalleOrdenCancelada from './DetalleOrdenCancelada.vue'

const mostrarModalPagado = ref(false)
const mostrarModalCancelado = ref(false)

interface ITransaccion {
  id: string
  fechaHora: string
  despacho: {
    tipo: 'Mostrador' | 'Para llevar'
    telefono: string // 📱 Cambiado de nombre de cliente a número telefónico
  }
  metodoPago: 'Tarjeta' | 'Efectivo' | 'Wallet'
  estado: 'Pagado' | 'Cancelado' | 'Reembolsado'
  total: number
}

const filtroTiempo = ref<'hoy' | 'semana' | 'mes'>('hoy')

// Datos adaptados con números telefónicos reales para comida rápida
const transacciones = ref<ITransaccion[]>([
  {
    id: '#0042',
    fechaHora: '14:25 - 12 Oct',
    despacho: { tipo: 'Mostrador', telefono: '452-123-4567' },
    metodoPago: 'Tarjeta',
    estado: 'Pagado',
    total: 145.5,
  },
  {
    id: '#0041',
    fechaHora: '14:10 - 12 Oct',
    despacho: { tipo: 'Para llevar', telefono: '352-987-6543' },
    metodoPago: 'Efectivo',
    estado: 'Pagado',
    total: 32.0,
  },
  {
    id: '#0040',
    fechaHora: '13:45 - 12 Oct',
    despacho: { tipo: 'Para llevar', telefono: '452-555-0199' },
    metodoPago: 'Tarjeta',
    estado: 'Cancelado',
    total: 89.0,
  },
  {
    id: '#0039',
    fechaHora: '13:15 - 12 Oct',
    despacho: { tipo: 'Mostrador', telefono: '352-444-0288' },
    metodoPago: 'Wallet',
    estado: 'Pagado',
    total: 45.2,
  },
  {
    id: '#0038',
    fechaHora: '12:55 - 12 Oct',
    despacho: { tipo: 'Mostrador', telefono: '452-888-9111' },
    metodoPago: 'Efectivo',
    estado: 'Pagado',
    total: 12.5,
  },
  {
    id: '#0034',
    fechaHora: '11:45 - 12 Oct',
    despacho: { tipo: 'Para llevar', telefono: '352-222-3344' },
    metodoPago: 'Tarjeta',
    estado: 'Reembolsado',
    total: -15.0,
  },
])

const obtenerIconoMetodo = (metodo: string) => {
  if (metodo === 'Tarjeta') return 'credit_card'
  if (metodo === 'Efectivo') return 'payments'
  return 'account_balance_wallet'
}

const obtenerClaseEstado = (estado: string) => {
  if (estado === 'Pagado') return 'status-pagado'
  if (estado === 'Cancelado') return 'status-cancelado'
  return 'status-reembolsado'
}

const verDetalleOrden = (estado: string) => {
  if (estado === 'Cancelado') {
    mostrarModalCancelado.value = true
  } else {
    mostrarModalPagado.value = true
  }
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
          <button type="button" class="btn-sync-circle">
            <q-icon name="sync" size="xs" />
          </button>
        </div>
      </header>

      <section class="metrics-grid">
        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Ventas Hoy</span>
            <h3 class="metric-value text-blue-primary">$12,450.00</h3>
            <span class="metric-trend text-green-success">
              <q-icon name="trending_up" size="xs" /> +12%
            </span>
          </div>
          <div class="metric-icon-box bg-blue-fixed text-blue-primary">
            <q-icon name="monetization_on" size="sm" />
          </div>
        </div>

        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Órdenes</span>
            <h3 class="metric-value">142</h3>
            <span class="metric-subtext">Uso: 85%</span>
          </div>
          <div class="metric-icon-box bg-orange-fixed text-orange-deep">
            <q-icon name="shopping_basket" size="sm" />
          </div>
        </div>

        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Ticket Prom.</span>
            <h3 class="metric-value text-orange-deep">$87.60</h3>
            <span class="metric-trend text-red-error">
              <q-icon name="trending_down" size="xs" /> -3%
            </span>
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
            <select class="select-filter-native">
              <option>Estado</option>
              <option>Pagado</option>
              <option>Cancelado</option>
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
                <th>Cliente</th>
                <th>Método</th>
                <th>Estado</th>
                <th class="text-right">Total</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transacciones" :key="tx.id" class="table-row-hover">
                <td class="font-bold text-blue-primary">{{ tx.id }}</td>
                <td class="text-xs text-slate-muted">{{ tx.fechaHora }}</td>
                <td>
                  <div class="flex-column-cell">
                    <span class="font-bold text-slate-dark">{{ tx.despacho.telefono }}</span>
                    <span class="subtext-cell">{{ tx.despacho.tipo }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex-row-cell gap-sm text-xs text-slate-dark">
                    <q-icon
                      :name="obtenerIconoMetodo(tx.metodoPago)"
                      size="xs"
                      class="text-slate-muted"
                    />
                    {{ tx.metodoPago }}
                  </div>
                </td>
                <td>
                  <span :class="obtenerClaseEstado(tx.estado)" class="status-badge-native">
                    {{ tx.estado }}
                  </span>
                </td>
                <td
                  class="text-right font-bold text-slate-dark"
                  :class="{
                    'line-through opacity-40': tx.estado === 'Cancelado',
                    'text-orange-deep': tx.estado === 'Reembolsado',
                  }"
                >
                  ${{ tx.total.toFixed(2) }}
                </td>
                <td>
                  <div class="actions-cell-group">
                    <button
                      type="button"
                      class="btn-cell-action text-blue-primary"
                      @click="verDetalleOrden(tx.estado)"
                    >
                      <q-icon name="visibility" size="xs" />
                    </button>

                    <button
                      type="button"
                      class="btn-cell-action text-orange-deep"
                      :disabled="tx.estado === 'Cancelado'"
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
          <span class="pagination-counter-text">Mostrando 1-10 de 142 órdenes</span>
          <div class="pagination-buttons-group">
            <button type="button" class="btn-pager-nav">
              <q-icon name="chevron_left" size="xs" />
            </button>
            <button type="button" class="btn-pager-num active-page">1</button>
            <button type="button" class="btn-pager-num">2</button>
            <button type="button" class="btn-pager-num">3</button>
            <button type="button" class="btn-pager-nav">
              <q-icon name="chevron_right" size="xs" />
            </button>
          </div>
        </div>
      </div>

      <footer class="system-brand-footer">Sistema de Gestión Comercial ComertexPOS v2.4.0</footer>
    </main>

    <DetalleOrdenPagada v-if="mostrarModalPagado" @close="mostrarModalPagado = false" />
    <DetalleOrdenCancelada v-if="mostrarModalCancelado" @close="mostrarModalCancelado = false" />
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
/* 🔒 ESTILOS DEL COMPONENTE */
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
