<template>
  <q-page class="page-content list-page">
    <PageHeader title="Insumos" subtitle="Materia prima, presentaciones y existencias.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nuevo Insumo"
          :disable="!authStore.currentBranchId"
          @click="abrirCrear"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div v-if="totalBajoMinimo > 0" class="list-page__note list-page__note--warn">
      <q-icon name="warning" size="19px" />
      {{ totalBajoMinimo }} {{ totalBajoMinimo === 1 ? 'insumo está' : 'insumos están' }} por debajo
      del mínimo. Revisa el Reporte de Stock para generar la compra.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      :filters="FILTROS"
      search-placeholder="Buscar insumo"
      :count="`${insumosFiltrados.length} insumos`"
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
        :rows="insumosFiltrados"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-unidad_base_id="props">
          <q-td :props="props">{{ codigoUnidad(props.row.unidad_base_id) }}</q-td>
        </template>
        <template #body-cell-stock_actual="props">
          <q-td :props="props">
            <div class="stock-bar" :class="{ 'stock-bar--low': bajoMinimo(props.row) }">
              <div class="stock-bar__track">
                <div class="stock-bar__fill" :style="{ width: `${pctStock(props.row)}%` }" />
              </div>
              <span class="stock-bar__value">
                {{ Number(props.row.stock_actual) }} {{ codigoUnidad(props.row.unidad_base_id) }}
              </span>
            </div>
          </q-td>
        </template>
        <template #body-cell-rinde_para="props">
          <q-td :props="props" class="cell-muted">
            <template v-if="estimacion(props.row)">
              <span :class="{ 'text-negative text-weight-bold': estimacion(props.row)!.min === 0 }">
                ≈ {{ estimacion(props.row)!.min }} {{ estimacion(props.row)!.producto }}
              </span>
              <q-tooltip v-if="estimacion(props.row)!.desglose.length" anchor="top middle">
                <div v-for="d in estimacion(props.row)!.desglose" :key="d.producto">
                  {{ d.producto }}: ≈ {{ d.unidades }}
                </div>
              </q-tooltip>
            </template>
            <template v-else>—</template>
          </q-td>
        </template>
        <template #body-cell-stock_minimo="props">
          <q-td :props="props">{{ Number(props.row.stock_minimo) }}</q-td>
        </template>
        <template #body-cell-costo_unitario="props">
          <q-td :props="props" class="text-weight-bold">
            {{ props.row.costo_unitario ? formatMXN(Number(props.row.costo_unitario)) : '—' }}
          </q-td>
        </template>
        <template #body-cell-proveedor_principal_id="props">
          <q-td :props="props" class="cell-muted">{{
            nombreProveedor(props.row.proveedor_principal_id)
          }}</q-td>
        </template>
        <template #body-cell-activo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="!props.row.activo ? 'off' : bajoMinimo(props.row) ? 'bad' : 'ok'"
              :label="
                !props.row.activo ? 'Inactivo' : bajoMinimo(props.row) ? 'Bajo mínimo' : 'Activo'
              "
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="history"
              class="action-btn"
              aria-label="Kardex"
              @click="abrirKardex(props.row)"
            >
              <q-tooltip>Kardex</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="tune"
              class="action-btn"
              aria-label="Ajustar stock"
              :disable="!props.row.activo"
              @click="abrirAjuste(props.row)"
            >
              <q-tooltip>Ajustar stock</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="more_vert" class="action-btn" aria-label="Más acciones">
              <q-menu anchor="bottom right" self="top right">
                <q-list dense style="min-width: 180px">
                  <q-item v-close-popup clickable @click="abrirEditar(props.row)">
                    <q-item-section avatar><q-icon name="edit" size="19px" /></q-item-section>
                    <q-item-section>Editar</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="abrirPresentaciones(props.row)">
                    <q-item-section avatar><q-icon name="category" size="19px" /></q-item-section>
                    <q-item-section>Presentaciones</q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    class="text-negative"
                    :disable="!props.row.activo"
                    @click="confirmarEliminar(props.row)"
                  >
                    <q-item-section avatar><q-icon name="delete" size="19px" /></q-item-section>
                    <q-item-section>Eliminar</q-item-section>
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
            :title="filtrando ? undefined : 'No hay insumos registrados'"
            :body="filtrando ? undefined : 'Agrega la materia prima que usan tus recetas.'"
            :action-label="filtrando ? 'Limpiar filtros' : 'Nuevo Insumo'"
            @action="filtrando ? ((busqueda = ''), (filtro = 'todos')) : abrirCrear()"
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogOpen"
      :title="editando ? 'Editar insumo' : 'Nuevo insumo'"
      :subtitle="editando ? editando.nombre : 'Define unidad base y existencias mínimas.'"
      icon="inventory_2"
      tone="blue"
      :width="600"
      persistent
    >
      <div class="dlg-stack">
        <div>
          <div class="field-label">Nombre</div>
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
          <div class="field-label">Descripción (opcional)</div>
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
            <div class="field-label">Unidad de compra</div>
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
          <div class="field-label">Stock inicial</div>
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
            <div class="field-label">Stock mínimo</div>
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
            <div class="field-label">Costo unitario (opcional)</div>
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

        <div class="row q-col-gutter-md">
          <div class="col">
            <div class="field-label">Punto de reorden (opcional)</div>
            <q-input
              v-model.number="formDialog.punto_reorden"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
              hint="Nivel al que conviene volver a pedir"
            />
          </div>
          <div class="col">
            <div class="field-label">Stock máximo (opcional)</div>
            <q-input
              v-model.number="formDialog.stock_maximo"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
              hint="Referencia para sugerir cuánto comprar"
            />
          </div>
        </div>

        <div>
          <div class="field-label">Proveedor principal (opcional)</div>
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
      </div>

      <template #footer>
        <q-btn outline label="Cancelar" @click="cerrarDialog" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="editando ? 'Guardar cambios' : 'Crear insumo'"
          :loading="guardando"
          @click="guardar"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogEliminar"
      :title="'Eliminar insumo'"
      :subtitle="filaEliminar?.nombre"
      icon="delete"
      tone="red"
      :width="460"
    >
      <div class="dlg-stack">
        <div class="q-mt-sm text-body2 text-grey-8">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ filaEliminar?.nombre }}</strong
          >? Esta acción no se puede deshacer.
        </div>
      </div>

      <template #footer>
        <q-btn v-close-popup outline label="Cancelar" />
        <q-btn
          unelevated
          no-caps
          color="negative"
          label="Eliminar"
          :loading="eliminando"
          @click="ejecutarEliminar"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogAjuste"
      :title="'Registrar ajuste'"
      :subtitle="
        insumoAjuste
          ? `${insumoAjuste.nombre} · stock actual ${Number(insumoAjuste.stock_actual)}`
          : ''
      "
      icon="tune"
      tone="amber"
      :width="520"
    >
      <div class="dlg-stack">
        <q-btn-toggle
          v-model="modoAjuste"
          spread
          no-caps
          dense
          unelevated
          toggle-color="primary"
          :options="[
            { label: 'Ajuste manual', value: 'manual' },
            { label: 'Conteo físico', value: 'conteo' },
          ]"
        />

        <template v-if="modoAjuste === 'manual'">
          <div>
            <div class="field-label">Tipo de ajuste</div>
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
            <div class="field-label">Cantidad</div>
            <q-input
              v-model.number="formAjuste.cantidad"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
            />
          </div>
        </template>

        <template v-else>
          <div>
            <div class="field-label">
              STOCK REAL CONTADO ({{
                insumoAjuste ? codigoUnidad(insumoAjuste.unidad_base_id) : ''
              }})
            </div>
            <q-input
              v-model.number="formConteo.stock_contado"
              dense
              outlined
              type="number"
              min="0"
              step="0.001"
            />
          </div>
          <q-banner v-if="insumoAjuste" dense rounded class="bg-blue-1 text-blue-9">
            <template #avatar><q-icon name="calculate" color="blue-9" /></template>
            <template v-if="deltaConteo === 0">Coincide con el sistema, no hay ajuste.</template>
            <template v-else-if="deltaConteo > 0">
              Entrada de <strong>+{{ deltaConteo }}</strong>
              {{ codigoUnidad(insumoAjuste.unidad_base_id) }} (sobra stock).
            </template>
            <template v-else>
              Merma de <strong>{{ deltaConteo }}</strong>
              {{ codigoUnidad(insumoAjuste.unidad_base_id) }} (falta stock).
            </template>
          </q-banner>
        </template>

        <div>
          <div class="field-label">Notas (opcional)</div>
          <q-input
            v-model="formAjuste.notas"
            dense
            outlined
            type="textarea"
            rows="2"
            placeholder="Ej. conteo físico, producto vencido..."
          />
        </div>
      </div>

      <template #footer>
        <q-btn outline label="Cancelar" @click="cerrarAjuste" />
        <q-btn
          v-if="modoAjuste === 'manual'"
          unelevated
          no-caps
          color="primary"
          label="Registrar ajuste"
          :loading="guardandoAjuste"
          :disable="!formAjuste.cantidad"
          @click="guardarAjuste"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          color="primary"
          label="Aplicar conteo"
          :loading="guardandoAjuste"
          :disable="deltaConteo === 0"
          @click="guardarConteo"
        />
      </template>
    </BaseDialog>

    <BaseDialog
      v-model="dialogPresentaciones"
      :title="'Presentaciones'"
      :subtitle="
        insumoPresentaciones
          ? `${insumoPresentaciones.nombre} · unidad base ${codigoUnidad(insumoPresentaciones.unidad_base_id)}`
          : ''
      "
      icon="category"
      tone="blue"
      :width="560"
    >
      <div class="dlg-stack">
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
                {{ insumoPresentaciones ? codigoUnidad(insumoPresentaciones.unidad_base_id) : '' }}
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
      </div>

      <div class="dlg-stack">
        <div class="row q-col-gutter-sm items-start">
          <div class="col-7">
            <div class="field-label">Nombre</div>
            <q-input
              v-model="formPresentacion.nombre"
              dense
              outlined
              placeholder="Ej. Paquete (8 pz)"
            />
          </div>
          <div class="col-5">
            <div class="field-label">Equivalencia</div>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
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

