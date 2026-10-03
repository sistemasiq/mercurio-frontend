<template>
  <q-page class="page-content list-page">
    <PageHeader title="Roles" subtitle="Agrupa permisos y asígnalos a usuarios.">
      <template #actions>
        <q-btn
          v-if="puedeEditar"
          unelevated
          color="primary"
          icon="add"
          label="Nuevo rol"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      :filters="FILTROS"
      search-placeholder="Buscar rol"
      :count="`${rolesFiltrados.length} roles`"
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
        :rows="rolesFiltrados"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">
            {{ props.row.nombre }}
            <q-icon
              v-if="!(props.row as RolConPermisos).requiere_sucursal"
              name="lock"
              size="15px"
              class="rol-lock"
            >
              <q-tooltip>Rol protegido del sistema</q-tooltip>
            </q-icon>
          </q-td>
        </template>
        <template #body-cell-descripcion="props">
          <q-td
            :props="props"
            class="cell-muted cell-ellipsis"
            :title="props.row.descripcion ?? ''"
          >
            {{ props.row.descripcion || '—' }}
          </q-td>
        </template>
        <template #body-cell-permisos="props">
          <q-td :props="props">
            <div class="perm-bar">
              <div class="perm-bar__track">
                <div
                  class="perm-bar__fill"
                  :style="{ width: `${pctPermisos(props.row as RolConPermisos)}%` }"
                />
              </div>
              <span class="perm-bar__value">
                {{ (props.row as RolConPermisos).permisos.length }} de {{ totalPermisos }}
              </span>
            </div>
          </q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="props.row.activo ? 'ok' : 'off'"
              :label="props.row.activo ? 'Activo' : 'Inactivo'"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <template v-if="puedeEditar">
              <q-btn
                flat
                round
                dense
                icon="tune"
                class="action-btn"
                aria-label="Permisos"
                @click="abrirPermisos(props.row)"
              />
              <q-btn
                v-if="(props.row as RolConPermisos).requiere_sucursal"
                flat
                round
                dense
                icon="edit"
                class="action-btn"
                aria-label="Editar"
                @click="abrirEditar(props.row)"
              />
              <q-btn
                v-if="(props.row as RolConPermisos).requiere_sucursal && props.row.activo"
                flat
                round
                dense
                icon="block"
                class="action-btn"
                aria-label="Desactivar"
                @click="confirmarDesactivar(props.row)"
              />
              <q-btn
                v-else-if="(props.row as RolConPermisos).requiere_sucursal"
                flat
                round
                dense
                icon="restart_alt"
                class="action-btn"
                aria-label="Reactivar"
                @click="confirmarReactivar(props.row)"
              />
            </template>
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay roles registrados'"
            :action-label="filtrando ? 'Limpiar filtros' : undefined"
            @action="((busqueda = ''), (filtro = 'todos'))"
          />
        </template>
      </q-table>
    </DataTableCard>

    <!-- ── Crear / editar / permisos ─────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogOpen"
      :title="tituloDialog"
      :subtitle="subtituloDialog"
      :icon="modo === 'permisos' ? 'admin_panel_settings' : modo === 'crear' ? 'add' : 'edit'"
      :width="modo === 'editar' ? 520 : 720"
      persistent
      :primary-label="
        modo === 'crear' ? 'Crear rol' : modo === 'permisos' ? 'Guardar permisos' : 'Guardar'
      "
      :primary-disabled="
        (modo !== 'permisos' && !formDialog.nombre.trim()) ||
        (modo === 'permisos' && !!editando && !editando.permisos_editables)
      "
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <template v-if="modo !== 'permisos'">
          <label class="form-grid__field form-grid__field--full">
            <span class="field-label">Nombre</span>
            <q-input
              ref="nombreRef"
              v-model="formDialog.nombre"
              dense
              outlined
              autofocus
              placeholder="Ej. Atención niños"
              hide-bottom-space
              :rules="[(v) => !!v.trim() || 'El nombre es requerido']"
            />
          </label>
          <label class="form-grid__field form-grid__field--full">
            <span class="field-label">Descripción (opcional)</span>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Qué hace este rol dentro del sistema"
            />
          </label>
        </template>

        <template v-if="modo !== 'editar'">
          <div v-if="editando && !editando.permisos_editables" class="perm-note">
            <q-icon name="lock" size="18px" />Este rol siempre tiene todos los permisos.
          </div>
          <q-input
            v-model="busquedaPermiso"
            dense
            outlined
            clearable
            placeholder="Buscar permiso"
            class="form-grid__field--full"
          >
            <template #prepend><q-icon name="search" size="19px" /></template>
          </q-input>

          <div v-if="gruposPermisos.length === 0" class="form-grid__field--full cell-muted">
            No se encontraron permisos.
          </div>

          <template v-for="grupo in gruposPermisos" :key="grupo.modulo">
            <span class="form-grid__section perm-section">
              {{ grupo.modulo }}
              <span class="perm-section__count">{{ grupo.seleccionados }}/{{ grupo.total }}</span>
            </span>
            <label v-for="permiso in grupo.permisos" :key="permiso.id" class="perm-row">
              <span>{{ permiso.nombre }}</span>
              <q-toggle
                v-model="formDialog.permiso_ids"
                :val="permiso.id"
                dense
                color="primary"
                :disable="!!editando && !editando.permisos_editables"
              />
            </label>
          </template>
        </template>
      </div>
    </BaseDialog>

    <!-- ── Desactivar / reactivar ──────────────────────────────────────────── -->
    <BaseDialog
      v-model="dialogDesactivar"
      title="Desactivar rol"
      :subtitle="filaDesactivar?.nombre"
      icon="block"
      tone="red"
      danger
      :width="460"
      primary-label="Desactivar"
      :loading="desactivando"
      @confirm="ejecutarDesactivar"
    >
      <p class="dlg-text">
        Los usuarios que ya lo tienen conservan su acceso, pero no podrás asignarlo a usuarios
        nuevos hasta reactivarlo.
      </p>
    </BaseDialog>

    <BaseDialog
      v-model="dialogReactivar"
      title="Reactivar rol"
      :subtitle="filaReactivar?.nombre"
      icon="restart_alt"
      tone="green"
      :width="460"
      primary-label="Reactivar"
      :loading="reactivando"
      @confirm="ejecutarReactivar"
    >
      <p class="dlg-text">
        Volverá a estar disponible para asignarlo a usuarios con sus
        {{ filaReactivar?.permisos.length ?? 0 }} permisos actuales.
      </p>
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'
import type { RolConPermisos } from '@/types/permission'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useRolesStore()

