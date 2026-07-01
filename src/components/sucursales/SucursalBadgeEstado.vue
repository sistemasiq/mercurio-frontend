<template>
  <span class="estado-badge" :class="`badge--${estado}`">
    <span class="badge-dot"></span>
    {{ estadoLabels[estado] }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  estado: 'activa' | 'inactiva'
}>()

const estadoLabels: Record<string, string> = {
  activa: 'Activa',
  inactiva: 'Inactiva',
}
</script>

<style scoped lang="scss">
.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &.badge--activa {
    background-color: #e8f5e9;
    color: #2e7d32;

    .badge-dot {
      background-color: #43a047;
    }
  }

  &.badge--inactiva {
    background-color: #fce4ec;
    color: #c62828;

    .badge-dot {
      background-color: #e53935;
    }
  }
}
</style>
