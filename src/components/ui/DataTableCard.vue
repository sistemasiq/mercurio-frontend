<script setup lang="ts" generic="T extends string">
import type { FilterChip } from '@/types/ui'

/**
 * Tarjeta de listado del diseño (TablePage): barra con buscador, chips de
 * filtro y contador; debajo, la tabla (slot por defecto, normalmente una
 * q-table `flat`) y su paginación.
 */
withDefaults(
  defineProps<{
    searchPlaceholder?: string
    filters?: FilterChip<T>[]
    count?: string
    hideSearch?: boolean
  }>(),
  { searchPlaceholder: 'Buscar…', filters: () => [], count: '', hideSearch: false },
)

const search = defineModel<string>('search', { default: '' })
const filter = defineModel<T | null>('filter', { default: null })
</script>

<template>
  <section class="table-card">
    <div class="table-card__toolbar">
      <q-input
        v-if="!hideSearch"
        v-model="search"
        dense
        outlined
        clearable
        debounce="200"
        :placeholder="searchPlaceholder"
        class="table-card__search"
      >
        <template #prepend><q-icon name="search" size="19px" /></template>
      </q-input>
      <div v-if="filters.length" class="table-card__chips" role="group">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          class="table-card__chip"
          :class="{ 'table-card__chip--on': filter === f.value }"
          :aria-pressed="filter === f.value"
          @click="filter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
      <slot name="toolbar" />
      <span v-if="count" class="table-card__count">{{ count }}</span>
    </div>
    <div class="table-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.table-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__search {
    width: 320px;
    max-width: 100%;

    :deep(.q-field__control) {
      height: 38px;
      min-height: 38px;
    }

    :deep(.q-field__marginal) {
      height: 38px;
      color: var(--text-secondary);
    }
  }

  &__chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__chip {
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid var(--border-input);
    background: #fff;
    color: var(--text-body);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;

    &:hover {
      background: var(--bg-subtle);
    }

    &--on,
    &--on:hover {
      background: var(--text-strong);
      border-color: var(--text-strong);
      color: #fff;
    }
  }

  &__count {
    margin-left: auto;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  &__body {
    flex: 1;
    min-height: 0;

    // La tabla vive dentro de la tarjeta: sin borde ni radio propios.
    :deep(.q-table__card) {
      border: 0;
      border-radius: 0;
    }
  }
}
</style>
