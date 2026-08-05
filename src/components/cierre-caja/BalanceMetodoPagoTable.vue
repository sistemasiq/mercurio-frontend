<template>
  <div class="balance-wrap">
    <div class="balance-heading">Balance por Método de Pago</div>

    <q-markup-table flat dense class="balance-table">
      <thead>
        <tr>
          <th class="text-left">Método</th>
          <th class="text-right">Monto</th>
          <th class="text-right">%</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila.label">
          <td class="text-left">{{ fila.label }}</td>
          <td class="text-right">{{ formatMoneda(fila.monto) }}</td>
          <td class="text-right text-grey-7">{{ fila.porcentaje }}%</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td class="text-left text-weight-bold">Total</td>
          <td class="text-right text-weight-bold">{{ formatMoneda(totalGeneral) }}</td>
          <td class="text-right">100%</td>
        </tr>
      </tfoot>
    </q-markup-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MetodoPago {
  id: string
  metodo: string
  monto: number
}

const props = defineProps<{
  efectivo: number
  metodos: MetodoPago[]
}>()

const etiquetasMetodo: Record<string, string> = {
  vouchers: 'Vouchers / Tickets',
  tarjeta: 'Tarjeta de crédito/débito',
  transferencia: 'Transferencia',
  otro: 'Otro',
}

const totalGeneral = computed(() => {
  const totalMetodos = props.metodos.reduce((acc, m) => acc + (m.monto || 0), 0)
  return props.efectivo + totalMetodos
})

const filas = computed(() => {
  const base: { label: string; monto: number }[] = [{ label: 'Efectivo', monto: props.efectivo }]
  const metodosAgrupados = props.metodos.reduce<Record<string, number>>((acc, m) => {
    const label = etiquetasMetodo[m.metodo] || m.metodo
    acc[label] = (acc[label] || 0) + (m.monto || 0)
    return acc
  }, {})
  Object.entries(metodosAgrupados).forEach(([label, monto]) => base.push({ label, monto }))

  return base.map((f) => ({
    ...f,
    porcentaje: totalGeneral.value ? Math.round((f.monto / totalGeneral.value) * 100) : 0,
  }))
})

function formatMoneda(valor: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(valor || 0)
}
</script>

<style scoped>
.balance-wrap {
  border: 1px solid var(--md-outline-variant);
  border-radius: 12px;
  overflow: hidden;
}
.balance-heading {
  padding: 12px 16px;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--md-primary);
  background: var(--md-surface-container-low);
  border-bottom: 1px solid var(--md-outline-variant);
}
.balance-table thead th {
  color: var(--md-on-surface-variant);
  font-size: 0.75rem;
  text-transform: uppercase;
}
.total-row td {
  border-top: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container-low);
}
</style>
