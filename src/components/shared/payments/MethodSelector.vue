<template>
  <div v-if="visibleMethods.length > 0" class="grid-methods">
    <button
      v-for="method in visibleMethods"
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
  <q-banner v-else dense rounded class="bg-orange-1 text-orange-9 q-mb-md" style="font-size: 12px">
    <template #avatar><q-icon name="warning" color="warning" /></template>
    Esta sucursal no tiene métodos de pago activos. Configúralos en Catálogo &gt; Métodos de Pago.
  </q-banner>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORIAS_METODO_PAGO } from '@/types/metodos_pago'
import type { MetodosPago } from '@/types/metodos_pago'

const props = defineProps<{
  modelValue: string
  metodosDisponibles: MetodosPago[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Solo se muestra una categoría si la sucursal tiene al menos un método
// activo de ese tipo -- evita ofrecer un botón (ej. "Cupones") que siempre
// va a fallar al cobrar porque nunca se configuró un método real de ese tipo.
const visibleMethods = computed(() =>
  CATEGORIAS_METODO_PAGO.filter((cat) =>
    props.metodosDisponibles.some((m) => m.activo && m.tipo === cat.tipo),
  ),
)
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
