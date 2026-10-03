<script setup lang="ts">
import { computed } from 'vue'

/** Pie de tabla del diseño: "Mostrando a–b de n" + paginación compacta. */
const props = withDefaults(
  defineProps<{
    total: number
    perPage: number
    /** Sustantivo en plural para el texto (p. ej. "pulseras"). */
    noun?: string
  }>(),
  { noun: 'resultados' },
)

const page = defineModel<number>({ required: true })

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => (props.total === 0 ? 0 : (page.value - 1) * props.perPage + 1))
const to = computed(() => Math.min(page.value * props.perPage, props.total))

// Ventana de hasta 5 páginas alrededor de la actual.
const visibles = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, pages.value - 4))
  const end = Math.min(pages.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})
</script>

<template>
  <div class="pager">
    <span class="pager__info">Mostrando {{ from }}–{{ to }} de {{ total }} {{ noun }}</span>
    <template v-if="pages > 1">
      <button
        type="button"
        class="pager__btn pager__btn--edge"
        :disabled="page <= 1"
        aria-label="Página anterior"
        @click="page--"
      >
        <q-icon name="chevron_left" size="18px" />
      </button>
      <button
        v-for="n in visibles"
        :key="n"
        type="button"
        class="pager__btn"
        :class="{ 'pager__btn--on': n === page }"
        :aria-current="n === page ? 'page' : undefined"
        @click="page = n"
      >
        {{ n }}
      </button>
      <button
        type="button"
        class="pager__btn pager__btn--edge"
        :disabled="page >= pages"
        aria-label="Página siguiente"
        @click="page++"
      >
        <q-icon name="chevron_right" size="18px" />
      </button>
    </template>
  </div>
</template>

<style scoped lang="scss">
.pager {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 48px;
  padding: 8px 16px;
  border-top: 1px solid var(--border-soft);
  font-size: 12.5px;
  color: var(--text-secondary);

  &__info {
    flex: 1;
  }

  &__btn {
    min-width: 30px;
    height: 30px;
    padding: 0 6px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--text-body);
    font: inherit;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &--edge {
      border: 1px solid var(--border-input);
      color: var(--text-secondary);
    }

    &--on {
      background: var(--text-strong);
      color: #fff;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
