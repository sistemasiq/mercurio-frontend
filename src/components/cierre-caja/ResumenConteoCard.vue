<template>
  <div class="rs-resumen-card">
    <!-- Header -->
    <div class="rs-card-header">
      <q-icon name="assessment" color="primary" size="24px" class="q-mr-xs" />
      <h3 class="rs-card-title">Resumen de turno</h3>
    </div>

    <!-- Filas -->
    <div class="rs-card-body">
      <div class="rs-summary-row">
        <span class="rs-row-label">Fondo Inicial</span>
        <span class="rs-row-value">{{ formatMXN(fondoInicial) }}</span>
      </div>
      <div class="rs-divider" />
      <div class="rs-summary-row">
        <span class="rs-row-label">Retiros / Pagos</span>
        <span class="rs-row-value rs-row-value--negative">-{{ formatMXN(retirosPagos) }}</span>
      </div>
      <!--
        NOTA INTENCIONAL: "Total Esperado" no se muestra al cajero.
        El conteo se realiza a ciegas para garantizar la integridad del arqueo.
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatMXN } from '@/utils/formatoMoneda'

defineProps<{
  fondoInicial: number
  retirosPagos: number
}>()
</script>

<style scoped>
/* ── Card ───────────────────────────────────────────────────────────── */
.rs-resumen-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-main);
}
.rs-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* ── Body ───────────────────────────────────────────────────────────── */
.rs-card-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Filas ──────────────────────────────────────────────────────────── */
.rs-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.rs-row-label {
  font-size: 14px;
  color: var(--text-secondary);
}
.rs-row-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.rs-row-value--negative {
  color: #dc2626;
}

/* ── Divisor ────────────────────────────────────────────────────────── */
.rs-divider {
  height: 1px;
  background: var(--border-color);
}
</style>
