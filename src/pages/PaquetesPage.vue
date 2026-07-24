<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Paquetes</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Nuevo Paquete"
        unelevated
        no-caps
        :disable="!authStore.currentBranchId"
        @click="abrirCrear"
      />
    </div>

    <q-banner
      v-if="!authStore.currentBranchId"
      dense
      rounded
      class="bg-orange-1 text-orange-9 q-mb-md"
      style="border-radius: 10px"
    >
      <template #avatar><q-icon name="info" color="orange-9" /></template>
      No hay una sucursal activa en la sesión.
    </q-banner>

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
        :rows="store.paquetes"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay paquetes registrados"
      >
        <template #body-cell-precio_base="props">
          <q-td :props="props"> ${{ Number(props.row.precio_base).toFixed(2) }} </q-td>
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
      <q-card style="min-width: 460px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar Paquete' : 'Nuevo Paquete' }}
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
              placeholder="Ej. Paquete Clásico"
              :rules="[(v) => !!v || 'El nombre es requerido']"
            />
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="field-label">PRECIO BASE</div>
              <q-input
                v-model.number="formDialog.precio_base"
                dense
                outlined
                type="number"
                min="0"
                step="0.01"
                prefix="$"
                :rules="[(v) => v > 0 || 'Debe ser mayor a 0']"
              />
            </div>
            <div class="col-6">
              <div class="field-label">PRECIO POR PERSONA EXTRA</div>
              <q-input
                v-model.number="formDialog.precio_persona_extra"
                dense
                outlined
                type="number"
                min="0"
                step="0.01"
                prefix="$"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="field-label">DURACIÓN (MINUTOS)</div>
              <q-input
                v-model.number="formDialog.duracion_minutos"
                dense
                outlined
                type="number"
                min="1"
              />
            </div>
            <div class="col-6">
              <div class="field-label">PERSONAS INCLUIDAS</div>
              <q-input
                v-model.number="formDialog.personas_incluidas"
                dense
                outlined
                type="number"
                min="1"
              />
            </div>
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Descripción breve del paquete"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear paquete'"
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
          <div class="text-h6 text-weight-bold">Eliminar paquete</div>
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
import { usePaquetesStore } from '@/stores/paquetes'
import type { Paquetes } from '@/types/paquetes'

const $q = useQuasar()
const authStore = useAuthStore()
const store = usePaquetesStore()

const cargar = () => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  {
    name: 'precio_base',
    label: 'PRECIO BASE',
    field: 'precio_base',
    align: 'left',
    sortable: true,
  },
  { name: 'personas_incluidas', label: 'PERSONAS', field: 'personas_incluidas', align: 'left' },
  { name: 'duracion_minutos', label: 'DURACIÓN (MIN)', field: 'duracion_minutos', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Paquetes | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  descripcion: '',
  duracion_minutos: 120,
  personas_incluidas: 10,
  precio_base: 0,
  precio_persona_extra: 0,
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    descripcion: '',
    duracion_minutos: 120,
    personas_incluidas: 10,
    precio_base: 0,
    precio_persona_extra: 0,
  }
  dialogOpen.value = true
}

const abrirEditar = (row: Paquetes) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    duracion_minutos: row.duracion_minutos,
    personas_incluidas: row.personas_incluidas,
    precio_base: Number(row.precio_base),
    precio_persona_extra: Number(row.precio_persona_extra),
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
  if (formDialog.value.precio_base <= 0) {
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
      await store.editarPaquete(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        duracion_minutos: formDialog.value.duracion_minutos,
        personas_incluidas: formDialog.value.personas_incluidas,
        precio_base: String(formDialog.value.precio_base),
        precio_persona_extra: String(formDialog.value.precio_persona_extra),
      })
      $q.notify({ type: 'positive', message: 'Paquete actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crearPaquete({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        duracion_minutos: formDialog.value.duracion_minutos,
        personas_incluidas: formDialog.value.personas_incluidas,
        precio_base: String(formDialog.value.precio_base),
        precio_persona_extra: String(formDialog.value.precio_persona_extra),
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Paquete creado', position: 'top-right' })
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

const toggleActivo = async (row: Paquetes) => {
  try {
    await store.editarPaquete(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Paquete ${!row.activo ? 'activado' : 'desactivado'}`,
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
const filaEliminar = ref<Paquetes | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Paquetes) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminarPaquete(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Paquete eliminado', position: 'top-right' })
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
