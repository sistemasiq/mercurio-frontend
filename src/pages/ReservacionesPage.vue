<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Reservaciones</div>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="Nueva Reservación"
        unelevated
        no-caps
        @click="irANuevaReservacion"
      />
    </div>
    <q-card flat bordered>
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
onMounted(() => store.cargar(authStore.currentBranchId ?? undefined))

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
