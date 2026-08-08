<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
          Tipos de Evento
        </div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Catálogo de tipos de evento disponibles para reservaciones.
        </div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Tipo"
        unelevated
        no-caps
        style="border-radius: 8px; font-weight: 600"
        @click="abrirCrear"
      />
    </div>

    <q-banner
      v-if="store.error"
      dense
      rounded
      class="bg-red-1 text-red-8 q-mb-md"
      style="border-radius: 10px"
    >
      <template #avatar><q-icon name="error_outline" color="negative" /></template>
      {{ store.error }}
      <template #action>
        <q-btn flat dense no-caps label="Reintentar" @click="store.cargar()" />
      </template>
    </q-banner>

    <q-card flat bordered style="border-radius: 12px; overflow: hidden">
      <q-table
        :rows="store.tipos"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay tipos de evento registrados"
        class="fec-table"
      >
        <template #body-cell-activo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.activo ? 'positive' : 'grey-5'"
              :label="props.row.activo ? 'Activo' : 'Inactivo'"
              style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
            />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              dense
              color="grey-8"
              size="sm"
              class="action-btn q-mr-xs"
              @click="abrirEditar(props.row)"
            >
              <span class="material-symbols-outlined">edit</span>
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              color="grey-8"
              size="sm"
              class="action-btn q-mr-xs"
              @click="toggleActivo(props.row)"
            >
              <span class="material-symbols-outlined">{{
                props.row.activo ? 'toggle_on' : 'toggle_off'
              }}</span>
              <q-tooltip>{{ props.row.activo ? 'Desactivar' : 'Activar' }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              color="grey-8"
              size="sm"
              class="action-btn"
              @click="confirmarEliminar(props.row)"
            >
              <span class="material-symbols-outlined">delete_outline</span>
              <q-tooltip>Eliminar</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar Tipo de Evento' : 'Nuevo Tipo de Evento' }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">NOMBRE</div>
            <q-input
              ref="nombreRef"
              v-model="formDialog.nombre"
              dense
              outlined
              autofocus
              placeholder="Ej. Cumpleaños"
              :rules="[(v) => !!v || 'El nombre es requerido']"
            />
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="3"
              placeholder="Descripción breve del tipo de evento"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear tipo'"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Confirmar Eliminar ──────────────────────────────────────── -->
    <q-dialog v-model="dialogEliminar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar tipo de evento</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Estás seguro de que deseas eliminar
            <strong>{{ filaEliminar?.nombre }}</strong
            >? Esta acción no se puede deshacer.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Eliminar"
            style="border-radius: 8px; font-weight: 600"
            :loading="eliminando"
            @click="ejecutarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

onMounted(() => store.cargar())

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
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

<style scoped>
.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.action-btn {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 20;
  font-size: 20px;
  line-height: 1;
  text-transform: none;
}
</style>
