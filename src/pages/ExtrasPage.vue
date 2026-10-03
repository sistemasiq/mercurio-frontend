<template>
  <q-page class="page-content list-page">
    <PageHeader title="Extras" subtitle="Servicios y artículos adicionales para reservaciones.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Extra"
          :disable="!authStore.currentBranchId"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar extra"
      :filters="FILTROS"
      :count="`${extrasVisibles.length} extras`"
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
        :rows="extrasVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-precio="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(Number(props.row.precio)) }}
          </q-td>
        </template>
        <template #body-cell-unidad="props">
          <q-td :props="props">{{ etiquetaUnidad(props.row.unidad) }}</q-td>
        </template>
        <template #body-cell-descripcion="props">
          <q-td
            :props="props"
            class="cell-muted cell-ellipsis"
            :title="props.row.descripcion ?? ''"
          >
            {{ props.row.descripcion }}
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
              icon="edit"
              class="action-btn"
              aria-label="Editar"
              @click="abrirEditar(props.row)"
            />
            <q-btn
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
            :title="filtrando ? undefined : 'No hay extras registrados'"
            :body="filtrando ? undefined : 'Crea el primero para ofrecerlo en reservaciones.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nuevo Extra'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar extra' : 'Nuevo extra'"
      :subtitle="editando ? editando.nombre : 'Se mostrará al crear o cerrar una reservación.'"
      icon="add_box"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Guardar extra'"
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Nombre</span>
          <q-input
            ref="nombreRef"
            v-model="formDialog.nombre"
            dense
            outlined
            autofocus
            placeholder="Ej. Decoración temática"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Precio</span>
          <q-input
            v-model.number="formDialog.precio"
            dense
            outlined
            type="number"
            min="0"
            step="0.01"
            prefix="$"
            :rules="[(v) => v > 0 || 'El precio debe ser mayor a 0']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Unidad</span>
          <q-select
            v-model="formDialog.unidad"
            dense
            outlined
            emit-value
            map-options
            :options="UNIDAD_OPTIONS"
          />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Descripción</span>
          <q-input
            v-model="formDialog.descripcion"
            dense
            outlined
            type="textarea"
            rows="3"
            placeholder="Descripción breve (opcional)"
          />
        </label>
      </div>
    </BaseDialog>

    <BaseDialog
      v-model="dialogEliminar"
      title="Eliminar extra"
      :subtitle="filaEliminar?.nombre"
      icon="delete"
      tone="red"
      :width="460"
      primary-label="Eliminar"
      danger
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      Las reservaciones que ya lo incluyen conservarán el cargo. Dejará de aparecer en nuevas
      reservaciones.
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useExtrasStore } from '@/stores/extras'
import type { Extras } from '@/types/extras'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { formatMXN } from '@/utils/formatoMoneda'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useExtrasStore()

const UNIDAD_OPTIONS = [
  { label: 'Por evento', value: 'evento' },
  { label: 'Por persona', value: 'persona' },
  { label: 'Por hora', value: 'hora' },
]

const cargar = () => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'precio', label: 'Precio', field: 'precio', align: 'right', sortable: true },
  { name: 'unidad', label: 'Unidad', field: 'unidad', align: 'left' },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
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

const extrasVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.extras
    .filter((e) => filtro.value === 'todos' || e.activo === (filtro.value === 'activos'))
    .filter((e) => !q || `${e.nombre} ${e.descripcion ?? ''}`.toLowerCase().includes(q))
})

const etiquetaUnidad = (u: string) => UNIDAD_OPTIONS.find((o) => o.value === u)?.label ?? u

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Extras | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  precio: 0,
  unidad: 'evento' as 'evento' | 'persona' | 'hora',
  descripcion: '',
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', precio: 0, unidad: 'evento', descripcion: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: Extras) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    precio: Number(row.precio),
    unidad: row.unidad,
    descripcion: row.descripcion ?? '',
  }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  if (!formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }
  if (formDialog.value.precio <= 0) {
    $q.notify({
      type: 'warning',
      message: 'El precio debe ser mayor a cero.',
      position: 'top-right',
    })
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await store.updateExtras(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        precio: String(formDialog.value.precio),
        unidad: formDialog.value.unidad,
        descripcion: formDialog.value.descripcion.trim() || null,
      })
      $q.notify({ type: 'positive', message: 'Extra actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId && !authStore.hasRole('AdministradorSistema')) {
        $q.notify({
          type: 'negative',
          message: 'No hay una sucursal activa en la sesión.',
          position: 'top-right',
        })
        return
      }
      await store.createExtras({
        nombre: formDialog.value.nombre.trim(),
        precio: String(formDialog.value.precio),
        unidad: formDialog.value.unidad,
        descripcion: formDialog.value.descripcion.trim() || null,
        sucursal_id: authStore.currentBranchId ?? null,
      })
      $q.notify({ type: 'positive', message: 'Extra creado', position: 'top-right' })
    }
    cerrarDialog()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    guardando.value = false
  }
}

// ── Toggle activo ─────────────────────────────────────────────────────────────

const toggleActivo = async (row: Extras) => {
  try {
    await store.updateExtras(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Extra ${!row.activo ? 'activado' : 'desactivado'}`,
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
const filaEliminar = ref<Extras | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Extras) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.deleteExtras(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Extra eliminado', position: 'top-right' })
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
