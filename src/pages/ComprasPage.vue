<template>
  <q-page class="page-content list-page">
    <PageHeader title="Compras" subtitle="Órdenes de compra y recepción de mercancía.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva compra"
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
      :filters="FILTROS"
      search-placeholder="Buscar proveedor"
      :count="`${comprasFiltradas.length} compras`"
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
        :rows="comprasFiltradas"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-proveedor_nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.proveedor_nombre }}</q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="ESTADO_TONO[props.row.estado as EstadoCompra]"
              :label="ESTADO_LABEL[props.row.estado as EstadoCompra]"
            />
          </q-td>
        </template>
        <template #body-cell-total="props">
          <q-td :props="props" class="text-weight-bold">{{
            formatMXN(Number(props.row.total))
          }}</q-td>
        </template>
        <template #body-cell-fecha_pedido="props">
          <q-td :props="props">{{ formatearFecha(props.row.fecha_pedido) }}</q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.estado === 'P' || props.row.estado === 'PARCIAL'"
              flat
              round
              dense
              icon="inventory"
              class="action-btn"
              aria-label="Recibir"
              @click="abrirRecibir(props.row)"
            >
              <q-tooltip>Recibir</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="receipt_long"
              class="action-btn"
              aria-label="Ver detalle"
              @click="abrirDetalle(props.row)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
            <q-btn
              v-if="props.row.estado === 'P'"
              flat
              round
              dense
              icon="more_vert"
              class="action-btn"
              aria-label="Más acciones"
            >
              <q-menu anchor="bottom right" self="top right">
                <q-list dense style="min-width: 170px">
                  <q-item v-close-popup clickable @click="abrirEditar(props.row)">
                    <q-item-section avatar><q-icon name="edit" size="19px" /></q-item-section>
                    <q-item-section>Editar</q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    class="text-negative"
                    @click="confirmarAccion(props.row, 'cancelar')"
                  >
                    <q-item-section avatar><q-icon name="block" size="19px" /></q-item-section>
                    <q-item-section>Cancelar compra</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="filtrando ? 'no-results' : 'empty'"
            :title="filtrando ? undefined : 'No hay compras registradas'"
            :body="filtrando ? undefined : 'Crea una orden de compra a un proveedor.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nueva compra'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todas')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="compraEditando ? 'Editar compra' : 'Nueva compra'"
      :subtitle="authStore.currentBranchName ?? undefined"
      icon="shopping_cart"
      tone="blue"
      :width="680"
      persistent
    >
      <div class="dlg-stack">
        <div>
          <div class="field-label">Proveedor</div>
          <q-select
            v-model="formCompra.proveedor_id"
            dense
            outlined
            emit-value
            map-options
            :options="proveedorOptions"
            placeholder="Selecciona un proveedor"
          />
        </div>
        <div>
          <div class="field-label">Notas (opcional)</div>
          <q-input v-model="formCompra.notas" dense outlined placeholder="Referencia, factura..." />
        </div>

        <div
          class="q-p-sm bg-grey-1 rounded-borders"
          style="border: 1px dashed #ccc; border-radius: 8px; padding: 12px"
        >
          <div class="text-subtitle2 text-weight-bold q-mb-sm text-primary">
            LÍNEAS DE LA COMPRA
          </div>

          <div class="row q-col-gutter-sm items-end">
            <div class="col-4">
              <div class="field-label">Insumo</div>
              <q-select
                v-model="lineaTemporal.insumo_id"
                dense
                outlined
                emit-value
                map-options
                :options="insumoOptions"
                placeholder="Elige un insumo"
                @update:model-value="onCambiarInsumoLinea"
              />
            </div>
            <div class="col-3">
              <div class="field-label">Unidad</div>
              <q-select
                v-model="lineaTemporal.unidad_seleccion"
                dense
                outlined
                emit-value
                map-options
                :options="unidadesCombinadas"
                :disable="!lineaTemporal.insumo_id"
                placeholder="Unidad"
              />
            </div>
            <div class="col-2">
              <div class="field-label">Cant.</div>
              <q-input
                v-model.number="lineaTemporal.cantidad"
                dense
                outlined
                type="number"
                min="0"
                step="0.001"
              />
            </div>
            <div class="col-2">
              <div class="field-label">Costo unit.</div>
              <q-input
                v-model.number="lineaTemporal.costo_unitario"
                dense
                outlined
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div class="col-1 flex flex-center">
              <q-btn
                color="primary"
                icon="add"
                unelevated
                style="height: 40px; border-radius: 8px"
                :disable="!lineaCompleta"
                @click="agregarLinea"
              >
                <q-tooltip>Agregar línea</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div class="q-mt-md">
            <div v-if="lineas.length === 0" class="text-caption text-grey-6 text-center q-py-sm">
              No has agregado líneas todavía.
            </div>

            <q-list
              v-else
              separator
              dense
              class="bg-white rounded-borders"
              style="border: 1px solid #e2e8f0"
            >
              <q-item v-for="(linea, index) in lineas" :key="index" class="q-py-sm">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ linea.insumo_nombre }}</q-item-label>
                  <q-item-label caption>
                    {{ linea.cantidad }} {{ linea.unidad_label }} × ${{
                      linea.costo_unitario.toFixed(2)
                    }}
                    = ${{ (linea.cantidad * linea.costo_unitario).toFixed(2) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense color="grey-8" size="sm" @click="quitarLinea(index)">
                    <span class="material-symbols-outlined">delete</span>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row justify-end q-mt-sm text-subtitle2 text-weight-bold">
              Total: ${{ totalCompra.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <q-btn outline label="Cancelar" @click="cerrarDialog" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="compraEditando ? 'Guardar cambios' : 'Crear compra'"
          :loading="guardando"
          :disable="!formCompra.proveedor_id || lineas.length === 0"
          @click="guardarCompra"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogConfirmar"
      :title="'Cancelar compra'"
      icon="block"
      tone="red"
      :width="480"
    >
      <div class="dlg-stack">
        <div class="q-mt-sm text-body2 text-grey-8">
          ¿Deseas cancelar la compra a
          <strong>{{ compraConfirmar?.proveedor_nombre }}</strong
          >? Esta acción no se puede deshacer.
        </div>
      </div>

      <template #footer>
        <q-btn v-close-popup outline no-caps label="Cerrar" />
        <q-btn
          unelevated
          no-caps
          color="negative"
          label="Cancelar compra"
          :loading="ejecutando"
          @click="ejecutarAccion"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogRecibir"
      :title="'Recibir compra'"
      icon="inventory"
      tone="green"
      :width="600"
    >
      <div class="dlg-stack">
        <q-list separator>
          <q-item v-for="l in lineasRecepcion" :key="l.detalle_id">
            <q-item-section>
              <q-item-label>{{ l.insumo_nombre }}</q-item-label>
              <q-item-label caption>
                Pedido {{ l.pedido }} {{ l.unidad }} · recibido {{ l.recibido }} · pendiente
                {{ l.pendiente }}
              </q-item-label>
            </q-item-section>
            <q-item-section side style="width: 120px">
              <q-input
                v-model.number="l.ahora"
                dense
                outlined
                type="number"
                min="0"
                :max="l.pendiente"
                step="0.001"
                :disable="l.pendiente <= 0"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <template #footer>
        <q-btn v-close-popup outline no-caps label="Cerrar" />
        <q-btn
          unelevated
          no-caps
          color="positive"
          label="Recibir"
          :loading="ejecutando"
          :disable="!hayAlgoQueRecibir"
          @click="ejecutarRecibir"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogDetalle"
      :title="'Detalle de compra'"
      icon="receipt_long"
      tone="green"
      :width="600"
    >
      <div class="dlg-stack">
        <div v-if="cargandoDetalle" class="text-center q-py-md">
          <q-spinner size="24px" color="primary" />
        </div>
        <q-list v-else-if="detalleCompra?.detalles.length" separator>
          <q-item v-for="l in detalleCompra.detalles" :key="l.id">
            <q-item-section>
              <q-item-label>{{ l.insumo_nombre }}</q-item-label>
              <q-item-label caption>
                {{ Number(l.cantidad) }}
                {{ l.presentacion_nombre ?? l.unidad_medida_codigo ?? '' }} × ${{
                  Number(l.costo_unitario).toFixed(2)
                }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="text-weight-medium">
              ${{ Number(l.subtotal).toFixed(2) }}
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-body2 text-grey-7 q-py-sm">Sin líneas.</div>
        <div v-if="detalleCompra" class="row justify-end q-mt-sm text-subtitle2 text-weight-bold">
          Total: ${{ Number(detalleCompra.total).toFixed(2) }}
        </div>
        <div v-if="detalleCompra?.notas" class="text-caption text-grey-7 q-mt-sm">
          Notas: {{ detalleCompra.notas }}
        </div>
      </div>

      <template #footer>
        <q-btn v-close-popup outline no-caps label="Cerrar" />
      </template>
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
import { formatMXN } from '@/utils/formatoMoneda'
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useComprasStore } from '@/stores/compras'
import { useProveedoresStore } from '@/stores/proveedores'
import { useInsumosStore } from '@/stores/insumos'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { usePresentacionesInsumoStore } from '@/stores/presentacionesInsumo'
import { comprasApi } from '@/api/comprasApi'
import type { Compra, EstadoCompra } from '@/types/compra'

const $q = useQuasar()
const authStore = useAuthStore()
const store = useComprasStore()
const proveedoresStore = useProveedoresStore()
const insumosStore = useInsumosStore()
const unidadesStore = useUnidadesMedidaStore()
const presentacionesStore = usePresentacionesInsumoStore()

const cargar = async () => {
  if (!authStore.currentBranchId) return
  await Promise.all([
    store.cargar(authStore.currentBranchId),
    proveedoresStore.cargar(authStore.currentBranchId),
    insumosStore.cargar(authStore.currentBranchId),
    unidadesStore.cargar(),
  ])
}

onMounted(async () => {
  await cargar()
  aplicarBorradorPrefill()
})

const ESTADO_LABEL: Record<EstadoCompra, string> = {
  P: 'Pendiente',
  PARCIAL: 'Parcial',
  R: 'Recibida',
  C: 'Cancelada',
}
const ESTADO_TONO: Record<EstadoCompra, 'warn' | 'info' | 'ok' | 'off'> = {
  P: 'warn',
  PARCIAL: 'info',
  R: 'ok',
  C: 'off',
}

const formatearFecha = (iso: string): string => new Date(iso).toLocaleDateString('es-MX')

// ── Filtros ────────────────────────────────────────────────────────────────
const busqueda = ref('')
const filtroEstado = ref<'todas' | EstadoCompra | null>('todas')
const filtro = filtroEstado
const FILTROS: FilterChip<'todas' | EstadoCompra>[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Pendientes', value: 'P' },
  { label: 'Parciales', value: 'PARCIAL' },
  { label: 'Recibidas', value: 'R' },
  { label: 'Canceladas', value: 'C' },
]
const filtrando = computed(() => !!busqueda.value || filtroEstado.value !== 'todas')

const comprasFiltradas = computed(() => {
  const t = (busqueda.value ?? '').trim().toLowerCase()
  return store.compras.filter((c) => {
    if (t && !c.proveedor_nombre.toLowerCase().includes(t)) return false
    if (filtroEstado.value !== 'todas' && c.estado !== filtroEstado.value) return false
    return true
  })
})

// ── Detalle de compra ──────────────────────────────────────────────────────
const dialogDetalle = ref(false)
const cargandoDetalle = ref(false)
const detalleCompra = ref<Compra | null>(null)

const abrirDetalle = async (row: Compra) => {
  detalleCompra.value = row
  dialogDetalle.value = true
  cargandoDetalle.value = true
  try {
    detalleCompra.value = await comprasApi.obtener(row.id)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    cargandoDetalle.value = false
  }
}

const columns: QTableColumn[] = [
  {
    name: 'proveedor_nombre',
    label: 'Proveedor',
    field: 'proveedor_nombre',
    align: 'left',
    sortable: true,
  },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left' },
  { name: 'total', label: 'Total', field: 'total', align: 'right', sortable: true },
  { name: 'fecha_pedido', label: 'Fecha', field: 'fecha_pedido', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Dialog Nueva Compra ────────────────────────────────────────────────────

const dialogOpen = ref(false)
const guardando = ref(false)

const proveedorOptions = computed(() =>
  proveedoresStore.proveedores
    .filter((p) => p.activo)
    .map((p) => ({ label: p.nombre, value: p.id })),
)

const insumoOptions = computed(() =>
  insumosStore.insumos.filter((i) => i.activo).map((i) => ({ label: i.nombre, value: i.id })),
)

// Codifica el valor del select como "u:<uuid>" (unidad global) o "p:<uuid>"
// (presentación específica del insumo) para distinguir cuál campo llenar al
// agregar la línea, sin comparar objetos en el v-model (fase 7).
const unidadesCombinadas = computed(() => {
  if (!lineaTemporal.value.insumo_id) return []
  const insumo = insumosStore.insumos.find((i) => i.id === lineaTemporal.value.insumo_id)
  if (!insumo) return []
  const unidadBase = unidadesStore.unidades.find((u) => u.id === insumo.unidad_base_id)
  const opcionesUnidad = unidadBase
    ? unidadesStore.unidades
        .filter((u) => u.tipo === unidadBase.tipo)
        .map((u) => ({ label: `${u.nombre} (${u.codigo})`, value: `u:${u.id}` }))
    : []
  const opcionesPresentacion = presentacionesStore.items
    .filter((p) => p.activo)
    .map((p) => ({ label: p.nombre, value: `p:${p.id}` }))
  return [...opcionesUnidad, ...opcionesPresentacion]
})

const onCambiarInsumoLinea = (insumoId: string | null) => {
  lineaTemporal.value.unidad_seleccion = null
  if (insumoId) presentacionesStore.cargarPorInsumo(insumoId)
}

const formCompra = ref({
  proveedor_id: null as string | null,
  notas: '',
})

interface LineaLocal {
  insumo_id: string
  insumo_nombre: string
  unidad_medida_id: string | null
  presentacion_id: string | null
  unidad_label: string
  cantidad: number
  costo_unitario: number
}

const lineas = ref<LineaLocal[]>([])

const lineaTemporal = ref({
  insumo_id: null as string | null,
  unidad_seleccion: null as string | null,
  cantidad: 0,
  costo_unitario: 0,
})

const lineaCompleta = computed(
  () =>
    !!lineaTemporal.value.insumo_id &&
    !!lineaTemporal.value.unidad_seleccion &&
    lineaTemporal.value.cantidad > 0 &&
    lineaTemporal.value.costo_unitario >= 0,
)

const totalCompra = computed(() =>
  lineas.value.reduce((acc, l) => acc + l.cantidad * l.costo_unitario, 0),
)

const lineaTemporalVacia = () => ({
  insumo_id: null as string | null,
  unidad_seleccion: null as string | null,
  cantidad: 0,
  costo_unitario: 0,
})

const compraEditando = ref<Compra | null>(null)

const abrirCrear = () => {
  compraEditando.value = null
  formCompra.value = { proveedor_id: null, notas: '' }
  lineas.value = []
  lineaTemporal.value = lineaTemporalVacia()
  dialogOpen.value = true
}

const abrirEditar = async (row: Compra) => {
  const completa = await comprasApi.obtener(row.id)
  compraEditando.value = completa
  formCompra.value = { proveedor_id: completa.proveedor_id, notas: completa.notas ?? '' }
  lineas.value = completa.detalles.flatMap((d) => {
    const insumo = insumosStore.insumos.find((i) => i.id === d.insumo_id)
    return [
      {
        insumo_id: d.insumo_id,
        insumo_nombre: insumo?.nombre ?? d.insumo_nombre,
        unidad_medida_id: d.unidad_medida_id,
        presentacion_id: d.presentacion_id,
        unidad_label: d.presentacion_nombre ?? d.unidad_medida_codigo ?? '',
        cantidad: Number(d.cantidad),
        costo_unitario: Number(d.costo_unitario),
      },
    ]
  })
  lineaTemporal.value = lineaTemporalVacia()
  dialogOpen.value = true
}

// Borrador armado desde el Reporte de Stock: precarga proveedor + líneas
// (en la unidad base de cada insumo) y abre el diálogo de nueva compra.
const aplicarBorradorPrefill = () => {
  const borrador = store.consumirBorradorPrefill()
  if (!borrador) return
  formCompra.value = { proveedor_id: borrador.proveedor_id, notas: '' }
  lineas.value = borrador.lineas.flatMap((l) => {
    const insumo = insumosStore.insumos.find((i) => i.id === l.insumo_id)
    const unidad = unidadesStore.unidades.find((u) => u.id === l.unidad_medida_id)
    if (!insumo || !unidad) return []
    return [
      {
        insumo_id: l.insumo_id,
        insumo_nombre: insumo.nombre,
        unidad_medida_id: unidad.id,
        presentacion_id: null,
        unidad_label: unidad.codigo,
        cantidad: l.cantidad,
        costo_unitario: l.costo_unitario,
      },
    ]
  })
  lineaTemporal.value = lineaTemporalVacia()
  dialogOpen.value = true
}

const cerrarDialog = () => {
  dialogOpen.value = false
}

const agregarLinea = () => {
  if (!lineaCompleta.value || !lineaTemporal.value.unidad_seleccion) return
  const insumo = insumosStore.insumos.find((i) => i.id === lineaTemporal.value.insumo_id)
  if (!insumo) return

  const [prefijo, id] = lineaTemporal.value.unidad_seleccion.split(':') as [string, string]
  let unidad_medida_id: string | null = null
  let presentacion_id: string | null = null
  let unidad_label: string

  if (prefijo === 'u') {
    const unidad = unidadesStore.unidades.find((u) => u.id === id)
    if (!unidad) return
    unidad_medida_id = unidad.id
    unidad_label = unidad.codigo
  } else {
    const presentacion = presentacionesStore.items.find((p) => p.id === id)
    if (!presentacion) return
    presentacion_id = presentacion.id
    unidad_label = presentacion.nombre
  }

  lineas.value.push({
    insumo_id: insumo.id,
    insumo_nombre: insumo.nombre,
    unidad_medida_id,
    presentacion_id,
    unidad_label,
    cantidad: lineaTemporal.value.cantidad,
    costo_unitario: lineaTemporal.value.costo_unitario,
  })
  lineaTemporal.value = lineaTemporalVacia()
}

const quitarLinea = (index: number) => {
  lineas.value.splice(index, 1)
}

const guardarCompra = async () => {
  if (!formCompra.value.proveedor_id || lineas.value.length === 0 || !authStore.currentBranchId)
    return
  guardando.value = true
  const detalles = lineas.value.map((l) => ({
    insumo_id: l.insumo_id,
    unidad_medida_id: l.unidad_medida_id,
    presentacion_id: l.presentacion_id,
    cantidad: String(l.cantidad),
    costo_unitario: String(l.costo_unitario),
  }))
  try {
    if (compraEditando.value) {
      await store.editar(compraEditando.value.id, {
        proveedor_id: formCompra.value.proveedor_id,
        notas: formCompra.value.notas.trim() || null,
        detalles,
      })
      $q.notify({ type: 'positive', message: 'Compra actualizada', position: 'top-right' })
    } else {
      await store.crear({
        sucursal_id: authStore.currentBranchId,
        proveedor_id: formCompra.value.proveedor_id,
        notas: formCompra.value.notas.trim() || null,
        detalles,
      })
      $q.notify({ type: 'positive', message: 'Compra creada', position: 'top-right' })
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

// ── Cancelar ────────────────────────────────────────────────────────────────

const dialogConfirmar = ref(false)
const compraConfirmar = ref<Compra | null>(null)
const ejecutando = ref(false)

const confirmarAccion = (row: Compra, _accion: 'cancelar') => {
  compraConfirmar.value = row
  dialogConfirmar.value = true
}

const refrescarStockLocal = () => {
  if (authStore.currentBranchId) void insumosStore.cargar(authStore.currentBranchId)
}

const ejecutarAccion = async () => {
  if (!compraConfirmar.value) return
  ejecutando.value = true
  try {
    await store.cancelar(compraConfirmar.value.id)
    $q.notify({ type: 'positive', message: 'Compra cancelada', position: 'top-right' })
    dialogConfirmar.value = false
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    ejecutando.value = false
  }
}

// ── Recibir (parcial) ───────────────────────────────────────────────────────

interface LineaRecepcionUI {
  detalle_id: string
  insumo_nombre: string
  unidad: string
  pedido: number
  recibido: number
  pendiente: number
  ahora: number
}

const dialogRecibir = ref(false)
const compraRecibir = ref<Compra | null>(null)
const lineasRecepcion = ref<LineaRecepcionUI[]>([])

const hayAlgoQueRecibir = computed(() =>
  lineasRecepcion.value.some((l) => l.ahora > 0 && l.ahora <= l.pendiente),
)

const abrirRecibir = async (row: Compra) => {
  const completa = await comprasApi.obtener(row.id)
  compraRecibir.value = completa
  lineasRecepcion.value = completa.detalles.map((d) => {
    const pedido = Number(d.cantidad)
    const recibido = Number(d.cantidad_recibida)
    const pendiente = Number((pedido - recibido).toFixed(3))
    return {
      detalle_id: d.id,
      insumo_nombre: d.insumo_nombre,
      unidad: d.presentacion_nombre ?? d.unidad_medida_codigo ?? '',
      pedido,
      recibido,
      pendiente,
      ahora: pendiente > 0 ? pendiente : 0,
    }
  })
  dialogRecibir.value = true
}

const ejecutarRecibir = async () => {
  if (!compraRecibir.value) return
  ejecutando.value = true
  try {
    const actualizada = await store.recibir(compraRecibir.value.id, {
      lineas: lineasRecepcion.value
        .filter((l) => l.ahora > 0)
        .map((l) => ({ detalle_id: l.detalle_id, cantidad: String(l.ahora) })),
    })
    $q.notify({
      type: 'positive',
      message:
        actualizada.estado === 'R'
          ? 'Compra recibida completa, stock actualizado'
          : 'Recepción parcial registrada',
      position: 'top-right',
    })
    dialogRecibir.value = false
    refrescarStockLocal()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    ejecutando.value = false
  }
}
</script>