const puedeEditar = computed(() => authStore.hasPermission('permisos:editar'))

const cargar = async () => {
  await store.cargar()
  if (store.catalogoPermisos.length === 0) await store.cargarCatalogo()
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
  { name: 'permisos', label: 'Permisos', field: 'permisos', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

type Filtro = 'todos' | 'activos' | 'inactivos'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<Filtro | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')
const rolesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.roles.filter(
    (r) =>
      (!q ||
        r.nombre.toLowerCase().includes(q) ||
        (r.descripcion ?? '').toLowerCase().includes(q)) &&
      (filtro.value !== 'activos' || r.activo) &&
      (filtro.value !== 'inactivos' || !r.activo),
  )
})

const totalPermisos = computed(() => store.catalogoPermisos.length)
const pctPermisos = (rol: RolConPermisos): number =>
  totalPermisos.value ? Math.min(100, (rol.permisos.length / totalPermisos.value) * 100) : 0

const busquedaPermiso = ref('')

const gruposPermisos = computed(() => {
  const grupos = new Map<string, typeof store.catalogoPermisos>()
  for (const permiso of store.catalogoPermisos) {
    const lista = grupos.get(permiso.modulo) ?? []
    lista.push(permiso)
    grupos.set(permiso.modulo, lista)
  }

  const termino = busquedaPermiso.value.trim().toLowerCase()
  const seleccionados = new Set(formDialog.value.permiso_ids)

  return Array.from(grupos.entries())
    .map(([modulo, permisos]) => ({
      modulo,
      permisos: termino
        ? permisos.filter((p) => p.nombre.toLowerCase().includes(termino))
        : permisos,
      total: permisos.length,
      seleccionados: permisos.filter((p) => seleccionados.has(p.id)).length,
    }))
    .filter((grupo) => grupo.permisos.length > 0)
})

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const modo = ref<'crear' | 'editar' | 'permisos'>('crear')
const editando = ref<RolConPermisos | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  descripcion: '',
  permiso_ids: [] as number[],
})

