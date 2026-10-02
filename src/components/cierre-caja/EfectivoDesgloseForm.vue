<template>
  <section class="cash">
    <header class="cash__head">
      <h3 class="cash__title">Efectivo · desglose</h3>
      <span class="cash__hint">Cuenta billetes y monedas</span>
    </header>
    <div class="cash__grid">
      <div v-for="row in denominaciones" :key="row.key" class="cash__row">
        <span class="cash__denom" :class="`cash__denom--${row.tipo}`">{{ row.label }}</span>
        <span class="cash__times">×</span>
        <q-input
          v-model.number="row.d.amount"
          type="text"
          inputmode="numeric"
          dense
          outlined
          placeholder="0"
          class="cash__input"
          input-class="text-center"
          :aria-label="`Cantidad de ${row.label}`"
          :readonly="readonly"
          :disable="readonly"
          :rules="[reglaEntero]"
          hide-bottom-space
          @keydown="filtrarTeclaEntero"
        />
        <span class="cash__subtotal">{{ formatMXN(row.d.value * (row.d.amount || 0)) }}</span>
      </div>
    </div>
    <footer class="cash__foot">
      <span>Total efectivo</span>
      <span class="cash__total">{{ formatMXN(modelValue.total) }}</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { formatMXN, formatEntero } from '@/utils/formatoMoneda'
import { filtrarTeclaEntero, reglaEntero } from '@/utils/validacionNumerica'
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

// Billetes y monedas en una sola rejilla de dos columnas, como en el diseño.
const denominaciones = computed(() => [
  ...modelValue.value.billetes.map((d) => ({
    key: `b-${d.value}`,
    label: `$${formatEntero(d.value)}`,
    tipo: 'billete' as const,
    d,
  })),
  ...modelValue.value.monedas.map((d) => ({
    key: `m-${d.value}`,
    label: d.label,
    tipo: 'moneda' as const,
    d,
  })),
])

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

<style scoped lang="scss">
.cash {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__title {
    margin: 0;
    font-size: 15px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__hint {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (max-width: 600px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    border-bottom: 1px solid #f1f3f7;

    &:nth-child(odd) {
      border-right: 1px solid #f1f3f7;
    }
  }

  &__denom {
    min-width: 54px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
    font-variant-numeric: tabular-nums;

    &--billete {
      background: var(--tone-ok-bg);
      color: var(--tone-ok-fg);
    }

    &--moneda {
      background: #fff4d6;
      color: var(--tone-warn-fg);
    }
  }

  &__times {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__input {
    width: 56px;

    :deep(.q-field__control) {
      height: 36px;
      min-height: 36px;
      padding: 0 6px;
    }

    :deep(.q-field__native) {
      font-weight: 700;
    }
  }

  &__subtotal {
    flex: 1;
    text-align: right;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__foot {
    margin-top: auto;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 14px 20px;
    background: var(--bg-subtle);
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
  }

  &__total {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }
}
</style>
