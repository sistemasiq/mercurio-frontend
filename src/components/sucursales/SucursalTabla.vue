<template>
  <div class="sucursal-tabla">
    <q-table
      flat
      :rows="sucursales"
      :columns="columns"
      row-key="id"
      :loading="loading"
      class="tabla-sucursales"
      hide-pagination
    >
      <!-- Clave -->
      <template #body-cell-clave="slotProps">
        <q-td :props="slotProps">
          <span class="clave-link" @click="emit('verDetalle', slotProps.row.id)">
            {{ slotProps.row.clave }}
          </span>
        </q-td>
      </template>

      <!-- Nombre -->
      <template #body-cell-nombre="slotProps">
        <q-td :props="slotProps">
          <span class="nombre-text">{{ slotProps.row.nombre }}</span>
        </q-td>
      </template>

      <!-- Dirección -->
      <template #body-cell-direccion="slotProps">
        <q-td :props="slotProps">
          <span class="direccion-text">{{ slotProps.row.ciudad }}</span>
        </q-td>
      </template>

      <!-- Administrador -->
      <template #body-cell-gerente="slotProps">
        <q-td :props="slotProps">
          <span class="gerente-text">{{ slotProps.row.gerente || '-' }}</span>
        </q-td>
      </template>

      <!-- Fecha de Creación -->
      <template #body-cell-fechaCreacion="slotProps">
        <q-td :props="slotProps">
          <span class="fecha-text">
            {{ slotProps.row.fechaCreacion ? formatFecha(slotProps.row.fechaCreacion) : '-' }}
          </span>
        </q-td>
      </template>

      <!-- Estado -->
      <template #body-cell-estado="slotProps">
        <q-td :props="slotProps">
          <SucursalBadgeEstado :estado="slotProps.row.statusClave" />
        </q-td>
      </template>

      <!-- Acciones -->
      <template #body-cell-acciones="slotProps">
        <q-td :props="slotProps">
          <div class="acciones-cell">
            <q-btn
              flat
              dense
              round
              icon="delete_outline"
              size="sm"
              class="accion-btn accion-btn--delete"
              @click="emit('eliminar', slotProps.row)"
            >
              <q-tooltip>Desactivar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="edit"
              size="sm"
              class="accion-btn"
              @click="emit('editar', slotProps.row.id)"
            >
              <q-tooltip>Editar</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="visibility"
              size="sm"
              class="accion-btn"
              @click="emit('verDetalle', slotProps.row.id)"
            >
              <q-tooltip>Ver detalle</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Footer paginación -->
    <div class="tabla-footer">
      <div class="resultado-info">
        Mostrando {{ inicio }} – {{ fin }} de {{ pagination.total }} resultados
      </div>
      <q-pagination
        :model-value="pagination.page"
        :max="totalPages"
        :max-pages="5"
        direction-links
        boundary-links
        color="primary"
        active-color="primary"
        class="pagination"
        @update:model-value="emit('cambiarPagina', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import SucursalBadgeEstado from './SucursalBadgeEstado.vue'
import type { Sucursal } from '@/composables/useSucursales'

interface Props {
  sucursales: Sucursal[]
  loading: boolean
  pagination: { page: number; perPage: number; total: number }
  totalPages: number
}

interface Emits {
  (e: 'eliminar', sucursal: Sucursal): void
  (e: 'editar', id: string): void
  (e: 'verDetalle', id: string): void
  (e: 'cambiarPagina', pagina: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const columns = [
  { name: 'clave', align: 'left' as const, label: 'Clave', field: 'clave' },
  { name: 'nombre', align: 'left' as const, label: 'Nombre', field: 'nombre' },
  { name: 'direccion', align: 'left' as const, label: 'Dirección', field: 'ciudad' },
  { name: 'gerente', align: 'left' as const, label: 'Administrador', field: 'gerente' },
  { name: 'fechaCreacion', align: 'left' as const, label: 'Creación', field: 'fechaCreacion' },
  { name: 'estado', align: 'center' as const, label: 'Estado', field: 'statusClave' },
  { name: 'acciones', align: 'center' as const, label: 'Acciones', field: 'id' },
]

const inicio = computed(() => (props.pagination.page - 1) * props.pagination.perPage + 1)
const fin = computed(() =>
  Math.min(props.pagination.page * props.pagination.perPage, props.pagination.total),
)

function formatFecha(fecha: string): string {
  try {
    return format(parseISO(fecha), 'dd MMM yyyy', { locale: es })
  } catch {
    return fecha
  }
}
</script>

<style scoped lang="scss">
.sucursal-tabla {
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.tabla-sucursales {
  :deep(.q-table__card) {
    box-shadow: none;
  }

  :deep(.q-table thead tr th) {
    background-color: #ffffff;
    color: #424242;
    font-size: 12px;
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0;
    border-bottom: 1px solid #e8e8e8;
    padding: 10px 16px;
  }

  :deep(.q-table tbody td) {
    background-color: #ffffff;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
  }

  :deep(.q-table tbody tr:last-child td) {
    border-bottom: none;
  }
  :deep(.q-table tbody tr:hover td) {
    background-color: #fafafa;
  }
}

.clave-link {
  color: #1565c0;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  &:hover {
    text-decoration: underline;
  }
}

.nombre-text {
  font-size: 13px;
  font-weight: 500;
  color: #212121;
}
.direccion-text {
  font-size: 13px;
  color: #616161;
}
.gerente-text {
  font-size: 13px;
  color: #424242;
}
.fecha-text {
  font-size: 13px;
  color: #424242;
}

.acciones-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.accion-btn {
  color: #757575;
  &:hover {
    color: #424242;
    background-color: #f5f5f5;
  }
  &.accion-btn--delete:hover {
    color: #e53935;
    background-color: #ffebee;
  }
}

.tabla-footer {
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .resultado-info {
    font-size: 12px;
    color: #1565c0;
    font-weight: 500;
  }
  .pagination {
    flex-shrink: 0;
  }
}
</style>
