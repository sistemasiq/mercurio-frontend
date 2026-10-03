<template>
  <div
    v-if="visibleMethods.length > 0"
    class="methods"
    role="radiogroup"
    aria-label="Método de pago"
  >
    <button
      v-for="method in visibleMethods"
      :key="method.valor"
      type="button"
      role="radio"
      class="methods__btn"
      :class="{ 'methods__btn--on': modelValue === method.valor }"
      :aria-checked="modelValue === method.valor"
      @click="$emit('update:modelValue', method.valor)"
    >
      <q-icon :name="method.icon" size="20px" />
      <span>{{ method.nombre }}</span>
    </button>
  </div>
  <div v-else class="methods__empty">
    <q-icon name="warning" size="19px" />
    Esta sucursal no tiene métodos de pago activos. Configúralos en Catálogo &gt; Métodos de Pago.
  </div>
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

<style scoped lang="scss">
.methods {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__btn {
    height: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: #fff;
    color: var(--text-body);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    text-align: left;
    cursor: pointer;

    .q-icon {
      color: var(--text-secondary);
    }

    &:hover {
      background: var(--bg-subtle);
    }

    &--on,
    &--on:hover {
      border: 1.5px solid var(--q-primary);
      background: var(--tone-info-bg);
      color: var(--q-primary);

      .q-icon {
        color: var(--q-primary);
      }
    }
  }

  &__empty {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-radius: 10px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1.45;
  }
}
</style>
