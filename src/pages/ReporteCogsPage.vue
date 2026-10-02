<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Costo de Ventas"
      subtitle="Costo de los insumos consumidos (ventas + mermas) por PEPS/FIFO."
    />

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="kpi-row">
      <KpiCard label="Costo total del periodo" :value="formatMXN(costoTotal)" />
      <KpiCard label="Insumos con consumo" :value="renglones.length" />
    </div>

    <DataTableCard hide-search :count="`${renglones.length} insumos`">
      <template #toolbar>
        <div class="cogs-range">
          <label class="cogs-range__field">
            <span class="field-label">Desde</span>
            <q-input v-model="desde" dense outlined type="date" />
          </label>
          <label class="cogs-range__field">
            <span class="field-label">Hasta</span>
            <q-input v-model="hasta" dense outlined type="date" />
          </label>
          <q-btn unelevated color="primary" label="Consultar" :loading="loading" @click="cargar" />
        </div>
      </template>
      <q-table
        :rows="renglones"
        :columns="columns"
        row-key="insumo_id"
        flat
        :loading="loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-insumo_nombre="props">
          <q-td :props="props" class="text-weight-bold">{{ props.row.insumo_nombre }}</q-td>
        </template>
        <template #body-cell-cantidad_salida="props">
          <q-td :props="props">{{ Number(props.row.cantidad_salida) }}</q-td>
        </template>
        <template #body-cell-costo_total="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(Number(props.row.costo_total)) }}
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            variant="empty"
            title="Sin consumo en el periodo"
            body="Prueba con otro rango de fechas."
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
import StateBlock from '@/components/ui/StateBlock.vue'
import { formatMXN } from '@/utils/formatoMoneda'
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { listarReporteCogs } from '@/services/insumoService'
import type { CogsRenglon } from '@/types/movimientoInventario'
import { resolveErrorMessage } from '@/utils/errorHandler'
import type { ApiError } from '@/types/auth'

const $q = useQuasar()
const authStore = useAuthStore()

const hoy = new Date().toISOString().slice(0, 10)
const primeroDeMes = hoy.slice(0, 8) + '01'
const desde = ref(primeroDeMes)
const hasta = ref(hoy)
const loading = ref(false)
const renglones = ref<CogsRenglon[]>([])

const costoTotal = computed(() =>
  renglones.value.reduce((acc, r) => acc + Number(r.costo_total), 0),
)

const cargar = async () => {
  if (!authStore.currentBranchId) return
  loading.value = true
  try {
    renglones.value = await listarReporteCogs(
      authStore.currentBranchId,
      desde.value || undefined,
      hasta.value || undefined,
    )
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: resolveErrorMessage(err as ApiError),
      position: 'top-right',
    })
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

const columns: QTableColumn[] = [
  { name: 'insumo_nombre', label: 'Insumo', field: 'insumo_nombre', align: 'left', sortable: true },
  {
    name: 'cantidad_salida',
    label: 'Cantidad consumida',
    field: 'cantidad_salida',
    align: 'right',
    sortable: true,
  },
  {
    name: 'costo_total',
    label: 'Costo',
    field: 'costo_total',
    align: 'right',
    sortable: true,
  },
]
</script>

<style scoped lang="scss">
.cogs-range {
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
</style>
