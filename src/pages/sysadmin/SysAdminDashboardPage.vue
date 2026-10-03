<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { Notify } from 'quasar'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import type { UserListItem } from '@/types/user'
import type { Branch } from '@/types/branch'
import type { FilterChip } from '@/types/ui'

const router = useRouter()

// Exportar indicadores (C2): mismo rango por defecto que DetailBranchPage.vue
// (el mes en curso).
function primerDiaDelMes(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`
}
function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}
const exportandoId = ref<string | null>(null)

async function exportarIndicadores(branch: Branch) {
  exportandoId.value = branch.id
  try {
    await branchService.exportarIndicadores(
      branch.id,
      primerDiaDelMes(),
      hoyIso(),
      `indicadores_${branch.clave ?? branch.id}.csv`,
    )
  } catch {
    Notify.create({ type: 'negative', message: 'Error al exportar los indicadores.' })
  } finally {
    exportandoId.value = null
  }
}

const users = ref<UserListItem[]>([])
const branches = ref<Branch[]>([])
const loading = ref(true)
const error = ref('')
const busqueda = ref('')

type Filtro = 'todas' | 'activas' | 'inactivas'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Activas', value: 'activas' },
  { label: 'Inactivas', value: 'inactivas' },
]
const filtro = ref<Filtro | null>('todas')

const activeBranches = computed(() => branches.value.filter((b) => b.isActive).length)
const inactiveBranches = computed(() => branches.value.length - activeBranches.value)
const activeUsers = computed(() => users.value.filter((u) => u.isActive).length)
const sinAdministrador = computed(
  () => branches.value.filter((b) => b.isActive && !b.administradorId).length,
)

const usuariosPorSucursal = computed(() => {
  const conteo = new Map<string, number>()
  for (const u of users.value) {
    if (u.branchId) conteo.set(u.branchId, (conteo.get(u.branchId) ?? 0) + 1)
  }
  return conteo
})

const filas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return branches.value
    .filter(
      (b) =>
        (!q || b.nombre.toLowerCase().includes(q) || (b.clave ?? '').toLowerCase().includes(q)) &&
        (filtro.value !== 'activas' || b.isActive) &&
        (filtro.value !== 'inactivas' || !b.isActive),
    )
    .map((b) => ({ ...b, usuarios: usuariosPorSucursal.value.get(b.id) ?? 0 }))
})

const totalAsignados = computed(() =>
  [...usuariosPorSucursal.value.values()].reduce((s, n) => s + n, 0),
)
const participacion = (n: number): number =>
  totalAsignados.value ? Math.round((n / totalAsignados.value) * 100) : 0

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Sucursal', field: 'nombre', align: 'left', sortable: true },
  { name: 'admin', label: 'Administrador', field: 'administradorName', align: 'left' },
  { name: 'usuarios', label: 'Usuarios', field: 'usuarios', align: 'right', sortable: true },
  { name: 'participacion', label: 'Participación de usuarios', field: 'usuarios', align: 'left' },
  { name: 'estado', label: 'Estado', field: 'isActive', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    const [u, b] = await Promise.all([userService.listUsers(), branchService.listBranches()])
    users.value = u
    branches.value = b
  } catch {
    error.value = 'No se pudieron cargar los datos del reporte.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <q-page class="page-content list-page">
    <PageHeader title="Reportes" subtitle="Indicadores generales de la franquicia." />

    <div class="kpi-row">
      <KpiCard
        label="Sucursales activas"
        icon="store"
        :value="loading ? '—' : activeBranches"
        :note="`de ${branches.length} registradas`"
      />
      <KpiCard
        label="Sucursales inactivas"
        icon="block"
        :value="loading ? '—' : inactiveBranches"
        :note-tone="inactiveBranches > 0 ? 'warn' : undefined"
        :note="inactiveBranches > 0 ? 'revisar' : 'sin pendientes'"
      />
      <KpiCard
        label="Usuarios"
        icon="group"
        :value="loading ? '—' : users.length"
        :note="`${activeUsers} activos`"
        note-tone="ok"
      />
      <KpiCard
        label="Sin administrador"
        icon="person_off"
        :value="loading ? '—' : sinAdministrador"
        :note="sinAdministrador > 0 ? 'sucursales activas' : 'todas asignadas'"
        :note-tone="sinAdministrador > 0 ? 'warn' : 'ok'"
      />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      :filters="FILTROS"
      search-placeholder="Buscar sucursal"
      :count="`${activeBranches} sucursales activas`"
    >
      <StateBlock
        v-if="error"
        variant="error"
        :body="error"
        action-label="Reintentar"
        @action="cargar"
      />
      <q-table
        v-else
        :rows="filas"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props">
            <div class="text-weight-bold">{{ props.row.nombre }}</div>
            <div class="cell-sub">{{ props.row.clave ?? '—' }}</div>
          </q-td>
        </template>
        <template #body-cell-admin="props">
          <q-td :props="props" :class="{ 'cell-muted': !props.row.administradorName }">
            {{ props.row.administradorName ?? 'Sin asignar' }}
          </q-td>
        </template>
        <template #body-cell-usuarios="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.usuarios }}</q-td>
        </template>
        <template #body-cell-participacion="props">
          <q-td :props="props">
            <div class="share-bar">
              <div class="share-bar__track">
                <div
                  class="share-bar__fill"
                  :style="{ width: `${participacion(props.row.usuarios)}%` }"
                />
              </div>
              <span class="share-bar__value">{{ participacion(props.row.usuarios) }}%</span>
            </div>
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.isActive ? 'ok' : 'off'"
              :label="props.row.isActive ? 'Activa' : 'Inactiva'"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="download"
              class="action-btn"
              aria-label="Exportar indicadores"
              :loading="exportandoId === props.row.id"
              @click="exportarIndicadores(props.row)"
            >
              <q-tooltip>Exportar indicadores del mes</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="open_in_new"
              class="action-btn"
              aria-label="Ver sucursal"
              @click="router.push({ name: 'sucursales-detalle', params: { id: props.row.id } })"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="busqueda || filtro !== 'todas' ? 'no-results' : 'empty'"
            :title="busqueda || filtro !== 'todas' ? undefined : 'No hay sucursales registradas'"
          />
        </template>
      </q-table>
    </DataTableCard>
  </q-page>
</template>

<style scoped lang="scss">
.share-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;

  &__track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--border-soft);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: var(--q-primary);
  }

  &__value {
    width: 36px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-body);
    text-align: right;
  }
}
</style>
