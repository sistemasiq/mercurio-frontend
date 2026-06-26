<template>
  <q-page padding class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">Extras</div>
      <q-space />
      <q-btn color="primary" icon="add" label="Nuevo Extra" unelevated no-caps />
    </div>
    <q-card flat bordered>
      <q-table
        :rows="store.extras"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
        no-data-label="No hay extras registrados"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { QTableColumn } from 'quasar'
import { useExtrasStore } from '@/stores/extras'

const store = useExtrasStore()
onMounted(() => store.cargar())

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'DESCRIPCIÓN', field: 'descripcion', align: 'left' },
  { name: 'precio', label: 'PRECIO', field: 'precio', align: 'left', sortable: true },
  { name: 'unidad', label: 'UNIDAD', field: 'unidad', align: 'left' },
  { name: 'activo', label: 'ESTADO', field: 'activo', align: 'left' },
  { name: 'actions', label: 'ACCIONES', field: 'id', align: 'right' },
]
</script>
