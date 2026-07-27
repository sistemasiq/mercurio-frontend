<template>
  <div class="row items-center justify-between q-mb-md estado-turno-header">
    <div class="row items-center q-gutter-x-xl">
      <div class="row items-center q-gutter-x-xs">
        <q-icon name="person" size="18px" color="grey-7" />
        <span class="text-body2 context-label">
          Cajero: <span class="text-weight-semibold context-value">{{ cajero }}</span>
        </span>
      </div>
      <div class="row items-center q-gutter-x-xs">
        <q-icon name="point_of_sale" size="18px" color="grey-7" />
        <span class="text-body2 context-label">
          Terminal: <span class="text-weight-semibold context-value">{{ terminal }}</span>
        </span>
      </div>
    </div>

    <q-badge rounded class="estado-badge" :class="estadoClase">
      <span class="estado-dot" />
      {{ estado }}
    </q-badge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  cajero: { type: String, required: true },
  terminal: { type: String, required: true },
  /** 'En conteo' | 'Cerrado' | 'Con diferencia' */
  estado: { type: String, default: 'En conteo' },
})

// Permite reusar el header para distintos estados del ciclo de cierre
const estadoClase = computed(() => {
  const map = {
    'En conteo': 'estado--activo',
    Cerrado: 'estado--ok',
    'Con diferencia': 'estado--alerta',
  }
  return map[props.estado] || 'estado--activo'
})
</script>

<style scoped>
.context-label {
  color: var(--md-on-surface-variant);
}
.context-value {
  color: var(--md-on-surface);
}
.estado-badge {
  background: var(--md-secondary-fixed);
  color: var(--md-on-secondary-fixed-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  font-size: 0.7rem;
  padding: 6px 12px;
  gap: 6px;
}
.estado-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--md-secondary);
  display: inline-block;
  margin-right: 6px;
  animation: pulse 1.6s infinite;
}
.estado--ok .estado-dot {
  background: var(--md-success);
  animation: none;
}
.estado--alerta .estado-dot {
  background: var(--md-error);
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
