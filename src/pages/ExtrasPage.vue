<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Extras</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Extra"
        unelevated
        no-caps
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
        <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
      </template>
    </q-banner>

    <q-card flat bordered>
      <q-table
        :rows="store.extras"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay extras registrados"
      >
        <template #body-cell-precio="props">
          <q-td :props="props"> ${{ Number(props.row.precio).toFixed(2) }} </q-td>
        </template>

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
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              class="q-mr-xs"
              @click="abrirEditar(props.row)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              :icon="props.row.activo ? 'toggle_on' : 'toggle_off'"
              :color="props.row.activo ? 'positive' : 'grey-5'"
              size="sm"
              class="q-mr-xs"
              @click="toggleActivo(props.row)"
            >
              <q-tooltip>{{ props.row.activo ? 'Desactivar' : 'Activar' }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete_outline"
              color="negative"
              size="sm"
              @click="confirmarEliminar(props.row)"
            >
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
            {{ editando ? 'Editar Extra' : 'Nuevo Extra' }}
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
              placeholder="Ej. Decoración temática"
              :rules="[(v) => !!v || 'El nombre es requerido']"
            />
          </div>
          <div>
            <div class="field-label">PRECIO</div>
            <q-input
              v-model.number="formDialog.precio"
              dense
              outlined
              type="number"
              min="0"
              step="0.01"
              prefix="$"
              :rules="[(v) => v > 0 || 'El precio debe ser mayor a 0']"
            />
          </div>
          <div>
            <div class="field-label">UNIDAD</div>
            <q-select
              v-model="formDialog.unidad"
              dense
              outlined
              emit-value
              map-options
              :options="UNIDAD_OPTIONS"
            />
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Descripción breve del extra"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear extra'"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Confirmar Eliminar ────────────────────────────────────────── -->
    <q-dialog v-model="dialogEliminar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Eliminar extra</div>
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
import { useExtrasStore } from '@/stores/extras'
import type { Extras } from '@/types/extras'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useExtrasStore()

const UNIDAD_OPTIONS = [
  { label: 'Por evento', value: 'evento' },
  { label: 'Por persona', value: 'persona' },
  { label: 'Por hora', value: 'hora' },
]

const cargar = () => store.cargar(authStore.currentBranchId ?? undefined)

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'precio', label: 'PRECIO', field: 'precio', align: 'left', sortable: true },
  { name: 'unidad', label: 'UNIDAD', field: 'unidad', align: 'left' },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

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

<style scoped>
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
</style>
