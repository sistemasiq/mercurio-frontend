<template>
  <q-page class="page-content list-page">
    <PageHeader
      title="Kardex de Lealtad"
      subtitle="Consulta el saldo y los movimientos de puntos de un cliente."
    />

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div v-if="store.saldo" class="kpi-row">
      <KpiCard label="Saldo actual" :value="`${fmt(store.saldo.saldo)} pts`" note-tone="ok" />
      <KpiCard label="Acumulado" :value="`${fmt(acumulado)} pts`" />
      <KpiCard label="Canjeado" :value="`${fmt(canjeado)} pts`" />
    </div>

    <DataTableCard
      v-model:filter="filtro"
      hide-search
      :filters="store.movimientos.length ? FILTROS : []"
      :count="store.saldo ? `Cliente ${celular}` : ''"
    >
      <template #toolbar>
        <div class="kdx-search">
          <q-input
            v-model="celular"
            dense
            outlined
            mask="##########"
            placeholder="Celular del cliente (10 dígitos)"
            class="kdx-search__input"
            aria-label="Celular del cliente"
            @keyup.enter="buscar"
          >
            <template #prepend><q-icon name="search" size="19px" /></template>
          </q-input>
          <q-btn
            unelevated
            color="primary"
            label="Buscar"
            :disable="celular.length !== 10"
            @click="buscar"
          />
        </div>
      </template>
      <StateBlock v-if="store.error" variant="error" :body="store.error" />
      <q-table
        v-else
        :rows="movimientosVisibles"
        :columns="columns"
        row-key="id"
        flat
        :loading="store.loading"
        :rows-per-page-options="[10, 25, 50]"
      >
        <template #body-cell-creado="props">
          <q-td :props="props" class="text-weight-bold">{{
            formatearFecha(props.row.creado)
          }}</q-td>
        </template>
        <template #body-cell-tipo="props">
          <q-td :props="props">
            <StatusBadge
              :tone="TIPO_TONO[props.row.tipo as TipoMovimientoPuntos]"
              :label="TIPO_LABEL[props.row.tipo as TipoMovimientoPuntos]"
            />
          </q-td>
        </template>
        <template #body-cell-puntos="props">
          <q-td :props="props" :class="props.row.puntos >= 0 ? 'pts--in' : 'pts--out'">
            {{ props.row.puntos >= 0 ? '+' : '' }}{{ fmt(props.row.puntos) }}
          </q-td>
        </template>
        <template #body-cell-saldo_resultante="props">
          <q-td :props="props" class="text-weight-bold">{{ fmt(props.row.saldo_resultante) }}</q-td>
        </template>
        <template #body-cell-notas="props">
          <q-td :props="props" class="cell-muted cell-ellipsis">{{ props.row.notas }}</q-td>
        </template>
        <template #no-data>
          <StateBlock
            class="full-width"
            :variant="store.saldo ? 'empty' : 'no-results'"
            :title="store.saldo ? 'Sin movimientos' : 'Busca un cliente'"
            :body="
              store.saldo
                ? 'Este cliente aún no tiene movimientos de puntos.'
                : 'Escribe el celular del cliente para ver su historial de puntos.'
            "
          />
        </template>
      </q-table>
    </DataTableCard>
  </q-page>
</template>

<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import DataTableCard from '@/components/ui/DataTableCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StateBlock from '@/components/ui/StateBlock.vue'
import type { FilterChip } from '@/types/ui'
import { computed, ref } from 'vue'
import type { QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useLealtadStore } from '@/stores/lealtad'

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
const TIPO_TONO: Record<TipoMovimientoPuntos, 'ok' | 'info' | 'warn' | 'off'> = {
  O: 'ok',
  R: 'info',
  C: 'off',
  A: 'warn',
}

type Filtro = 'todos' | TipoMovimientoPuntos
const FILTROS: FilterChip<Filtro>[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Otorgados', value: 'O' },
  { label: 'Redimidos', value: 'R' },
  { label: 'Ajustes', value: 'A' },
]
const filtro = ref<Filtro | null>('todos')
const movimientosVisibles = computed(() =>
  store.movimientos.filter((m) => filtro.value === 'todos' || m.tipo === filtro.value),
)
const acumulado = computed(() =>
  store.movimientos.filter((m) => m.puntos > 0).reduce((s, m) => s + m.puntos, 0),
)
const canjeado = computed(() =>
  store.movimientos.filter((m) => m.tipo === 'R').reduce((s, m) => s + Math.abs(m.puntos), 0),
)

const columns: QTableColumn[] = [
  { name: 'creado', label: 'Fecha', field: 'creado', align: 'left', sortable: true },
  { name: 'tipo', label: 'Tipo', field: 'tipo', align: 'left' },
  { name: 'puntos', label: 'Puntos', field: 'puntos', align: 'right' },
  { name: 'saldo_resultante', label: 'Saldo', field: 'saldo_resultante', align: 'right' },
  { name: 'notas', label: 'Notas', field: 'notas', align: 'left' },
]

const fmt = (n: number): string => n.toLocaleString('es-MX')
</script>

<style scoped lang="scss">
.kdx-search {
  display: flex;
  gap: 8px;

  &__input {
    width: 300px;
  }
}

.pts--in {
  color: var(--tone-ok-fg) !important;
  font-weight: 700;
}

.pts--out {
  color: var(--tone-bad-fg) !important;
  font-weight: 700;
}
</style>
