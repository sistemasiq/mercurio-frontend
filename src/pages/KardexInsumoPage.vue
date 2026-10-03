<template>
  <q-page class="page-content list-page">
    <PageHeader
      :title="`Kardex · ${insumo?.nombre ?? '…'}`"
      subtitle="Movimientos de entrada y salida del insumo."
      back-label="Insumos"
      :back-to="{ name: 'insumos-listar' }"
    >
      <template #actions>
        <q-btn outline icon="download" label="Exportar" :loading="exportando" @click="exportar" />
      </template>
    </PageHeader>

    <div v-if="insumo" class="kpi-row">
      <KpiCard
        label="Stock actual"
        :value="`${Number(insumo.stock_actual)} ${codigoUnidad(insumo.unidad_base_id)}`"
        :note="`mín. ${Number(insumo.stock_minimo)} ${codigoUnidad(insumo.unidad_base_id)}`"
        :note-tone="bajoMinimo ? 'bad' : undefined"
      />
      <KpiCard
        label="Entradas del periodo"
        :value="`${entradas} ${codigoUnidad(insumo.unidad_base_id)}`"
      />
      <KpiCard
        label="Salidas del periodo"
        :value="`${salidas} ${codigoUnidad(insumo.unidad_base_id)}`"
        note="ventas y merma"
      />
    </div>

    <DataTableCard hide-search :count="`${movimientosStore.items.length} movimientos`">
      <template #toolbar>
        <div class="kdx-range">
          <label class="kdx-range__field">
            <span class="field-label">Desde</span>
            <q-input v-model="desde" dense outlined type="date" />
          </label>
          <label class="kdx-range__field">
            <span class="field-label">Hasta</span>
            <q-input v-model="hasta" dense outlined type="date" />
          </label>
          <q-btn unelevated color="primary" label="Filtrar" @click="aplicarFiltro" />
          <q-btn flat label="Limpiar" @click="limpiarFiltro" />
        </div>
      </template>
      <StateBlock
        v-if="movimientosStore.error"
        variant="error"
        :body="movimientosStore.error"
        action-label="Reintentar"
        @action="aplicarFiltro"
      />
      <q-table
        v-else
        :rows="movimientosStore.items"
        :columns="columns"
        row-key="id"
        flat
        :loading="movimientosStore.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-creado="props">
          <q-td :props="props" class="text-weight-bold">{{
            formatearFecha(props.row.creado)
          }}</q-td>
        </template>
        <template #body-cell-tipo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="TIPO_TONO[props.row.tipo as TipoMovimiento]"
              :label="TIPO_LABEL[props.row.tipo as TipoMovimiento]"
            />
          </q-td>
        </template>
        <template #body-cell-motivo="props">
          <q-td :props="props" class="cell-muted">
            {{ MOTIVO_LABEL[props.row.motivo] ?? props.row.motivo }}
          </q-td>
        </template>
        <template #body-cell-entrada="props">
          <q-td :props="props" class="kdx-in">
            {{ esEntrada(props.row.tipo) ? Number(props.row.cantidad) : '' }}
          </q-td>
        </template>
        <template #body-cell-salida="props">
          <q-td :props="props" class="kdx-out">
            {{ !esEntrada(props.row.tipo) ? Number(props.row.cantidad) : '' }}
          </q-td>
        </template>
        <template #body-cell-saldo="props">
          <q-td :props="props">{{ Number(props.row.stock_resultante) }}</q-td>
        </template>
        <template #body-cell-costo="props">
          <q-td :props="props" class="text-weight-bold">
            {{ props.row.costo_total != null ? formatMXN(Number(props.row.costo_total)) : '—' }}
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            variant="empty"
            title="Sin movimientos"
            body="No hay movimientos en este rango de fechas."
          />
        </template>
      </q-table>
    </DataTableCard>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import { formatMXN } from '@/utils/formatoMoneda'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useInsumosStore } from '@/stores/insumos'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { useMovimientosInventarioStore } from '@/stores/movimientosInventario'
