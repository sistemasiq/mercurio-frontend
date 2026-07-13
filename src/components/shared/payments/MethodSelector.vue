<template>
  <div class="grid-methods">
    <button
      v-for="method in methods"
      :key="method.value"
      class="method-btn"
      :class="{ active: modelValue === method.value }"
      @click="$emit('update:modelValue', method.value)"
    >
      <q-icon
        :name="method.icon"
        size="24px"
        :color="modelValue === method.value ? 'primary' : method.color"
      />
      <span
        class="method-label"
        :class="{ 'text-primary text-weight-bold': modelValue === method.value }"
      >
        {{ method.label }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PaymentForm } from '@/types/payments'

defineProps<{
  modelValue: PaymentForm['method']
}>()

defineEmits<{
  (e: 'update:modelValue', value: PaymentForm['method']): void
}>()

const methods = [
  { label: 'Efectivo', value: 'EFECTIVO' as const, icon: 'payments', color: 'green' },
  { label: 'Crédito/Débito', value: 'TARJETA' as const, icon: 'credit_card', color: 'blue' },
  { label: 'Cupones', value: 'CUPONES' as const, icon: 'redeem', color: 'orange' },
  { label: 'Saldo de Lealtad', value: 'LEALTAD' as const, icon: 'loyalty', color: 'purple' },
]
</script>

<style scoped>
.grid-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.method-btn {
  height: 76px; /* Altura reducida para laptops */
  background: #ffffff;
  border: 1px solid #e1e3e4;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.method-btn:hover {
  background: #f8f9fa;
}
.method-btn.active {
  border: 2px solid #0059bb;
  background: #e6f0fa;
}
.method-label {
  font-size: 14px;
  color: #414754;
}
</style>
