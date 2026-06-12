<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableProps } from 'quasar'
import { userService } from '@/services/userService'
import type { UserListItem } from '@/types/user'
import type { UserRole } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()

const rows = ref<UserListItem[]>([])
const loading = ref(false)
const search = ref('')
const roleFilter = ref<UserRole | ''>('')
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 })

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' as const, sortable: false },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' as const, sortable: false },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left' as const, sortable: false },
  {
    name: 'isActive',
    label: 'Estado',
    field: 'isActive',
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'createdAt',
    label: 'Creado',
    field: 'createdAt',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'actions',
    label: 'Acciones',
    field: 'actions',
    align: 'center' as const,
    sortable: false,
  },
]

const roleOptions: { label: string; value: UserRole | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
]

async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const response = await userService.listUsers({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: search.value || undefined,
      role: roleFilter.value || undefined,
    })
    rows.value = response.items
    pagination.value.rowsNumber = response.total
  } catch {
    $q.notify({ type: 'negative', message: 'Error al cargar usuarios.' })
  } finally {
    loading.value = false
  }
}

async function toggleStatus(user: UserListItem): Promise<void> {
  try {
    await userService.toggleUserStatus(user.id, !user.isActive)
    user.isActive = !user.isActive
    $q.notify({
      type: 'positive',
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'}.`,
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cambiar el estado del usuario.' })
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function onRequest(props: Parameters<NonNullable<QTableProps['onRequest']>>[0]): void {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<template>
  <q-page padding>
    <div class="flex items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold">Usuarios</div>
      <q-btn
        color="primary"
        icon="person_add"
        label="Registrar usuario"
        @click="router.push({ name: 'sysadmin-users-new' })"
      />
    </div>

    <q-card flat bordered>
      <q-card-section class="row q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          placeholder="Buscar por nombre o correo"
          clearable
          class="col-12 col-sm-5"
          @update:model-value="fetchUsers"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <q-select
          v-model="roleFilter"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          dense
          outlined
          label="Filtrar por rol"
          class="col-12 col-sm-3"
          @update:model-value="fetchUsers"
        />
      </q-card-section>

      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        flat
        @request="onRequest"
      >
        <template #body-cell-roles="{ row }">
          <q-td>
            <q-chip
              v-for="role in row.roles"
              :key="role"
              dense
              color="primary"
              text-color="white"
              class="q-mr-xs"
            >
              {{ role }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-isActive="{ row }">
          <q-td class="text-center">
            <q-badge
              :color="row.isActive ? 'positive' : 'grey'"
              :label="row.isActive ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>

        <template #body-cell-createdAt="{ row }">
          <q-td>{{ formatDate(row.createdAt) }}</q-td>
        </template>

        <template #body-cell-actions="{ row }">
          <q-td class="text-center">
            <q-btn
              flat
              round
              dense
              :icon="row.isActive ? 'person_off' : 'person'"
              :color="row.isActive ? 'negative' : 'positive'"
              :title="row.isActive ? 'Desactivar' : 'Activar'"
              @click="toggleStatus(row)"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width text-center text-grey-6 q-py-xl">
            <q-icon name="group_off" size="48px" class="q-mb-sm" />
            <div>No hay usuarios registrados.</div>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>
