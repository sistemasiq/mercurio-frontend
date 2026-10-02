<template>
  <q-page class="page-content list-page historial-layout-wrapper">
    <PageHeader
      title="Historial de Ventas"
      subtitle="Órdenes cobradas en caja, estancias y eventos."
    >
      <template #actions>
        <q-btn outline icon="sync" label="Actualizar" :loading="isLoading" @click="cargarDatos" />
      </template>
    </PageHeader>

    <div class="kpi-row">
      <KpiCard label="Ingresos" :value="formatearMonto(estadisticas.total_ventas)" />
      <KpiCard label="Órdenes" :value="estadisticas.total_ordenes" />
      <KpiCard label="Ticket promedio" :value="formatearMonto(estadisticas.ticket_promedio)" />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtroTiempoChip"
      search-placeholder="Buscar folio o cliente"
      :filters="FILTROS_TIEMPO"
      :count="`${transaccionesFiltradas.length} órdenes · ${formatearMonto(totalFiltrado)}`"
    >
      <template #toolbar>
        <q-select
          v-model="filtroEstado"
          :options="OPCIONES_ESTADO"
          emit-value
          map-options
          outlined
          dense
          class="hist-select"
          aria-label="Estado"
        />
        <q-btn
          outline
          dense
          icon="date_range"
          label="Rango"
          class="hist-range-btn"
          :class="{ 'hist-range-btn--on': mostrarFiltros || fechaInicio || fechaFin }"
          @click="mostrarFiltros = !mostrarFiltros"
        />
      </template>

      <div v-if="mostrarFiltros" class="hist-range">
        <label class="hist-range__field">
          <span class="field-label">Fecha inicio</span>
          <q-input v-model="fechaInicio" type="date" outlined dense />
        </label>
        <label class="hist-range__field">
          <span class="field-label">Fecha fin</span>
          <q-input v-model="fechaFin" type="date" outlined dense />
        </label>
        <q-btn flat icon="close" label="Limpiar" @click="limpiarFiltroFecha" />
        <q-btn
          unelevated
          color="primary"
          icon="check"
          label="Aplicar"
          @click="aplicarFiltroFecha"
        />
      </div>

      <div class="hist-table-wrap">
        <table class="hist-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Métodos</th>
              <th class="text-right">Total</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="7"><StateBlock variant="loading" /></td>
            </tr>
            <tr v-else-if="transaccionesFiltradas.length === 0">
              <td colspan="7">
                <StateBlock
                  :variant="busqueda || filtroEstado !== 'todos' ? 'no-results' : 'empty'"
                  :title="
                    busqueda || filtroEstado !== 'todos'
                      ? undefined
                      : 'No hay ventas en este período'
                  "
                  :body="
                    busqueda || filtroEstado !== 'todos'
                      ? undefined
                      : 'Prueba con otro rango de fechas.'
                  "
                />
              </td>
            </tr>
            <tr v-for="tx in transaccionesPaginadas" v-else :key="tx.referencia_id">
              <td>
                <span class="code-chip">{{ tx.ticket_numero ?? tx.titulo }}</span>
              </td>
              <td>
                <span class="hist-table__strong">{{ tx.titulo }}</span>
                <span class="cell-sub">
                  <q-icon :name="infoTipo(tx.tipo_origen).icon" size="12px" />
                  {{ infoTipo(tx.tipo_origen).label }}
                </span>
              </td>
              <td class="cell-muted">{{ formatearFecha(tx.creado) }}</td>
              <td>
                <span v-for="(mp, idx) in tx.metodos_pago" :key="idx" class="hist-method">
                  {{ mp.metodo_pago_nombre }}
                  <span class="cell-muted">{{ formatearMonto(mp.monto) }}</span>
                </span>
              </td>
              <td class="text-right hist-table__num">
                {{ formatearMonto(Number(tx.total_final || 0)) }}
              </td>
              <td>
                <StatusBadge
                  :tone="tonoEstado(tx.tipo_origen, tx.estado_actual)"
                  :label="textoEstado(tx.tipo_origen, tx.estado_actual)"
                />
              </td>
              <td class="hist-table__actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="receipt_long"
                  class="action-btn"
                  aria-label="Ver detalle"
                  @click="verDetalleOrden(tx.tipo_origen, tx.referencia_id, tx.estado_actual)"
                />
                <q-btn
                  v-if="tx.tipo_origen === 'comanda'"
                  flat
                  round
                  dense
                  icon="more_vert"
                  class="action-btn"
                  aria-label="Más acciones"
                >
                  <q-menu anchor="bottom right" self="top right">
                    <q-list dense style="min-width: 180px">
                      <q-item
                        v-close-popup
                        clickable
                        :disable="esEstadoFinal(tx.estado_actual)"
                        @click="imprimirDirecto(tx.tipo_origen, tx.referencia_id)"
                      >
                        <q-item-section avatar><q-icon name="print" size="19px" /></q-item-section>
                        <q-item-section>Imprimir</q-item-section>
                      </q-item>
                      <q-item
                        v-if="esEditable(tx.estado_actual)"
                        v-close-popup
                        clickable
                        @click="abrirEditar(tx.comanda_id!)"
                      >
                        <q-item-section avatar><q-icon name="edit" size="19px" /></q-item-section>
                        <q-item-section>Editar orden</q-item-section>
                      </q-item>
                      <q-item
                        v-if="!esEstadoFinal(tx.estado_actual)"
                        v-close-popup
                        clickable
                        class="text-negative"
                        @click="abrirCancelar(tx.comanda_id!)"
                      >
                        <q-item-section avatar><q-icon name="block" size="19px" /></q-item-section>
                        <q-item-section>Cancelar orden</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePager
        v-model="paginaActual"
        :total="transaccionesFiltradas.length"
        :per-page="itemsPorPagina"
        noun="órdenes"
      />
    </DataTableCard>

    <DetalleOrdenPagada
      v-if="mostrarModalPagado"
      :tipo-origen="detalleTipoOrigen"
      :referencia-id="detalleReferenciaId"
      :auto-print="modoImpresion"
      @close="onCerrarDetallePagado"
    />
    <EditarOrdenModal
      v-if="mostrarModalEditar"
      :comanda-id="comandaSeleccionadaId"
      @close="mostrarModalEditar = false"
      @orden-actualizada="onOrdenActualizada"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useQuasar } from 'quasar'
