<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import { useRolesStore } from '@/stores/roles'
import type { UserListItem } from '@/types/user'
import type { UserRole } from '@/types/auth'
import { getInitials, getAvatarColor } from '@/utils/avatar'

const $q = useQuasar()
const router = useRouter()
const rolesStore = useRolesStore()

const allUsers = ref<UserListItem[]>([])
const loading = ref(false)
const search = ref('')
const roleFilter = ref<UserRole | ''>('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const pagination = ref({ page: 1, rowsPerPage: 10 })

// El color del badge se deriva del nombre del rol (hash determinístico),
// igual que los avatares de usuario: los roles son un catálogo dinámico,
// no un enum cerrado con colores fijos.
const roleColor = (role: string) => getAvatarColor(role)

const roleFilters = computed(() => [
  { label: 'Todos', value: '' },
  ...rolesStore.roles.filter((r) => r.activo).map((r) => ({ label: r.nombre, value: r.nombre })),
])

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

const columns = [
  { name: 'user', label: 'USUARIO', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'EMAIL', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'ROL', field: 'role', align: 'left' as const, sortable: true },
  { name: 'status', label: 'ESTADO', field: 'isActive', align: 'left' as const, sortable: true },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' as const, sortable: false },
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

onMounted(() => {
  fetchUsers()
  if (rolesStore.roles.length === 0) rolesStore.cargar()
})
</script>

<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
          Gestión de Usuarios
        </div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Administra los permisos, roles y estados de los usuarios del sistema.
        </div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="person_add"
        label="Registrar usuario"
        unelevated
        no-caps
        style="border-radius: 8px; font-weight: 600"
        @click="router.push({ name: 'usuarios-crear' })"
      />
    </div>

    <q-card flat bordered style="border-radius: 12px; overflow: hidden">
      <div class="row items-center q-pa-md q-gutter-md">
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Buscar usuario o email..."
          clearable
          style="min-width: 240px"
        >
          <template #prepend><q-icon name="search" color="grey-5" size="16px" /></template>
        </q-input>
        <q-select
          :model-value="roleFilter"
          :options="roleFilters"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          label="Rol"
          style="min-width: 180px"
          @update:model-value="setRoleFilter"
        />
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
      <q-separator />
      <q-table
        v-model:pagination="pagination"
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        flat
        no-data-label="No hay usuarios registrados"
        class="fec-table"
      >
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
                background: roleColor(row.role) + '18',
                color: roleColor(row.role),
                borderColor: roleColor(row.role) + '40',
              }"
            >
              {{ row.role.toUpperCase() }}
            </span>
          </q-td>
        </template>

        <template #body-cell-status="{ row }">
          <q-td>
            <q-badge
              :color="row.isActive ? 'positive' : 'grey-5'"
              :label="row.isActive ? 'Activo' : 'Inactivo'"
              style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
            />
          </q-td>
        </template>

        <template #body-cell-actions="{ row }">
          <q-td class="text-right">
            <q-btn
              flat
              dense
              color="grey-8"
              size="sm"
              class="action-btn"
              @click="router.push({ name: 'usuarios-editar', params: { id: row.id } })"
            >
              <span class="material-symbols-outlined">edit</span>
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<style scoped>
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
  color: var(--text-primary);
}

.user-id {
  font-size: 11.5px;
  color: var(--text-secondary);
}

/* Role badge -- color derivado del nombre del rol (hash determinístico),
   no del enum de la paleta: los roles son un catálogo dinámico. */
.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid;
}
</style>
