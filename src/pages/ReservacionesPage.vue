<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Reservaciones</div>
        <div class="text-body2" style="color: var(--text-secondary)">
          Reservaciones de eventos de la sucursal.
        </div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Nueva Reservación"
        unelevated
        no-caps
        style="border-radius: 8px; font-weight: 600"
        @click="irANuevaReservacion"
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

    <q-card flat bordered style="border-radius: 12px; overflow: hidden">
      <div class="row items-center q-pa-md">
        <q-select
          v-model="filtroEstado"
          :options="opcionesEstado"
          emit-value
          map-options
          dense
          outlined
          label="Estado"
          style="min-width: 220px"
        />
      </div>
      <q-separator />
      <q-table
        :rows="reservacionesFiltradas"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay reservaciones registradas"
        class="fec-table"
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge
              :color="estadoColor(props.row.estado)"
              :label="estadoLabel(props.row.estado)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" auto-width>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="point_of_sale"
              label="Cerrar evento"
              @click="
                router.push({ name: 'eventos-reservaciones-cierre', params: { id: props.row.id } })
              "
            />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import type { QTableColumn } from 'quasar'
import { useRouter } from 'vue-router'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAuthStore } from '@/stores/auth'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { estadoColorReservacion, estadoLabelReservacion } from '@/utils/estadoReservacion'

const router = useRouter()
const store = useReservacionesStore()
const authStore = useAuthStore()
const turno = useTurnoCajaStore()
onMounted(() => {
  if (authStore.currentBranchId) store.cargar(authStore.currentBranchId)
})

function irANuevaReservacion() {
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  router.push({ name: 'eventos-reservaciones-crear' })
}

const opcionesEstado = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Confirmada', value: 'confirmada' },
  { label: 'En curso', value: 'en_curso' },
  { label: 'Completada', value: 'completada' },
  { label: 'Cancelada', value: 'cancelada' },
]

const filtroEstado = ref('todos')

const reservacionesFiltradas = computed(() =>
  filtroEstado.value === 'todos'
    ? store.reservaciones
    : store.reservaciones.filter((r) => r.estado === filtroEstado.value),
)

const estadoLabel = estadoLabelReservacion
const estadoColor = estadoColorReservacion

const columns: QTableColumn[] = [
  {
    name: 'nombre_cliente',
    label: 'CLIENTE',
    field: 'nombre_cliente',
    align: 'left',
    sortable: true,
  },
  { name: 'fecha_evento', label: 'FECHA', field: 'fecha_evento', align: 'left', sortable: true },
  { name: 'estado', label: 'ESTADO', field: 'estado', align: 'left', sortable: true },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]
</script>
