<template>
  <q-page class="page-content list-page">
    <PageHeader title="Historial de Arqueos" subtitle="Cierres de caja y sus diferencias.">
      <template #actions>
        <q-btn
          outline
          icon="filter_list"
          label="Filtrar"
          :class="{ 'btn--on': mostrarFiltros }"
          @click="mostrarFiltros = !mostrarFiltros"
        />
      </template>
    </PageHeader>

    <div class="kpi-row">
      <KpiCard label="Cierres" :value="total" />
      <KpiCard
        label="Con diferencia"
        :value="conDiferencia"
        :note="notaPagina ?? `de ${items.length}`"
        note-tone="warn"
      />
      <KpiCard
        label="Diferencia acumulada"
        :value="formatDiferencia(diferenciaAcumulada)"
        :value-color="diferenciaAcumulada < 0 ? 'var(--tone-bad-fg)' : undefined"
        :note="notaPagina"
      />
    </div>

    <div v-if="error" class="list-page__note list-page__note--bad">
      <q-icon name="error" size="19px" />{{ error }}
    </div>

    <DataTableCard hide-search :count="`${total} cierres`">
      <template #toolbar>
        <div v-if="mostrarFiltros" class="arq-filters">
          <label class="arq-filters__field">
            <span class="field-label">Desde</span>
            <q-input v-model="filtros.fechaDesde" dense outlined type="date" />
          </label>
          <label class="arq-filters__field">
            <span class="field-label">Hasta</span>
            <q-input v-model="filtros.fechaHasta" dense outlined type="date" />
          </label>
          <label class="arq-filters__field">
            <span class="field-label">ID de cajero</span>
            <q-input v-model="filtros.cajeroId" dense outlined placeholder="Ej. usr-042" />
          </label>
          <q-btn flat label="Limpiar" @click="limpiarFiltros" />
          <q-btn unelevated color="primary" icon="search" label="Buscar" @click="cargar" />
        </div>
        <span v-else class="arq-hint">Toca un cierre para ver su detalle.</span>
      </template>

      <q-table
        :rows="items"
        :columns="columns"
        row-key="id"
        flat
        :loading="cargando"
        hide-pagination
        :rows-per-page-options="[0]"
        class="arq-table"
        @row-click="(_, row) => abrirDetalle((row as ArqueoResumen).id)"
      >
        <template #body-cell-cajero="props">
          <q-td :props="props">
            <div class="arq-cajero">
              <span class="arq-avatar" :style="{ background: avatarColor(props.row.cajeroNombre) }">
                {{ iniciales(props.row.cajeroNombre) }}
              </span>
              <span class="text-weight-bold">{{ props.row.cajeroNombre }}</span>
            </div>
          </q-td>
        </template>
        <template #body-cell-fechaCierre="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ formatDia(props.row.fechaCierre) }}</span>
            <span class="cell-sub">{{ formatHora(props.row.fechaCierre) }}</span>
          </q-td>
        </template>
        <template #body-cell-totalDeclarado="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(props.row.totalDeclarado) }}
          </q-td>
        </template>
        <template #body-cell-diferenciaNeta="props">
          <q-td
            :props="props"
            class="text-weight-bold"
            :class="claseDiferenciaLocal(props.row.diferenciaNeta)"
          >
            {{ formatDiferencia(props.row.diferenciaNeta) }}
          </q-td>
        </template>
        <template #body-cell-adminNombre="props">
          <q-td :props="props" class="cell-muted">{{ props.row.adminNombre ?? '—' }}</q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" @click.stop>
            <q-btn
              v-if="props.row.pdfUrl"
              flat
              dense
              label="PDF"
              class="arq-pdf"
              :loading="descargandoId === props.row.id"
              :aria-label="`Descargar PDF de ${props.row.cajeroNombre}`"
              @click="descargarPdf(props.row.id)"
            />
            <q-btn
              flat
              round
              dense
              icon="visibility"
              class="action-btn"
              aria-label="Ver detalle"
              @click="abrirDetalle(props.row.id)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            variant="no-results"
            title="Sin arqueos"
            body="No se encontraron cierres con los filtros actuales."
          />
        </template>
      </q-table>
      <TablePager
        v-model="paginaActual"
        :total="total"
        :per-page="PAGE_SIZE"
        noun="cierres"
        @update:model-value="cargar"
      />
    </DataTableCard>

    <DetalleArqueoDialog v-model="mostrarDetalle" :arqueo-id="arqueoIdSeleccionado" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { turnoCajaService } from '@/services/turnoCajaService'
