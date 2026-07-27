<template>
  <div class="rs-obs-card" :class="{ 'rs-obs-card--requerido': hayDiferencias && !modelValue }">
    <!-- Label -->
    <div class="rs-obs-header">
      <span class="rs-obs-label-text">OBSERVACIONES DE CIERRE</span>
      <span v-if="hayDiferencias" class="rs-obs-badge">Requerido</span>
    </div>

    <!-- Textarea nativo para coincidencia exacta con el diseño -->
    <textarea
      v-model="modelValue"
      class="rs-obs-textarea"
      :class="{ 'rs-obs-textarea--error': hayDiferencias && !modelValue }"
      :placeholder="placeholder"
      rows="4"
    />

    <!-- Mensaje de error -->
    <div v-if="hayDiferencias && !modelValue" class="rs-obs-error-msg">
      <span class="material-symbols-outlined rs-obs-error-icon">info</span>
      Las observaciones son requeridas cuando existen diferencias en el balance.
    </div>

    <!-- Hint cuando no hay error -->
    <div v-else-if="hayDiferencias" class="rs-obs-hint">
      <span class="material-symbols-outlined rs-obs-hint-icon">info</span>
      Al haber diferencias, este campo es obligatorio para confirmar el cierre.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hayDiferencias: boolean
}>()

const modelValue = defineModel<string>({ default: '' })

const placeholder = computed(() =>
  props.hayDiferencias
    ? 'Ingrese comentarios, discrepancias o notas adicionales sobre el turno...'
    : 'Notas sobre el conteo, incidentes del turno, aclaraciones... (opcional)',
)

function validar(): boolean {
  if (props.hayDiferencias && !modelValue.value.trim()) return false
  return true
}

defineExpose({ validar })
</script>

<style scoped>
/* ── Card ───────────────────────────────────────────────────────────── */
.rs-obs-card {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.15s ease;
}
.rs-obs-card--requerido {
  border-color: #b7131a;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-obs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.rs-obs-label-text {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #454652;
}
.rs-obs-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 9999px;
  background: #ffdad6;
  color: #93000a;
  border: 1px solid #ffb4ac;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
}

/* ── Textarea ───────────────────────────────────────────────────────── */
.rs-obs-textarea {
  width: 100%;
  padding: 10px 12px;
  background: #f8f9ff;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #0b1c30;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  min-height: 96px;
}
.rs-obs-textarea::placeholder {
  color: #c6c5d4;
}
.rs-obs-textarea:focus {
  border-color: #b7131a;
  box-shadow: 0 0 0 2px rgba(183, 19, 26, 0.1);
}
.rs-obs-textarea--error {
  border-color: #b7131a;
}

/* ── Mensajes ───────────────────────────────────────────────────────── */
.rs-obs-error-msg,
.rs-obs-hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.5;
}
.rs-obs-error-msg {
  color: #93000a;
}
.rs-obs-hint {
  color: #454652;
}
.rs-obs-error-icon,
.rs-obs-hint-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
