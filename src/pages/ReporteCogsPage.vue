<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Costo de ventas
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Costo de los insumos consumidos (ventas + mermas) por PEPS/FIFO.
          </div>
        </div>
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

      <div class="row q-col-gutter-sm items-end q-mb-md">
        <div class="col-6 col-sm-3">
          <div class="field-label">DESDE</div>
          <q-input v-model="desde" dense outlined type="date" />
        </div>
        <div class="col-6 col-sm-3">
          <div class="field-label">HASTA</div>
          <q-input v-model="hasta" dense outlined type="date" />
        </div>
        <div class="col-auto">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Consultar"
            style="border-radius: 8px; font-weight: 600"
            :loading="loading"
            @click="cargar"
          />
        </div>
      </div>

      <div class="kpi-row q-mb-lg">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="payments" size="20px" />
          </div>
          <div class="stat-card__value">${{ costoTotal.toFixed(2) }}</div>
          <div class="stat-card__label">Costo total del periodo</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="inventory_2" size="20px" />
          </div>
          <div class="stat-card__value">{{ renglones.length }}</div>
          <div class="stat-card__label">Insumos con consumo</div>
        </div>
      </div>

      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="renglones"
          :columns="columns"
          row-key="insumo_id"
          flat
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="Sin consumo de insumos en el periodo"
          class="fec-table"
        >
          <template #body-cell-cantidad_salida="props">
            <q-td :props="props">{{ Number(props.row.cantidad_salida) }}</q-td>
          </template>
          <template #body-cell-costo_total="props">
            <q-td :props="props" class="text-weight-bold">
              ${{ Number(props.row.costo_total).toFixed(2) }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
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
  { name: 'insumo_nombre', label: 'INSUMO', field: 'insumo_nombre', align: 'left', sortable: true },
  {
    name: 'cantidad_salida',
    label: 'CANTIDAD CONSUMIDA',
    field: 'cantidad_salida',
    align: 'left',
    sortable: true,
  },
  {
    name: 'costo_total',
    label: 'COSTO',
    field: 'costo_total',
    align: 'left',
    sortable: true,
  },
]
</script>
