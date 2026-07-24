<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-md">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          class="q-mr-sm"
          @click="router.push({ name: 'insumos-listar' })"
        >
          <q-tooltip>Volver a Insumos</q-tooltip>
        </q-btn>
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Kardex de {{ insumo?.nombre ?? '...' }}
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Historial de movimientos y stock resultante.
          </div>
        </div>
      </div>

      <!-- Resumen del insumo -->
      <q-card v-if="insumo" flat bordered class="q-pa-md q-mb-lg" style="border-radius: 12px">
        <div class="row q-col-gutter-md">
          <div class="col">
            <div class="field-label">STOCK ACTUAL</div>
            <div class="text-h6 text-weight-bold">
              {{ Number(insumo.stock_actual) }} {{ codigoUnidad(insumo.unidad_base_id) }}
            </div>
          </div>
          <div class="col">
            <div class="field-label">STOCK MÍNIMO</div>
            <div class="text-h6 text-weight-bold">
              {{ Number(insumo.stock_minimo) }} {{ codigoUnidad(insumo.unidad_base_id) }}
            </div>
          </div>
        </div>
      </q-card>

      <!-- Filtro de fechas -->
      <div class="row q-col-gutter-sm items-end q-mb-md">
        <div class="col-3">
          <div class="field-label">DESDE</div>
          <q-input v-model="desde" dense outlined type="date" />
        </div>
        <div class="col-3">
          <div class="field-label">HASTA</div>
          <q-input v-model="hasta" dense outlined type="date" />
        </div>
        <div class="col-auto">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Filtrar"
            style="border-radius: 8px; font-weight: 600"
            @click="aplicarFiltro"
          />
        </div>
        <div class="col-auto">
          <q-btn flat no-caps label="Limpiar" color="grey-7" @click="limpiarFiltro" />
        </div>
      </div>

      <!-- Error -->
      <q-banner
        v-if="movimientosStore.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ movimientosStore.error }}
      </q-banner>

      <!-- Tabla ── formato kardex -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="movimientosStore.items"
          :columns="columns"
          row-key="id"
          flat
          :loading="movimientosStore.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="No hay movimientos en este rango de fechas"
          class="fec-table"
        >
          <template #body-cell-creado="props">
            <q-td :props="props">{{ formatearFecha(props.row.creado) }}</q-td>
          </template>

          <template #body-cell-tipo="props">
            <q-td :props="props">
              <EstadoPill
                :tono="TIPO_TONO[props.row.tipo as TipoMovimiento]"
                :label="TIPO_LABEL[props.row.tipo as TipoMovimiento]"
              />
            </q-td>
          </template>

          <template #body-cell-motivo="props">
            <q-td :props="props">{{ MOTIVO_LABEL[props.row.motivo] ?? props.row.motivo }}</q-td>
          </template>

          <template #body-cell-entrada="props">
            <q-td :props="props" class="text-positive text-weight-medium">
              {{ esEntrada(props.row.tipo) ? Number(props.row.cantidad) : '' }}
            </q-td>
          </template>

          <template #body-cell-salida="props">
            <q-td :props="props" class="text-negative text-weight-medium">
              {{ !esEntrada(props.row.tipo) ? Number(props.row.cantidad) : '' }}
            </q-td>
          </template>

          <template #body-cell-saldo="props">
            <q-td :props="props" class="text-weight-bold">
              {{ Number(props.row.stock_resultante) }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QTableColumn } from 'quasar'
import { useInsumosStore } from '@/stores/insumos'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { useMovimientosInventarioStore } from '@/stores/movimientosInventario'
import { useAuthStore } from '@/stores/auth'
import EstadoPill from '@/components/inventario/EstadoPill.vue'

type TipoMovimiento = 'E' | 'S' | 'A' | 'M'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const insumosStore = useInsumosStore()
const unidadesStore = useUnidadesMedidaStore()
const movimientosStore = useMovimientosInventarioStore()

const insumoId = computed(() => String(route.params.id))
const insumo = computed(() => insumosStore.insumos.find((i) => i.id === insumoId.value))

const desde = ref('')
const hasta = ref('')

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
  A: 'Ajuste',
  M: 'Merma',
}
const TIPO_TONO: Record<TipoMovimiento, 'verde' | 'rojo' | 'azul' | 'naranja'> = {
  E: 'verde',
  S: 'rojo',
  A: 'azul',
  M: 'naranja',
}
const MOTIVO_LABEL: Record<string, string> = {
  venta_comanda: 'Venta',
  cancelacion_comanda: 'Cancelación',
  entrada_manual: 'Entrada manual',
  merma: 'Merma',
  compra: 'Compra',
}

const formatearFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

const columns: QTableColumn[] = [
  { name: 'creado', label: 'FECHA', field: 'creado', align: 'left', sortable: true },
  { name: 'tipo', label: 'TIPO', field: 'tipo', align: 'left' },
  { name: 'motivo', label: 'MOTIVO', field: 'motivo', align: 'left' },
  { name: 'entrada', label: 'ENTRADA', field: 'cantidad', align: 'left' },
  { name: 'salida', label: 'SALIDA', field: 'cantidad', align: 'left' },
  { name: 'saldo', label: 'SALDO', field: 'stock_resultante', align: 'left' },
]
</script>

<style scoped>
.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
</style>
