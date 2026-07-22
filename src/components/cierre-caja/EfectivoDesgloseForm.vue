<template>
  <div class="rs-form-block">
    <span class="rs-block-label">BLOQUE A: EFECTIVO (Billetes y Monedas)</span>

    <div class="rs-grid">
      <!-- ── Billetes ── -->
      <div class="rs-col">
        <div class="rs-col-heading">
          <span class="rs-icon material-symbols-outlined">payments</span>
          Billetes
        </div>
        <div class="rs-denom-list">
          <div v-for="d in modelValue.billetes" :key="'b-' + d.value" class="rs-denom-row">
            <label class="rs-denom-label">${{ formatEntero(d.value) }}</label>
            <q-input
              v-model.number="d.amount"
              type="number"
              min="0"
              dense
              outlined
              placeholder="0"
              class="rs-denom-input"
              input-class="text-right"
              :readonly="readonly"
              :disable="readonly"
              :class="{ 'rs-input--readonly': readonly }"
            />
            <span class="rs-denom-subtotal">= {{ formatMXN(d.value * (d.amount || 0)) }}</span>
          </div>
        </div>
      </div>

      <!-- ── Monedas ── -->
      <div class="rs-col">
        <div class="rs-col-heading">
          <span class="rs-icon material-symbols-outlined">monetization_on</span>
          Monedas
        </div>
        <div class="rs-denom-list">
          <div v-for="d in modelValue.monedas" :key="'m-' + d.value" class="rs-denom-row">
            <label class="rs-denom-label">{{ d.label }}</label>
            <q-input
              v-model.number="d.amount"
              type="number"
              min="0"
              dense
              outlined
              placeholder="0"
              class="rs-denom-input"
              input-class="text-right"
              :readonly="readonly"
              :disable="readonly"
              :class="{ 'rs-input--readonly': readonly }"
            />
            <span class="rs-denom-subtotal">= {{ formatMXN(d.value * (d.amount || 0)) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Total footer ── -->
    <div class="rs-total-footer">
      <span class="rs-total-label">TOTAL EFECTIVO</span>
      <span class="rs-total-value">{{ formatMXN(modelValue.total) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'
import { formatMXN, formatEntero } from '@/utils/formatoMoneda'
import type { DesgloseEfectivo } from '@/types/turnoCaja'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  { readonly: false },
)

const modelValue = defineModel<DesgloseEfectivo>({
  default: () => ({
    billetes: [
      { value: 1000, amount: null },
      { value: 500, amount: null },
      { value: 200, amount: null },
      { value: 100, amount: null },
      { value: 50, amount: null },
      { value: 20, amount: null },
    ],
    monedas: [
      { value: 20, label: '$20', amount: null },
      { value: 10, label: '$10', amount: null },
      { value: 5, label: '$5', amount: null },
      { value: 2, label: '$2', amount: null },
      { value: 1, label: '$1', amount: null },
      { value: 0.5, label: '50¢', amount: null },
    ],
    total: 0,
  }),
})

watchEffect(() => {
  const totalBilletes = modelValue.value.billetes.reduce(
    (acc, d) => acc + d.value * (d.amount || 0),
    0,
  )
  const totalMonedas = modelValue.value.monedas.reduce(
    (acc, d) => acc + d.value * (d.amount || 0),
    0,
  )
  modelValue.value.total = totalBilletes + totalMonedas
})
</script>

<style scoped>
/* ── Contenedor principal ─────────────────────────────────────────────── */
.rs-form-block {
  position: relative;
  border: 1px solid #c6c5d4;
  border-radius: 12px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.05);
}

/* ── Etiqueta flotante ───────────────────────────────────────────────── */
.rs-block-label {
  position: absolute;
  top: -11px;
  left: 16px;
  background: #ffffff;
  padding: 0 8px;
  color: #000666;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── Grid 2 columnas ────────────────────────────────────────────────── */
.rs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .rs-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Encabezado de columna ─────────────────────────────────────────── */
.rs-col-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #0b1c30;
  border-bottom: 1px solid #e5eeff;
  padding-bottom: 8px;
  margin-bottom: 14px;
}
.rs-icon {
  font-size: 20px;
  color: #767683;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* ── Filas de denominación ─────────────────────────────────────────── */
.rs-denom-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rs-denom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rs-denom-label {
  width: 52px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
  flex-shrink: 0;
}

/* ── Input de cantidad ─────────────────────────────────────────────── */
.rs-denom-input {
  width: 80px;
  flex-shrink: 0;
}
/* Borde base */
.rs-denom-input :deep(.q-field__control) {
  background: #f8f9ff;
  border-radius: 8px;
}
/* Foco en rojo secundario (design token secondary = #b7131a) */
.rs-denom-input :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.12);
}
.rs-denom-input :deep(.q-field--focused .q-field__control:before) {
  border-color: #b7131a !important;
}
.rs-denom-input :deep(input) {
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}
/* Estado readonly */
.rs-input--readonly :deep(.q-field__control) {
  background: #eff4ff;
}

/* ── Subtotal de fila ──────────────────────────────────────────────── */
.rs-denom-subtotal {
  width: 88px;
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #767683;
  flex-shrink: 0;
}

/* ── Total footer ──────────────────────────────────────────────────── */
.rs-total-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 14px 16px;
  margin-left: -24px;
  margin-right: -24px;
  margin-bottom: -24px;
  border-top: 1px solid #e5eeff;
  background: #eff4ff;
  border-radius: 0 0 12px 12px;
}
.rs-total-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #454652;
}
.rs-total-value {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1a237e;
}
</style>
