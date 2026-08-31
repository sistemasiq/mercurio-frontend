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
        <q-space />
        <q-btn
          v-if="insumosParaReponer.length > 0"
          color="primary"
          icon="shopping_cart_checkout"
          label="Generar orden de compra"
          unelevated
          no-caps
          style="border-radius: 8px; font-weight: 600"
          @click="dialogGenerar = true"
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
          <div class="stat-card__value">{{ criticos.length }}</div>
          <div class="stat-card__label">Bajo mínimo</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <q-icon name="notification_important" size="20px" />
          </div>
          <div class="stat-card__value">{{ porReordenar.length }}</div>
          <div class="stat-card__label">Por reordenar</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="payments" size="20px" />
          </div>
          <div class="stat-card__value">${{ valorInventario.toFixed(2) }}</div>
          <div class="stat-card__label">Valor de inventario</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="shopping_cart" size="20px" />
          </div>
          <div class="stat-card__value">{{ comprasPendientes.length }}</div>
          <div class="stat-card__label">Compras pendientes</div>
        </div>
      </div>

      <!-- Insumos bajo mínimo -->
      <div class="text-subtitle1 text-weight-bold q-mb-sm" style="color: var(--text-primary)">
        Insumos bajo mínimo
      </div>
      <q-card flat bordered class="q-mb-lg" style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="criticos"
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
          <template #body-cell-umbral="props">
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

      <!-- Insumos por reordenar -->
      <div class="text-subtitle1 text-weight-bold q-mb-sm" style="color: var(--text-primary)">
        Por reordenar (bajo el punto de reorden, aún sobre el mínimo)
      </div>
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="porReordenar"
          :columns="columns"
          row-key="id"
          flat
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="Ningún insumo está bajo su punto de reorden"
          class="fec-table"
        >
          <template #body-cell-stock_actual="props">
            <q-td :props="props" class="text-orange-9 text-weight-bold">
              {{ Number(props.row.stock_actual) }} {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>
          <template #body-cell-umbral="props">
            <q-td :props="props">
              {{ Number(props.row.punto_reorden ?? props.row.stock_minimo) }}
              {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>
          <template #body-cell-deficit="props">
            <q-td :props="props">
              {{
                (
                  Number(props.row.punto_reorden ?? props.row.stock_minimo) -
                  Number(props.row.stock_actual)
                ).toFixed(3)
              }}
              {{ codigoUnidad(props.row.unidad_base_id) }}
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <!-- ── Dialog Generar orden de compra ─────────────────────────────────── -->
    <q-dialog v-model="dialogGenerar">
      <q-card style="min-width: 460px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="text-h6 text-weight-bold">Generar orden de compra</div>
          <div class="text-body2 text-grey-7">
            Se crea un borrador por proveedor con los insumos por reponer y una cantidad sugerida
            (hasta el stock máximo / punto de reorden).
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-list v-if="gruposPorProveedor.length" separator>
            <q-item v-for="g in gruposPorProveedor" :key="g.proveedorId ?? 'sin'">
              <q-item-section>
                <q-item-label>{{ g.proveedorNombre }}</q-item-label>
                <q-item-label caption>{{ g.insumos.length }} insumo(s) por reponer</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  v-if="g.proveedorId"
                  unelevated
                  no-caps
                  dense
                  color="primary"
                  label="Generar"
                  style="border-radius: 8px"
                  @click="generarOrden(g)"
                />
                <q-badge v-else color="grey-5">Sin proveedor principal</q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-body2 text-grey-7 q-py-sm">No hay insumos por reponer.</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-xs">
          <q-btn v-close-popup flat no-caps label="Cerrar" color="grey-7" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useInsumosStore } from '@/stores/insumos'
import { useProveedoresStore } from '@/stores/proveedores'
import { useComprasStore, type LineaPrefill } from '@/stores/compras'
import { useUnidadesMedidaStore } from '@/stores/unidadesMedida'
import { useAlertasInventarioStore } from '@/stores/alertasInventario'
import type { Insumo } from '@/types/insumo'

const router = useRouter()
const authStore = useAuthStore()
const insumosStore = useInsumosStore()
const proveedoresStore = useProveedoresStore()
const comprasStore = useComprasStore()
const unidadesStore = useUnidadesMedidaStore()
const alertas = useAlertasInventarioStore()

const loading = ref(false)
const dialogGenerar = ref(false)

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

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'INSUMO', field: 'nombre', align: 'left', sortable: true },
  { name: 'stock_actual', label: 'STOCK ACTUAL', field: 'stock_actual', align: 'left' },
  { name: 'umbral', label: 'UMBRAL', field: 'id', align: 'left' },
  { name: 'deficit', label: 'DÉFICIT', field: 'id', align: 'left' },
]
</script>
