<template>
  <q-table
    flat
    :rows="sucursales"
    :columns="columns"
    row-key="id"
    :loading="loading"
    :rows-per-page-options="[10, 25, 50]"
    no-data-label="No hay sucursales registradas"
    class="fec-table"
  >
    <!-- Clave -->
    <template #body-cell-clave="slotProps">
      <q-td :props="slotProps">
        <span class="clave-link" @click="emit('verDetalle', slotProps.row.id)">
          {{ slotProps.row.clave }}
        </span>
      </q-td>
    </template>

    <!-- Dirección -->
    <template #body-cell-direccion="slotProps">
      <q-td :props="slotProps" class="cell-truncate" :title="slotProps.row.ciudad">
        {{ slotProps.row.ciudad }}
      </q-td>
    </template>

    <!-- Fecha de Creación -->
    <template #body-cell-fechaCreacion="slotProps">
      <q-td :props="slotProps">
        {{ slotProps.row.fechaCreacion ? formatFecha(slotProps.row.fechaCreacion) : '-' }}
      </q-td>
    </template>

    <!-- Estado -->
    <template #body-cell-estado="slotProps">
      <q-td :props="slotProps">
        <q-badge
          :color="slotProps.row.statusClave === 'activa' ? 'positive' : 'grey-5'"
          :label="slotProps.row.statusClave === 'activa' ? 'Activa' : 'Inactiva'"
          style="font-size: 0.72rem; padding: 4px 10px; border-radius: 20px"
        />
      </q-td>
    </template>

    <!-- Acciones -->
    <template #body-cell-acciones="slotProps">
      <q-td :props="slotProps" class="text-right">
        <q-btn
          flat
          dense
          color="grey-8"
          size="sm"
          class="action-btn q-mr-xs"
          @click="emit('verDetalle', slotProps.row.id)"
        >
          <span class="material-symbols-outlined">visibility</span>
          <q-tooltip>Ver detalle</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          color="grey-8"
          size="sm"
          class="action-btn q-mr-xs"
          @click="emit('editar', slotProps.row.id)"
        >
          <span class="material-symbols-outlined">edit</span>
          <q-tooltip>Editar</q-tooltip>
        </q-btn>
        <q-btn
          v-if="slotProps.row.statusClave === 'activa'"
          flat
          dense
          color="grey-8"
          size="sm"
          class="action-btn"
          @click="emit('eliminar', slotProps.row)"
        >
          <span class="material-symbols-outlined">delete_outline</span>
          <q-tooltip>Desactivar</q-tooltip>
        </q-btn>
        <q-btn
          v-else
          flat
          dense
          color="grey-8"
          size="sm"
          class="action-btn"
          @click="emit('reactivar', slotProps.row)"
        >
          <span class="material-symbols-outlined">restore</span>
          <q-tooltip>Reactivar</q-tooltip>
        </q-btn>
      </q-td>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Sucursal } from '@/composables/useSucursales'

interface Props {
  sucursales: Sucursal[]
  loading: boolean
}

interface Emits {
  (e: 'eliminar', sucursal: Sucursal): void
  (e: 'reactivar', sucursal: Sucursal): void
  (e: 'editar', id: string): void
  (e: 'verDetalle', id: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const columns = [
  { name: 'clave', align: 'left' as const, label: 'CLAVE', field: 'clave', sortable: true },
  { name: 'nombre', align: 'left' as const, label: 'NOMBRE', field: 'nombre', sortable: true },
  { name: 'direccion', align: 'left' as const, label: 'DIRECCIÓN', field: 'ciudad' },
  { name: 'gerente', align: 'left' as const, label: 'ADMINISTRADOR', field: 'gerente' },
  {
    name: 'fechaCreacion',
    align: 'left' as const,
    label: 'CREACIÓN',
    field: 'fechaCreacion',
    sortable: true,
  },
  { name: 'estado', align: 'left' as const, label: 'ESTADO', field: 'statusClave' },
  { name: 'acciones', align: 'right' as const, label: 'ACCIONES', field: 'id' },
]

function formatFecha(fecha: string): string {
  try {
    return format(parseISO(fecha), 'dd MMM yyyy', { locale: es })
  } catch {
    return fecha
  }
}
</script>

<style scoped>
.clave-link {
  color: var(--q-primary);
  cursor: pointer;
  font-weight: 700;
  font-size: 0.875rem;
}

.clave-link:hover {
  text-decoration: underline;
}
</style>
