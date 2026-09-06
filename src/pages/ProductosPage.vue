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
            <q-td :props="props">
              <span v-if="props.row.tipo === 'E'" class="text-caption text-grey-7">
                Configurado por rangos de horas
              </span>
              <span v-else>${{ Number(props.row.precio_unitario).toFixed(2) }}</span>
            </q-td>
          </template>

          <template #body-cell-tipo="props">
            <q-td :props="props">
              <EstadoBadge
                :tono="TIPO_TONO[props.row.tipo as TipoProducto]"
                :label="TIPO_LABELS[props.row.tipo as TipoProducto]"
              />
            </q-td>
          </template>

          <template #body-cell-descripcion="props">
            <q-td :props="props" class="cell-truncate" :title="props.row.descripcion ?? ''">
              {{ props.row.descripcion }}
            </q-td>
          </template>

          <template #body-cell-activo="props">
            <q-td :props="props">
              <EstadoBadge
                :tono="props.row.activo ? 'verde' : 'rojo'"
                :label="props.row.activo ? 'Activo' : 'Inactivo'"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                v-if="props.row.tipo === 'A' || props.row.tipo === 'B'"
                flat
                dense
                color="grey-8"
                size="sm"
                class="action-btn q-mr-xs"
                @click="abrirReceta(props.row)"
              >
                <span class="material-symbols-outlined">restaurant_menu</span>
                <q-tooltip>Receta</q-tooltip>
              </q-btn>
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
                color="grey-8"
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
              :disable="formDialog.tipo === 'E'"
              :hint="
                formDialog.tipo === 'E' ? 'El precio se calcula por la configuración de tramos' : ''
              "
              :rules="[(v) => formDialog.tipo === 'E' || v > 0 || 'El precio debe ser mayor a 0']"
            />
          </div>

          <!-- ── SECCIÓN CONFIGURACIÓN ESTANCIA (TIPO 'E') ──────────────── -->
          <div
            v-if="formDialog.tipo === 'E'"
            class="bg-grey-1 rounded-borders q-mt-md"
            style="border: 1px dashed var(--q-primary); border-radius: 8px; padding: 12px"
          >
            <div class="text-subtitle2 text-weight-bold q-mb-xs text-primary">
              CONFIGURACIÓN DE TARIFAS POR HORA
            </div>
            <div class="text-caption text-grey-7 q-mb-sm">
              Define los rangos de tiempo y el precio asignado para cada rango de horas.
            </div>

            <div class="row q-col-gutter-xs items-end">
              <div class="col-3">
                <div class="field-label text-caption">Min (hrs)</div>
                <q-input
                  v-model.number="tramoTemporal.min_horas"
                  dense
                  outlined
                  type="number"
                  min="0"
                />
              </div>
              <div class="col-3">
                <div class="field-label text-caption">Max (hrs)</div>
                <q-input
                  v-model.number="tramoTemporal.max_horas"
                  dense
                  outlined
                  type="number"
                  min="0"
                />
              </div>
              <div class="col-4">
                <div class="field-label text-caption">Precio por hora($)</div>
                <q-input
                  v-model.number="tramoTemporal.precio"
                  dense
                  outlined
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="col-2 flex flex-center">
                <q-btn
                  color="primary"
                  icon="add"
                  unelevated
                  style="height: 40px; width: 100%; border-radius: 6px"
                  @click="agregarTramoEstancia"
                >
                  <q-tooltip>Agregar rango</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="q-mt-sm">
              <div
                v-if="formDialog.config_estancia.length === 0"
                class="text-caption text-negative text-center q-py-sm"
              >
                Debes agregar al menos un rango de estancia.
              </div>

              <q-list
                v-else
                separator
                dense
                class="bg-white rounded-borders q-mt-xs"
                style="border: 1px solid #e2e8f0"
              >
                <q-item
                  v-for="(tramo, index) in formDialog.config_estancia"
                  :key="index"
                  class="q-py-xs"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-body2">
                      {{ tramo.min_horas }} hrs - {{ tramo.max_horas }} hrs
                    </q-item-label>
                    <q-item-label caption>
                      Precio: ${{ Number(tramo.precio).toFixed(2) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      size="sm"
                      icon="delete"
                      @click="removerTramoEstancia(index)"
                    >
                      <q-tooltip>Eliminar rango</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <div>
            <div class="field-label">Foto / miniatura (opcional)</div>
            <div class="row items-center q-gutter-md">
              <q-avatar square size="64px" class="imagen-preview-avatar">
                <img v-if="imagenPreviewUrl" :src="imagenPreviewUrl" />
                <q-icon v-else name="image" size="32px" color="grey-5" />
              </q-avatar>
              <q-file
                v-model="imagenFile"
                dense
                outlined
                clearable
                accept="image/*"
                label="Seleccionar imagen"
                style="flex: 1"
              >
                <template #prepend><q-icon name="attach_file" /></template>
              </q-file>
            </div>
          </div>

          <!-- ── SECCIÓN PRODUCTOS DEL COMBO (TIPO 'C') ─────────────────── -->
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
                      <q-item-label class="text-weight-medium">
                        {{ obtenerNombreProducto(item.producto_id) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row items-center q-gutter-sm">
                        <div class="qty-stepper bg-blue-2 text-blue-9">
                          <q-btn
                            flat
                            round
                            dense
                            class="qty-btn"
                            @click="ajustarCantidadCombo(item, -1)"
                          >
                            <span class="material-symbols-outlined qty-icon">remove</span>
                          </q-btn>
                          <span class="qty-value">{{ item.cantidad }}</span>
                          <q-btn
                            flat
                            round
                            dense
                            class="qty-btn"
                            @click="ajustarCantidadCombo(item, 1)"
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

    <!-- ── Dialog Receta ──────────────────────────────────────────────────── -->
    <q-dialog v-model="dialogReceta">
      <q-card style="min-width: 480px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Receta de {{ productoReceta?.nombre }}</div>
          <div class="text-body2 text-grey-7">Insumos que consume una unidad de este producto.</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner
            v-if="recetaStore.error"
            dense
            rounded
            class="bg-red-1 text-red-8 q-mb-md"
            style="border-radius: 10px"
          >
            {{ recetaStore.error }}
          </q-banner>

          <q-list v-if="recetaStore.items.length" separator>
            <q-item v-for="item in recetaStore.items" :key="item.insumo_id">
              <q-item-section>
                <q-item-label>{{ item.insumo_nombre }}</q-item-label>
                <q-item-label caption>
                  {{ Number(item.cantidad) }} {{ item.unidad_base_codigo }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="negative"
                  size="sm"
                  @click="quitarInsumo(item.insumo_id)"
                >
                  <q-tooltip>Quitar</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-body2 text-grey-7 q-py-sm">
            Este producto todavía no tiene insumos en su receta.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm items-start">
            <div class="col-7">
              <div class="field-label">INSUMO</div>
              <q-select
                v-model="formReceta.insumo_id"
                dense
                outlined
                emit-value
                map-options
                :options="insumoOptions"
                placeholder="Selecciona un insumo"
              />
            </div>
            <div class="col-5">
              <div class="field-label">
                CANTIDAD<span v-if="unidadRecetaSeleccionada">
                  ({{ unidadRecetaSeleccionada.codigo }})</span
                >
              </div>
              <q-input
                v-model.number="formReceta.cantidad"
                dense
                outlined
                type="number"
                min="0"
                step="0.001"
                :suffix="unidadRecetaSeleccionada?.codigo"
              />
            </div>
          </div>
          <q-banner
            v-if="avisoCantidadReceta"
            dense
            rounded
            class="bg-amber-1 text-amber-9"
            style="border-radius: 10px"
          >
            <template #avatar><q-icon name="warning" color="amber-9" /></template>
            {{ avisoCantidadReceta }}
          </q-banner>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Agregar / actualizar"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardandoReceta"
            :disable="!formReceta.insumo_id || !formReceta.cantidad"
            @click="guardarRecetaItem"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn v-close-popup flat no-caps label="Cerrar" color="grey-7" />
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
import { ref, onMounted, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useProductosStore } from '@/stores/productos'
import { useInsumosStore } from '@/stores/insumos'
import { useRecetaProductoStore } from '@/stores/recetaProducto'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import {
  TIPO_LABELS,
  type ComboItemCreate,
  type ProductoAdmin,
  type TipoProducto,
} from '@/types/producto'
import { apiClient } from '@/api/axiosClient.ts'
import { getProductoImagenUrl } from '@/api/productosApi'
import EstadoBadge from '@/components/shared/EstadoBadge.vue'

interface TramoEstancia {
  min_horas: number
  max_horas: number
  precio: number
}

const $q = useQuasar()
const authStore = useAuthStore()
const store = useProductosStore()
const insumosStore = useInsumosStore()
const recetaStore = useRecetaProductoStore()
const unidadesStore = useUnidadesMedidaStore()

const TIPO_TONO: Record<TipoProducto, 'verde' | 'rojo' | 'azul' | 'naranja' | 'gris'> = {
  A: 'verde',
  B: 'azul',
  C: 'naranja',
  E: 'gris',
  S: 'rojo',
}

const TIPO_OPTIONS = [
  { label: 'Alimento', value: 'A' },
  { label: 'Bebida', value: 'B' },
  { label: 'Combo', value: 'C' },
  { label: 'Estancia', value: 'E' },
  { label: 'Servicio', value: 'S' },
]

const cargar = () => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
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
  return store.productos.filter(
    (p) => p.tipo !== 'C' && p.tipo !== 'S' && p.tipo !== 'E' && p.activo && !yaAgregados.has(p.id),
  )
})

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
  config_estancia: [] as TramoEstancia[],
})

const tramoTemporal = ref<TramoEstancia>({
  min_horas: 1,
  max_horas: 1,
  precio: 0,
})

const productoComboTemporal = ref({
  producto_id: '',
  cantidad: 1,
})

const imagenFile = ref<File | null>(null)
const imagenPreviewLocal = ref<string | null>(null)

// Si el tipo cambia a 'E', forzar precio_unitario a 0
watch(
  () => formDialog.value.tipo,
  (nuevoTipo) => {
    if (nuevoTipo === 'E') {
      formDialog.value.precio_unitario = 0
    }
  },
)

const formularioValido = computed(() => {
  const { nombre, precio_unitario, tipo, productos_combo, config_estancia } = formDialog.value
  if (!nombre.trim()) return false

  if (tipo === 'E') {
    if (config_estancia.length === 0) return false
    return true
  }

  if (precio_unitario <= 0) return false

  if (tipo === 'C') {
    if (productos_combo.length < 2) return false
    if (productos_combo.some((item) => !item.cantidad || item.cantidad <= 0)) return false
  }

  return true
})

// ── Gestión de tramos de Estancia ────────────────────────────────────────────

const agregarTramoEstancia = () => {
  const { min_horas, max_horas, precio } = tramoTemporal.value

  if (min_horas < 0 || max_horas < 0 || precio <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Las horas deben ser >= 0 y el precio > 0.',
      position: 'top-right',
    })
    return
  }

  if (min_horas > max_horas) {
    $q.notify({
      type: 'warning',
      message: 'El mínimo de horas no puede ser mayor al máximo.',
      position: 'top-right',
    })
    return
  }

  // Verificar solapamientos con tramos ya agregados
  const haySolapamiento = formDialog.value.config_estancia.some((tramo) => {
    return Math.max(tramo.min_horas, min_horas) <= Math.min(tramo.max_horas, max_horas)
  })

  if (haySolapamiento) {
    $q.notify({
      type: 'warning',
      message: 'El rango de horas se solapa con uno existente.',
      position: 'top-right',
    })
    return
  }

  formDialog.value.config_estancia.push({ min_horas, max_horas, precio })
  // Mantener orden cronológico
  formDialog.value.config_estancia.sort((a, b) => a.min_horas - b.min_horas)

  // Sugerir el siguiente rango consecutivo
  tramoTemporal.value = {
    min_horas: max_horas + 1,
    max_horas: max_horas + 1,
    precio: 0,
  }
}

