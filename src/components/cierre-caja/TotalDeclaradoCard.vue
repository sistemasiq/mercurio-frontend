<template>
  <div class="declared">
    <span class="declared__label">Total declarado</span>
    <div class="declared__input">
      <span class="declared__prefix">$</span>
      <q-input
        v-model.number="modelValue"
        type="text"
        inputmode="decimal"
        borderless
        dark
        placeholder="0.00"
        aria-label="Total declarado"
        input-class="declared__native"
        :rules="[reglaDecimal]"
        hide-bottom-space
        @keydown="filtrarTeclaDecimal"
      />
    </div>
    <button type="button" class="declared__use" @click="modelValue = totalCalculado">
      Usar total contado ({{ formatMXN(totalCalculado) }})
    </button>
  </div>
</template>

<script setup lang="ts">
import { filtrarTeclaDecimal, reglaDecimal } from '@/utils/validacionNumerica'
import { formatMXN } from '@/utils/formatoMoneda'

defineProps<{
  totalCalculado: number
}>()

const modelValue = defineModel<number | null>({ default: null })
</script>

<style scoped lang="scss">
.declared {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #aeb8e8;
  }

  &__input {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__prefix {
    font-size: 34px;
    font-weight: 800;
    color: #fff;
  }

  :deep(.declared__native) {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
    font-variant-numeric: tabular-nums;
    height: 52px;
  }

  :deep(.q-field__control) {
    height: 56px;
  }

  &__use {
    align-self: flex-start;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 12.5px;
    font-weight: 700;
    color: #aeb8e8;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #fff;
    }
  }
}
</style>
