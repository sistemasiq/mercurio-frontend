<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  subtitle?: string
  /** Texto del enlace "← volver" sobre el título. */
  backLabel?: string
  backTo?: RouteLocationRaw
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <div class="page-header">
    <div class="page-header__text">
      <template v-if="backLabel">
        <router-link v-if="backTo" :to="backTo" class="page-header__back">
          <q-icon name="arrow_back" size="18px" />{{ backLabel }}
        </router-link>
        <button v-else type="button" class="page-header__back" @click="emit('back')">
          <q-icon name="arrow_back" size="18px" />{{ backLabel }}
        </button>
      </template>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle || $slots.subtitle" class="page-header__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 240px;
  }

  &__back {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--q-primary);
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: var(--text-strong);
    }
  }

  &__title {
    margin: 0;
    font-size: 26px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }

  &__subtitle {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
}
</style>
