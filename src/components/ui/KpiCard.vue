<script setup lang="ts">
import type { UiTone } from '@/types/ui'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    note?: string
    noteTone?: UiTone
    /** Color del valor (por defecto navy). */
    valueColor?: string
  }>(),
  { note: undefined, noteTone: undefined, valueColor: undefined },
)
</script>

<template>
  <div class="kpi-card">
    <span class="kpi-card__label">{{ label }}</span>
    <div class="kpi-card__row">
      <span class="kpi-card__value" :style="valueColor ? { color: valueColor } : undefined">
        <slot name="value">{{ value }}</slot>
      </span>
      <span v-if="note" class="kpi-card__note" :class="noteTone && `kpi-card__note--${noteTone}`">
        {{ note }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  &__row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__value {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__note {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-secondary);

    &--ok {
      color: var(--tone-ok-fg);
    }
    &--warn {
      color: var(--tone-warn-fg);
    }
    &--bad {
      color: var(--tone-bad-fg);
    }
    &--info {
      color: var(--tone-info-fg);
    }
    &--pink {
      color: var(--tone-pink-fg);
    }
  }
}
</style>
