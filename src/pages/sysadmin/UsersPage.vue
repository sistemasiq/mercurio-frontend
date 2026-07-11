<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import type { UserListItem } from '@/types/user'
import type { UserRole } from '@/types/auth'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const $q = useQuasar()
const router = useRouter()

const allUsers = ref<UserListItem[]>([])
const loading = ref(false)
const search = ref('')
const roleFilter = ref<UserRole | ''>('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const pagination = ref({ page: 1, rowsPerPage: 10 })

const ROLE_LABELS: Record<UserRole, string> = {
  AdministradorSistema: 'SISTEMA',
  Administrador: 'ADMIN',
  Cajero: 'CAJERO',
  Cocina: 'COCINA',
}

const ROLE_COLORS: Record<UserRole, string> = {
  AdministradorSistema: '#7c3aed',
  Administrador: '#025FE0',
  Cajero: '#0891b2',
  Cocina: '#d97706',
}

const roleFilters: { label: string; value: UserRole | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Sistema', value: 'AdministradorSistema' },
  { label: 'Admin', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
]

const filteredRows = computed(() => {
  let result = allUsers.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }
  if (roleFilter.value) {
    result = result.filter((u) => u.role === roleFilter.value)
  }
  if (statusFilter.value === 'active') result = result.filter((u) => u.isActive)
  if (statusFilter.value === 'inactive') result = result.filter((u) => !u.isActive)
  return result
})

const showingText = computed(() => {
  const total = filteredRows.value.length
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage + 1
  const end = Math.min(pagination.value.page * pagination.value.rowsPerPage, total)
  if (total === 0) return 'Sin resultados'
  return `Mostrando ${start}–${end} de ${total} usuario${total !== 1 ? 's' : ''}`
})

const columns = [
  { name: 'user', label: 'USUARIO', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'EMAIL', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'ROL', field: 'role', align: 'left' as const, sortable: true },
  { name: 'status', label: 'ESTADO', field: 'isActive', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'center' as const, sortable: false },
]

function setRoleFilter(value: UserRole | ''): void {
  roleFilter.value = value
  pagination.value.page = 1
}

async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    allUsers.value = await userService.listUsers()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar usuarios.' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <q-page padding class="users-page">
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gestión de Usuarios</h1>
        <p class="page-sub">
          Administra los permisos, roles y estados de los usuarios del sistema.
        </p>
      </div>
      <q-btn
        unelevated
        color="primary"
        icon="person_add"
        label="Registrar usuario"
        @click="router.push({ name: 'usuarios-crear' })"
      />
    </div>

    <!-- Filters + stats -->
    <div class="filters-row">
      <div class="filters-left">
        <!-- Search -->
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Buscar usuario, rol o permiso..."
          clearable
          class="filter-search"
        >
          <template #prepend><q-icon name="search" color="grey-5" size="16px" /></template>
        </q-input>

        <!-- Role pills -->
        <div class="role-pills">
          <span class="pills-label">Filtrar por:</span>
          <button
            v-for="f in roleFilters"
            :key="f.value"
            class="pill"
            :class="{ 'pill--active': roleFilter === f.value }"
            @click="setRoleFilter(f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- Status dropdown -->
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          label="Estado"
          style="min-width: 130px"
          @update:model-value="pagination.page = 1"
        />
      </div>

      <!-- Total usuarios card -->
      <div class="total-card">
        <div>
          <div class="total-label">Total Usuarios</div>
          <div class="total-val">{{ allUsers.length.toLocaleString() }}</div>
        </div>
        <div class="total-icon">
          <q-icon name="group" color="primary" size="28px" />
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
        class="users-table"
      >
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body-cell-user="{ row }">
          <q-td>
            <div class="user-cell">
              <div class="user-avatar" :style="{ background: getAvatarColor(row.name) }">
                {{ getInitials(row.name) }}
              </div>
              <div>
                <div class="user-name">{{ row.name }}</div>
                <div class="user-id">ID: {{ row.id.slice(0, 8) }}</div>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-role="{ row }">
          <q-td>
            <span
              class="role-badge"
              :style="{
                background: ROLE_COLORS[row.role as UserRole] + '18',
                color: ROLE_COLORS[row.role as UserRole],
                borderColor: ROLE_COLORS[row.role as UserRole] + '40',
              }"
            >
              {{ ROLE_LABELS[row.role as UserRole] }}
            </span>
          </q-td>
        </template>

        <template #body-cell-status="{ row }">
          <q-td>
            <div class="status-cell">
              <div
                class="status-dot"
                :style="{ background: row.isActive ? '#16a34a' : '#9ca3af' }"
              />
              <span :style="{ color: row.isActive ? '#16a34a' : '#9ca3af' }">
                {{ row.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
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
              @click="router.push({ name: 'usuarios-editar', params: { id: row.id } })"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center text-grey-5 q-py-xl">
            <q-icon name="group_off" size="40px" class="q-mb-sm" />
            <div>No hay usuarios registrados.</div>
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
.users-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
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

/* Filters row */
.filters-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-search {
  min-width: 220px;
}

/* Role pills */
.role-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pills-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}

.pill {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
}

.pill:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.pill--active {
  background: #025fe0;
  border-color: #025fe0;
  color: #fff;
}

/* Total card */
.total-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}

.total-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.total-val {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

/* Table */
.table-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.users-table {
  border-radius: 0;
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

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #1e293b;
}

.user-id {
  font-size: 11.5px;
  color: #94a3b8;
}

/* Role badge */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid;
}

/* Status */
.status-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
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
