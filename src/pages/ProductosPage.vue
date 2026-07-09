<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Productos</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Catálogo de productos de la sucursal (alimentos, bebidas, estancia, servicios).
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Producto"
          unelevated
          no-caps
          :disable="!authStore.currentBranchId"
          style="border-radius: 8px; font-weight: 600"
          @click="abrirCrear"
        />
      </div>

      <!-- Sin sucursal activa -->
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
          <q-btn flat dense no-caps label="Reintentar" @click="cargar" />
        </template>
      </q-banner>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="store.productos"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay productos registrados"
          class="fec-table"
        >
          <template #body-cell-precio_unitario="props">
            <q-td :props="props"> ${{ Number(props.row.precio_unitario).toFixed(2) }} </q-td>
          </template>

          <template #body-cell-tipo="props">
            <q-td :props="props">
              {{ TIPO_LABELS[props.row.tipo as TipoProducto] }}
            </q-td>
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
                icon="delete_outline"
                color="negative"
                size="sm"
                :disable="!props.row.activo"
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
            {{ editando ? 'Editar Producto' : 'Nuevo Producto' }}
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
              placeholder="Ej. Refresco 600ml"
              :rules="[(v) => !!v || 'El nombre es requerido']"
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
            />
          </div>
          <div>
            <div class="field-label">PRECIO UNITARIO</div>
            <q-input
              v-model.number="formDialog.precio_unitario"
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
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input
              v-model="formDialog.descripcion"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Descripción breve del producto"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear producto'"
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
          <div class="text-h6 text-weight-bold">Eliminar producto</div>
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
import { useAuthStore } from '@/stores/auth'
import { useProductosStore } from '@/stores/productos'
import type { ProductoAdmin, TipoProducto } from '@/types/producto'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useProductosStore()

const TIPO_LABELS: Record<TipoProducto, string> = {
  A: 'Alimento',
  B: 'Bebida',
  E: 'Estancia',
  S: 'Servicio',
}

const TIPO_OPTIONS = [
  { label: 'Alimento', value: 'A' },
  { label: 'Bebida', value: 'B' },
  { label: 'Estancia', value: 'E' },
  { label: 'Servicio', value: 'S' },
]

const cargar = () => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'tipo', label: 'TIPO', field: 'tipo', align: 'left' },
  {
    name: 'precio_unitario',
    label: 'PRECIO',
    field: 'precio_unitario',
    align: 'left',
    sortable: true,
  },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<ProductoAdmin | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  tipo: 'A' as TipoProducto,
  precio_unitario: 0,
  descripcion: '',
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = { nombre: '', tipo: 'A', precio_unitario: 0, descripcion: '' }
  dialogOpen.value = true
}

const abrirEditar = (row: ProductoAdmin) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    tipo: row.tipo,
    precio_unitario: Number(row.precio_unitario),
    descripcion: row.descripcion ?? '',
  }
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
}

const guardar = async () => {
  if (!formDialog.value.nombre.trim() || formDialog.value.precio_unitario <= 0) {
    nombreRef.value?.validate()
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await store.actualizar(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        tipo: formDialog.value.tipo,
        precio_unitario: String(formDialog.value.precio_unitario),
        descripcion: formDialog.value.descripcion.trim() || null,
      })
      $q.notify({ type: 'positive', message: 'Producto actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crear({
        nombre: formDialog.value.nombre.trim(),
        tipo: formDialog.value.tipo,
        precio_unitario: String(formDialog.value.precio_unitario),
        descripcion: formDialog.value.descripcion.trim() || null,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Producto creado', position: 'top-right' })
    }
    cerrarDialog()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ocurrió un error. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    guardando.value = false
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

const dialogEliminar = ref(false)
const filaEliminar = ref<ProductoAdmin | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: ProductoAdmin) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminar(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Producto eliminado', position: 'top-right' })
    dialogEliminar.value = false
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo eliminar. Intenta de nuevo.',
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
