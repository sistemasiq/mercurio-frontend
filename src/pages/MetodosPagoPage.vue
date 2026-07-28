<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Métodos de Pago
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Gestiona los métodos de pago disponibles para reservaciones.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Método"
          unelevated
          no-caps
          style="border-radius: 8px; font-weight: 600"
          @click="abrirCrear"
        />
      </div>

      <!-- Error -->
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

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="store.metodos"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay métodos de pago registrados"
          class="fec-table"
        >
          <!-- Estado -->
          <template #body-cell-activo="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.activo ? 'positive' : 'grey-5'"
                :label="props.row.activo ? 'Activo' : 'Inactivo'"
                style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
              />
            </q-td>
          </template>

          <!-- Acciones -->
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
    </div>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar Método de Pago' : 'Nuevo Método de Pago' }}
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
              placeholder="Ej. Transferencia bancaria"
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
              placeholder="Descripción breve del método de pago"
            />
          </div>
          <div>
            <div class="field-label">TIPO</div>
            <q-select
              v-model="formDialog.tipo"
              dense
              outlined
              emit-value
              map-options
              :options="TIPO_OPTIONS"
              :rules="[(v) => !!v || 'El tipo es requerido']"
              hint="Determina qué botón del modal de cobro usa este método."
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear método'"
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
          <div class="text-h6 text-weight-bold">Eliminar método de pago</div>
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
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import type { MetodosPago, TipoMetodoPago } from '@/types/metodos_pago'

const TIPO_OPTIONS: { label: string; value: TipoMetodoPago }[] = [
  { label: 'Efectivo', value: 'E' },
  { label: 'Tarjeta (crédito/débito/wallets)', value: 'T' },
  { label: 'Cupón', value: 'C' },
  { label: 'Lealtad', value: 'L' },
  { label: 'Otro (transferencia, etc.)', value: 'O' },
]

const $q = useQuasar()
const authStore = useAuthStore()
const store = useMetodosPagoStore()

onMounted(() => store.cargar())

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  {
    name: 'tipo',
    label: 'TIPO',
    field: 'tipo',
    align: 'left',
    format: (v: TipoMetodoPago) => TIPO_OPTIONS.find((o) => o.value === v)?.label ?? v,
  },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<MetodosPago | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref<{ nombre: string; descripcion: string; tipo: TipoMetodoPago | null }>({
  nombre: '',
  descripcion: '',
  tipo: null,
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', descripcion: '', tipo: null }
  dialogOpen.value = true
}

const abrirEditar = (row: MetodosPago) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    tipo: row.tipo,
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
  if (!formDialog.value.tipo) {
    $q.notify({ type: 'warning', message: 'Selecciona un tipo.', position: 'top-right' })
    return
  }
  guardando.value = true
  try {
    const body = {
      nombre: formDialog.value.nombre.trim(),
      descripcion: formDialog.value.descripcion.trim() || undefined,
      tipo: formDialog.value.tipo,
    }
    if (editando.value) {
      await store.actualizarMetodoPago(editando.value.id, body)
      $q.notify({ type: 'positive', message: 'Método de pago actualizado', position: 'top-right' })
    } else {
      await store.crearMetodoPago({
        ...body,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Método de pago creado', position: 'top-right' })
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

const toggleActivo = async (row: MetodosPago) => {
  try {
    await store.actualizarMetodoPago(row.id, { activo: !row.activo })
    $q.notify({
      type: 'positive',
      message: `Método ${!row.activo ? 'activado' : 'desactivado'}`,
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
const filaEliminar = ref<MetodosPago | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: MetodosPago) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminarMetodoPago(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Método de pago eliminado', position: 'top-right' })
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
