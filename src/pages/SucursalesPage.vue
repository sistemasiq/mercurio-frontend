<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Sucursales</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nueva Sucursal" unelevated no-caps />
    </div>
    <q-card flat bordered>
      <q-table
        :rows="store.sucursales"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay sucursales registradas"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useSucursalesStore } from '@/stores/sucursales'

const store = useSucursalesStore()
onMounted(() => store.cargar())

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'direccion', label: 'DIRECCIÓN', field: 'direccion', align: 'left' },
  { name: 'telefono', label: 'TELÉFONO', field: 'telefono', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]
</script>
