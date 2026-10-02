<template>
  <q-page class="page-content list-page">
    <PageHeader title="Proveedores" subtitle="Contactos para compras de insumos.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Proveedor"
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
      search-placeholder="Buscar proveedor"
      :count="`${proveedoresFiltrados.length} proveedores`"
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
        :rows="proveedoresFiltrados"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-email="props">
          <q-td :props="props" class="cell-muted">{{ props.row.email ?? '—' }}</q-td>
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
              :disable="!props.row.activo"
              @click="confirmarEliminar(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay proveedores registrados'"
            :body="filtrando ? undefined : 'Agrega el primero para registrar compras.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nuevo Proveedor'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar proveedor' : 'Nuevo proveedor'"
      :subtitle="editando ? editando.nombre : 'Se usará al registrar compras.'"
      icon="local_shipping"
      persistent
      :primary-label="editando ? 'Guardar cambios' : 'Guardar proveedor'"
      :loading="guardando"
      @cancel="cerrarDialog"
      @confirm="guardar"
    >
      <div class="form-grid">
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Nombre comercial</span>
          <q-input
            ref="nombreRef"
            v-model="formDialog.nombre"
            dense
            outlined
            autofocus
            placeholder="Ej. Distribuidora del Valle"
            :rules="[(v) => !!v || 'El nombre es requerido']"
            hide-bottom-space
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Contacto</span>
          <q-input
            v-model="formDialog.contacto_nombre"
            dense
            outlined
            placeholder="Persona de contacto"
          />
        </label>
        <label class="form-grid__field">
          <span class="field-label">Teléfono</span>
          <q-input v-model="formDialog.telefono" dense outlined placeholder="10 dígitos" />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Email</span>
          <q-input
            v-model="formDialog.email"
            dense
            outlined
            type="email"
            placeholder="contacto@proveedor.com"
          />
        </label>
        <label class="form-grid__field form-grid__field--full">
          <span class="field-label">Notas</span>
          <q-input
            v-model="formDialog.notas"
            dense
            outlined
            type="textarea"
            rows="2"
            placeholder="Condiciones de pago, horarios… (opcional)"
          />
        </label>
      </div>
    </BaseDialog>
    <BaseDialog
      v-model="dialogEliminar"
      title="Eliminar proveedor"
      :subtitle="filaEliminar?.nombre"
      icon="delete"
      tone="red"
      :width="460"
      primary-label="Eliminar"
      danger
      :loading="eliminando"
      @confirm="ejecutarEliminar"
    >
      Las compras registradas con este proveedor se conservan. No podrá seleccionarse en nuevas
      compras.
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
import { useProveedoresStore } from '@/stores/proveedores'
import type { Proveedor } from '@/types/proveedor'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useProveedoresStore()

const cargar = () => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

type FiltroActivo = 'todos' | 'activos' | 'inactivos'
const FILTROS_ACTIVO: FilterChip<FiltroActivo>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<FiltroActivo | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')

const proveedoresFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.proveedores
    .filter((r) => filtro.value === 'todos' || r.activo === (filtro.value === 'activos'))
    .filter(
      (r) =>
        !q ||
        `${r.nombre ?? ''} ${r.contacto_nombre ?? ''} ${r.email ?? ''}`.toLowerCase().includes(q),
    )
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'contacto_nombre', label: 'Contacto', field: 'contacto_nombre', align: 'left' },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Proveedor | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  contacto_nombre: '',
  telefono: '',
  email: '',
  notas: '',
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', contacto_nombre: '', telefono: '', email: '', notas: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: Proveedor) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    contacto_nombre: row.contacto_nombre ?? '',
    telefono: row.telefono ?? '',
    email: row.email ?? '',
    notas: row.notas ?? '',
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
  guardando.value = true
  try {
    if (editando.value) {
      await store.actualizar(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        contacto_nombre: formDialog.value.contacto_nombre.trim() || null,
        telefono: formDialog.value.telefono.trim() || null,
        email: formDialog.value.email.trim() || null,
        notas: formDialog.value.notas.trim() || null,
      })
      $q.notify({ type: 'positive', message: 'Proveedor actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crear({
        nombre: formDialog.value.nombre.trim(),
        contacto_nombre: formDialog.value.contacto_nombre.trim() || null,
        telefono: formDialog.value.telefono.trim() || null,
        email: formDialog.value.email.trim() || null,
        notas: formDialog.value.notas.trim() || null,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Proveedor creado', position: 'top-right' })
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

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<Proveedor | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Proveedor) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminar(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Proveedor eliminado', position: 'top-right' })
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