const removerTramoEstancia = (index: number) => {
  formDialog.value.config_estancia.splice(index, 1)
}

// ── Gestión de combos ─────────────────────────────────────────────────────────

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

const ajustarCantidadCombo = (item: ComboItemCreate, delta: number) => {
  item.cantidad = Math.max(1, item.cantidad + delta)
}

const removerItemDelCombo = (index: number) => {
  formDialog.value.productos_combo.splice(index, 1)
}

const obtenerNombreProducto = (id: string) => {
  const prod = store.productos.find((p) => p.id === id)
  return prod ? prod.nombre : 'Producto no encontrado'
}

watch(imagenFile, (file, _oldFile, onCleanup) => {
  if (!file) {
    imagenPreviewLocal.value = null
    return
  }
  const url = URL.createObjectURL(file)
  imagenPreviewLocal.value = url
  onCleanup(() => URL.revokeObjectURL(url))
})

const imagenPreviewUrl = computed(
  () => imagenPreviewLocal.value ?? getProductoImagenUrl(editando.value?.imagen) ?? null,
)

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    tipo: 'A',
    precio_unitario: 0,
    descripcion: '',
    productos_combo: [],
    config_estancia: [],
  }
  tramoTemporal.value = { min_horas: 1, max_horas: 1, precio: 0 }
  productoComboTemporal.value = { producto_id: '', cantidad: 1 }
  imagenFile.value = null
  dialogOpen.value = true
}

