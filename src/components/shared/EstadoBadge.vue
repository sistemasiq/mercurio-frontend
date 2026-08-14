<template>
  <span class="estado-badge" :class="`estado-badge--${tono}`">{{ label }}</span>
</template>

<script setup lang="ts">
defineProps<{
  tono: 'verde' | 'rojo' | 'naranja' | 'azul' | 'gris'
  label: string
}>()
</script>

<style scoped lang="scss">
// Colores derivados de la paleta oficial ($positive/$negative/$warning/$primary
// en src/css/app.scss) -- no se importan aquí porque el proyecto no expone las
// variables SCSS globalmente a componentes individuales.
.estado-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.estado-badge--verde {
    background-color: rgba(63, 168, 52, 0.12); // $positive
    color: #3fa834;
  }

  &.estado-badge--rojo {
    background-color: rgba(220, 38, 38, 0.12); // $negative
    color: #dc2626;
  }

  &.estado-badge--naranja {
    background-color: rgba(255, 193, 7, 0.16); // $warning
    color: #b45309;
  }

  &.estado-badge--azul {
    background-color: rgba(2, 95, 224, 0.1); // $primary
    color: #025fe0;
  }

  &.estado-badge--gris {
    background-color: #eceff1;
    color: #546e7a;
  }
}
</style>
