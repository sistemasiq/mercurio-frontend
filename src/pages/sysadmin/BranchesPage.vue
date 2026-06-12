<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { branchService } from '@/services/branchService'
import type { Branch } from '@/types/branch'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const $q = useQuasar()
const router = useRouter()

const allBranches = ref<Branch[]>([])
const loading = ref(false)
const search = ref('')
const pagination = ref({ page: 1, rowsPerPage: 10 })

const activeCount = computed(() => allBranches.value.filter((b) => b.isActive).length)
const alertCount = computed(() => allBranches.value.filter((b) => !b.isActive).length)

const filteredRows = computed(() => {
  if (!search.value) return allBranches.value
  const q = search.value.toLowerCase()
  return allBranches.value.filter((b) => b.nombre.toLowerCase().includes(q))
})

const showingText = computed(() => {
  const total = filteredRows.value.length
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage + 1
  const end = Math.min(pagination.value.page * pagination.value.rowsPerPage, total)
  if (total === 0) return 'Sin resultados'
  return `Mostrando ${start}–${end} de ${total} sucursal${total !== 1 ? 'es' : ''}`
})

const columns = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left' as const, sortable: true },
  {
    name: 'direccion',
    label: 'DIRECCIÓN',
    field: 'direccion',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'telefono',
    label: 'TELÉFONO',
    field: 'telefono',
    align: 'left' as const,
    sortable: false,
  },
  { name: 'status', label: 'ESTADO', field: 'isActive', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'center' as const, sortable: false },
]

async function fetchBranches(): Promise<void> {
  loading.value = true
  try {
    allBranches.value = await branchService.listBranches()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar sucursales.' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchBranches)
</script>

<template>
  <q-page padding class="branches-page">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sucursales</h1>
        <p class="page-sub">Gestión centralizada de ubicaciones físicas y puntos de venta.</p>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="add_business"
        label="Nueva sucursal"
        @click="router.push({ name: 'sysadmin-branches-new' })"
      />
    </div>

    <!-- Stats + search row -->
    <div class="top-row">
      <q-input
        v-model="search"
        dense
        outlined
        placeholder="Buscar por nombre de sucursal..."
        clearable
        class="branch-search"
        @update:model-value="pagination.page = 1"
      >
        <template #prepend><q-icon name="search" color="grey-5" size="16px" /></template>
      </q-input>

      <div class="stats-chips">
        <div class="stat-chip stat-chip--green">
          <q-icon name="check_circle" size="16px" />
          <span>Activas</span>
          <strong>{{ activeCount }}</strong>
        </div>
        <div v-if="alertCount > 0" class="stat-chip stat-chip--orange">
          <q-icon name="warning" size="16px" />
          <span>Alertas</span>
          <strong>{{ alertCount }}</strong>
        </div>
      </div>
    </div>

    <!-- Table -->
    <q-card flat class="table-card">
      <q-table
        v-model:pagination="pagination"
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        flat
        class="branches-table"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body-cell-nombre="{ row }">
          <q-td>
            <div class="branch-cell">
              <div class="branch-avatar" :style="{ background: getAvatarColor(row.nombre) }">
                {{ getInitials(row.nombre) }}
              </div>
              <div>
                <div class="branch-name">{{ row.nombre }}</div>
                <div class="branch-id">ID: {{ row.id.slice(0, 8) }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-direccion="{ row }">
          <q-td>
            <span class="cell-text">{{ row.direccion ?? '—' }}</span>
          </q-td>
        </template>

        <template #body-cell-telefono="{ row }">
          <q-td>
            <span class="cell-text">{{ row.telefono ?? '—' }}</span>
          </q-td>
        </template>

        <template #body-cell-status="{ row }">
          <q-td class="text-center">
            <span
              class="status-badge"
              :class="row.isActive ? 'status-badge--green' : 'status-badge--red'"
            >
              {{ row.isActive ? 'ACTIVA' : 'INACTIVA' }}
            </span>
          </q-td>
        </template>

        <template #body-cell-actions="{ row }">
          <q-td class="text-center">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="grey-6"
              size="sm"
              title="Editar"
              @click="router.push({ name: 'sysadmin-branches-edit', params: { id: row.id } })"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center text-grey-5 q-py-xl">
            <q-icon name="store_mall_directory" size="40px" class="q-mb-sm" />
            <div>No hay sucursales registradas.</div>
          </div>
        </template>

        <template #bottom="{ pagination: pag }">
          <div class="table-footer">
            <span class="showing-text">{{ showingText }}</span>
            <q-pagination
              v-model="pagination.page"
              :max="Math.ceil(filteredRows.length / pag.rowsPerPage)"
              :max-pages="5"
              boundary-numbers
              color="primary"
              size="sm"
            />
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<style scoped>
.branches-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.page-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Top row */
.top-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.branch-search {
  min-width: 260px;
  flex: 1;
  max-width: 400px;
}

.stats-chips {
  display: flex;
  gap: 10px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 13px;
}

.stat-chip strong {
  font-weight: 700;
  font-size: 15px;
}

.stat-chip--green {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.stat-chip--orange {
  background: #fff7ed;
  color: #d97706;
  border: 1px solid #fed7aa;
}

/* Table */
.table-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.table-header-row {
  background: #f8fafc;
}

.table-th {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f1f5f9 !important;
}

/* Branch cell */
.branch-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.branch-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.branch-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #1e293b;
}

.branch-id {
  font-size: 11.5px;
  color: #94a3b8;
}

.cell-text {
  font-size: 13.5px;
  color: #475569;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.status-badge--green {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-badge--red {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

/* Footer */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  width: 100%;
}

.showing-text {
  font-size: 12.5px;
  color: #94a3b8;
}
</style>
