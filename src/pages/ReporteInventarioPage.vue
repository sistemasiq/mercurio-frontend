<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 1100px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Reporte de Stock
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Resumen del estado del inventario de la sucursal.
          </div>
        </div>
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

      <!-- KPIs -->
      <div class="kpi-row q-mb-lg">
        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #2a78d61a; color: #2a78d6">
            <q-icon name="inventory_2" size="20px" />
          </div>
          <div class="kpi-value">{{ insumosActivos.length }}</div>
          <div class="kpi-label">Insumos activos</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #fab2191a; color: #c98d10">
            <q-icon name="warning" size="20px" />
          </div>
          <div class="kpi-value">{{ insumosBajoMinimo.length }}</div>
          <div class="kpi-label">Insumos bajo mínimo</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #0083001a; color: #008300">
            <q-icon name="payments" size="20px" />
          </div>
          <div class="kpi-value">${{ valorInventario.toFixed(2) }}</div>
          <div class="kpi-label">Valor de inventario</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #1baf7a1a; color: #1baf7a">
            <q-icon name="local_shipping" size="20px" />
          </div>
          <div class="kpi-value">{{ proveedoresActivos.length }}</div>
          <div class="kpi-label">Proveedores activos</div>
        </q-card>

        <q-card flat bordered class="kpi-tile">
          <div class="kpi-icon" style="background: #4a3aa71a; color: #4a3aa7">
            <q-icon name="shopping_cart" size="20px" />
          </div>
          <div class="kpi-value">{{ comprasPendientes.length }}</div>
          <div class="kpi-label">Compras pendientes</div>
        </q-card>
      </div>

      <!-- Alerta: insumos bajo mínimo -->
      <div class="text-subtitle1 text-weight-bold q-mb-sm" style="color: var(--text-primary)">
        Insumos bajo mínimo
      </div>
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="insumosBajoMinimo"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="Ningún insumo está por debajo de su stock mínimo"
          class="fec-table"
        >
          <template #body-cell-stock_actual="props">
            <q-td :props="props" class="text-negative text-weight-bold">
              {{ Number(props.row.stock_actual) }} {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>

          <template #body-cell-stock_minimo="props">
            <q-td :props="props">
              {{ Number(props.row.stock_minimo) }} {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>

          <template #body-cell-deficit="props">
            <q-td :props="props">
              {{ (Number(props.row.stock_minimo) - Number(props.row.stock_actual)).toFixed(3) }}
              {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useInsumosStore } from '@/stores/insumos'
import { useProveedoresStore } from '@/stores/proveedores'
import { useComprasStore } from '@/stores/compras'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { playAlertChime } from '@/utils/notificationSound'

// Cada cuánto se refresca el stock mientras la página sigue abierta, para
// detectar insumos que cruzan su mínimo sin que el usuario tenga que recargar.
const INTERVALO_REFRESCO_MS = 20000

const $q = useQuasar()
const authStore = useAuthStore()
const insumosStore = useInsumosStore()
const proveedoresStore = useProveedoresStore()
const comprasStore = useComprasStore()
const unidadesStore = useUnidadesMedidaStore()

const loading = ref(false)
let intervaloId: ReturnType<typeof setInterval> | undefined
let primeraCarga = true
const idsBajoMinimoVistos = new Set<string>()

const cargarInsumos = async () => {
  if (!authStore.currentBranchId) return
  await insumosStore.cargar(authStore.currentBranchId)
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
    ])
  } finally {
    loading.value = false
  }
  intervaloId = setInterval(() => void cargarInsumos(), INTERVALO_REFRESCO_MS)
})

onBeforeUnmount(() => {
  if (intervaloId) clearInterval(intervaloId)
})

const codigoUnidad = (unidadId: string): string => {
  const unidad = unidadesStore.unidades.find((u) => u.id === unidadId)
  return unidad ? unidad.codigo : '—'
}

const insumosActivos = computed(() => insumosStore.insumos.filter((i) => i.activo))

const insumosBajoMinimo = computed(() =>
  insumosActivos.value.filter((i) => Number(i.stock_actual) < Number(i.stock_minimo)),
)

const valorInventario = computed(() =>
  insumosActivos.value.reduce(
    (acc, i) => acc + Number(i.stock_actual) * Number(i.costo_unitario ?? 0),
    0,
  ),
)

const proveedoresActivos = computed(() => proveedoresStore.proveedores.filter((p) => p.activo))

const comprasPendientes = computed(() => comprasStore.compras.filter((c) => c.estado === 'P'))

// Alerta con timbre solo para insumos que ACABAN de cruzar el mínimo — no en
// la carga inicial de la página, para no repetir aviso de algo ya conocido.
watch(insumosBajoMinimo, (actual) => {
  const nuevos = primeraCarga ? [] : actual.filter((i) => !idsBajoMinimoVistos.has(i.id))

  idsBajoMinimoVistos.clear()
  actual.forEach((i) => idsBajoMinimoVistos.add(i.id))
  primeraCarga = false

  if (nuevos.length === 0) return

  playAlertChime()
  $q.notify({
    type: 'warning',
    icon: 'notifications_active',
    message:
      nuevos.length === 1
        ? `Stock bajo: ${nuevos[0]!.nombre}`
        : `${nuevos.length} insumos entraron en stock bajo`,
    caption: nuevos.map((i) => i.nombre).join(', '),
    position: 'top-right',
    timeout: 8000,
  })
})

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'INSUMO', field: 'nombre', align: 'left', sortable: true },
  { name: 'stock_actual', label: 'STOCK ACTUAL', field: 'stock_actual', align: 'left' },
  { name: 'stock_minimo', label: 'MÍNIMO', field: 'stock_minimo', align: 'left' },
  { name: 'deficit', label: 'DÉFICIT', field: 'id', align: 'left' },
]
</script>

<style scoped>
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi-tile {
  border-radius: 12px;
  padding: 16px;
}

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.kpi-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
</style>
