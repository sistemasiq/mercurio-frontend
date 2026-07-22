<template>
  <div class="form-block">
    <div class="form-block__label">OBSERVACIONES</div>
    <q-input
      v-model="modelValue"
      type="textarea"
      outlined
      dense
      autogrow
      class="q-mt-sm"
      placeholder="Notas sobre el conteo, diferencias detectadas, incidentes del turno, etc. (opcional)"
    />
  </div>
</template>

<script setup lang="ts">
const modelValue = defineModel({ type: String, default: '' })
</script>

<style scoped>
.form-block {
  position: relative;
  border: 1px solid var(--md-outline-variant);
  border-radius: 12px;
  padding: 24px;
  background: var(--md-surface-container-lowest);
  box-shadow: 0 2px 10px -4px rgba(0, 0, 0, 0.05);
}
.form-block__label {
  position: absolute;
  top: -12px;
  left: 16px;
  background: var(--md-surface-container-lowest);
  padding: 0 8px;
  color: var(--md-primary);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}
</style>