type FiltroInsumo = 'todos' | 'bajo' | 'inactivos'
const FILTROS: FilterChip<FiltroInsumo>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Bajo mínimo', value: 'bajo' },
  { label: 'Inactivos', value: 'inactivos' },
]
const filtro = ref<FiltroInsumo | null>('todos')
const busqueda = ref('')
const filtrando = computed(() => !!busqueda.value || filtro.value !== 'todos')

const insumosFiltrados = computed(() => {
  const t = (busqueda.value ?? '').trim().toLowerCase()
  return store.insumos.filter((i) => {
    if (t && !i.nombre.toLowerCase().includes(t)) return false
    if (filtro.value === 'inactivos') return !i.activo
    if (filtro.value === 'bajo') return i.activo && bajoMinimo(i)
    return true
  })
})

const totalBajoMinimo = computed(
  () => store.insumos.filter((i) => i.activo && bajoMinimo(i)).length,
)

// Barra de stock: proporción respecto al doble del mínimo (llena = holgado).
const pctStock = (row: Insumo) => {
  const min = Number(row.stock_minimo) || 0
  if (min <= 0) return 100
  return Math.min(100, Math.round((Number(row.stock_actual) / (min * 2)) * 100))
}

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
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'unidad_base_id', label: 'Unidad', field: 'unidad_base_id', align: 'left' },
  { name: 'stock_actual', label: 'Stock', field: 'stock_actual', align: 'left', sortable: true },
  { name: 'rinde_para', label: 'Rinde para (estimado)', field: 'id', align: 'left' },
  { name: 'stock_minimo', label: 'Mínimo', field: 'stock_minimo', align: 'right' },
  { name: 'costo_unitario', label: 'Costo', field: 'costo_unitario', align: 'right' },
  {
    name: 'proveedor_principal_id',
    label: 'Proveedor',
    field: 'proveedor_principal_id',
    align: 'left',
  },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

