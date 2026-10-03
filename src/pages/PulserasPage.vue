<template>
  <q-page class="page-content list-page">
    <PageHeader title="Pulseras" subtitle="Pulseras RFID registradas en la sucursal.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Agregar pulseras"
          @click="irARegistro"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="kpi-row">
      <KpiCard label="Total" :value="store.pulseras.length" />
      <KpiCard
        label="Disponibles"
        :value="totalDisponibles"
        note="listas para usar"
        note-tone="ok"
      />
      <KpiCard
        label="Usadas"
        :value="totalUsadas"
        :note="totalUsadas ? 'asignadas actualmente' : undefined"
        note-tone="info"
      />
      <KpiCard
        label="Inactivas"
        :value="totalInactivas"
        :note="totalInactivas ? 'fuera de uso' : undefined"
        note-tone="bad"
      />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtroEstado"
      search-placeholder="Buscar código"
      :filters="FILTROS"
      :count="`${pulserasFiltradas.length} pulseras`"
    >
      <StateBlock
        v-if="store.error"
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="cargar"
      />
      <q-table
        v-else
        :rows="pulserasEnPagina"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        hide-pagination
        :rows-per-page-options="[0]"
      >
        <template #body-cell-pulsera_rfid="props">
          <q-td :props="props">
            <span class="code-chip">{{ props.row.pulsera_rfid }}</span>
          </q-td>
        </template>
        <template #body-cell-creado="props">
          <q-td :props="props">{{ formatearFecha(props.row.creado) }}</q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="!props.row.activo ? 'off' : props.row.usada ? 'info' : 'ok'"
              :label="!props.row.activo ? 'Inactiva' : props.row.usada ? 'Usada' : 'Disponible'"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.row.activo"
              dense
              :aria-label="props.row.activo ? 'Desactivar' : 'Activar'"
              @update:model-value="toggleActivo(props.row)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete"
              class="action-btn"
              aria-label="Eliminar"
              :disable="!props.row.activo"
              @click="confirmarEliminar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="busqueda || filtroEstado !== 'todas' ? 'no-results' : 'empty'"
            :title="
              busqueda || filtroEstado !== 'todas' ? undefined : 'No hay pulseras registradas'
            "
            :body="
              busqueda || filtroEstado !== 'todas'
                ? undefined
                : 'Registra las primeras para usarlas en el control de acceso.'
            "
            :action-label="
              busqueda || filtroEstado !== 'todas' ? 'Limpiar filtros' : 'Agregar pulseras'
            "
            @action="
              busqueda || filtroEstado !== 'todas'
                ? ((busqueda = ''), (filtroEstado = 'todas'))
                : irARegistro()
            "
          />
        </template>
      </q-table>
      <TablePager
        v-model="paginaActual"
        :total="pulserasFiltradas.length"
        :per-page="porPagina"
        noun="pulseras"
      />
    </DataTableCard>

    <BaseDialog
      v-model="dialogEliminar"
      title="Eliminar pulsera"
      :subtitle="filaEliminar?.pulsera_rfid"
      icon="delete"
      tone="red"
      :width="460"
      primary-label="Eliminar"
      danger
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      Esta acción no se puede deshacer.
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { usePulserasStore } from '@/stores/pulseras'
import type { PulseraAdmin } from '@/types/pulsera'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import TablePager from '@/components/ui/TablePager.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const store = usePulserasStore()

const irARegistro = () => router.push({ name: 'estancias-pulseras-registro' })

const cargar = () => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

const columns: QTableColumn[] = [
  {
    name: 'pulsera_rfid',
    label: 'Código RFID',
    field: 'pulsera_rfid',
    align: 'left',
    sortable: true,
  },
  { name: 'creado', label: 'Registrada', field: 'creado', align: 'left', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

type FiltroEstado = 'todas' | 'disponibles' | 'usadas' | 'inactivas'
const FILTROS: FilterChip<FiltroEstado>[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Disponibles', value: 'disponibles' },
  { label: 'Usadas', value: 'usadas' },
  { label: 'Inactivas', value: 'inactivas' },
]

// ── Resumen y filtros ─────────────────────────────────────────────────────────

const busqueda = ref('')
const filtroEstado = ref<FiltroEstado | null>('todas')
const paginaActual = ref(1)
const porPagina = 10

const totalDisponibles = computed(() => store.pulseras.filter((p) => p.activo && !p.usada).length)
const totalUsadas = computed(() => store.pulseras.filter((p) => p.activo && p.usada).length)
const totalInactivas = computed(() => store.pulseras.filter((p) => !p.activo).length)

const pulserasFiltradas = computed(() => {
  const q = busqueda.value?.trim().toLowerCase() ?? ''
  return store.pulseras.filter((p) => {
    if (filtroEstado.value === 'disponibles' && (!p.activo || p.usada)) return false
    if (filtroEstado.value === 'usadas' && (!p.activo || !p.usada)) return false
    if (filtroEstado.value === 'inactivas' && p.activo) return false
    return !q || p.pulsera_rfid.toLowerCase().includes(q)
  })
})

const pulserasEnPagina = computed(() =>
  pulserasFiltradas.value.slice(
    (paginaActual.value - 1) * porPagina,
    paginaActual.value * porPagina,
  ),
)

watch([busqueda, filtroEstado], () => {
  paginaActual.value = 1
})

const formatearFecha = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: PulseraAdmin) => {
  try {
    await store.actualizar(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Pulsera ${!row.activo ? 'activada' : 'desactivada'}`,
      position: 'top-right',
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<PulseraAdmin | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: PulseraAdmin) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminar(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Pulsera eliminada', position: 'top-right' })
    dialogEliminar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    eliminando.value = false
  }
}
</script>
