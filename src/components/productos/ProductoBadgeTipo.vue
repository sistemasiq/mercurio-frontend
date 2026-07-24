<template>
  <span class="tipo-badge" :class="`tipo-badge--${tipo}`">
    {{ TIPO_LABELS[tipo] }}
  </span>
</template>

<script setup lang="ts">
import { TIPO_LABELS, type TipoProducto } from '@/types/producto'

defineProps<{
  tipo: TipoProducto
}>()
</script>

<style scoped lang="scss">
.tipo-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.tipo-badge--A {
    background-color: #e8f5e9;
    color: #2e7d32;
  }

  &.tipo-badge--B {
    background-color: #e3f2fd;
    color: #1565c0;
  }

  &.tipo-badge--C {
    background-color: #fff3e0;
    color: #ef6c00;
  }

  &.tipo-badge--E {
    background-color: #f3e5f5;
    color: #6a1b9a;
  }

  &.tipo-badge--S {
    background-color: #ede7f6;
    color: #4527a0;
  }
}
</style>
