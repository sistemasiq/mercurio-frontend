<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Reporte de Stock"
      subtitle="Insumos por debajo de su mínimo o punto de reorden."
    >
      <template #actions>
        <q-btn outline icon="download" label="Exportar" :loading="exportando" @click="exportar" />
        <q-btn
          v-if="insumosParaReponer.length > 0"
          unelevated
          color="primary"
          icon="add_shopping_cart"
          label="Generar orden de compra"
          @click="dialogGenerar = true"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="kpi-row">
      <KpiCard
        label="Insumos bajo mínimo"
        :value="criticos.length"
        :note="`de ${insumosActivos.length}`"
        note-tone="bad"
      />
      <KpiCard label="Por reordenar" :value="porReordenar.length" note-tone="warn" />
      <KpiCard
        label="Valor del inventario"
        :value="formatMXN(valorInventario)"
        note="costo unitario"
      />
      <KpiCard label="Compras pendientes" :value="comprasPendientes.length" />
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="vista"
      search-placeholder="Buscar insumo"
      :filters="VISTAS"
      :count="`${filas.length} alertas`"
    >
      <q-table
        :rows="filas"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.nombre }}</q-td>
        </template>
        <template #body-cell-stock_actual="props">
          <q-td :props="props">
            <div
              class="stock-bar"
              :class="vista === 'reordenar' ? 'stock-bar--warn' : 'stock-bar--bad'"
            >
              <div class="stock-bar__track">
                <div class="stock-bar__fill" :style="{ width: `${pctUmbral(props.row)}%` }" />
              </div>
              <span class="stock-bar__value">
                {{ Number(props.row.stock_actual) }} {{ codigoUnidad(props.row.unidad_base_id) }}
              </span>
            </div>
          </q-td>
        </template>
        <template #body-cell-umbral="props">
          <q-td :props="props">
            {{ umbral(props.row) }} {{ codigoUnidad(props.row.unidad_base_id) }}
          </q-td>
        </template>
        <template #body-cell-deficit="props">
          <q-td :props="props" class="deficit">
            {{ Number((umbral(props.row) - Number(props.row.stock_actual)).toFixed(3)) }}
            {{ codigoUnidad(props.row.unidad_base_id) }}
          </q-td>
        </template>
        <template #body-cell-proveedor="props">
          <q-td :props="props" class="cell-muted">
            {{ nombreProveedor(props.row.proveedor_principal_id) }}
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            variant="empty"
            title="Sin alertas"
            :body="
              vista === 'reordenar'
                ? 'Ningún insumo está bajo su punto de reorden.'
                : 'Ningún insumo está por debajo de su stock mínimo.'
            "
          />
        </template>
      </q-table>
    </DataTableCard>

    <BaseDialog
      v-model="dialogGenerar"
      title="Generar orden de compra"
      subtitle="Se crea un borrador por proveedor con la cantidad sugerida."
      icon="add_shopping_cart"
      :width="560"
    >
      <div class="gen-list">
        <div class="gen-list__head"><span>Proveedor</span><span>Insumos</span></div>
        <p v-if="!gruposPorProveedor.length" class="gen-list__empty">No hay insumos por reponer.</p>
        <div v-for="g in gruposPorProveedor" :key="g.proveedorId ?? 'sin'" class="gen-list__row">
          <div class="gen-list__info">
            <span class="gen-list__name">{{ g.proveedorNombre }}</span>
            <span class="gen-list__meta">
              {{ g.insumos.map((i) => i.nombre).join(' · ') }}
            </span>
          </div>
          <q-btn
            v-if="g.proveedorId"
            unelevated
            dense
            color="primary"
            label="Generar"
            class="gen-list__btn"
            @click="generarOrden(g)"
          />
          <span v-else class="gen-list__none">Sin proveedor principal</span>
        </div>
      </div>
      <template #footer>
        <q-btn v-close-popup outline label="Cerrar" />
      </template>
    </BaseDialog>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { FilterChip } from '@/types/ui'
import { formatMXN } from '@/utils/formatoMoneda'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useInsumosStore } from '@/stores/insumos'
import { useProveedoresStore } from '@/stores/proveedores'
import { useComprasStore, type LineaPrefill } from '@/stores/compras'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import { exportarReporteStock } from '@/services/insumoService'
import { mensajeDeError } from '@/utils/errorHandler'
import type { Insumo } from '@/types/insumo'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const insumosStore = useInsumosStore()
const proveedoresStore = useProveedoresStore()
const comprasStore = useComprasStore()
const unidadesStore = useUnidadesMedidaStore()
const alertas = useAlertasInventarioStore()

const loading = ref(false)
const dialogGenerar = ref(false)
const exportando = ref(false)

async function exportar() {
  if (!authStore.currentBranchId) return
  exportando.value = true
  try {
    await exportarReporteStock(authStore.currentBranchId)
  } catch (err) {
    $q.notify({ type: 'negative', message: mensajeDeError(err, 'No se pudo exportar el reporte.') })
  } finally {
    exportando.value = false
  }
}