const abrirCrear = () => {
  editando.value = null
  modo.value = 'crear'
  formDialog.value = { nombre: '', descripcion: '', permiso_ids: [] }
  busquedaPermiso.value = ''
  dialogOpen.value = true
}

const prepararEdicion = (row: RolConPermisos) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    permiso_ids: row.permisos.map((p) => p.id),
  }
  busquedaPermiso.value = ''
  dialogOpen.value = true
}

const abrirEditar = (row: RolConPermisos) => {
  modo.value = 'editar'
  prepararEdicion(row)
}

const abrirPermisos = (row: RolConPermisos) => {
  modo.value = 'permisos'
  prepararEdicion(row)
}

const tituloDialog = computed(() => {
  if (modo.value === 'crear') return 'Nuevo rol'
  if (modo.value === 'editar') return 'Editar rol'
  return `Permisos · ${editando.value?.nombre ?? ''}`
})
const subtituloDialog = computed(() =>
  modo.value === 'editar'
    ? editando.value?.nombre
    : `${formDialog.value.permiso_ids.length} de ${totalPermisos.value} permisos activos`,
)

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  if (modo.value !== 'permisos' && !formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      const rol = editando.value
      if (modo.value === 'editar' && rol.requiere_sucursal) {
        await store.actualizarMetadata(rol.id, {
          nombre: formDialog.value.nombre.trim(),
          descripcion: formDialog.value.descripcion.trim() || null,
        })
      }
      if (modo.value === 'permisos' && rol.permisos_editables) {
        await store.actualizarPermisos(rol.id, formDialog.value.permiso_ids)
      }
      $q.notify({ type: 'positive', message: 'Rol actualizado' })
    } else {
      await store.crear({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        permiso_ids: formDialog.value.permiso_ids,
      })
      $q.notify({ type: 'positive', message: 'Rol creado' })
    }
    cerrarDialog()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  } finally {
    guardando.value = false
  }
}

// ── Desactivar / Reactivar ──────────────────────────────────────────────────

const dialogDesactivar = ref(false)
const filaDesactivar = ref<RolConPermisos | null>(null)
const desactivando = ref(false)

const confirmarDesactivar = (row: RolConPermisos) => {
  filaDesactivar.value = row
  dialogDesactivar.value = true
}

const ejecutarDesactivar = async () => {
  if (!filaDesactivar.value) return
  desactivando.value = true
  try {
    await store.desactivar(filaDesactivar.value.id)
    $q.notify({ type: 'positive', message: 'Rol desactivado' })
    dialogDesactivar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  } finally {
    desactivando.value = false
  }
}

const dialogReactivar = ref(false)
const filaReactivar = ref<RolConPermisos | null>(null)
const reactivando = ref(false)

const confirmarReactivar = (row: RolConPermisos) => {
  filaReactivar.value = row
  dialogReactivar.value = true
}

const ejecutarReactivar = async () => {
  if (!filaReactivar.value) return
  reactivando.value = true
  try {
    await store.reactivar(filaReactivar.value.id)
    $q.notify({ type: 'positive', message: 'Rol reactivado' })
    dialogReactivar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
    })
  } finally {
    reactivando.value = false
  }
}
</script>

<style scoped lang="scss">
.rol-lock {
  margin-left: 4px;
  color: var(--text-muted);
}

.perm-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;

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
    font-size: 12px;
    font-weight: 700;
    color: var(--text-body);
    white-space: nowrap;
  }
}

.perm-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-transform: capitalize;

  &__count {
    font-weight: 700;
    letter-spacing: 0;
    color: var(--text-muted);
  }
}

.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control);
  font-size: 13.5px;
  color: var(--text-body);
  cursor: pointer;
}

.perm-note {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  background: var(--tone-info-bg);
  color: var(--tone-info-fg);
  font-size: 13px;
  font-weight: 600;
}

.dlg-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--text-secondary);
}
</style>
