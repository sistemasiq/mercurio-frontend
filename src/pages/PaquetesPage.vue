<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Paquetes</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nuevo Paquete" unelevated no-caps />
    </div>
    <q-card flat bordered>
      <q-table
        :rows="store.paquetes"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay paquetes registrados"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { usePaquetesStore } from '@/stores/paquetes'

const store = usePaquetesStore()
onMounted(() => store.cargar())

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'precio_base', label: 'PRECIO BASE', field: 'precio_base', align: 'left', sortable: true },
  { name: 'personas_incluidas', label: 'PERSONAS', field: 'personas_incluidas', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]
</script>
