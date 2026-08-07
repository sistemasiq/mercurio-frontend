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

        <template #body-cell-precio_pulsera="props">
          <q-td :props="props"> ${{ Number(props.row.precio_pulsera).toFixed(2) }} </q-td>
        </template>

        <template #body-cell-productos_incluidos="props">
          <q-td :props="props">
            <div v-if="props.row.productos_incluidos?.length" class="row q-gutter-xs">
              <q-badge
                v-for="item in props.row.productos_incluidos"
                :key="item.producto_id"
                color="blue-1"
                text-color="primary"
                :label="`${item.cantidad}x ${item.nombre}`"
                style="font-size: 0.7rem; padding: 3px 8px; border-radius: 6px"
              />
            </div>
            <span v-else class="text-grey-6 text-caption">—</span>
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
      <q-card style="min-width: 520px; border-radius: 12px">
        <q-card-section class="q-pa-lg q-pb-md">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar Paquete' : 'Nuevo Paquete' }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-lg q-pa-lg">
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
              <div class="field-label">PRECIO DE LA PULSERA</div>
              <q-input
                v-model.number="formDialog.precio_pulsera"
                dense
                outlined
                type="number"
                min="0"
                step="0.01"
                prefix="$"
              />
              <div class="text-caption text-grey-6 q-mt-xs">
                Se cobra por cada invitado del evento, además del precio base.
              </div>
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="field-label">MÍN. DE INVITADOS</div>
              <q-input
                v-model.number="formDialog.min_invitados"
                dense
                outlined
                type="number"
                min="1"
                :rules="[(v) => v > 0 || 'Debe ser mayor a 0']"
              />
            </div>
            <div class="col-6">
              <div class="field-label">MÁX. DE INVITADOS</div>
              <q-input
                v-model.number="formDialog.max_invitados"
                dense
                outlined
                type="number"
                min="1"
                :rules="[
                  (v) => v > 0 || 'Debe ser mayor a 0',
                  (v) => v >= formDialog.min_invitados || 'No puede ser menor que el mínimo',
                ]"
              />
            </div>
          </div>
          <div class="text-caption text-grey-6 q-mb-sm">
            Al reservar solo se ofrecerán los paquetes cuyo rango cubra el número de niños que pida
            el cliente.
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

          <div
            class="bg-grey-1 rounded-borders q-mt-md"
            style="border: 1px dashed #ccc; border-radius: 8px; padding: 20px"
          >
            <div class="text-subtitle2 text-weight-bold q-mb-md text-primary">
              ALIMENTOS INCLUIDOS (opcional)
            </div>

            <div class="row q-col-gutter-sm items-end">
              <div class="col-7">
                <div class="field-label">Seleccionar producto</div>
                <q-select
                  v-model="productoIncluidoTemporal.producto_id"
                  dense
                  outlined
                  emit-value
                  map-options
                  option-value="id"
                  option-label="nombre"
                  :options="productosDisponiblesParaIncluir"
                  placeholder="Elige un producto"
                  no-options-label="No hay más productos disponibles"
                />
              </div>
              <div class="col-3">
                <div class="field-label">Cant.</div>
                <q-input
                  v-model.number="productoIncluidoTemporal.cantidad"
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
                  @click="agregarProductoIncluido"
                >
                  <q-tooltip>Agregar al paquete</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="q-mt-md">
              <div
                v-if="formDialog.productos_incluidos.length === 0"
                class="text-caption text-grey-6 text-center q-py-sm"
              >
                No has añadido alimentos incluidos a este paquete todavía.
              </div>

              <q-list
                v-else
                separator
                dense
                class="bg-white rounded-borders"
                style="border: 1px solid #e2e8f0"
              >
                <q-item
                  v-for="(item, index) in formDialog.productos_incluidos"
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
                      <div class="qty-stepper bg-blue-2 text-blue-9">
                        <q-btn
                          flat
                          round
                          dense
                          class="qty-btn"
                          @click="ajustarCantidadIncluido(item, -1)"
                        >
                          <span class="material-symbols-outlined qty-icon">remove</span>
                        </q-btn>
                        <span class="qty-value">{{ item.cantidad }}</span>
                        <q-btn
                          flat
                          round
                          dense
                          class="qty-btn"
                          @click="ajustarCantidadIncluido(item, 1)"
                        >
                          <span class="material-symbols-outlined qty-icon">add</span>
                        </q-btn>
                      </div>
                      <q-btn
                        flat
                        round
                        dense
                        color="grey-8"
                        size="sm"
                        @click="removerProductoIncluido(index)"
                      >
                        <span class="material-symbols-outlined">delete</span>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-lg q-pt-sm">
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { usePaquetesStore } from '@/stores/paquetes'
import { useProductosStore } from '@/stores/productos'
import { paquetesApi } from '@/api/paquetesApi'
import type { Paquetes, PaqueteProductoItem } from '@/types/paquetes'

