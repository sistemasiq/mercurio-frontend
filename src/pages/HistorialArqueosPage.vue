<template>
  <q-page class="rs-page">
    <div class="rs-page-wrap">
      <!-- ── Título ───────────────────────────────────────────────────── -->
      <div class="rs-page-header">
        <div>
          <h2 class="rs-page-title">Historial de Arqueos</h2>
          <p class="rs-page-sub">
            Registro histórico de cierres de caja autorizados por la Administración.
          </p>
        </div>
        <button type="button" class="rs-btn-filter" @click="mostrarFiltros = !mostrarFiltros">
          <span class="material-symbols-outlined rs-btn-icon">filter_list</span>
          Filtrar
        </button>
      </div>

      <!-- ── Filtros (colapsables) ────────────────────────────────────── -->
      <div v-if="mostrarFiltros" class="rs-filtros-card">
        <div class="rs-filtros-grid">
          <div class="rs-field-group">
            <label class="rs-field-label">Desde</label>
            <input v-model="filtros.fechaDesde" type="date" class="rs-input" />
          </div>
          <div class="rs-field-group">
            <label class="rs-field-label">Hasta</label>
            <input v-model="filtros.fechaHasta" type="date" class="rs-input" />
          </div>
          <div class="rs-field-group">
            <label class="rs-field-label">ID de cajero</label>
            <input
              v-model="filtros.cajeroId"
              type="text"
              class="rs-input"
              placeholder="Ej. usr-042"
            />
          </div>
          <div class="rs-filtros-actions">
            <button type="button" class="rs-btn-secondary" @click="limpiarFiltros">Limpiar</button>
            <button type="button" class="rs-btn-primary" @click="cargar">
              <span class="material-symbols-outlined rs-btn-icon">search</span>
              Buscar
            </button>
          </div>
        </div>
      </div>

      <!-- ── Error ─────────────────────────────────────────────────────── -->
      <q-banner v-if="error" rounded class="bg-negative text-white q-mb-md">
        <template #avatar><q-icon name="error" /></template>
        {{ error }}
      </q-banner>

      <!-- ── Panel tabla ───────────────────────────────────────────────── -->
      <div class="rs-panel-card">
        <!-- Panel header -->
        <div class="rs-panel-header">
          <span class="material-symbols-outlined rs-panel-icon">receipt_long</span>
          <span class="rs-panel-title">Arqueos del Día</span>
        </div>

        <!-- Tabla fec-table -->
        <div class="rs-table-wrap">
          <table class="rs-fec-table">
            <thead>
              <tr>
                <th class="rs-th">Cajero</th>
                <th class="rs-th">Sucursal</th>
                <th class="rs-th">Caja</th>
                <th class="rs-th rs-th--center">Hora Cierre</th>
                <th class="rs-th rs-th--right">Total Declarado</th>
                <th class="rs-th rs-th--right">Diferencia</th>
                <th class="rs-th">Administrador</th>
                <th class="rs-th rs-th--center">PDF</th>
              </tr>
            </thead>
            <tbody>
              <!-- Cargando -->
              <tr v-if="cargando">
                <td colspan="8" class="rs-td rs-td--center rs-td--loading">
                  <q-spinner-dots color="primary" size="28px" />
                </td>
              </tr>
              <!-- Sin resultados -->
              <tr v-else-if="items.length === 0">
                <td colspan="8" class="rs-td rs-td--center rs-td--empty">
                  <span class="material-symbols-outlined rs-empty-icon">inbox</span>
                  <span>No se encontraron arqueos con los filtros actuales.</span>
                </td>
              </tr>
              <!-- Filas de datos -->
              <tr
                v-for="item in items"
                v-else
                :key="item.id"
                class="rs-tr"
                @click="abrirDetalle(item.id)"
              >
                <!-- Cajero con avatar de iniciales -->
                <td class="rs-td">
                  <div class="rs-cajero-cell">
                    <span class="rs-avatar" :style="{ background: avatarColor(item.cajeroNombre) }">
                      {{ iniciales(item.cajeroNombre) }}
                    </span>
                    <span class="rs-cajero-name">{{ item.cajeroNombre }}</span>
                  </div>
                </td>
                <td class="rs-td">{{ item.sucursalNombre }}</td>
                <td class="rs-td rs-td--mono">{{ item.terminal }}</td>
                <td class="rs-td rs-td--center">{{ formatHora(item.fechaCierre) }}</td>
                <td class="rs-td rs-td--right">{{ formatMXN(item.totalDeclarado) }}</td>
                <td
                  class="rs-td rs-td--right rs-td--bold"
                  :class="claseDiferenciaLocal(item.diferenciaNeta)"
                >
                  {{ formatDiferencia(item.diferenciaNeta) }}
                </td>
                <td class="rs-td">{{ item.adminNombre ?? '—' }}</td>
                <td class="rs-td rs-td--center" @click.stop>
                  <button
                    v-if="item.pdfUrl"
                    type="button"
                    class="rs-btn-pdf"
                    :class="{ 'rs-btn-pdf--loading': descargandoId === item.id }"
                    :title="'Descargar PDF de ' + item.cajeroNombre"
                    @click="descargarPdf(item.id)"
                  >
                    <span class="material-symbols-outlined">picture_as_pdf</span>
                  </button>
                  <span v-else class="rs-td--muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="rs-pagination">
          <q-pagination
            v-model="paginaActual"
            :max="totalPaginas"
            boundary-numbers
            direction-links
            color="primary"
            @update:model-value="cargar"
          />
        </div>
      </div>
    </div>

    <!-- Dialog detalle -->
    <DetalleArqueoDialog v-model="mostrarDetalle" :arqueo-id="arqueoIdSeleccionado" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { turnoCajaService } from '@/services/turnoCajaService'
