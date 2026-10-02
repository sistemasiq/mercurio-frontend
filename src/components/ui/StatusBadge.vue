<script setup lang="ts">
import type { UiTone } from '@/types/ui'

withDefaults(defineProps<{ tone?: UiTone; label: string; dot?: boolean }>(), {
  tone: 'off',
  dot: true,
})
</script>

<template>
  <span class="status-badge" :class="`status-badge--${tone}`">
    <span v-if="dot" class="status-badge__dot" />{{ label }}
  </span>
</template>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  @each $tone in 'ok', 'warn', 'bad', 'info', 'off', 'pink' {
    &--#{$tone} {
      background: var(--tone-#{$tone}-bg);
      color: var(--tone-#{$tone}-fg);

      .status-badge__dot {
        background: var(--tone-#{$tone}-dot);
      }
    }
  }
}
</style>
