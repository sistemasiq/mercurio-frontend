<template>
  <div class="keypad">
    <div class="keypad__display">
      <span class="keypad__display-label">{{ label }}</span>
      <span class="keypad__display-amount">${{ montoFormateado }}</span>
    </div>

    <div v-if="atajos.length" class="keypad__quick">
      <button
        v-for="a in atajos"
        :key="a.label"
        type="button"
        class="keypad__quick-btn"
        @click="amountDisplay = String(a.value)"
      >
        {{ a.label }}
      </button>
    </div>

    <div class="keypad__grid">
      <button
        v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']"
        :key="n"
        type="button"
        class="keypad__key"
        @click="appendNumber(n)"
      >
        {{ n }}
      </button>
      <button type="button" class="keypad__key" aria-label="Borrar" @click="backspace">
        <q-icon name="backspace" size="22px" />
      </button>
    </div>

    <button type="button" class="keypad__apply" :disabled="!montoValido" @click="submitAmount">
      {{ montoValido ? `${actionLabel} $${montoFormateado}` : actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const {
  actionLabel = 'Aplicar',
  label = 'Monto',
  exacto = null,
} = defineProps<{
  actionLabel?: string
  /** Texto sobre el monto (p. ej. "Efectivo recibido"). */
  label?: string
  /** Si se indica, muestra atajos: Exacto y los siguientes múltiplos de $100. */
  exacto?: number | null
}>()

const emit = defineEmits<{
  (e: 'add-payment', amount: number): void
}>()

const amountDisplay = ref('')

const montoValido = computed(() => {
  const num = parseFloat(amountDisplay.value)
  return !isNaN(num) && num > 0
})

const montoFormateado = computed(() => {
  const num = parseFloat(amountDisplay.value)
  return isNaN(num)
    ? '0.00'
    : num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const atajos = computed(() => {
  if (exacto === null || exacto <= 0) return []
  const base = Math.ceil(exacto / 100) * 100
  const redondos = [base, base + 100, base + 200].filter((v) => v > exacto).slice(0, 3)
  while (redondos.length < 3) redondos.push((redondos.at(-1) ?? base) + 100)
  return [
    { label: 'Exacto', value: Number(exacto.toFixed(2)) },
    ...redondos.map((v) => ({ label: `$${v}`, value: v })),
  ]
})

const appendNumber = (num: string) => {
  if (num === '.' && amountDisplay.value.includes('.')) return
  if (amountDisplay.value.length > 8) return
  if (amountDisplay.value === '0' && num !== '.') {
    amountDisplay.value = num
  } else {
    amountDisplay.value += num
  }
}

const backspace = () => {
  amountDisplay.value = amountDisplay.value.slice(0, -1)
}

const submitAmount = () => {
  if (montoValido.value) {
    emit('add-payment', parseFloat(amountDisplay.value))
    amountDisplay.value = ''
  }
}
</script>

<style scoped lang="scss">
.keypad {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__display {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 16px;
    border: 2px solid var(--q-primary);
    border-radius: 12px;
  }

  &__display-label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--q-primary);
  }

  &__display-amount {
    font-size: 36px;
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__quick {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  &__quick-btn {
    height: 36px;
    border: 0;
    border-radius: 8px;
    background: var(--bg-muted);
    color: var(--text-body);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: #e8ebf1;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  &__key {
    height: 54px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    color: var(--text-primary);
    font: inherit;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: var(--bg-subtle);
    }

    &:active {
      background: var(--bg-muted);
    }
  }

  &__apply {
    height: 46px;
    border: 1px solid var(--q-primary);
    border-radius: 10px;
    background: #fff;
    color: var(--q-primary);
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--tone-info-bg);
    }

    &:disabled {
      border-color: var(--border-input);
      color: var(--text-muted);
      cursor: not-allowed;
    }
  }
}
</style>