onMounted(async () => {
  if (!authStore.currentBranchId) return
  loading.value = true
  try {
    await Promise.all([
      insumosStore.cargar(authStore.currentBranchId),
      proveedoresStore.cargar(authStore.currentBranchId),
      comprasStore.cargar(authStore.currentBranchId),
      unidadesStore.cargar(),
      alertas.refrescar(authStore.currentBranchId, false),
    ])
  } finally {
    loading.value = false
  }
})

const codigoUnidad = (unidadId: string): string =>
  unidadesStore.unidades.find((u) => u.id === unidadId)?.codigo ?? '—'

const insumosActivos = computed(() => insumosStore.insumos.filter((i) => i.activo))
const criticos = computed(() => alertas.criticos)
const porReordenar = computed(() => alertas.porReordenar)

const valorInventario = computed(() =>
  insumosActivos.value.reduce(
    (acc, i) => acc + Number(i.stock_actual) * Number(i.costo_unitario ?? 0),
    0,
  ),
)

const comprasPendientes = computed(() => comprasStore.compras.filter((c) => c.estado === 'P'))

const insumosParaReponer = computed<Insumo[]>(() => [...criticos.value, ...porReordenar.value])

interface GrupoProveedor {
  proveedorId: string | null
  proveedorNombre: string
  insumos: Insumo[]
}

const gruposPorProveedor = computed<GrupoProveedor[]>(() => {
  const mapa = new Map<string | null, Insumo[]>()
  for (const ins of insumosParaReponer.value) {
    const key = ins.proveedor_principal_id
    const lista = mapa.get(key)
    if (lista) lista.push(ins)
    else mapa.set(key, [ins])
  }
  return [...mapa.entries()].map(([proveedorId, insumos]) => ({
    proveedorId,
    proveedorNombre: proveedorId
      ? (proveedoresStore.proveedores.find((p) => p.id === proveedorId)?.nombre ?? 'Proveedor')
      : 'Sin proveedor principal',
    insumos,
  }))
})

const cantidadSugerida = (ins: Insumo): number => {
  const objetivo = Number(ins.stock_maximo ?? ins.punto_reorden ?? ins.stock_minimo)
  return Math.max(0, Number((objetivo - Number(ins.stock_actual)).toFixed(3)))
}

const generarOrden = (grupo: GrupoProveedor) => {
  if (!grupo.proveedorId) return
  const lineas: LineaPrefill[] = grupo.insumos.map((ins) => ({
    insumo_id: ins.id,
    unidad_medida_id: ins.unidad_base_id,
    cantidad: cantidadSugerida(ins) || 1,
    costo_unitario: Number(ins.costo_unitario ?? 0),
  }))
  comprasStore.setBorradorPrefill({ proveedor_id: grupo.proveedorId, lineas })
  dialogGenerar.value = false
  router.push({ name: 'compras-listar' })
}

type Vista = 'criticos' | 'reordenar'
const VISTAS: FilterChip<Vista>[] = [
  { label: 'Bajo mínimo', value: 'criticos' },
  { label: 'Por reordenar', value: 'reordenar' },
]
const vista = ref<Vista | null>('criticos')
const busqueda = ref('')

const filas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const base = vista.value === 'reordenar' ? porReordenar.value : criticos.value
  return base.filter((i) => !q || i.nombre.toLowerCase().includes(q))
})

// Umbral de la vista: mínimo para críticos, punto de reorden para el resto.
const umbral = (row: Insumo) =>
  vista.value === 'reordenar'
    ? Number(row.punto_reorden ?? row.stock_minimo)
    : Number(row.stock_minimo)
const pctUmbral = (row: Insumo) => {
  const u = umbral(row)
  return u > 0 ? Math.min(100, Math.round((Number(row.stock_actual) / u) * 100)) : 0
}
const nombreProveedor = (id: string | null) =>
  proveedoresStore.proveedores.find((p) => p.id === id)?.nombre ?? '—'

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'Insumo', field: 'nombre', align: 'left', sortable: true },
  { name: 'stock_actual', label: 'Stock actual', field: 'stock_actual', align: 'left' },
  { name: 'umbral', label: 'Umbral', field: 'id', align: 'right' },
  { name: 'deficit', label: 'Déficit', field: 'id', align: 'right' },
  { name: 'proveedor', label: 'Proveedor', field: 'proveedor_principal_id', align: 'left' },
]
</script>

<style scoped lang="scss">
.stock-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;

  &__track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #eef1f5;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
  }

  &__value {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-body);
    white-space: nowrap;
  }

  &--bad &__fill {
    background: var(--tone-bad-dot);
  }

  &--warn &__fill {
    background: var(--tone-warn-dot);
  }
}

.deficit {
  color: var(--tone-bad-fg) !important;
  font-weight: 700;
}

.gen-list {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;

  &__head {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__empty {
    margin: 0;
    padding: 14px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__meta {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__btn {
    padding: 0 12px;
  }

  &__none {
    font-size: 12px;
    color: var(--text-muted);
  }
}
</style>
