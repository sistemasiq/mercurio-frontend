<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userService } from '@/services/userService'
import type { UserListItem } from '@/types/user'
import type { UserRole } from '@/types/auth'

const $q = useQuasar()
const router = useRouter()

const allUsers = ref<UserListItem[]>([])
const loading = ref(false)
const search = ref('')
const roleFilter = ref<UserRole | ''>('')

const columns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Rol', field: 'role', align: 'left' as const, sortable: true },
  {
    name: 'isActive',
    label: 'Estado',
    field: 'isActive',
    align: 'center' as const,
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'center' as const, sortable: false },
]

const roleOptions: { label: string; value: UserRole | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Administrador Sistema', value: 'AdministradorSistema' },
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Cajero', value: 'Cajero' },
  { label: 'Cocina', value: 'Cocina' },
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
  return result
})

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
        />
      </q-card-section>

      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
        flat
      >
        <template #body-cell-role="{ row }">
          <q-td>
            <q-chip dense color="primary" text-color="white">
              {{ row.role }}
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

        <template #body-cell-actions="{ row }">
          <q-td class="text-center">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              title="Editar"
              @click="router.push({ name: 'sysadmin-users-edit', params: { id: row.id } })"
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