import { mensajeDeError } from '@/utils/errorHandler'
import { formatDiferencia, formatMXN } from '@/utils/formatoMoneda'
import { getAvatarColor, getInitials } from '@/utils/avatar'
import type { ArqueoResumen, FiltrosHistorial } from '@/types/turnoCaja'
import DetalleArqueoDialog from '@/components/cierre-caja/DetalleArqueoDialog.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import TablePager from '@/components/ui/TablePager.vue'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const authStore = useAuthStore()

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

const columns: QTableColumn[] = [
  { name: 'cajero', label: 'Cajero', field: 'cajeroNombre', align: 'left' },
  { name: 'sucursalNombre', label: 'Sucursal', field: 'sucursalNombre', align: 'left' },
  { name: 'terminal', label: 'Caja', field: 'terminal', align: 'left' },
  { name: 'fechaCierre', label: 'Cierre', field: 'fechaCierre', align: 'left' },
  { name: 'totalDeclarado', label: 'Total declarado', field: 'totalDeclarado', align: 'right' },
  { name: 'diferenciaNeta', label: 'Diferencia', field: 'diferenciaNeta', align: 'right' },
  { name: 'adminNombre', label: 'Administrador', field: 'adminNombre', align: 'left' },
  { name: 'acciones', label: '', field: 'id', align: 'right' },
]

// KPIs sobre la página cargada (el historial se pagina en el servidor).
const conDiferencia = computed(() => items.value.filter((a) => a.diferenciaNeta !== 0).length)
const diferenciaAcumulada = computed(() => items.value.reduce((s, a) => s + a.diferenciaNeta, 0))
const notaPagina = computed(() => (total.value > items.value.length ? 'en esta página' : undefined))

// ── Computed ──────────────────────────────────────────────────────────────

// ── Acciones ──────────────────────────────────────────────────────────────
async function cargar() {
  cargando.value = true
  error.value = null
  try {
    const params: FiltrosHistorial = { page: paginaActual.value, pageSize: PAGE_SIZE }
    if (authStore.currentBranchId) params.sucursalId = authStore.currentBranchId
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
    if (filtros.cajeroId) params.cajeroId = filtros.cajeroId
    const resp = await turnoCajaService.listarHistorial(params)
    items.value = resp.items
    total.value = resp.total
  } catch (err) {
    error.value = mensajeDeError(err, 'No se pudo cargar el historial de arqueos.')
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
    $q.notify({ type: 'negative', message: mensajeDeError(err, 'No se pudo descargar el PDF.') })
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

function formatDia(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function claseDiferenciaLocal(dif: number): string {
  if (dif < 0) return 'dif--bad'
  if (dif > 0) return 'dif--ok'
  return ''
}

onMounted(cargar)

// AdministradorSistema no tiene sucursal propia; sin esto, cambiar la sucursal
// en el selector global no volvía a consultar el historial y dejaba visibles
// los resultados de la selección anterior (incluida "todas las sucursales").
watch(
  () => authStore.currentBranchId,
  () => {
    paginaActual.value = 1
    cargar()
  },
)
</script>

<style scoped lang="scss">
.arq-hint {
  font-size: 13px;
  color: var(--text-secondary);
}

.arq-filters {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;

  &__field {
    display: flex;
    flex-direction: column;
    width: 170px;
  }
}

.arq-table :deep(tbody tr) {
  cursor: pointer;
}

.arq-cajero {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arq-avatar {
  width: 30px;
  height: 30px;
  border-radius: 15px;
  color: #fff;
  font-size: 11.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.arq-pdf {
  min-height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  background: #f1f4f9;
  font-size: 11.5px;
  font-weight: 800;
  color: var(--text-body);
}

.dif--bad {
  color: var(--tone-bad-fg);
}

.dif--ok {
  color: var(--tone-ok-fg);
}
</style>
