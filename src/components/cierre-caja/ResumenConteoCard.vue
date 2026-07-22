<template>
  <div class="rs-resumen-card">
    <!-- Header -->
    <div class="rs-card-header">
      <span class="material-symbols-outlined rs-header-icon">assessment</span>
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
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 16px;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5eeff;
  background: #f8f9ff;
}
.rs-header-icon {
  font-size: 22px;
  color: #1a237e;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-card-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #0b1c30;
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
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
}
.rs-row-value {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #0b1c30;
}
.rs-row-value--negative {
  color: #b7131a;
}

/* ── Divisor ────────────────────────────────────────────────────────── */
.rs-divider {
  height: 1px;
  background: #e5eeff;
}
</style>
