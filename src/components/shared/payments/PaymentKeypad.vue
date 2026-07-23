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
        class="num-btn"
        v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
        :key="n"
        @click="appendNumber(n.toString())"
      >
        {{ n }}
      </button>
      <button class="num-btn" @click="appendNumber('.')">.</button>
      <button class="num-btn" @click="appendNumber('0')">0</button>
      <button class="num-btn action-btn" @click="backspace">
        <q-icon name="backspace" size="sm" />
      </button>

      <!-- Botón de Acción Principal -->
      <button class="apply-btn" @click="submitAmount" :disabled="!montoValido">
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
  background: #f8f9fa;
  border: 1px solid #e1e3e4;
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28px;
  font-weight: 700;
  color: #191c1d;
  min-height: 54px;
}
.currency {
  font-size: 20px;
  color: #717786;
}
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  flex-grow: 1; /* Esto hace que el teclado se estire para llenar el espacio disponible */
}
.num-btn {
  background: #ffffff;
  border: 1px solid #e1e3e4;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #191c1d;
  cursor: pointer;
  min-height: 42px; /* Altura mínima flexible */
  transition: background 0.2s;
}
.num-btn:hover {
  background: #f3f4f5;
}
.action-btn {
  color: #414754;
}
.apply-btn {
  grid-column: span 3;
  background: #0059bb;
  color: white;
  border: none;
  border-radius: 10px;
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
  background: #004493;
}
.apply-btn:disabled {
  background: #adc7ff;
  cursor: not-allowed;
}
</style>