const abrirEditar = async (row: ProductoAdmin) => {
  editando.value = row
  let productosComboCargados: ComboItemCreate[] = []
  let configEstanciaCargada: TramoEstancia[] = []

  if (row.tipo === 'C' || row.tipo === 'E') {
    try {
      const { data } = await apiClient.get<ProductoAdmin>(`/productos/${row.id}`)
      if (data) {
        if (data.productos_combo) {
          productosComboCargados = data.productos_combo.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
          }))
        }
        if (data.config_estancia) {
          configEstanciaCargada = (data.config_estancia as unknown as TramoEstancia[]).map((t) => ({
            min_horas: Number(t.min_horas),
            max_horas: Number(t.max_horas),
            precio: Number(t.precio),
          }))
        }
      }
    } catch {
      $q.notify({
        type: 'negative',
        message: 'No se pudieron recuperar los detalles del producto.',
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
    config_estancia: configEstanciaCargada,
  }

  const ultimaHora =
    configEstanciaCargada.length > 0
      ? Math.max(...configEstanciaCargada.map((t) => t.max_horas)) + 1
      : 1

  tramoTemporal.value = { min_horas: ultimaHora, max_horas: ultimaHora, precio: 0 }
  productoComboTemporal.value = { producto_id: '', cantidad: 1 }
  imagenFile.value = null
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
  editando.value = null
  imagenFile.value = null
}

const guardar = async () => {
  if (!formDialog.value.nombre.trim()) {
    nombreRef.value?.validate()
    return
  }

  if (formDialog.value.tipo === 'E') {
    if (formDialog.value.config_estancia.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Debes definir al menos un tramo de estancia.',
        position: 'top-right',
      })
      return
    }
  } else if (formDialog.value.precio_unitario <= 0) {
    $q.notify({
      type: 'warning',
      message: 'El precio debe ser mayor a cero.',
      position: 'top-right',
    })
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
    const payload = {
      nombre: formDialog.value.nombre.trim(),
      tipo: formDialog.value.tipo,
      precio_unitario: String(formDialog.value.tipo === 'E' ? 0 : formDialog.value.precio_unitario),
      descripcion: formDialog.value.descripcion.trim() || null,
      productos_combo: formDialog.value.tipo === 'C' ? formDialog.value.productos_combo : null,
      config_estancia: formDialog.value.tipo === 'E' ? formDialog.value.config_estancia : null,
    }

    if (editando.value) {
      await store.actualizar(editando.value.id, payload, imagenFile.value)
      $q.notify({ type: 'positive', message: 'Producto actualizado', position: 'top-right' })
    } else {
      const sucursalId = authStore.currentBranchId
      if (!sucursalId) {
        $q.notify({
          type: 'negative',
          message: 'No hay una sucursal activa en la sesión.',
          position: 'top-right',
        })
        return
      }

      await store.crear(
        {
          ...payload,
          sucursal_id: sucursalId,
        },
        imagenFile.value,
      )
      $q.notify({ type: 'positive', message: 'Producto creado', position: 'top-right' })
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

// ── Receta ────────────────────────────────────────────────────────────────────

const dialogReceta = ref(false)
const productoReceta = ref<ProductoAdmin | null>(null)
const guardandoReceta = ref(false)

const formReceta = ref({
  insumo_id: null as string | null,
  cantidad: 0,
})

const insumoOptions = computed(() =>
  insumosStore.insumos.filter((i) => i.activo).map((i) => ({ label: i.nombre, value: i.id })),
)

// Unidad base del insumo elegido para la línea de receta (la cantidad se
// captura siempre en esa unidad: g / ml / pza).
const unidadRecetaSeleccionada = computed(() => {
  const insumo = insumosStore.insumos.find((i) => i.id === formReceta.value.insumo_id)
  if (!insumo) return null
  return unidadesStore.unidades.find((u) => u.id === insumo.unidad_base_id) ?? null
})

// Aviso suave: 1000+ g/ml por unidad de producto casi siempre es un error de
// unidad (se quiso poner kg/l). No bloquea.
const avisoCantidadReceta = computed(() => {
  const u = unidadRecetaSeleccionada.value
  if (!u || (u.tipo !== 'masa' && u.tipo !== 'volumen')) return null
  if (formReceta.value.cantidad >= 1000) {
    const mayor = u.tipo === 'masa' ? 'kg' : 'l'
    return `${formReceta.value.cantidad} ${u.codigo} por unidad. ¿No querías ${mayor}? 1 ${mayor} = 1000 ${u.codigo}.`
  }
  return null
})

const abrirReceta = (row: ProductoAdmin) => {
  productoReceta.value = row
  formReceta.value = { insumo_id: null, cantidad: 0 }
  dialogReceta.value = true
  recetaStore.cargar(row.id)
  void unidadesStore.cargar()
  if (authStore.currentBranchId) insumosStore.cargar(authStore.currentBranchId)
}

const guardarRecetaItem = async () => {
  if (!productoReceta.value || !formReceta.value.insumo_id || !formReceta.value.cantidad) return
  guardandoReceta.value = true
  try {
    await recetaStore.upsert(productoReceta.value.id, formReceta.value.insumo_id, {
      cantidad: String(formReceta.value.cantidad),
    })
    formReceta.value = { insumo_id: null, cantidad: 0 }
    $q.notify({ type: 'positive', message: 'Receta actualizada', position: 'top-right' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    guardandoReceta.value = false
  }
}

const quitarInsumo = async (insumoId: string) => {
  if (!productoReceta.value) return
  try {
    await recetaStore.eliminar(productoReceta.value.id, insumoId)
    $q.notify({ type: 'positive', message: 'Insumo quitado de la receta', position: 'top-right' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  }
}

// ── Reactivar ─────────────────────────────────────────────────────────────────

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
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    reactivando.value = false
  }
}
</script>

<style scoped>
.imagen-preview-avatar {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  flex-shrink: 0;
}

.imagen-preview-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-dialog-card {
  width: 480px;
  height: 660px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.producto-dialog-body {
  flex: 1;
  overflow-y: auto;
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