import DetalleOrdenPagada from './DetalleOrdenPagada.vue'
import EditarOrdenModal from './EditarOrdenModal.vue'
import MotivoCancelacionDialog from './MotivoCancelacionDialog.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import TablePager from '@/components/ui/TablePager.vue'
import type { FilterChip, UiTone } from '@/types/ui'
import { formatMXN } from '@/utils/formatoMoneda'
import { mensajeDeError, resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
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
const detalleTipoOrigen = ref<'comanda' | 'estancia' | 'reservacion'>('comanda')
const detalleReferenciaId = ref('')
const estadisticas = ref<Estadisticas>({ total_ventas: 0, total_ordenes: 0, ticket_promedio: 0 })
const mostrarFiltros = ref(false)
const fechaInicio = ref('')
const fechaFin = ref('')
const busqueda = ref('')
const paginaActual = ref(1)
const itemsPorPagina = 20
const modoImpresion = ref(false)
let controladorFetch: AbortController | null = null

function cargarDatos() {
  if (controladorFetch) controladorFetch.abort()
  controladorFetch = new AbortController()
  const signal = controladorFetch.signal

  isLoading.value = true
  const fi = fechaInicio.value || undefined
  const ff = fechaFin.value || undefined
  Promise.all([
    obtenerHistorial(filtroTiempo.value, filtroEstado.value, signal, fi, ff),
    obtenerEstadisticas(filtroTiempo.value, signal, fi, ff),
  ])
    .then(([txs, stats]) => {
      if (!signal.aborted) {
        transacciones.value = txs
        estadisticas.value = stats
      }
    })
    .catch((err: unknown) => {
      if (signal.aborted) return
      console.error('[HistorialView] cargarDatos:', err)
      $q.notify({
        type: 'negative',
        message: 'No se pudo cargar el historial.',
        caption: resolveErrorMessage(err as ApiError),
        position: 'top',
        timeout: 4000,
      })
    })
    .finally(() => {
      if (!signal.aborted) isLoading.value = false
    })
}

onMounted(cargarDatos)

onBeforeUnmount(() => {
  if (controladorFetch) controladorFetch.abort()
})

watch([filtroTiempo, filtroEstado], cargarDatos)

watch(busqueda, () => {
  paginaActual.value = 1
})

const transaccionesFiltradas = computed(() => {
  const term = busqueda.value.trim().toLowerCase()
  if (!term) return transacciones.value
  return transacciones.value.filter(
    (tx) =>
      tx.titulo.toLowerCase().includes(term) ||
      tx.tipo_origen.toLowerCase().includes(term) ||
      tx.metodos_pago.some((mp) => mp.metodo_pago_nombre.toLowerCase().includes(term)),
  )
})

const transaccionesPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina
  return transaccionesFiltradas.value.slice(inicio, inicio + itemsPorPagina)
})

function aplicarFiltroFecha() {
  mostrarFiltros.value = false
  paginaActual.value = 1
  cargarDatos()
}

function limpiarFiltroFecha() {
  fechaInicio.value = ''
  fechaFin.value = ''
  mostrarFiltros.value = false
  paginaActual.value = 1
  cargarDatos()
}

const verDetalleOrden = (tipoOrigen: string, referenciaId: string, _estado: string) => {
  detalleTipoOrigen.value = tipoOrigen as 'comanda' | 'estancia' | 'reservacion'
  detalleReferenciaId.value = referenciaId
  mostrarModalPagado.value = true
}

function infoTipo(tipo: string): { label: string; icon: string; clase: string } {
  if (tipo === 'estancia')
    return { label: 'Estancia', icon: 'child_care', clase: 'tipo-badge-estancia' }
  if (tipo === 'reservacion')
    return { label: 'Evento', icon: 'event', clase: 'tipo-badge-reservacion' }
  return { label: 'Pedido', icon: 'receipt_long', clase: 'tipo-badge-comanda' }
}

