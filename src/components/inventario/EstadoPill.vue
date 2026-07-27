<template>
  <span class="estado-pill" :class="`estado-pill--${tono}`">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  tono: 'verde' | 'rojo' | 'naranja' | 'azul' | 'gris'
  label: string
}>()
</script>

<style scoped lang="scss">
.estado-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.estado-pill--verde {
    background-color: #e8f5e9;
    color: #2e7d32;
  }

  &.estado-pill--rojo {
    background-color: #fce4ec;
    color: #c62828;
  }

  &.estado-pill--naranja {
    background-color: #fff3e0;
    color: #ef6c00;
  }

  &.estado-pill--azul {
    background-color: #e3f2fd;
    color: #1565c0;
  }

  &.estado-pill--gris {
    background-color: #eceff1;
    color: #546e7a;
  }
}
</style>
