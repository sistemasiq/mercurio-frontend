<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
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
          label="Nuevo producto"
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
              <ProductoBadgeTipo :tipo="props.row.tipo as TipoProducto" />
            </q-td>
          </template>

          <template #body-cell-activo="props">
            <q-td :props="props">
              <ProductoBadgeEstado :activo="props.row.activo" />
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
                v-if="props.row.activo"
                flat
                dense
                color="negative"
                size="sm"
                class="action-btn"
                @click="confirmarEliminar(props.row)"
              >
                <span class="material-symbols-outlined">delete_outline</span>
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
              <q-btn
                v-else
                flat
                dense
                color="grey-8"
                size="sm"
                class="action-btn"
                @click="confirmarReactivar(props.row)"
              >
                <span class="material-symbols-outlined">restore</span>
                <q-tooltip>Reactivar</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="producto-dialog-card" style="border-radius: 12px">
        <q-card-section class="q-pb-sm row items-center" style="flex-shrink: 0">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar producto' : 'Nuevo producto' }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-7" @click="cerrarDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md producto-dialog-body">
          <div>
            <div class="field-label">Nombre</div>
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
            <div class="field-label">Tipo</div>
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
            <div class="field-label">Precio unitario</div>
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
          <div
            v-if="formDialog.tipo === 'C'"
            class="q-p-sm bg-grey-1 rounded-borders q-mt-md"
            style="border: 1px dashed #ccc; border-radius: 8px; padding: 12px"
          >
            <div class="text-subtitle2 text-weight-bold q-mb-sm text-primary">
              PRODUCTOS DEL COMBO
            </div>

            <div class="row q-col-gutter-sm items-end">
              <div class="col-7">
                <div class="field-label">Seleccionar producto</div>
                <q-select
                  v-model="productoComboTemporal.producto_id"
                  dense
                  outlined
                  emit-value
                  map-options
                  option-value="id"
                  option-label="nombre"
                  :options="productosDisponiblesParaCombo"
                  placeholder="Elige un producto"
                  no-options-label="No hay más productos disponibles"
                />
              </div>
              <div class="col-3">
                <div class="field-label">Cant.</div>
                <q-input
                  v-model.number="productoComboTemporal.cantidad"
                  dense
                  outlined
                  type="number"
                  min="1"
                />
              </div>
              <div class="col-2 flex flex-center">
                <q-btn
                  color="primary"
                  icon="add"
                  unelevated
                  style="height: 40px; border-radius: 8px"
                  @click="agregarItemAlCombo"
                >
                  <q-tooltip>Agregar al combo</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="q-mt-md">
              <div
                v-if="formDialog.productos_combo.length === 0"
                class="text-caption text-grey-6 text-center q-py-sm"
              >
                No has añadido productos a este combo todavía.
              </div>
              <template v-else>
                <q-list
                  separator
                  dense
                  class="bg-white rounded-borders"
                  style="border: 1px solid #e2e8f0"
                >
                  <q-item
                    v-for="(item, index) in formDialog.productos_combo"
                    :key="item.producto_id"
                    class="q-py-sm"
                  >
                    <q-item-section>
                      <q-item-label class="text-weight-medium">{{
                        obtenerNombreProducto(item.producto_id)
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-sm">
                        <q-badge
                          color="blue-2"
                          text-color="blue-9"
                          :label="`x${item.cantidad}`"
                          class="text-weight-bold"
                          style="padding: 4px 8px; border-radius: 6px"
                        />
                        <q-btn
                          flat
                          round
                          dense
                          color="negative"
                          size="sm"
                          @click="removerItemDelCombo(index)"
                        >
                          <span class="material-symbols-outlined">delete</span>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div
                  v-if="formDialog.productos_combo.length === 1"
                  class="text-caption text-orange-8 q-mt-xs q-px-sm"
                >
                  Agrega al menos un producto más para poder guardar.
                </div>
              </template>
            </div>
          </div>
          <div>
            <div class="field-label">Descripción opcional</div>
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

        <q-card-actions align="right" class="q-pa-md q-pt-sm" style="flex-shrink: 0">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear producto'"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardando"
            :disable="!formularioValido"
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

    <q-dialog v-model="dialogReactivar">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Reactivar producto</div>
          <div class="q-mt-sm text-body2 text-grey-8">
            ¿Deseas reactivar <strong>{{ filaReactivar?.nombre }}</strong
            >? Volverá a estar disponible en el catálogo.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="positive"
            label="Reactivar"
            style="border-radius: 8px; font-weight: 600"
            :loading="reactivando"
            @click="ejecutarReactivar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useProductosStore } from '@/stores/productos'
import type { ComboItemCreate, ProductoAdmin, TipoProducto } from '@/types/producto'
import { apiClient } from '@/api/axiosClient.ts'
import ProductoBadgeTipo from '@/components/productos/ProductoBadgeTipo.vue'
import ProductoBadgeEstado from '@/components/productos/ProductoBadgeEstado.vue'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useProductosStore()

const TIPO_OPTIONS = [
  { label: 'Alimento', value: 'A' },
  { label: 'Bebida', value: 'B' },
  { label: 'Combo', value: 'C' },
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

const productosDisponiblesParaCombo = computed(() => {
  const yaAgregados = new Set(formDialog.value.productos_combo.map((i) => i.producto_id))
  return store.productos.filter((p) => p.tipo !== 'C' && p.activo && !yaAgregados.has(p.id))
})

const formularioValido = computed(() => {
  const { nombre, precio_unitario, tipo, productos_combo } = formDialog.value
  if (!nombre.trim() || precio_unitario <= 0) return false
  if (tipo === 'C' && productos_combo.length < 2) return false
  return true
})

const agregarItemAlCombo = () => {
  const { producto_id, cantidad } = productoComboTemporal.value

  if (!producto_id || cantidad <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un producto y una cantidad válida.',
      position: 'top-right',
    })
    return
  }
  const existente = formDialog.value.productos_combo.find(
    (item) => item.producto_id === producto_id,
  )
  if (existente) {
    existente.cantidad += cantidad
  } else {
    formDialog.value.productos_combo.push({ producto_id, cantidad })
  }
  productoComboTemporal.value = { producto_id: '', cantidad: 1 }
}

const removerItemDelCombo = (index: number) => {
  formDialog.value.productos_combo.splice(index, 1)
}

const obtenerNombreProducto = (id: string) => {
  const prod = store.productos.find((p) => p.id === id)
  return prod ? prod.nombre : 'Producto no encontrado'
}

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
  productos_combo: [] as ComboItemCreate[],
})

