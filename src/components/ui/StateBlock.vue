<script setup lang="ts">
import { computed } from 'vue'
import type { StateVariant } from '@/types/ui'

/**
 * Estados de tabla y pantalla (07c Sistema): cargando, sin datos, sin
 * resultados y error de carga.
 */
const props = withDefaults(
  defineProps<{
    variant: StateVariant
    title?: string
    body?: string
    actionLabel?: string
    actionIcon?: string
  }>(),
  { title: undefined, body: undefined, actionLabel: undefined, actionIcon: undefined },
)

const emit = defineEmits<{ action: [] }>()

const PRESETS: Record<
  Exclude<StateVariant, 'loading'>,
  { icon: string; title: string; body: string }
> = {
  empty: { icon: 'inbox', title: 'No hay registros', body: 'Crea el primero para empezar.' },
  'no-results': {
    icon: 'search_off',
    title: 'Sin resultados',
    body: 'Prueba con otro término o quita los filtros.',
  },
  error: {
    icon: 'cloud_off',
    title: 'No se pudieron cargar los datos',
    body: 'Revisa tu conexión e intenta de nuevo.',
  },
}

const preset = computed(() => (props.variant === 'loading' ? null : PRESETS[props.variant]))

const SKELETON = [
  ['40%', '30%'],
  ['55%', '20%'],
  ['35%', '35%'],
  ['50%', '25%'],
  ['30%', '40%'],
]
</script>

<template>
  <div class="state-block" :class="`state-block--${variant}`" role="status">
    <div v-if="variant === 'loading'" class="state-block__skeleton" aria-label="Cargando">
      <div v-for="(row, i) in SKELETON" :key="i" class="state-block__bar-row">
        <span class="state-block__bar" :style="{ width: row[0] }" />
        <span class="state-block__bar state-block__bar--soft" :style="{ width: row[1] }" />
      </div>
    </div>
    <template v-else-if="preset">
      <span class="state-block__icon"><q-icon :name="preset.icon" size="26px" /></span>
      <span class="state-block__title">{{ title ?? preset.title }}</span>
      <span class="state-block__body">{{ body ?? preset.body }}</span>
      <q-btn
        v-if="actionLabel"
        :unelevated="variant === 'empty'"
        :outline="variant !== 'empty'"
        :color="variant === 'empty' ? 'primary' : variant === 'error' ? 'negative' : undefined"
        :icon="actionIcon"
        :label="actionLabel"
        class="state-block__action"
        @click="emit('action')"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.state-block {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;

  &__skeleton {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__bar-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  &__bar {
    height: 12px;
    border-radius: 6px;
    background: #eef1f5;
    animation: state-pulse 1.4s ease-in-out infinite;

    &--soft {
      background: var(--bg-muted);
    }
  }

  &__icon {
    width: 52px;
    height: 52px;
    border-radius: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tone-off-bg);
    color: var(--text-secondary);
  }

  &--no-results &__icon {
    background: var(--tone-info-bg);
    color: var(--q-primary);
  }

  &--error &__icon {
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
  }

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__body {
    max-width: 320px;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--text-secondary);
  }

  &--error &__action {
    color: var(--tone-bad-fg);
  }
}

@keyframes state-pulse {
  50% {
    opacity: 0.55;
  }
}
</style>
