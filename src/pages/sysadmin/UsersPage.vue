<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import UserFormDialog from '@/components/usuarios/UserFormDialog.vue'
import { userService } from '@/services/userService'
import { branchService } from '@/services/branchService'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import { rolTono } from '@/utils/rolTono'
import type { UserListItem } from '@/types/user'
import type { Branch } from '@/types/branch'
import type { FilterChip } from '@/types/ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const rolesStore = useRolesStore()

const allUsers = ref<UserListItem[]>([])
const branches = ref<Branch[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const roleFilter = ref<string | null>(null)

type Estado = 'todos' | 'activos' | 'inactivos'
const FILTROS: FilterChip<Estado>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const estado = ref<Estado | null>('todos')

const roleOptions = computed(() =>
  rolesStore.roles.filter((r) => r.activo).map((r) => ({ label: r.nombre, value: r.nombre })),
)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allUsers.value.filter(
    (u) =>
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!roleFilter.value || u.role === roleFilter.value) &&
      (estado.value !== 'activos' || u.isActive) &&
      (estado.value !== 'inactivos' || !u.isActive),
  )
})
const filtrando = computed(() => !!search.value || !!roleFilter.value || estado.value !== 'todos')

function limpiarFiltros() {
  search.value = ''
  roleFilter.value = null
  estado.value = 'todos'
}

function sucursalDe(user: UserListItem): string {
  if (!user.branchId) return '—'
  return branches.value.find((b) => b.id === user.branchId)?.nombre ?? '—'
}

function ultimoAccesoDe(user: UserListItem): string {
  if (!user.lastAccess) return 'Nunca'
  return new Date(user.lastAccess).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const columns: QTableColumn[] = [
  { name: 'name', label: 'Usuario', field: 'name', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'role', label: 'Rol', field: 'role', align: 'left', sortable: true },
  { name: 'branch', label: 'Sucursal', field: 'branchId', align: 'left' },
  { name: 'status', label: 'Estado', field: 'isActive', align: 'left', sortable: true },
  { name: 'lastAccess', label: 'Último acceso', field: 'lastAccess', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

async function fetchUsers(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    allUsers.value = await userService.listUsers()
  } catch {
    error.value = 'No se pudieron cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  void fetchUsers()
  if (rolesStore.roles.length === 0) void rolesStore.cargar()
  try {
    branches.value = await branchService.listBranches()
  } catch {
    Notify.create({ type: 'warning', message: 'No se pudieron cargar las sucursales.' })
  }
})

// ── Alta / edición ──────────────────────────────────────────────────────────
const formAbierto = ref(false)
const editandoId = ref<string | null>(null)

function abrirCrear() {
  editandoId.value = null
  formAbierto.value = true
}

function abrirEditar(id: string) {
  editandoId.value = id
  formAbierto.value = true
}

// Accesos directos /usuarios/nuevo y /usuarios/:id/editar (redirigen aquí).
watch(
  () => route.query,
  (q) => {
    if (q.nuevo && auth.hasPermission('usuarios:crear')) abrirCrear()
    else if (typeof q.editar === 'string' && auth.hasPermission('usuarios:editar'))
      abrirEditar(q.editar)
    else return
    router.replace({ query: {} })
  },
  { immediate: true },
)

// ── Eliminación ─────────────────────────────────────────────────────────────
const eliminarAbierto = ref(false)
const eliminando = ref(false)
const usuarioAEliminar = ref<{ id: string; name: string } | null>(null)

function confirmarEliminar(user: { id: string; name: string }) {
  usuarioAEliminar.value = user
  eliminarAbierto.value = true
}

function eliminarDesdeFormulario() {
  const user = allUsers.value.find((u) => u.id === editandoId.value)
  if (!user) return
  formAbierto.value = false
  confirmarEliminar(user)
}

async function eliminar() {
  if (!usuarioAEliminar.value) return
  eliminando.value = true
  try {
    await userService.deleteUser(usuarioAEliminar.value.id)
    Notify.create({ type: 'positive', message: 'Usuario eliminado.' })
    eliminarAbierto.value = false
    await fetchUsers()
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo eliminar el usuario.' })
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <q-page class="page-content list-page">
    <PageHeader title="Usuarios" subtitle="Cuentas con acceso al sistema.">
      <template #actions>
        <q-btn
          v-if="auth.hasPermission('usuarios:crear')"
          unelevated
          color="primary"
          icon="person_add"
          label="Registrar usuario"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <DataTableCard
      v-model:search="search"
      v-model:filter="estado"
      :filters="FILTROS"
      search-placeholder="Buscar por nombre o email"
      :count="`${filteredRows.length} usuarios`"
    >
      <template #toolbar>
        <q-select
          v-model="roleFilter"
          dense
          outlined
          clearable
          emit-value
          map-options
          :options="roleOptions"
          :display-value="roleFilter ?? 'Todos los roles'"
          class="role-filter"
          aria-label="Filtrar por rol"
        />
      </template>
      <StateBlock
        v-if="error"
        variant="error"
        :body="error"
        action-label="Reintentar"
        @action="fetchUsers"
      />
      <q-table
        v-else
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-name="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.name }}</q-td>
        </template>
        <template #body-cell-email="props">
          <q-td :props="props" class="cell-muted">{{ props.row.email }}</q-td>
        </template>
        <template #body-cell-role="props">
          <q-td :props="props">
            <StatusBadge :tone="rolTono(props.row.role)" :label="props.row.role" />
          </q-td>
        </template>
        <template #body-cell-branch="props">
          <q-td :props="props" class="cell-muted">{{ sucursalDe(props.row) }}</q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.isActive ? 'ok' : 'off'"
              :label="props.row.isActive ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>
        <template #body-cell-lastAccess="props">
          <q-td :props="props" class="cell-muted">{{ ultimoAccesoDe(props.row) }}</q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="auth.hasPermission('usuarios:editar')"
              flat
              round
              dense
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row.id)"
            />
            <q-btn
              v-if="auth.hasPermission('usuarios:editar')"
              flat
              round
              dense
              icon="delete"
              class="action-btn"
              aria-label="Eliminar"
              @click="confirmarEliminar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay usuarios registrados'"
            :action-label="filtrando ? 'Limpiar filtros' : undefined"
            @action="limpiarFiltros"
          />
        </template>
      </q-table>
    </DataTableCard>

    <UserFormDialog
      v-model="formAbierto"
      :user-id="editandoId"
      :branches="branches"
      @saved="fetchUsers"
      @eliminar="eliminarDesdeFormulario"
    />

    <BaseDialog
      v-model="eliminarAbierto"
      title="Eliminar usuario"
      :subtitle="usuarioAEliminar?.name"
      icon="person_remove"
      tone="red"
      danger
      :width="460"
      primary-label="Eliminar"
      :loading="eliminando"
      @confirm="eliminar"
    >
      <p class="dlg-text">
        ¿Eliminar a "{{ usuarioAEliminar?.name }}"? Esta acción no se puede deshacer.
      </p>
    </BaseDialog>
  </q-page>
</template>

<style scoped lang="scss">
.role-filter {
  width: 190px;
}

.dlg-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}
</style>
