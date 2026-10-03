<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Tipos de Evento"
      subtitle="Clasifica las reservaciones y define qué paquetes aplican."
    >
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Tipo"
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
      :filters="FILTROS_ACTIVO"
      search-placeholder="Buscar tipo"
      :count="`${tiposVisibles.length} tipos`"
    >
      <StateBlock
        v-if="store.error"
        variant="error"
        :body="store.error"
        action-label="Reintentar"
        @action="store.cargar()"
      />
      <q-table
        v-else
        :rows="tiposVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
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
            :title="filtrando ? undefined : 'No hay tipos de evento registrados'"
            :body="filtrando ? undefined : 'Crea el primero para clasificar reservaciones.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nuevo Tipo'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar tipo de evento' : 'Nuevo tipo de evento'"
      :subtitle="editando ? editando.nombre : 'Podrás asignarlo a uno o más paquetes.'"
      icon="category"
      :width="520"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Crear tipo'"
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
            placeholder="Ej. Baby shower"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            hide-bottom-space
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
      title="Eliminar tipo de evento"
      :subtitle="filaEliminar?.nombre"
      icon="delete"
      tone="red"
      :width="460"
      primary-label="Eliminar"
      danger
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      Se quitará de los paquetes que lo tengan asignado. Las reservaciones existentes conservan su
      tipo.
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useTiposEventoStore } from '@/stores/tipos_evento'
import type { Tipos_evento } from '@/types/tipos_evento'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useTiposEventoStore()

onMounted(() => {
  if (authStore.currentBranchId) store.cargar()
})

type FiltroActivo = 'todos' | 'activos' | 'inactivos'
const FILTROS_ACTIVO: FilterChip<FiltroActivo>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<FiltroActivo | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')

const tiposVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.tipos
    .filter((r) => filtro.value === 'todos' || r.activo === (filtro.value === 'activos'))
    .filter((r) => !q || `${r.nombre ?? ''} ${r.descripcion ?? ''}`.toLowerCase().includes(q))
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left' },
  {
    name: 'paquetes_count',
    label: 'Paquetes',
    field: 'paquetes_count',
    align: 'right',
    sortable: true,
    format: (v?: number) => String(v ?? 0),
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Tipos_evento | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({ nombre: '', descripcion: '' })

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', descripcion: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: Tipos_evento) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
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
  if (!authStore.currentBranchId && !authStore.hasRole('AdministradorSistema')) {
    $q.notify({
      type: 'negative',
      message: 'No hay una sucursal activa en la sesión.',
      position: 'top-right',
    })
    return
  }
  guardando.value = true
  try {
    const body = {
      nombre: formDialog.value.nombre.trim(),
      descripcion: formDialog.value.descripcion.trim() || undefined,
    }
    if (editando.value) {
      await store.actualizarTipoEvento(editando.value.id, body)
      $q.notify({ type: 'positive', message: 'Tipo de evento actualizado', position: 'top-right' })
    } else {
      await store.crearTipoEvento({
        ...body,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Tipo de evento creado', position: 'top-right' })
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

const toggleActivo = async (row: Tipos_evento) => {
  try {
    await store.actualizarTipoEvento(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Tipo de evento ${!row.activo ? 'activado' : 'desactivado'}`,
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
const filaEliminar = ref<Tipos_evento | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Tipos_evento) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminarTipoEvento(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Tipo de evento eliminado', position: 'top-right' })
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
