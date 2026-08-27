<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import DetalleOrdenPagada from './DetalleOrdenPagada.vue'
import EditarOrdenModal from './EditarOrdenModal.vue'
import MotivoCancelacionDialog from './MotivoCancelacionDialog.vue'
import { comandasApi } from '@/api/comandasApi'
import { obtenerHistorial, obtenerEstadisticas } from '@/services/historialService'
import type { ITransaccion } from '@/types/transaccion'
import type { Estadisticas } from '@/api/historialApi'

const $q = useQuasar()

const mostrarModalPagado = ref(false)
const mostrarModalEditar = ref(false)
const isLoading = ref(false)
const filtroTiempo = ref<'hoy' | 'semana' | 'mes'>('hoy')
const filtroEstado = ref<'todos' | 'pagado' | 'cancelado'>('todos')
const transacciones = ref<ITransaccion[]>([])
const comandaSeleccionadaId = ref('')
const estadisticas = ref<Estadisticas>({ total_ventas: 0, total_ordenes: 0, ticket_promedio: 0 })
const mostrarFiltros = ref(false)
const fechaInicio = ref('')
const fechaFin = ref('')

async function cargarDatos() {
  isLoading.value = true
  try {
    const fi = fechaInicio.value || undefined
    const ff = fechaFin.value || undefined
    const [txs, stats] = await Promise.all([
      obtenerHistorial(filtroTiempo.value, filtroEstado.value, undefined, fi, ff),
      obtenerEstadisticas(filtroTiempo.value, undefined, fi, ff),
    ])
    transacciones.value = txs
    estadisticas.value = stats
  } finally {
    isLoading.value = false
  }
}

onMounted(cargarDatos)

watch([filtroTiempo, filtroEstado], cargarDatos)

function aplicarFiltroFecha() {
  mostrarFiltros.value = false
  cargarDatos()
}

function limpiarFiltroFecha() {
  fechaInicio.value = ''
  fechaFin.value = ''
  mostrarFiltros.value = false
  cargarDatos()
}

function obtenerIconoMetodo(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('tarjeta') || n.includes('credito') || n.includes('debito') || n.includes('card'))
    return 'credit_card'
  if (n.includes('efectivo') || n.includes('cash')) return 'payments'
  return 'account_balance_wallet'
}

