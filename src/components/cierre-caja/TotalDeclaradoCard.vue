<template>
  <div class="rs-declarado-card">
    <div class="rs-declarado-label">TOTAL CONTADO (DECLARADO)</div>

    <!-- Input gigante estilo display -->
    <div class="rs-input-wrap">
      <span class="rs-input-prefix">$</span>
      <q-input
        v-model.number="modelValue"
        type="number"
        step="0.01"
        borderless
        placeholder="0.00"
        class="rs-declarado-input"
        input-class="rs-declarado-native"
      />
    </div>

    <!-- Hint de diferencia -->
    <div v-if="hayDiferencia" class="rs-diferencia" :class="claseDiferenciaLocal">
      <span class="material-symbols-outlined rs-diferencia-icon">
        {{ diferencia === 0 ? 'check_circle' : 'warning' }}
      </span>
      <span v-if="diferencia === 0">Coincide con el total calculado.</span>
      <span v-else>
        Diferencia de {{ formatMXN(Math.abs(diferencia)) }} ({{
          diferencia > 0 ? 'sobrante' : 'faltante'
        }}) frente al calculado ({{ formatMXN(totalCalculado) }}).
      </span>
    </div>

    <button type="button" class="rs-usar-calculado" @click="modelValue = totalCalculado">
      Usar total calculado
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMXN } from '@/utils/formatoMoneda'

const props = defineProps<{
  totalCalculado: number
}>()

const modelValue = defineModel<number | null>({ default: null })

const hayDiferencia = computed(() => modelValue.value !== null && modelValue.value !== undefined)
const diferencia = computed(() => {
  if (!hayDiferencia.value) return 0
  return Number(((modelValue.value ?? 0) - props.totalCalculado).toFixed(2))
})

const claseDiferenciaLocal = computed(() => {
  if (diferencia.value === 0) return 'rs-diferencia--ok'
  return 'rs-diferencia--warn'
})
</script>

<style scoped>
/* ── Card contenedor ────────────────────────────────────────────────── */
.rs-declarado-card {
  background: #e5eeff;
  border: 1px solid #c6c5d4;
  border-radius: 12px;
  padding: 28px 32px;
}

/* ── Label uppercase ────────────────────────────────────────────────── */
.rs-declarado-label {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #454652;
  margin-bottom: 12px;
}

/* ── Wrap para alinear $ + input ─────────────────────────────────────── */
.rs-input-wrap {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  padding: 0 16px;
  max-width: 520px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.rs-input-wrap:focus-within {
  border-color: #b7131a;
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.1);
}

.rs-input-prefix {
  font-family: 'Inter', sans-serif;
  font-size: 36px;
  font-weight: 900;
  color: #c6c5d4;
  line-height: 1;
  margin-right: 4px;
  flex-shrink: 0;
}

.rs-declarado-input {
  flex: 1;
  min-width: 0;
}
/* Quasar borderless — solo necesitamos estilizar el native input */
.rs-declarado-input :deep(.q-field__control) {
  padding: 0;
  min-height: 64px;
  height: 64px;
}
.rs-declarado-input :deep(input.rs-declarado-native) {
  font-family: 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 900;
  color: #000666;
  line-height: 1;
  padding: 8px 0;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
}
.rs-declarado-input :deep(input.rs-declarado-native)::placeholder {
  color: #c6c5d4;
}

/* ── Hint de diferencia ─────────────────────────────────────────────── */
.rs-diferencia {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
.rs-diferencia-icon {
  font-size: 16px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-diferencia--ok {
  color: #1b5e20;
}
.rs-diferencia--warn {
  color: #b7131a;
}

/* ── Botón "Usar calculado" ─────────────────────────────────────────── */
.rs-usar-calculado {
  display: inline-block;
  margin-top: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #000666;
  padding: 4px 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity 0.15s ease;
}
.rs-usar-calculado:hover {
  opacity: 0.7;
}
</style>
