<template>
  <q-card flat bordered class="movimientos-card">
    <q-card-section class="card-header row items-center">
      <q-icon name="receipt_long" color="primary" size="22px" class="q-mr-sm" />
      <div class="text-h6 text-weight-semibold">Movimientos del turno</div>
    </q-card-section>

    <q-list separator>
      <q-item v-if="!movimientos.length">
        <q-item-section class="text-grey-7 text-body2 text-center q-py-md">
          Sin movimientos registrados en este turno.
        </q-item-section>
      </q-item>

      <q-item v-for="(mov, idx) in movimientos" :key="idx">
        <q-item-section avatar>
          <q-icon :name="iconoTipo(mov.tipo)" :color="colorTipo(mov.tipo)" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ mov.descripcion }}</q-item-label>
          <q-item-label caption>{{ mov.hora }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <span :class="colorTipo(mov.tipo) === 'negative' ? 'monto-negativo' : 'monto-positivo'">
            {{ mov.tipo === 'retiro' || mov.tipo === 'pago' ? '-' : '+'
            }}{{ formatMoneda(mov.monto) }}
          </span>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup lang="ts">
interface Movimiento {
  tipo: 'retiro' | 'pago' | 'ingreso'
  descripcion: string
  hora: string
  monto: number
}

defineProps<{
  movimientos: Movimiento[]
}>()

function iconoTipo(tipo: string): string {
  return { retiro: 'north_east', pago: 'shopping_cart', ingreso: 'south_west' }[tipo] || 'sync_alt'
}
function colorTipo(tipo: string): string {
  return tipo === 'ingreso' ? 'positive' : 'negative'
}
function formatMoneda(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(valor || 0)
}
</script>

<style scoped>
.movimientos-card {
  border-radius: 16px;
  border-color: var(--md-outline-variant);
  background: var(--md-surface-container-lowest);
}
.card-header {
  background: var(--md-surface-bright);
  border-bottom: 1px solid var(--md-outline-variant);
}
.monto-negativo {
  color: var(--md-secondary);
  font-weight: 600;
}
.monto-positivo {
  color: var(--md-success);
  font-weight: 600;
}
</style>