import { formatDiferencia, formatMXN } from '@/utils/formatoMoneda'
import { getAvatarColor, getInitials } from '@/utils/avatar'
import type { ArqueoResumen, FiltrosHistorial } from '@/types/turnoCaja'
import DetalleArqueoDialog from '@/components/cierre-caja/DetalleArqueoDialog.vue'

const $q = useQuasar()

// ── Estado ────────────────────────────────────────────────────────────────
const items = ref<ArqueoResumen[]>([])
const total = ref(0)
const paginaActual = ref(1)
const PAGE_SIZE = 20
const cargando = ref(false)
const error = ref<string | null>(null)
const mostrarFiltros = ref(false)
const mostrarDetalle = ref(false)
const arqueoIdSeleccionado = ref<string | null>(null)
const descargandoId = ref<string | null>(null)

const filtros = reactive<FiltrosHistorial>({
  fechaDesde: '',
  fechaHasta: '',
  cajeroId: '',
})

// ── Computed ──────────────────────────────────────────────────────────────
const totalPaginas = computed(() => Math.ceil(total.value / PAGE_SIZE))

// ── Acciones ──────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const params: FiltrosHistorial = { page: paginaActual.value, pageSize: PAGE_SIZE }
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
    if (filtros.cajeroId) params.cajeroId = filtros.cajeroId
    const resp = await turnoCajaService.listarHistorial(params)
    items.value = resp.items
    total.value = resp.total
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros() {
  filtros.fechaDesde = ''
  filtros.fechaHasta = ''
  filtros.cajeroId = ''
  paginaActual.value = 1
  cargar()
}

function abrirDetalle(id: string) {
  arqueoIdSeleccionado.value = id
  mostrarDetalle.value = true
}

async function descargarPdf(id: string) {
  descargandoId.value = id
  try {
    await turnoCajaService.descargarPdfArqueo(id, `arqueo_${id.slice(-8)}.pdf`)
  } catch (err) {
    $q.notify({ type: 'negative', message: (err as Error).message })
  } finally {
    descargandoId.value = null
  }
}

// ── Helpers visuales ──────────────────────────────────────────────────────
function iniciales(nombre: string): string {
  return getInitials(nombre)
}
function avatarColor(nombre: string): string {
  return getAvatarColor(nombre)
}