const $q = useQuasar()
const authStore = useAuthStore()
const store = usePaquetesStore()
const productosStore = useProductosStore()

const cargar = () => {
  if (authStore.currentBranchId) {
    store.cargar(authStore.currentBranchId)
    productosStore.cargar(authStore.currentBranchId)
  }
}

onMounted(cargar)

// ── Alimentos incluidos ────────────────────────────────────────────────────────

const productoIncluidoTemporal = ref({ producto_id: '', cantidad: 1 })

const productosDisponiblesParaIncluir = computed(() => {
  const yaAgregados = new Set(formDialog.value.productos_incluidos.map((i) => i.producto_id))
  return productosStore.productos.filter(
    (p) => p.tipo !== 'C' && p.tipo !== 'S' && p.tipo !== 'E' && p.activo && !yaAgregados.has(p.id),
  )
})

const agregarProductoIncluido = () => {
  const { producto_id, cantidad } = productoIncluidoTemporal.value
  if (!producto_id || cantidad <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona un producto y una cantidad válida.',
      position: 'top-right',
    })
    return
  }
  const existente = formDialog.value.productos_incluidos.find(
    (item) => item.producto_id === producto_id,
  )
  if (existente) {
    existente.cantidad += cantidad
  } else {
    formDialog.value.productos_incluidos.push({ producto_id, cantidad })
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
}

const ajustarCantidadIncluido = (item: PaqueteProductoItem, delta: number) => {
  item.cantidad = Math.max(1, item.cantidad + delta)
}

const removerProductoIncluido = (index: number) => {
  formDialog.value.productos_incluidos.splice(index, 1)
}

const obtenerNombreProducto = (id: string) => {
  const prod = productosStore.productos.find((p) => p.id === id)
  return prod ? prod.nombre : 'Producto no encontrado'
}

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  {
    name: 'precio_base',
    label: 'PRECIO BASE',
    field: 'precio_base',
    align: 'left',
    sortable: true,
  },
  {
    name: 'precio_pulsera',
    label: 'PULSERA',
    field: 'precio_pulsera',
    align: 'left',
    sortable: true,
  },
  {
    name: 'invitados',
    label: 'INVITADOS',
    field: (row: Paquetes) => `${row.min_invitados} a ${row.max_invitados}`,
    align: 'left',
  },
  {
    name: 'productos_incluidos',
    label: 'ALIMENTOS INCLUIDOS',
    field: 'productos_incluidos',
    align: 'left',
  },
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
  min_invitados: 1,
  max_invitados: 10,
  precio_base: 0,
  precio_pulsera: 0,
  productos_incluidos: [] as PaqueteProductoItem[],
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    descripcion: '',
    min_invitados: 1,
    max_invitados: 10,
    precio_base: 0,
    precio_pulsera: 0,
    productos_incluidos: [],
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
  dialogOpen.value = true
}

const abrirEditar = async (row: Paquetes) => {
  editando.value = row
  let productosIncluidosCargados: PaqueteProductoItem[]

  try {
    const detalle = await paquetesApi.obtener(row.id)
    productosIncluidosCargados = (detalle.productos_incluidos ?? []).map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
    }))
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
    return
  }

  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    min_invitados: row.min_invitados,
    max_invitados: row.max_invitados,
    precio_base: Number(row.precio_base),
    precio_pulsera: Number(row.precio_pulsera),
    productos_incluidos: productosIncluidosCargados,
  }
  productoIncluidoTemporal.value = { producto_id: '', cantidad: 1 }
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
  // Un rango invertido dejaría el paquete invisible en el asistente de reservación.
  if (formDialog.value.max_invitados < formDialog.value.min_invitados) {
    $q.notify({
      type: 'warning',
      message: 'El máximo de invitados no puede ser menor que el mínimo.',
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
        min_invitados: formDialog.value.min_invitados,
        max_invitados: formDialog.value.max_invitados,
        precio_base: String(formDialog.value.precio_base),
        precio_pulsera: String(formDialog.value.precio_pulsera),
        productos_incluidos: formDialog.value.productos_incluidos,
      })
      $q.notify({ type: 'positive', message: 'Paquete actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crearPaquete({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        min_invitados: formDialog.value.min_invitados,
        max_invitados: formDialog.value.max_invitados,
        precio_base: String(formDialog.value.precio_base),
        precio_pulsera: String(formDialog.value.precio_pulsera),
        productos_incluidos: formDialog.value.productos_incluidos,
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

.qty-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 999px;
}

.qty-value {
  min-width: 16px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
}

.qty-btn {
  min-height: 22px;
  min-width: 22px;
  padding: 0;
}

.qty-icon {
  font-size: 14px;
  line-height: 1;
}
</style>
