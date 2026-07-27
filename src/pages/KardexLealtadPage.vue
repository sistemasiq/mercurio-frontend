<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 900px; margin: 0 auto">
      <!-- Encabezado -->
      <div class="row items-center q-mb-md">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">
            Kardex de Puntos de Lealtad
          </div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Consulta el saldo y el historial de puntos de un cliente por su celular.
          </div>
        </div>
      </div>

      <!-- Buscador -->
      <div class="row q-col-gutter-sm items-end q-mb-md">
        <div class="col-4">
          <div class="field-label">CELULAR DEL CLIENTE</div>
          <q-input
            v-model="celular"
            dense
            outlined
            mask="##########"
            placeholder="10 dígitos"
            @keyup.enter="buscar"
          />
        </div>
        <div class="col-auto">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Buscar"
            :disable="celular.length !== 10"
            style="border-radius: 8px; font-weight: 600"
            @click="buscar"
          />
        </div>
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

      <!-- Error -->
      <q-banner
        v-if="store.error"
        dense
        rounded
        class="bg-red-1 text-red-8 q-mb-md"
        style="border-radius: 10px"
      >
        <template #avatar><q-icon name="error_outline" color="negative" /></template>
        {{ store.error }}
      </q-banner>

      <!-- Saldo -->
      <q-card v-if="store.saldo" flat bordered class="q-pa-md q-mb-lg" style="border-radius: 12px">
        <div class="field-label">SALDO DISPONIBLE</div>
        <div class="text-h6 text-weight-bold">{{ store.saldo.saldo }} puntos</div>
      </q-card>

      <!-- Tabla ── formato kardex -->
      <q-card flat bordered style="border-radius: 12px; overflow: hidden">
        <q-table
          :rows="store.movimientos"
          :columns="columns"
          row-key="id"
          flat
          :loading="store.loading"
          :rows-per-page-options="[10, 25, 50]"
          no-data-label="Busca un celular para ver su historial de puntos"
          class="fec-table"
        >
          <template #body-cell-creado="props">
            <q-td :props="props">{{ formatearFecha(props.row.creado) }}</q-td>
          </template>

          <template #body-cell-tipo="props">
            <q-td :props="props">
              <EstadoPill
                :tono="TIPO_TONO[props.row.tipo as TipoMovimientoPuntos]"
                :label="TIPO_LABEL[props.row.tipo as TipoMovimientoPuntos]"
              />
            </q-td>
          </template>

          <template #body-cell-puntos="props">
            <q-td :props="props" :class="props.row.puntos >= 0 ? 'text-positive' : 'text-negative'">
              {{ props.row.puntos >= 0 ? '+' : '' }}{{ props.row.puntos }}
            </q-td>
          </template>

          <template #body-cell-saldo_resultante="props">
            <q-td :props="props" class="text-weight-bold">{{ props.row.saldo_resultante }}</q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'
import EstadoPill from '@/components/inventario/EstadoPill.vue'
import type { TipoMovimientoPuntos } from '@/types/lealtad'

const authStore = useAuthStore()
const store = useLealtadStore()

const celular = ref('')

const buscar = () => {
  if (!authStore.currentBranchId || celular.value.length !== 10) return
  store.cargarMovimientos(authStore.currentBranchId, celular.value)
}

const formatearFecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })

const TIPO_LABEL: Record<TipoMovimientoPuntos, string> = {
  O: 'Otorgado',
  R: 'Redimido',
  C: 'Cancelación',
  A: 'Ajuste',
}
const TIPO_TONO: Record<TipoMovimientoPuntos, 'verde' | 'rojo' | 'azul' | 'naranja'> = {
  O: 'verde',
  R: 'rojo',
  C: 'naranja',
  A: 'azul',
}

const columns: QTableColumn[] = [
  { name: 'creado', label: 'FECHA', field: 'creado', align: 'left', sortable: true },
  { name: 'tipo', label: 'TIPO', field: 'tipo', align: 'left' },
  { name: 'puntos', label: 'PUNTOS', field: 'puntos', align: 'left' },
  { name: 'saldo_resultante', label: 'SALDO', field: 'saldo_resultante', align: 'left' },
  { name: 'notas', label: 'NOTAS', field: 'notas', align: 'left' },
]
</script>

<style scoped>
.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
</style>