// ── Estado del dialog ─────────────────────────────────────────────────────────

const dialogOpen = ref(false)
const editando = ref<Insumo | null>(null)
const guardando = ref(false)
const nombreRef = ref()

const formVacio = () => ({
  nombre: '',
  descripcion: '',
  unidad_base_id: null as string | null,
  unidad_compra_id: null as string | null,
  stock_inicial: 0,
  stock_minimo: 0,
  punto_reorden: null as number | null,
  stock_maximo: null as number | null,
  costo_unitario: null as number | null,
  proveedor_principal_id: null as string | null,
})

const formDialog = ref(formVacio())

const abrirCrear = () => {
  editando.value = null
  formDialog.value = formVacio()
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
    punto_reorden: row.punto_reorden != null ? Number(row.punto_reorden) : null,
    stock_maximo: row.stock_maximo != null ? Number(row.stock_maximo) : null,
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
        punto_reorden:
          formDialog.value.punto_reorden != null ? String(formDialog.value.punto_reorden) : null,
        stock_maximo:
          formDialog.value.stock_maximo != null ? String(formDialog.value.stock_maximo) : null,
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
        punto_reorden:
          formDialog.value.punto_reorden != null ? String(formDialog.value.punto_reorden) : null,
        stock_maximo:
          formDialog.value.stock_maximo != null ? String(formDialog.value.stock_maximo) : null,
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

const modoAjuste = ref<'manual' | 'conteo'>('manual')

const formAjuste = ref({
  tipo: 'E' as TipoMovimientoManual,
  cantidad: 0,
  notas: '',
})

const formConteo = ref({ stock_contado: 0 })

const deltaConteo = computed(() => {
  if (!insumoAjuste.value) return 0
  return Number(
    (formConteo.value.stock_contado - Number(insumoAjuste.value.stock_actual)).toFixed(3),
  )
})

const abrirKardex = (row: Insumo) => {
  router.push({ name: 'insumos-kardex', params: { id: row.id } })
}

const abrirAjuste = (row: Insumo) => {
  insumoAjuste.value = row
  modoAjuste.value = 'manual'
  formAjuste.value = { tipo: 'E', cantidad: 0, notas: '' }
  formConteo.value = { stock_contado: Number(row.stock_actual) }
  dialogAjuste.value = true
}

const cerrarAjuste = () => {
  dialogAjuste.value = false
  insumoAjuste.value = null
}

const aplicarStockLocal = (insumoId: string, nuevoStock: string) => {
  const idx = store.insumos.findIndex((i) => i.id === insumoId)
  if (idx !== -1) store.insumos[idx] = { ...store.insumos[idx]!, stock_actual: nuevoStock }
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
    aplicarStockLocal(insumoAjuste.value.id, movimiento.stock_resultante)
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

const guardarConteo = async () => {
  if (!insumoAjuste.value || deltaConteo.value === 0) return
  guardandoAjuste.value = true
  try {
    const movimiento = await movimientosStore.conteoFisico(insumoAjuste.value.id, {
      stock_contado: String(formConteo.value.stock_contado),
      notas: formAjuste.value.notas.trim() || null,
    })
    aplicarStockLocal(insumoAjuste.value.id, movimiento.stock_resultante)
    $q.notify({ type: 'positive', message: 'Conteo aplicado', position: 'top-right' })
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

<style scoped lang="scss">
.stock-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;

  &__track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #eef1f5;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: var(--q-primary);
  }

  &__value {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-body);
    white-space: nowrap;
  }

  &--low &__fill {
    background: var(--tone-bad-dot);
  }
}
</style>
