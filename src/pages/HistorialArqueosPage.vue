<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Historial de Arqueos
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Registro histórico de cierres de caja autorizados por la Administración.
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          no-caps
          color="grey-8"
          icon="filter_list"
          label="Filtrar"
          style="border-radius: 8px"
          @click="mostrarFiltros = !mostrarFiltros"
        />
      </div>

      <!-- Filtros (colapsables) -->
      <q-card
        v-if="mostrarFiltros"
        flat
        bordered
        class="q-pa-md q-mb-md"
        style="border-radius: 12px"
      >
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-3">
            <div class="field-label">Desde</div>
            <q-input v-model="filtros.fechaDesde" dense outlined type="date" />
          </div>
          <div class="col-12 col-sm-3">
            <div class="field-label">Hasta</div>
            <q-input v-model="filtros.fechaHasta" dense outlined type="date" />
          </div>
          <div class="col-12 col-sm-3">
            <div class="field-label">ID de cajero</div>
            <q-input v-model="filtros.cajeroId" dense outlined placeholder="Ej. usr-042" />
          </div>
          <div class="col-12 col-sm-3 row q-gutter-sm justify-end">
            <q-btn flat no-caps label="Limpiar" color="grey-7" @click="limpiarFiltros" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="search"
              label="Buscar"
              style="border-radius: 8px; font-weight: 600"
              @click="cargar"
            />
          </div>
        </div>
      </q-card>

      <!-- Error -->
      <q-banner v-if="error" rounded class="bg-negative text-white q-mb-md">
        <template #avatar><q-icon name="error" /></template>
        {{ error }}
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="items"
          :columns="columns"
          row-key="id"
          flat
          :loading="cargando"
          hide-pagination
          :rows-per-page-options="[0]"
          no-data-label="No se encontraron arqueos con los filtros actuales"
          class="fec-table"
          @row-click="(_, row) => abrirDetalle((row as ArqueoResumen).id)"
        >
          <template #body-cell-cajero="props">
            <q-td :props="props">
              <div class="row items-center q-gutter-x-sm no-wrap">
                <span
                  class="cajero-avatar"
                  :style="{ background: avatarColor(props.row.cajeroNombre) }"
                >
                  {{ iniciales(props.row.cajeroNombre) }}
                </span>
                <span class="text-weight-medium">{{ props.row.cajeroNombre }}</span>
              </div>
            </q-td>
          </template>

          <template #body-cell-fechaCierre="props">
            <q-td :props="props" class="text-center">{{ formatHora(props.row.fechaCierre) }}</q-td>
          </template>

          <template #body-cell-totalDeclarado="props">
            <q-td :props="props" class="text-right">
              {{ formatMXN(props.row.totalDeclarado) }}
            </q-td>
          </template>

          <template #body-cell-diferenciaNeta="props">
            <q-td
              :props="props"
              class="text-right text-weight-bold"
              :class="claseDiferenciaLocal(props.row.diferenciaNeta)"
            >
              {{ formatDiferencia(props.row.diferenciaNeta) }}
            </q-td>
          </template>

          <template #body-cell-adminNombre="props">
            <q-td :props="props">{{ props.row.adminNombre ?? '—' }}</q-td>
          </template>

          <template #body-cell-pdf="props">
            <q-td :props="props" class="text-center" @click.stop>
              <q-btn
                v-if="props.row.pdfUrl"
                flat
                dense
                color="grey-8"
                size="sm"
                class="action-btn"
                :loading="descargandoId === props.row.id"
                @click="descargarPdf(props.row.id)"
              >
                <span class="material-symbols-outlined">picture_as_pdf</span>
                <q-tooltip>Descargar PDF de {{ props.row.cajeroNombre }}</q-tooltip>
              </q-btn>
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>
        </q-table>

        <!-- Paginación -->
        <div v-if="totalPaginas > 1" class="row justify-center q-py-md">
          <q-pagination
            v-model="paginaActual"
            :max="totalPaginas"
            boundary-numbers
            direction-links
            color="primary"
            @update:model-value="cargar"
          />
        </div>
      </q-card>
    </div>

    <!-- Dialog detalle -->
    <DetalleArqueoDialog v-model="mostrarDetalle" :arqueo-id="arqueoIdSeleccionado" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
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

const columns: QTableColumn[] = [
  { name: 'cajero', label: 'CAJERO', field: 'cajeroNombre', align: 'left' },
  { name: 'sucursalNombre', label: 'SUCURSAL', field: 'sucursalNombre', align: 'left' },
  { name: 'terminal', label: 'CAJA', field: 'terminal', align: 'left' },
  { name: 'fechaCierre', label: 'HORA CIERRE', field: 'fechaCierre', align: 'center' },
  { name: 'totalDeclarado', label: 'TOTAL DECLARADO', field: 'totalDeclarado', align: 'right' },
  { name: 'diferenciaNeta', label: 'DIFERENCIA', field: 'diferenciaNeta', align: 'right' },
  { name: 'adminNombre', label: 'ADMINISTRADOR', field: 'adminNombre', align: 'left' },
  { name: 'pdf', label: 'PDF', field: 'pdfUrl', align: 'center' },
]

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
  if (dif < 0) return 'text-negative'
  return 'text-positive'
}

onMounted(cargar)
</script>

<style scoped>
.cajero-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
}
</style>
