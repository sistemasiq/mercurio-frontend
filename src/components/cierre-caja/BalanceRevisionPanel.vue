<template>
  <div class="rs-balance-panel">
    <!-- Header -->
    <div class="rs-panel-header">
      <span class="material-symbols-outlined rs-header-icon">balance</span>
      <span class="rs-panel-title">Balance por Método de Pago</span>
      <span class="rs-spacer" />
      <span class="rs-badge" :class="hayDiferencias ? 'rs-badge--warn' : 'rs-badge--ok'">
        {{ hayDiferencias ? 'Diferencias' : 'Cuadrado' }}
      </span>
    </div>

    <!-- Tabla fec-table style -->
    <div class="rs-table-wrap">
      <table class="rs-fec-table">
        <thead>
          <tr>
            <th class="rs-th">Método</th>
            <th class="rs-th rs-th--right">Declarado</th>
            <th class="rs-th rs-th--right">Esperado</th>
            <th class="rs-th rs-th--right">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in balancePorMetodo" :key="fila.metodo" class="rs-tr">
            <td class="rs-td">{{ fila.label }}</td>
            <td class="rs-td rs-td--right">{{ formatMXN(fila.declarado) }}</td>
            <td class="rs-td rs-td--right rs-td--muted">{{ formatMXN(fila.esperado) }}</td>
            <td class="rs-td rs-td--right rs-td--bold" :class="claseDiferencia(fila.diferencia)">
              {{ formatDiferencia(fila.diferencia) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="rs-tr-total">
            <td class="rs-td rs-td--bold">TOTAL</td>
            <td class="rs-td rs-td--right rs-td--bold">{{ formatMXN(totalDeclarado) }}</td>
            <td class="rs-td rs-td--right rs-td--muted rs-td--bold">
              {{ formatMXN(totalEsperado) }}
            </td>
            <td class="rs-td rs-td--right rs-td--bold" :class="claseDiferencia(diferenciaNeta)">
              {{ formatDiferencia(diferenciaNeta) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Banner resultado -->
    <div
      class="rs-result-banner"
      :class="hayDiferencias ? 'rs-result-banner--warn' : 'rs-result-banner--ok'"
    >
      <span class="material-symbols-outlined rs-result-icon">
        {{ hayDiferencias ? 'warning' : 'check_circle_outline' }}
      </span>
      <span v-if="hayDiferencias">
        Diferencia neta de <strong>{{ formatDiferencia(diferenciaNeta) }}</strong> ({{
          diferenciaNeta > 0 ? 'sobrante' : 'faltante'
        }}). Se requerirán observaciones para confirmar el cierre.
      </span>
      <span v-else>Caja cuadrada. No hay diferencias.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMXN, formatDiferencia, claseDiferencia } from '@/utils/formatoMoneda'
import type { FilaBalance } from '@/types/turnoCaja'

const props = defineProps<{
  balancePorMetodo: FilaBalance[]
  totalDeclarado: number
  totalEsperado: number
  diferenciaNeta: number
}>()

const hayDiferencias = computed(() => props.diferenciaNeta !== 0)
</script>

<style scoped>
/* ── Contenedor ─────────────────────────────────────────────────────── */
.rs-balance-panel {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 16px;
  overflow: hidden;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
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
.rs-panel-title {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1a237e;
}
.rs-spacer {
  flex: 1;
}

/* ── Badge estado ───────────────────────────────────────────────────── */
.rs-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
}
.rs-badge--ok {
  background: #e8f5e9;
  color: #1b5e20;
  border: 1px solid #c8e6c9;
}
.rs-badge--warn {
  background: #ffdad6;
  color: #93000a;
  border: 1px solid #ffb4ac;
}

/* ── Tabla fec-table ────────────────────────────────────────────────── */
.rs-table-wrap {
  overflow-x: auto;
}
.rs-fec-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* Th */
.rs-th {
  padding: 10px 16px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #454652;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.rs-th--right {
  text-align: right;
}

/* Td */
.rs-td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0b1c30;
}
.rs-td--right {
  text-align: right;
}
.rs-td--muted {
  color: #454652;
}
.rs-td--bold {
  font-weight: 700;
}

/* Hover */
.rs-tr:hover td {
  background: #f8f9ff;
}

/* Fila total */
.rs-tr-total td {
  border-top: 2px solid #c6c5d4;
  border-bottom: none;
  background: #eff4ff;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}

/* Colores de diferencia (via formatoMoneda.claseDiferencia) */
.text-positive {
  color: #1b5e20;
}
.text-negative {
  color: #b7131a;
}
.text-on-surface {
  color: #0b1c30;
}

/* ── Banner resultado ───────────────────────────────────────────────── */
.rs-result-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}
.rs-result-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-result-banner--warn {
  background: rgba(176, 0, 32, 0.05);
  color: #93000a;
  border-top: 1px solid rgba(183, 19, 26, 0.2);
}
.rs-result-banner--ok {
  background: #e8f5e9;
  color: #1b5e20;
  border-top: 1px solid #c8e6c9;
}
</style>