const productoComboTemporal = ref({
  producto_id: '',
  cantidad: 1,
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    tipo: 'A',
    precio_unitario: 0,
    descripcion: '',
    productos_combo: [],
  }
  productoComboTemporal.value = { producto_id: '', cantidad: 1 }
  dialogOpen.value = true
}

const abrirEditar = async (row: ProductoAdmin) => {
  editando.value = row
  let productosComboCargados: ComboItemCreate[] = []

  if (row.tipo === 'C') {
    try {
      const { data } = await apiClient.get<ProductoAdmin>(`/productos/${row.id}`)
      if (data && data.productos_combo) {
        productosComboCargados = data.productos_combo.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        }))
      }
    } catch {
      $q.notify({
        type: 'negative',
        message: 'No se pudieron recuperar los productos del combo desde el servidor.',
        position: 'top-right',
      })
      return
    }
  }

  formDialog.value = {
    nombre: row.nombre,
    tipo: row.tipo,
    precio_unitario: Number(row.precio_unitario),
    descripcion: row.descripcion ?? '',
    productos_combo: productosComboCargados,
  }

  productoComboTemporal.value = { producto_id: '', cantidad: 1 }
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

  if (formDialog.value.tipo === 'C') {
    if (formDialog.value.productos_combo.length < 2) {
      $q.notify({
        type: 'warning',
        message: 'Un combo debe incluir un mínimo de 2 productos.',
        position: 'top-right',
      })
      return
    }
    if (productoComboTemporal.value.producto_id) {
      $q.notify({
        type: 'warning',
        message: 'Tienes un producto seleccionado. Confírmalo con "+" antes de guardar.',
        position: 'top-right',
      })
      return
    }
  }

  guardando.value = true
  try {
    if (editando.value) {
      await store.actualizar(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        tipo: formDialog.value.tipo,
        precio_unitario: String(formDialog.value.precio_unitario),
        descripcion: formDialog.value.descripcion.trim() || null,
        productos_combo: formDialog.value.tipo === 'C' ? formDialog.value.productos_combo : null,
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
        productos_combo: formDialog.value.tipo === 'C' ? formDialog.value.productos_combo : null,
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

const dialogReactivar = ref(false)
const filaReactivar = ref<ProductoAdmin | null>(null)
const reactivando = ref(false)

const confirmarReactivar = (row: ProductoAdmin) => {
  filaReactivar.value = row
  dialogReactivar.value = true
}

const ejecutarReactivar = async () => {
  if (!filaReactivar.value) return
  reactivando.value = true
  try {
    await store.reactivar(filaReactivar.value.id)
    $q.notify({ type: 'positive', message: 'Producto reactivado', position: 'top-right' })
    dialogReactivar.value = false
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo reactivar. Intenta de nuevo.',
      position: 'top-right',
    })
  } finally {
    reactivando.value = false
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

.producto-dialog-card {
  width: 460px;
  height: 620px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.producto-dialog-body {
  flex: 1;
  overflow-y: auto;
}
</style>
