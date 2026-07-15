<template>
  <div class="grid-methods">
    <button
      v-for="method in methods"
      :key="method.id"
      class="method-btn"
      :class="{ active: modelValue === method.nombre }"
      @click="$emit('update:modelValue', method.nombre)"
    >
      <q-icon
        :name="getMethodMeta(method.nombre).icon"
        size="24px"
        :color="modelValue === method.nombre ? 'primary' : getMethodMeta(method.nombre).color"
      />
      <span
        class="method-label"
        :class="{ 'text-primary text-weight-bold': modelValue === method.nombre }"
      >
        {{ method.nombre }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { MetodosPago } from '@/types/metodos_pago'

defineProps<{
  modelValue: string
  methods: MetodosPago[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const METHOD_META: Record<string, { icon: string; color: string }> = {
  efectivo: { icon: 'payments', color: 'green' },
  tarjeta: { icon: 'credit_card', color: 'blue' },
  cupones: { icon: 'redeem', color: 'orange' },
  lealtad: { icon: 'loyalty', color: 'purple' },
}

const getMethodMeta = (nombre: string) => {
  const key = nombre.trim().toLowerCase()
  for (const [pattern, meta] of Object.entries(METHOD_META)) {
    if (key.includes(pattern)) return meta
  }
  return { icon: 'payment', color: 'grey' }
}
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
