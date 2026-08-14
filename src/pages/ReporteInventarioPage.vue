<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div>
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
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="inventory_2" size="20px" />
          </div>
          <div class="stat-card__value">{{ insumosActivos.length }}</div>
          <div class="stat-card__label">Insumos activos</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <q-icon name="warning" size="20px" />
          </div>
          <div class="stat-card__value">{{ insumosBajoMinimo.length }}</div>
          <div class="stat-card__label">Insumos bajo mínimo</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="payments" size="20px" />
          </div>
          <div class="stat-card__value">${{ valorInventario.toFixed(2) }}</div>
          <div class="stat-card__label">Valor de inventario</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--pink">
            <q-icon name="local_shipping" size="20px" />
          </div>
          <div class="stat-card__value">{{ proveedoresActivos.length }}</div>
          <div class="stat-card__label">Proveedores activos</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="shopping_cart" size="20px" />
          </div>
          <div class="stat-card__value">{{ comprasPendientes.length }}</div>
          <div class="stat-card__label">Compras pendientes</div>
        </div>
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
