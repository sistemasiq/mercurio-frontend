<template>
  <span class="estado-badge" :class="activo ? 'estado-badge--activo' : 'estado-badge--inactivo'">
    {{ activo ? 'Activo' : 'Inactivo' }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  activo: boolean
}>()
</script>

<style scoped lang="scss">
.estado-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;

  &.estado-badge--activo {
    background-color: #e8f5e9;
    color: #2e7d32;
  }

  &.estado-badge--inactivo {
    background-color: #fce4ec;
    color: #c62828;
  }
}
</style>
