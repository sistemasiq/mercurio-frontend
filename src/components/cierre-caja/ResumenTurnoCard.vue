<template>
  <q-card flat bordered class="summary-card">
    <q-card-section class="card-header row items-center">
      <q-icon name="assessment" color="primary" size="22px" class="q-mr-sm" />
      <div class="text-h6 text-weight-semibold">Resumen de turno</div>
    </q-card-section>

    <q-card-section class="q-gutter-y-sm">
      <div class="summary-row">
        <span class="summary-label">Fondo Inicial</span>
        <span class="summary-value">{{ formatMoneda(fondoInicial) }}</span>
      </div>
      <q-separator />
      <div class="summary-row">
        <span class="summary-label">Retiros / Pagos</span>
        <span class="summary-value summary-value--negative">-{{ formatMoneda(retirosPagos) }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps({
  fondoInicial: { type: Number, default: 0 },
  retirosPagos: { type: Number, default: 0 },
})

function formatMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(valor || 0)
}
</script>

<style scoped>
.summary-card {
  border-radius: 16px;
  border-color: var(--md-outline-variant);
  background: var(--md-surface-container-lowest);
}
.card-header {
  background: var(--md-surface-bright);
  border-bottom: 1px solid var(--md-outline-variant);
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.summary-label {
  color: var(--md-on-surface-variant);
}
.summary-value {
  font-size: 1.1rem;
  color: var(--md-on-surface);
}
.summary-value--negative {
  color: var(--md-secondary);
}
</style>
