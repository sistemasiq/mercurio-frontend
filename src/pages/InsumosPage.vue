<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Insumos</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Catálogo de insumos (materia prima) de la sucursal.
          </div>
        </div>
        <q-space />
        <q-btn
          color="primary"
          icon="add"
          label="Nuevo Insumo"
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

      <!-- Filtros -->
      <div class="row q-col-gutter-sm items-center q-mb-md">
        <div class="col-12 col-sm-4">
          <q-input v-model="busqueda" dense outlined clearable placeholder="Buscar por nombre...">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-toggle v-model="soloBajoMinimo" label="Solo bajo mínimo" dense />
        </div>
        <div class="col-auto">
          <q-toggle v-model="soloActivos" label="Solo activos" dense />
        </div>
      </div>

      <!-- Tabla -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="insumosFiltrados"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay insumos registrados"
          class="fec-table"
        >
          <template #body-cell-unidad_base_id="props">
            <q-td :props="props">{{ codigoUnidad(props.row.unidad_base_id) }}</q-td>
          </template>

          <template #body-cell-stock_actual="props">
            <q-td :props="props">
              <span :class="{ 'text-negative text-weight-bold': bajoMinimo(props.row) }">
                {{ Number(props.row.stock_actual) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-rinde_para="props">
            <q-td :props="props">
              <template v-if="estimacion(props.row)">
                <span
                  :class="{ 'text-negative text-weight-bold': estimacion(props.row)!.min === 0 }"
                >
                  ≈ {{ estimacion(props.row)!.min }} {{ estimacion(props.row)!.producto }}
                </span>
                <q-tooltip v-if="estimacion(props.row)!.desglose.length" anchor="top middle">
                  <div v-for="d in estimacion(props.row)!.desglose" :key="d.producto">
                    {{ d.producto }}: ≈ {{ d.unidades }}
                  </div>
                </q-tooltip>
              </template>
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>

          <template #body-cell-costo_unitario="props">
            <q-td :props="props">
              {{
                props.row.costo_unitario ? `$${Number(props.row.costo_unitario).toFixed(2)}` : '—'
              }}
            </q-td>
          </template>

          <template #body-cell-proveedor_principal_id="props">
            <q-td :props="props">{{ nombreProveedor(props.row.proveedor_principal_id) }}</q-td>
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
                flat
                dense
                color="grey-8"
                size="sm"
                class="action-btn q-mr-xs"
                :disable="!props.row.activo"
                @click="abrirAjuste(props.row)"
              >
                <span class="material-symbols-outlined">tune</span>
                <q-tooltip>Ajustar stock</q-tooltip>
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
                flat
                dense
                color="grey-8"
                size="sm"
                class="action-btn q-mr-xs"
                :disable="!props.row.activo"
                @click="confirmarEliminar(props.row)"
              >
                <span class="material-symbols-outlined">delete_outline</span>
                <q-tooltip>Eliminar</q-tooltip>
              </q-btn>
              <q-btn flat dense color="grey-8" size="sm" class="action-btn">
                <span class="material-symbols-outlined">more_vert</span>
                <q-menu anchor="bottom right" self="top right">
                  <q-list dense style="min-width: 160px">
                    <q-item v-close-popup clickable @click="abrirKardex(props.row)">
                      <q-item-section avatar>
                        <span class="material-symbols-outlined">history</span>
                      </q-item-section>
                      <q-item-section>Kardex</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable @click="abrirPresentaciones(props.row)">
                      <q-item-section avatar>
                        <span class="material-symbols-outlined">view_module</span>
                      </q-item-section>
                      <q-item-section>Presentaciones</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Crear / Editar ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 460px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">
            {{ editando ? 'Editar Insumo' : 'Nuevo Insumo' }}
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
              placeholder="Ej. Harina de trigo"
              :rules="[(v) => !!v || 'El nombre es requerido']"
            />
          </div>
          <div>
            <div class="field-label">DESCRIPCIÓN (opcional)</div>
            <q-input v-model="formDialog.descripcion" dense outlined placeholder="Detalle breve" />
          </div>

          <div class="row q-col-gutter-md">
            <div class="col">
              <div class="field-label">UNIDAD BASE (stock)</div>
              <q-select
                v-model="formDialog.unidad_base_id"
                dense
                outlined
                emit-value
                map-options
                :disable="!!editando"
                :options="unidadOptions"
                :rules="[(v) => !!v || 'Requerido']"
              />
            </div>
            <div class="col">
              <div class="field-label">UNIDAD DE COMPRA</div>
              <q-select
                v-model="formDialog.unidad_compra_id"
                dense
                outlined
                emit-value
                map-options
                :disable="!!editando"
                :options="unidadOptions"
                :rules="[(v) => !!v || 'Requerido']"
              />
            </div>
          </div>
          <div v-if="editando" class="text-caption text-grey-7">
            La unidad no se puede cambiar una vez creado el insumo.
          </div>

          <div v-if="!editando">
            <div class="field-label">STOCK INICIAL</div>
            <q-input
              v-model.number="formDialog.stock_inicial"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
            />
          </div>

          <div class="row q-col-gutter-md">
            <div class="col">
              <div class="field-label">STOCK MÍNIMO</div>
              <q-input
                v-model.number="formDialog.stock_minimo"
                dense
                outlined
                type="number"
                min="0"
                step="0.001"
              />
            </div>
            <div class="col">
              <div class="field-label">COSTO UNITARIO (opcional)</div>
              <q-input
                v-model.number="formDialog.costo_unitario"
                dense
                outlined
                type="number"
                min="0"
                step="0.01"
                prefix="$"
              />
            </div>
          </div>

          <div>
            <div class="field-label">PROVEEDOR PRINCIPAL (opcional)</div>
            <q-select
              v-model="formDialog.proveedor_principal_id"
              dense
              outlined
              emit-value
              map-options
              clearable
              :options="proveedorOptions"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="editando ? 'Guardar cambios' : 'Crear insumo'"
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
          <div class="text-h6 text-weight-bold">Eliminar insumo</div>
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

    <!-- ── Dialog Ajustar Stock ───────────────────────────────────────────── -->
    <q-dialog v-model="dialogAjuste">
      <q-card style="min-width: 400px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Ajustar stock de {{ insumoAjuste?.nombre }}</div>
          <div class="text-body2 text-grey-7">
            Stock actual: {{ insumoAjuste ? Number(insumoAjuste.stock_actual) : 0 }}
            {{ insumoAjuste ? codigoUnidad(insumoAjuste.unidad_base_id) : '' }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md q-pt-md">
          <div>
            <div class="field-label">TIPO DE AJUSTE</div>
            <q-select
              v-model="formAjuste.tipo"
              dense
              outlined
              emit-value
              map-options
              :options="TIPO_AJUSTE_OPTIONS"
            />
          </div>
          <div>
            <div class="field-label">CANTIDAD</div>
            <q-input
              v-model.number="formAjuste.cantidad"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
            />
          </div>
          <div>
            <div class="field-label">NOTAS (opcional)</div>
            <q-input
              v-model="formAjuste.notas"
              dense
              outlined
              type="textarea"
              rows="2"
              placeholder="Ej. conteo físico, producto vencido..."
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cerrarAjuste" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Registrar ajuste"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardandoAjuste"
            :disable="!formAjuste.cantidad"
            @click="guardarAjuste"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Dialog Presentaciones ──────────────────────────────────────────── -->
    <q-dialog v-model="dialogPresentaciones">
      <q-card style="min-width: 480px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">
            Presentaciones de {{ insumoPresentaciones?.nombre }}
          </div>
          <div class="text-body2 text-grey-7">
            Empaques de compra propios de este insumo (ej. "Paquete (8 pz)"), expresados en
            {{ insumoPresentaciones ? codigoUnidad(insumoPresentaciones.unidad_base_id) : '' }}.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-banner
            v-if="presentacionesStore.error"
            dense
            rounded
            class="bg-red-1 text-red-8 q-mb-md"
            style="border-radius: 10px"
          >
            {{ presentacionesStore.error }}
          </q-banner>

          <q-list v-if="presentacionesActivas.length" separator>
            <q-item v-for="item in presentacionesActivas" :key="item.id">
              <q-item-section>
                <q-item-label>{{ item.nombre }}</q-item-label>
                <q-item-label caption>
                  {{ Number(item.equivalencia_base) }}
                  {{
                    insumoPresentaciones ? codigoUnidad(insumoPresentaciones.unidad_base_id) : ''
                  }}
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
                  @click="quitarPresentacion(item.id)"
                >
                  <q-tooltip>Quitar</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-body2 text-grey-7 q-py-sm">
            Este insumo todavía no tiene presentaciones registradas.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-gutter-md">
          <div class="row q-col-gutter-sm items-start">
            <div class="col-7">
              <div class="field-label">NOMBRE</div>
              <q-input
                v-model="formPresentacion.nombre"
                dense
                outlined
                placeholder="Ej. Paquete (8 pz)"
              />
            </div>
            <div class="col-5">
              <div class="field-label">EQUIVALENCIA</div>
              <q-input
                v-model.number="formPresentacion.equivalencia_base"
                dense
                outlined
                type="number"
                min="0"
                step="0.001"
              />
            </div>
          </div>
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Agregar presentación"
            style="border-radius: 8px; font-weight: 600"
            :loading="guardandoPresentacion"
            :disable="!formPresentacion.nombre.trim() || !formPresentacion.equivalencia_base"
            @click="guardarPresentacion"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn v-close-popup flat no-caps label="Cerrar" color="grey-7" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import EstadoBadge from '@/components/shared/EstadoBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useInsumosStore } from '@/stores/insumos'
import { useProveedoresStore } from '@/stores/proveedores'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { useMovimientosInventarioStore } from '@/stores/movimientosInventario'
import { usePresentacionesInsumoStore } from '@/stores/presentacionesInsumo'
import { resolveErrorMessage } from '@/utils/errorHandler'
import { calcularRindePorInsumo } from '@/utils/estimacionRinde'
import type { ApiError } from '@/types/auth'
import type { Insumo } from '@/types/insumo'
import type { TipoMovimientoManual } from '@/types/movimientoInventario'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const store = useInsumosStore()
const proveedoresStore = useProveedoresStore()
const unidadesStore = useUnidadesMedidaStore()
const movimientosStore = useMovimientosInventarioStore()
const presentacionesStore = usePresentacionesInsumoStore()

const cargar = () => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
  store.cargarEstimaciones(authStore.currentBranchId)
  proveedoresStore.cargar(authStore.currentBranchId)
  unidadesStore.cargar()
}

onMounted(cargar)

const unidadOptions = computed(() =>
  unidadesStore.unidades.map((u) => ({ label: `${u.nombre} (${u.codigo})`, value: u.id })),
)

const proveedorOptions = computed(() =>
  proveedoresStore.proveedores
    .filter((p) => p.activo)
    .map((p) => ({ label: p.nombre, value: p.id })),
)

const codigoUnidad = (unidadId: string): string => {
  const unidad = unidadesStore.unidades.find((u) => u.id === unidadId)
  return unidad ? unidad.codigo : '—'
}

const nombreProveedor = (proveedorId: string | null): string => {
  if (!proveedorId) return '—'
  const proveedor = proveedoresStore.proveedores.find((p) => p.id === proveedorId)
  return proveedor ? proveedor.nombre : '—'
}

const bajoMinimo = (row: Insumo): boolean => Number(row.stock_actual) < Number(row.stock_minimo)

const busqueda = ref('')
const soloBajoMinimo = ref(false)
const soloActivos = ref(false)

const insumosFiltrados = computed(() => {
  const t = (busqueda.value ?? '').trim().toLowerCase()
  return store.insumos.filter((i) => {
    if (t && !i.nombre.toLowerCase().includes(t)) return false
    if (soloActivos.value && !i.activo) return false
    if (soloBajoMinimo.value && !bajoMinimo(i)) return false
    return true
  })
})

// "Rinde para": cuántas unidades de cada producto A/B cubre el stock actual del
// insumo. La celda muestra el producto de menor rendimiento; el tooltip, el
// desglose completo.
const estimacion = (row: Insumo) =>
  calcularRindePorInsumo(Number(row.stock_actual), store.recetasPorInsumo.get(row.id))

const TIPO_AJUSTE_OPTIONS: Array<{ label: string; value: TipoMovimientoManual }> = [
  { label: 'Entrada manual (sumar stock)', value: 'E' },
  { label: 'Merma (restar stock)', value: 'M' },
]

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'unidad_base_id', label: 'UNIDAD', field: 'unidad_base_id', align: 'left' },
  { name: 'stock_actual', label: 'STOCK', field: 'stock_actual', align: 'left', sortable: true },
  { name: 'rinde_para', label: 'RINDE PARA', field: 'id', align: 'left' },
  { name: 'stock_minimo', label: 'MÍNIMO', field: 'stock_minimo', align: 'left' },
  { name: 'costo_unitario', label: 'COSTO', field: 'costo_unitario', align: 'left' },
  {
    name: 'proveedor_principal_id',
    label: 'PROVEEDOR',
    field: 'proveedor_principal_id',
    align: 'left',
  },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Insumo | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formDialog = ref({
  nombre: '',
  descripcion: '',
  unidad_base_id: null as string | null,
  unidad_compra_id: null as string | null,
  stock_inicial: 0,
  stock_minimo: 0,
  costo_unitario: null as number | null,
  proveedor_principal_id: null as string | null,
})

const abrirCrear = () => {
  editando.value = null
  formDialog.value = {
    nombre: '',
    descripcion: '',
    unidad_base_id: null,
    unidad_compra_id: null,
    stock_inicial: 0,
    stock_minimo: 0,
    costo_unitario: null,
    proveedor_principal_id: null,
  }
  dialogOpen.value = true
}

const abrirEditar = (row: Insumo) => {
  editando.value = row
  formDialog.value = {
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    unidad_base_id: row.unidad_base_id,
    unidad_compra_id: row.unidad_compra_id,
    stock_inicial: 0,
    stock_minimo: Number(row.stock_minimo),
    costo_unitario: row.costo_unitario ? Number(row.costo_unitario) : null,
    proveedor_principal_id: row.proveedor_principal_id,
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
  if (!editando.value && (!formDialog.value.unidad_base_id || !formDialog.value.unidad_compra_id)) {
    $q.notify({
      type: 'warning',
      message: 'Selecciona la unidad base y la unidad de compra.',
      position: 'top-right',
    })
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await store.actualizar(editando.value.id, {
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        stock_minimo: String(formDialog.value.stock_minimo),
        costo_unitario:
          formDialog.value.costo_unitario != null ? String(formDialog.value.costo_unitario) : null,
        proveedor_principal_id: formDialog.value.proveedor_principal_id,
      })
      $q.notify({ type: 'positive', message: 'Insumo actualizado', position: 'top-right' })
    } else {
      if (!authStore.currentBranchId) return
      await store.crear({
        nombre: formDialog.value.nombre.trim(),
        descripcion: formDialog.value.descripcion.trim() || null,
        unidad_base_id: formDialog.value.unidad_base_id!,
        unidad_compra_id: formDialog.value.unidad_compra_id!,
        stock_inicial: String(formDialog.value.stock_inicial),
        stock_minimo: String(formDialog.value.stock_minimo),
        costo_unitario:
          formDialog.value.costo_unitario != null ? String(formDialog.value.costo_unitario) : null,
        proveedor_principal_id: formDialog.value.proveedor_principal_id,
        sucursal_id: authStore.currentBranchId,
      })
      $q.notify({ type: 'positive', message: 'Insumo creado', position: 'top-right' })
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
const filaEliminar = ref<Insumo | null>(null)
const eliminando = ref(false)

const confirmarEliminar = (row: Insumo) => {
  filaEliminar.value = row
  dialogEliminar.value = true
}

const ejecutarEliminar = async () => {
  if (!filaEliminar.value) return
  eliminando.value = true
  try {
    await store.eliminar(filaEliminar.value.id)
    $q.notify({ type: 'positive', message: 'Insumo eliminado', position: 'top-right' })
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

// ── Ajustar stock ─────────────────────────────────────────────────────────────

const dialogAjuste = ref(false)
const insumoAjuste = ref<Insumo | null>(null)
const guardandoAjuste = ref(false)

const formAjuste = ref({
  tipo: 'E' as TipoMovimientoManual,
  cantidad: 0,
  notas: '',
})

const abrirKardex = (row: Insumo) => {
  router.push({ name: 'insumos-kardex', params: { id: row.id } })
}

const abrirAjuste = (row: Insumo) => {
  insumoAjuste.value = row
  formAjuste.value = { tipo: 'E', cantidad: 0, notas: '' }
  dialogAjuste.value = true
}

const cerrarAjuste = () => {
  dialogAjuste.value = false
  insumoAjuste.value = null
}

const guardarAjuste = async () => {
  if (!insumoAjuste.value || !formAjuste.value.cantidad) return
  guardandoAjuste.value = true
  try {
    const movimiento = await movimientosStore.registrar(insumoAjuste.value.id, {
      tipo: formAjuste.value.tipo,
      cantidad: String(formAjuste.value.cantidad),
      notas: formAjuste.value.notas.trim() || null,
    })
    const idx = store.insumos.findIndex((i) => i.id === insumoAjuste.value?.id)
    if (idx !== -1)
      store.insumos[idx] = { ...store.insumos[idx]!, stock_actual: movimiento.stock_resultante }
    $q.notify({ type: 'positive', message: 'Ajuste registrado', position: 'top-right' })
    cerrarAjuste()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    guardandoAjuste.value = false
  }
}

// ── Presentaciones ────────────────────────────────────────────────────────────

const dialogPresentaciones = ref(false)
const insumoPresentaciones = ref<Insumo | null>(null)
const guardandoPresentacion = ref(false)

const formPresentacion = ref({
  nombre: '',
  equivalencia_base: 0,
})

const presentacionesActivas = computed(() => presentacionesStore.items.filter((p) => p.activo))

const abrirPresentaciones = (row: Insumo) => {
  insumoPresentaciones.value = row
  formPresentacion.value = { nombre: '', equivalencia_base: 0 }
  dialogPresentaciones.value = true
  presentacionesStore.cargarPorInsumo(row.id)
}

const guardarPresentacion = async () => {
  if (
    !insumoPresentaciones.value ||
    !formPresentacion.value.nombre.trim() ||
    !formPresentacion.value.equivalencia_base
  )
    return
  guardandoPresentacion.value = true
  try {
    await presentacionesStore.crear(insumoPresentaciones.value.id, {
      nombre: formPresentacion.value.nombre.trim(),
      equivalencia_base: String(formPresentacion.value.equivalencia_base),
    })
    formPresentacion.value = { nombre: '', equivalencia_base: 0 }
    $q.notify({ type: 'positive', message: 'Presentación agregada', position: 'top-right' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    guardandoPresentacion.value = false
  }
}

const quitarPresentacion = async (presentacionId: string) => {
  if (!insumoPresentaciones.value) return
  try {
    await presentacionesStore.eliminar(insumoPresentaciones.value.id, presentacionId)
    $q.notify({ type: 'positive', message: 'Presentación eliminada', position: 'top-right' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  }
}
</script>

<style scoped></style>
