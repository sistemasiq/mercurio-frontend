<template>
  <div class="grid-methods">
    <button
      v-for="method in STATIC_METHODS"
      :key="method.valor"
      class="method-btn"
      :class="{ active: modelValue === method.valor }"
      @click="$emit('update:modelValue', method.valor)"
    >
      <q-icon
        :name="method.icon"
        size="24px"
        :color="modelValue === method.valor ? 'primary' : method.color"
      />
      <span
        class="method-label"
        :class="{ 'text-primary text-weight-bold': modelValue === method.valor }"
      >
        {{ method.nombre }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const STATIC_METHODS = [
  { nombre: 'Efectivo', valor: 'Efectivo', icon: 'payments', color: 'green' },
  { nombre: 'Crédito/Débito', valor: 'Tarjeta', icon: 'credit_card', color: 'blue' },
  { nombre: 'Cupones', valor: 'Cupones', icon: 'redeem', color: 'orange' },
  { nombre: 'Lealtad', valor: 'Lealtad', icon: 'loyalty', color: 'purple' },
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
  height: 76px;
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