function formatHora(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', { timeStyle: 'short' }).format(new Date(iso))
}

function claseDiferenciaLocal(dif: number): string {
  if (dif > 0) return 'rs-positive'
  if (dif < 0) return 'rs-negative'
  return 'rs-zero'
}

onMounted(cargar)
</script>

<style scoped>
/* ── Página ─────────────────────────────────────────────────────────── */
.rs-page {
  background: #f8f9ff;
}
.rs-page-wrap {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 28px;
}
.rs-page-title {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a237e;
  margin: 0;
}
.rs-page-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
  margin: 4px 0 0;
}

/* ── Botón filtrar ──────────────────────────────────────────────────── */
.rs-btn-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #1a237e;
  transition: background 0.15s ease;
}
.rs-btn-filter:hover {
  background: #eff4ff;
}
.rs-btn-icon {
  font-size: 18px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* ── Filtros ─────────────────────────────────────────────────────────── */
.rs-filtros-card {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}
.rs-filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  align-items: end;
}
.rs-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rs-field-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #454652;
  letter-spacing: 0.04em;
}
.rs-input {
  padding: 8px 12px;
  background: #f8f9ff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0b1c30;
  outline: none;
  transition: border-color 0.15s;
}
.rs-input:focus {
  border-color: #b7131a;
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.1);
}
.rs-filtros-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.rs-btn-secondary {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #454652;
  transition: background 0.15s;
}
.rs-btn-secondary:hover {
  background: #f8f9ff;
}
.rs-btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a237e;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  transition: background 0.15s;
}
.rs-btn-primary:hover {
  background: #000666;
}

/* ── Panel card ─────────────────────────────────────────────────────── */
.rs-panel-card {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 16px;
  overflow: hidden;
}
.rs-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.rs-panel-icon {
  font-size: 22px;
  color: #767683;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-panel-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0b1c30;
}

/* ── Tabla fec-table ────────────────────────────────────────────────── */
.rs-table-wrap {
  overflow-x: auto;
}
.rs-fec-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.rs-th {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #454652;
  background: #ffffff;
  white-space: nowrap;
}
.rs-th--center {
  text-align: center;
}
.rs-th--right {
  text-align: right;
}

.rs-td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0b1c30;
}
.rs-td--center {
  text-align: center;
}
.rs-td--right {
  text-align: right;
}
.rs-td--mono {
  font-family: 'Roboto Mono', monospace;
  color: #767683;
  font-size: 13px;
}
.rs-td--bold {
  font-weight: 700;
}
.rs-td--muted {
  color: #767683;
}
.rs-td--loading,
.rs-td--empty {
  padding: 40px 16px;
}
.rs-empty-icon {
  display: block;
  font-size: 36px;
  color: #c6c5d4;
  margin: 0 auto 8px;
  font-variation-settings:
    'FILL' 0,
    'wght' 300,
    'GRAD' 0,
    'opsz' 48;
}

/* Hover de fila */
.rs-tr {
  cursor: pointer;
  transition: background 0.1s ease;
}
.rs-tr:hover td {
  background: #f8f9ff;
}
/* Última fila sin borde inferior */
.rs-tr:last-child td {
  border-bottom: none;
}

/* ── Avatar de iniciales ────────────────────────────────────────────── */
.rs-cajero-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.rs-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
  text-transform: uppercase;
}
.rs-cajero-name {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #0b1c30;
}

/* ── Diferencia colores ─────────────────────────────────────────────── */
.rs-negative {
  color: #b7131a;
}
.rs-positive {
  color: #2e7d32;
}
.rs-zero {
  color: #2e7d32;
}

/* ── Botón PDF ──────────────────────────────────────────────────────── */
.rs-btn-pdf {
  background: none;
  border: none;
  cursor: pointer;
  color: #1a237e;
  padding: 4px;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-btn-pdf:hover {
  background: #e0e0ff;
}
.rs-btn-pdf--loading {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Paginación ─────────────────────────────────────────────────────── */
.rs-pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
}
</style>