import { useAuthStore } from '@/stores/auth'
import { exportarMovimientos } from '@/services/movimientoInventarioService'
import { mensajeDeError } from '@/utils/errorHandler'

type TipoMovimiento = 'E' | 'S' | 'A' | 'M'

const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()
const insumosStore = useInsumosStore()
const unidadesStore = useUnidadesMedidaStore()
const movimientosStore = useMovimientosInventarioStore()

const insumoId = computed(() => String(route.params.id))
const insumo = computed(() => insumosStore.insumos.find((i) => i.id === insumoId.value))

const desde = ref('')
const hasta = ref('')
const exportando = ref(false)

async function exportar() {
  exportando.value = true
  try {
    await exportarMovimientos(insumoId.value, desde.value || undefined, hasta.value || undefined)
  } catch (err) {
    $q.notify({ type: 'negative', message: mensajeDeError(err, 'No se pudo exportar el kardex.') })
  } finally {
    exportando.value = false
  }
}

onMounted(async () => {
  if (authStore.currentBranchId) await insumosStore.cargar(authStore.currentBranchId)
  await unidadesStore.cargar()
  await movimientosStore.cargarPorInsumo(insumoId.value)
})

const aplicarFiltro = () => {
  movimientosStore.cargarPorInsumo(
    insumoId.value,
    desde.value || undefined,
    hasta.value || undefined,
  )
}

const limpiarFiltro = () => {
  desde.value = ''
  hasta.value = ''
  movimientosStore.cargarPorInsumo(insumoId.value)
}

const codigoUnidad = (unidadId: string): string => {
  const unidad = unidadesStore.unidades.find((u) => u.id === unidadId)
  return unidad ? unidad.codigo : '—'
}

const esEntrada = (tipo: string): boolean => tipo === 'E' || tipo === 'A'

const TIPO_LABEL: Record<TipoMovimiento, string> = {
  E: 'Entrada',
  S: 'Salida',
  A: 'Devolución',
  M: 'Merma',
}
const TIPO_TONO: Record<TipoMovimiento, 'ok' | 'bad' | 'info' | 'warn'> = {
  E: 'ok',
  S: 'bad',
  A: 'info',
  M: 'warn',
}

const entradas = computed(() =>
  movimientosStore.items
    .filter((m) => esEntrada(m.tipo))
    .reduce((s, m) => s + Number(m.cantidad), 0),
)
const salidas = computed(() =>
  movimientosStore.items
    .filter((m) => !esEntrada(m.tipo))
    .reduce((s, m) => s + Number(m.cantidad), 0),
)
const bajoMinimo = computed(
  () => !!insumo.value && Number(insumo.value.stock_actual) < Number(insumo.value.stock_minimo),
)
const MOTIVO_LABEL: Record<string, string> = {
  venta_comanda: 'Venta',
  cancelacion_comanda: 'Cancelación',
  entrada_manual: 'Entrada manual',
  merma: 'Merma',
  compra: 'Compra',
  conteo_fisico: 'Conteo físico',
  ajuste_fifo: 'Ajuste',
}

const formatearFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

const columns: QTableColumn[] = [
  { name: 'creado', label: 'Fecha', field: 'creado', align: 'left', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'motivo', label: 'Motivo', field: 'motivo', align: 'left' },
  { name: 'entrada', label: 'Entrada', field: 'cantidad', align: 'right' },
  { name: 'salida', label: 'Salida', field: 'cantidad', align: 'right' },
  { name: 'saldo', label: 'Saldo', field: 'stock_resultante', align: 'right' },
  { name: 'costo', label: 'Costo', field: 'costo_total', align: 'right' },
]
</script>

<style scoped lang="scss">
.kdx-range {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;

  &__field {
    display: flex;
    flex-direction: column;
    width: 170px;
  }
}

.kdx-in {
  color: var(--tone-ok-fg) !important;
  font-weight: 700;
}

.kdx-out {
  color: var(--tone-bad-fg) !important;
  font-weight: 700;
}
</style>
