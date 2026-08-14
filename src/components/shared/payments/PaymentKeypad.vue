<template>
  <div class="keypad-container">
    <!-- Pantalla de cantidad ingresada -->
    <div class="amount-display">
      <span class="currency">$</span>
      <span class="amount">{{ amountDisplay || '0' }}</span>
    </div>

    <!-- Teclado Numérico -->
    <div class="keypad-grid">
      <button
        v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="n"
        class="num-btn"
        @click="appendNumber(n.toString())"
      >
        {{ n }}
      </button>
      <button class="num-btn" @click="appendNumber('.')">.</button>
      <button class="num-btn" @click="appendNumber('0')">0</button>
      <button class="num-btn keypad-backspace-btn" @click="backspace">
        <q-icon name="backspace" size="sm" />
      </button>

      <!-- Botón de Acción Principal -->
      <button class="apply-btn" :disabled="!montoValido" @click="submitAmount">
        <q-icon name="add_circle" size="sm" /> Aplicar Pago
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'add-payment', amount: number): void
}>()

const amountDisplay = ref('')

const montoValido = computed(() => {
  const num = parseFloat(amountDisplay.value)
  return !isNaN(num) && num > 0
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

<style scoped>
.keypad-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.amount-display {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  min-height: 54px;
}
.currency {
  font-size: 20px;
  color: var(--text-secondary);
}
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  flex-grow: 1; /* Esto hace que el teclado se estire para llenar el espacio disponible */
}
.num-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  min-height: 42px; /* Altura mínima flexible */
  transition: background 0.2s;
}
.num-btn:hover {
  background: var(--bg-main);
}
.keypad-backspace-btn {
  color: var(--text-secondary);
}
.apply-btn {
  grid-column: span 3;
  background: #025fe0;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  min-height: 48px;
  margin-top: 4px;
}
.apply-btn:hover:not(:disabled) {
  background: #0350c4;
}
.apply-btn:disabled {
  background: rgba(2, 95, 224, 0.35);
  cursor: not-allowed;
}
</style>
