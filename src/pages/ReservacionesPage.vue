<template>
  <q-page class="page-content list-page">
    <PageHeader title="Reservaciones" subtitle="Todas las reservaciones de la sucursal.">
      <template #actions>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Nueva Reservación"
          @click="irANuevaReservacion"
        />
      </template>
    </PageHeader>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <DataTableCard
      v-model:search="busqueda"
      v-model:filter="filtro"
      search-placeholder="Buscar cliente o festejado"
      :filters="FILTROS"
      :count="`${reservacionesFiltradas.length} reservaciones`"
    >
      <q-table
        :rows="reservacionesFiltradas"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-cliente="props">
          <q-td :props="props">
            <span class="text-weight-bold">
              {{ props.row.nombre_cliente }} {{ props.row.apellidos_cliente ?? '' }}
            </span>
            <span v-if="props.row.nombre_festejado" class="cell-sub">
              {{ props.row.nombre_festejado
              }}<template v-if="props.row.edad_festejado">
                · cumple {{ props.row.edad_festejado }}</template
              >
            </span>
          </q-td>
        </template>
        <template #body-cell-fecha_evento="props">
          <q-td :props="props">
            <span class="text-weight-bold">{{ etiquetaFecha(props.row.fecha_evento) }}</span>
            <span class="cell-sub">
              {{ props.row.hora_inicio.slice(0, 5) }} – {{ props.row.hora_fin.slice(0, 5) }}
            </span>
          </q-td>
        </template>
        <template #body-cell-paquete="props">
          <q-td :props="props">{{ nombrePaquete(props.row.paquete_id) }}</q-td>
        </template>
        <template #body-cell-precio_total="props">
          <q-td :props="props" class="text-weight-bold">
            {{ formatMXN(Number(props.row.precio_total)) }}
          </q-td>
        </template>
        <template #body-cell-saldo_pendiente="props">
          <q-td
            :props="props"
            class="text-weight-bold"
            :class="{ 'saldo--due': Number(props.row.saldo_pendiente) > 0 }"
          >
            {{ formatMXN(Number(props.row.saldo_pendiente)) }}
          </q-td>
        </template>
        <template #body-cell-estado="props">
          <q-td :props="props">
            <StatusBadge
              :tone="estadoTonoReservacion(props.row.estado)"
              :label="estadoLabelReservacion(props.row.estado)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              flat
              round
              dense
              icon="point_of_sale"
              class="action-btn"
              aria-label="Cerrar evento"
              @click="
                router.push({ name: 'eventos-reservaciones-cierre', params: { id: props.row.id } })
              "
            >
              <q-tooltip>Cerrar evento</q-tooltip>
            </q-btn>
          </q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="busqueda || filtro !== 'todas' ? 'no-results' : 'empty'"
            :title="busqueda || filtro !== 'todas' ? undefined : 'No hay reservaciones registradas'"
            :body="busqueda || filtro !== 'todas' ? undefined : 'Crea la primera reservación.'"
          />
        </template>
      </q-table>
    </DataTableCard>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { QTableColumn } from 'quasar'
import { useRouter } from 'vue-router'
import { useReservacionesStore } from '@/stores/reservaciones'
import { usePaquetesStore } from '@/stores/paquetes'
import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { estadoLabelReservacion, estadoTonoReservacion } from '@/utils/estadoReservacion'
import { formatMXN } from '@/utils/formatoMoneda'
import PageHeader from '@/components/ui/PageHeader.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import type { FilterChip } from '@/types/ui'
import type { Reservaciones } from '@/types/reservaciones'

const router = useRouter()
const store = useReservacionesStore()
const paquetesStore = usePaquetesStore()
const authStore = useAuthStore()
const turno = useTurnoCajaStore()

onMounted(() => {
  if (!authStore.currentBranchId) return
  store.cargar(authStore.currentBranchId)
  if (!paquetesStore.paquetes.length) paquetesStore.cargar(authStore.currentBranchId)
})

function irANuevaReservacion() {
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  router.push({ name: 'eventos-reservaciones-crear' })
}

type Filtro = 'proximas' | 'pendientes' | 'confirmadas' | 'cerradas' | 'canceladas' | 'todas'
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Próximas', value: 'proximas' },
  { label: 'Pendientes de pago', value: 'pendientes' },
  { label: 'Confirmadas', value: 'confirmadas' },
  { label: 'Cerradas', value: 'cerradas' },
  { label: 'Canceladas', value: 'canceladas' },
  { label: 'Todas', value: 'todas' },
]
const filtro = ref<Filtro | null>('proximas')
const busqueda = ref('')

const hoyISO = new Date().toLocaleDateString('en-CA')

function cumpleFiltro(r: Reservaciones): boolean {
  switch (filtro.value) {
    case 'proximas':
      return r.fecha_evento.slice(0, 10) >= hoyISO && r.estado !== 'cancelada'
    case 'pendientes':
      return Number(r.saldo_pendiente) > 0 && r.estado !== 'cancelada'
    case 'confirmadas':
      return r.estado === 'confirmada'
    case 'cerradas':
      return r.estado === 'completada'
    case 'canceladas':
      return r.estado === 'cancelada'
    default:
      return true
  }
}

const reservacionesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.reservaciones
    .filter(cumpleFiltro)
    .filter(
      (r) =>
        !q ||
        `${r.nombre_cliente} ${r.apellidos_cliente ?? ''} ${r.nombre_festejado ?? ''}`
          .toLowerCase()
          .includes(q),
    )
    .sort((a, b) =>
      `${a.fecha_evento}${a.hora_inicio}`.localeCompare(`${b.fecha_evento}${b.hora_inicio}`),
    )
})

function nombrePaquete(id: string): string {
  return paquetesStore.paquetes.find((p) => p.id === id)?.nombre ?? '—'
}

function etiquetaFecha(fecha: string): string {
  const [y, m, d] = fecha.slice(0, 10).split('-').map(Number)
  const dia = new Date(y!, m! - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  const texto = dia.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace('.', '')
}

const columns: QTableColumn[] = [
  {
    name: 'cliente',
    label: 'Cliente / festejado',
    field: 'nombre_cliente',
    align: 'left',
    sortable: true,
  },
  { name: 'fecha_evento', label: 'Fecha', field: 'fecha_evento', align: 'left', sortable: true },
  { name: 'paquete', label: 'Paquete', field: 'paquete_id', align: 'left' },
  { name: 'precio_total', label: 'Total', field: 'precio_total', align: 'right' },
  { name: 'saldo_pendiente', label: 'Saldo', field: 'saldo_pendiente', align: 'right' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]
</script>

<style scoped lang="scss">
.saldo--due {
  color: var(--tone-bad-fg);
}
</style>
