<template>
  <q-card flat bordered class="main-card">
    <q-card-section class="card-header">
      <div class="text-h5 text-weight-bold section-title">{{ title }}</div>
      <div class="text-body2 section-subtitle q-mt-xs">{{ subtitle }}</div>
    </q-card-section>

    <q-card-section class="q-pa-md q-pa-lg-desktop q-gutter-y-xl">
      <slot />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, default: 'Declaración de Valores' },
  subtitle: {
    type: String,
    default: 'Ingresa el conteo físico de tu caja antes de finalizar el turno.',
  },
})
</script>

<style scoped>
.main-card {
  border-radius: 16px;
  border-color: var(--md-outline-variant);
  background: var(--md-surface-container-lowest);
  overflow: hidden;
}
.card-header {
  background: var(--md-surface-bright);
  border-bottom: 1px solid var(--md-outline-variant);
}
.section-title {
  color: var(--md-primary-container);
}
.section-subtitle {
  color: var(--md-on-surface-variant);
}
</style>