function obtenerClaseEstado(tipoOrigen: string, estado: string): string {
  const e = tipoOrigen === 'reservacion' ? estado.toLowerCase() : estado.toUpperCase()
  if (tipoOrigen === 'reservacion') {
    if (e === 'cancelada') return 'status-cancelado'
    if (e === 'pendiente') return 'status-pendiente'
    if (e === 'en_curso') return 'status-proceso'
    return 'status-listo'
  }
  if (tipoOrigen === 'estancia') {
    if (e === 'P') return 'status-pendiente'
    if (e === 'A') return 'status-proceso'
    return 'status-entregado'
  }
  if (e === 'C') return 'status-cancelado'
  if (e === 'P') return 'status-pendiente'
  if (e === 'E') return 'status-proceso'
  if (e === 'L') return 'status-listo'
  if (e === 'T') return 'status-entregado'
  return 'status-cancelado'
}

function textoEstado(tipoOrigen: string, estado: string): string {
  if (tipoOrigen === 'reservacion') {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      en_curso: 'En curso',
      completada: 'Completada',
      cancelada: 'Cancelada',
    }
    return map[estado.toLowerCase()] ?? estado
  }
  if (tipoOrigen === 'estancia') {
    const map: Record<string, string> = { P: 'Pendiente', A: 'Activo', C: 'Cerrado' }
    return map[estado.toUpperCase()] ?? estado
  }
  const map: Record<string, string> = {
    P: 'Pendiente',
    E: 'En preparación',
    L: 'Listo',
    T: 'Entregado',
    C: 'Cancelado',
  }
  return map[estado.toUpperCase()] ?? estado
}

// Tono del badge a partir de la clase de estado existente.
const TONO_POR_CLASE: Record<string, UiTone> = {
  'status-cancelado': 'bad',
  'status-pendiente': 'warn',
  'status-proceso': 'info',
  'status-listo': 'ok',
  'status-entregado': 'ok',
}
function tonoEstado(tipoOrigen: string, estado: string): UiTone {
  return TONO_POR_CLASE[obtenerClaseEstado(tipoOrigen, estado)] ?? 'off'
}

type FiltroTiempo = 'hoy' | 'semana' | 'mes'
const FILTROS_TIEMPO: FilterChip<FiltroTiempo>[] = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Semana', value: 'semana' },
  { label: 'Mes', value: 'mes' },
]
const filtroTiempoChip = computed<FiltroTiempo | null>({
  get: () => filtroTiempo.value,
  set: (v) => {
    if (v) filtroTiempo.value = v
  },
})
const OPCIONES_ESTADO = [
  { label: 'Todos los estados', value: 'todos' },
  { label: 'Pagado', value: 'pagado' },
  { label: 'Cancelado', value: 'cancelado' },
]

const totalFiltrado = computed(() =>
  transaccionesFiltradas.value.reduce((s, t) => s + Number(t.total_final || 0), 0),
)

function formatearMonto(monto: number): string {
  return formatMXN(Number(monto || 0))
}

function formatearFecha(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const mes = d.toLocaleString('es', { month: 'short' })
  return `${hh}:${mm} - ${dd} ${mes}`
}

const imprimirDirecto = (tipoOrigen: string, referenciaId: string) => {
  modoImpresion.value = true
  verDetalleOrden(tipoOrigen, referenciaId, '')
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
      const msg = mensajeDeError(err, 'No se pudo cancelar la orden.')
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

function onCerrarDetallePagado() {
  mostrarModalPagado.value = false
  modoImpresion.value = false
}
</script>

<style scoped lang="scss">
.hist-select {
  width: 190px;

  :deep(.q-field__control) {
    height: 34px;
    min-height: 34px;
  }

  :deep(.q-field__marginal),
  :deep(.q-field__native) {
    height: 34px;
    min-height: 34px;
    font-size: 13px;
    font-weight: 700;
  }
}

.hist-range-btn {
  min-height: 34px;
  padding: 0 10px;
  font-size: 13px;

  &--on {
    background: var(--tone-info-bg);
    color: var(--q-primary) !important;
  }
}

.hist-range {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--bg-subtle);

  &__field {
    display: flex;
    flex-direction: column;
    width: 180px;
  }
}

.hist-table-wrap {
  overflow-x: auto;
}

.hist-table {
  width: 100%;
  border-collapse: collapse;

  th {
    height: 40px;
    padding: 0 16px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-soft);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
    text-align: left;
    white-space: nowrap;
  }

  td {
    height: 58px;
    padding: 8px 16px;
    border-bottom: 1px solid #f1f3f7;
    font-size: 13.5px;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    vertical-align: middle;
  }

  tbody tr:hover td {
    background: #fafbfd;
  }

  &__strong {
    display: block;
    font-weight: 700;
  }

  &__num {
    font-weight: 700;
  }

  th.text-right {
    text-align: right;
  }

  &__actions {
    text-align: right;
    white-space: nowrap;
  }
}

.hist-method {
  display: block;
  white-space: nowrap;
}
</style>