function obtenerClaseEstado(estado: string): string {
  const e = estado.toUpperCase()
  if (e === 'P') return 'status-pendiente'
  if (e === 'E') return 'status-proceso'
  if (e === 'L' || e === 'PAGADO') return 'status-listo'
  if (e === 'T') return 'status-entregado'
  if (e === 'C' || e === 'CANCELADO') return 'status-cancelado'
  return 'status-cancelado'
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

/**
 * Los códigos de estado de una comanda describen su preparación en cocina y no
 * significan lo mismo para un cobro de evento: ahí el renglón es dinero que ya
 * entró. Sin esta distinción un anticipo cobrado saldría como "Pendiente",
 * porque comparte la letra P con las comandas sin preparar.
 */
function textoEstadoTx(tx: ITransaccion): string {
  if (tx.origen === 'evento') return tx.estado_actual === 'C' ? 'Cancelado' : 'Cobrado'
  return textoEstado(tx.estado_actual)
}

function claseEstadoTx(tx: ITransaccion): string {
  if (tx.origen === 'evento') {
    return tx.estado_actual === 'C' ? 'status-cancelado' : 'status-listo'
  }
  return obtenerClaseEstado(tx.estado_actual)
}

const verDetalleOrden = (comandaId: string, _estado: string) => {
  comandaSeleccionadaId.value = comandaId
  mostrarModalPagado.value = true
}

function formatearMonto(monto: number): string {
  return `$${Number(monto || 0).toFixed(2)}`
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

function esEstadoFinal(estado: string): boolean {
  const e = estado.toUpperCase()
  return e === 'C' || e === 'R'
}

function esEditable(estado: string): boolean {
  return estado.toUpperCase() === 'P'
}

function abrirCancelar(comandaId: string) {
  comandaSeleccionadaId.value = comandaId
  $q.dialog({
    component: MotivoCancelacionDialog,
    componentProps: {
      titulo: 'Cancelar Orden',
      subtitulo: 'Selecciona el motivo de cancelación.',
      botonLabel: 'Cancelar Orden',
    },
  }).onOk(async (motivo: string) => {
    try {
      await comandasApi.cambiarEstado(comandaId, 'C', motivo)
      $q.notify({
        type: 'positive',
        message: 'Orden cancelada correctamente.',
        position: 'top',
        timeout: 2500,
        icon: 'check_circle',
      })
      void cargarDatos()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cancelar la orden.'
      $q.notify({ type: 'negative', message: msg, position: 'top', timeout: 4000 })
    }
  })
}

function abrirEditar(comandaId: string) {
  comandaSeleccionadaId.value = comandaId
  mostrarModalEditar.value = true
}

function onOrdenActualizada() {
  void cargarDatos()
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
            <span class="metric-label">Ingresos Totales</span>
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
            <span class="metric-label">Movimientos</span>
            <h3 class="metric-value">{{ estadisticas.total_ordenes }}</h3>
          </div>
          <div class="metric-icon-box bg-orange-fixed text-orange-deep">
            <q-icon name="shopping_basket" size="sm" />
          </div>
        </div>

        <div class="metric-card border-slate">
          <div class="metric-info">
            <span class="metric-label">Promedio</span>
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
            <button
              type="button"
              class="btn-filter-advanced"
              @click="mostrarFiltros = !mostrarFiltros"
            >
              <q-icon name="filter_list" size="xs" /> Filtros
            </button>
          </div>
        </div>

        <div v-if="mostrarFiltros" class="advanced-filters-panel">
          <div class="filters-row">
            <div class="filter-field">
              <label class="filter-label">Fecha Inicio</label>
              <input v-model="fechaInicio" type="date" class="filter-date-input" />
            </div>
            <div class="filter-field">
              <label class="filter-label">Fecha Fin</label>
              <input v-model="fechaFin" type="date" class="filter-date-input" />
            </div>
            <div class="filter-actions-row">
              <button type="button" class="btn-filter-clear" @click="limpiarFiltroFecha">
                <q-icon name="close" size="xs" /> Limpiar
              </button>
              <button type="button" class="btn-filter-apply" @click="aplicarFiltroFecha">
                <q-icon name="check" size="xs" /> Aplicar
              </button>
            </div>
          </div>
        </div>

        <div class="table-responsive-container">
          <table class="stitch-table-native">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Ticket</th>
                <th>Métodos de Pago</th>
                <th>Estado</th>
                <th class="text-right">Total</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="6" class="text-center" style="padding: 32px">
                  <q-spinner size="24px" color="primary" />
                </td>
              </tr>
              <tr v-else-if="transacciones.length === 0">
                <td colspan="6" class="text-center text-slate-muted" style="padding: 32px">
                  No hay transacciones para este período.
                </td>
              </tr>
              <tr v-for="tx in transacciones" :key="tx.comanda_id" class="table-row-hover">
                <td class="td-align-middle text-xs text-slate-muted">
                  {{ formatearFecha(tx.creado) }}
                </td>
                <td class="td-align-middle">
                  <div class="flex-column-cell">
                    <div class="origen-cell">
                      <span class="font-bold text-slate-dark">{{ tx.ticket_numero }}</span>
                      <span
                        class="origen-badge"
                        :class="
                          tx.origen === 'evento' ? 'origen-badge--evento' : 'origen-badge--orden'
                        "
                      >
                        {{ tx.origen === 'evento' ? 'Evento' : 'Pedido' }}
                      </span>
                    </div>
                    <span class="subtext-cell">
                      {{ tx.origen === 'evento' ? tx.concepto || 'Cobro de evento' : 'Pedido' }}
                    </span>
                  </div>
                </td>
                <td class="td-align-middle">
                  <div class="payment-methods-cell">
                    <div v-for="(mp, idx) in tx.metodos_pago" :key="idx" class="payment-method-row">
                      <q-icon
                        :name="obtenerIconoMetodo(mp.metodo_pago_nombre)"
                        size="xs"
                        class="text-slate-muted"
                      />
                      <span class="text-xs text-slate-dark">{{ mp.metodo_pago_nombre }}</span>
                      <span class="text-xs font-bold text-slate-dark">{{
                        formatearMonto(mp.monto)
                      }}</span>
                    </div>
                  </div>
                </td>
                <td class="td-align-middle">
                  <span :class="claseEstadoTx(tx)" class="status-badge-native">
                    {{ textoEstadoTx(tx) }}
                  </span>
                </td>
                <td class="td-align-middle text-right font-bold text-slate-dark">
                  ${{ Number(tx.total_final || 0).toFixed(2) }}
                </td>
                <td class="td-align-middle">
                  <!--
                    Ver detalle, editar y cancelar operan sobre una comanda, así que
                    no aplican a los cobros de evento: ahí el renglón es un pago de
                    reservación y su detalle vive en el cierre del evento.
                  -->
                  <div v-if="tx.origen === 'orden'" class="actions-cell-group">
                    <button
                      type="button"
                      class="btn-cell-action text-blue-primary"
                      title="Ver detalle"
                      @click="verDetalleOrden(tx.comanda_id, tx.estado_actual)"
                    >
                      <q-icon name="visibility" size="xs" />
                    </button>

                    <button
                      type="button"
                      class="btn-cell-action text-orange-deep"
                      title="Imprimir"
                      :disabled="esEstadoFinal(tx.estado_actual)"
                      @click="imprimirDirecto()"
                    >
                      <q-icon name="print" size="xs" />
                    </button>

                    <button
                      v-if="esEditable(tx.estado_actual)"
                      type="button"
                      class="btn-cell-action text-blue-primary"
                      title="Editar orden"
                      @click="abrirEditar(tx.comanda_id)"
                    >
                      <q-icon name="edit" size="xs" />
                    </button>

                    <button
                      v-if="!esEstadoFinal(tx.estado_actual)"
                      type="button"
                      class="btn-cell-action text-red-error"
                      title="Cancelar orden"
                      @click="abrirCancelar(tx.comanda_id)"
                    >
                      <q-icon name="block" size="xs" />
                    </button>
                  </div>
                  <span v-else class="text-xs text-slate-muted">—</span>
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
      :comanda-id="comandaSeleccionadaId"
      @close="mostrarModalPagado = false"
    />
    <EditarOrdenModal
      v-if="mostrarModalEditar"
      :comanda-id="comandaSeleccionadaId"
      @close="mostrarModalEditar = false"
      @orden-actualizada="onOrdenActualizada"
    />
  </div>
</template>

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
  vertical-align: middle;
}
.td-align-middle {
  vertical-align: middle !important;
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
/* El historial mezcla ventas de mostrador y cobros de eventos; la etiqueta es lo
   único que los distingue de un vistazo, porque un evento no trae folio de ticket. */
.origen-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.origen-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.origen-badge--orden {
  background: rgba(2, 95, 224, 0.1);
  color: #025fe0;
}
.origen-badge--evento {
  background: rgba(155, 81, 224, 0.12);
  color: #7a2fd0;
}
.flex-row-cell {
  display: flex;
  align-items: center;
}
.gap-sm {
  gap: 6px;
}
.payment-methods-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.payment-method-row {
  display: flex;
  align-items: center;
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
.status-pendiente {
  background-color: #edeeef;
  color: #414754;
}
.status-proceso {
  background-color: #ffdcc3;
  color: #6e3900;
}
.status-listo {
  background-color: rgba(0, 106, 53, 0.12);
  color: #006a35;
}
.status-entregado {
  background-color: rgba(0, 89, 187, 0.1);
  color: #0059bb;
}
.status-cancelado {
  background-color: rgba(186, 26, 26, 0.1);
  color: #ba1a1a;
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
.advanced-filters-panel {
  padding: 16px 20px;
  border-bottom: 1px solid #c1c6d7;
  background-color: #f8f9fa;
}
.filters-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: #414754;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.filter-date-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #c1c6d7;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background-color: #ffffff;
  outline: none;
  box-sizing: border-box;
}
.filter-date-input:focus {
  border-color: #0059bb;
}
.filter-actions-row {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.btn-filter-clear {
  height: 38px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #c1c6d7;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #414754;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.btn-filter-clear:hover {
  background-color: #edeeef;
}
.btn-filter-apply {
  height: 38px;
  padding: 0 16px;
  background-color: #0059bb;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.btn-filter-apply:hover {
  background-color: #004a9c;
}
</style>
