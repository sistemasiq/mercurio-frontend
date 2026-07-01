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
        @click="router.push({ name: 'nueva-reservacion' })"
      />
    </div>
    <q-card flat bordered>
      <q-table
        :rows="store.reservaciones"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay reservaciones registradas"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useRouter } from 'vue-router'
import { useReservacionesStore } from '@/stores/reservaciones'

const router = useRouter()
const store = useReservacionesStore()
onMounted(() => store.cargar())

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
  { name: 'precio_total', label: 'TOTAL', field: 'precio_total', align: 'left' },
  { name: 'saldo_pendiente', label: 'SALDO', field: 'saldo_pendiente', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]
</script>
