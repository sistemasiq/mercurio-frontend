<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppNavigation } from '@/composables/useAppNavigation'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { fuzzyScore } from '@/utils/fuzzyMatch'

/**
 * Paleta de comandos "Buscar o ir a… Ctrl+K": búsqueda difusa sobre las
 * rutas del menú (ya filtradas por permiso en useAppNavigation). Responde a
 * Ctrl+K y también a Cmd+K (Meta), pero la etiqueta visible siempre dice
 * "Ctrl" (los usuarios de esta app usan Windows). Se abre desde cualquier
 * pantalla o desde el botón del Sidebar.
 */
const router = useRouter()
const { visibleGroups } = useAppNavigation()
const { open, togglePalette } = useCommandPalette()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<{ focus: () => void } | null>(null)

interface Resultado {
  routeName: string
  label: string
  icon: string
  groupLabel: string | null
}

const items = computed<Resultado[]>(() =>
  visibleGroups.value.flatMap((group) =>
    group.items.map((item) => ({
      routeName: item.routeName,
      label: item.label,
      icon: item.icon,
      groupLabel: group.label,
    })),
  ),
)

const resultados = computed<Resultado[]>(() => {
  const q = query.value.trim()
  if (!q) return items.value
  return items.value
    .map((item) => ({ item, score: fuzzyScore(q, item.label) }))
    .filter((r): r is { item: Resultado; score: number } => r.score !== null)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.item)
})

watch(resultados, () => {
  activeIndex.value = 0
})

function closePalette(): void {
  open.value = false
  query.value = ''
  activeIndex.value = 0
}

function ir(item: Resultado | undefined): void {
  if (!item) return
  closePalette()
  void router.push({ name: item.routeName })
}

function moverSeleccion(delta: number): void {
  if (resultados.value.length === 0) return
  const total = resultados.value.length
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function onKeydownGlobal(event: KeyboardEvent): void {
  const esAtajo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
  if (esAtajo) {
    event.preventDefault()
    togglePalette()
  }
}

watch(open, (value) => {
  if (value) void nextTick(() => inputRef.value?.focus())
})

onMounted(() => window.addEventListener('keydown', onKeydownGlobal))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydownGlobal))
</script>

<template>
  <q-dialog v-model="open" @hide="closePalette">
    <q-card class="cmdk">
      <q-input
        ref="inputRef"
        v-model="query"
        autofocus
        dense
        borderless
        placeholder="Buscar o ir a…"
        class="cmdk__input"
        @keydown.down.prevent="moverSeleccion(1)"
        @keydown.up.prevent="moverSeleccion(-1)"
        @keydown.enter.prevent="ir(resultados[activeIndex])"
        @keydown.esc="closePalette"
      >
        <template #prepend>
          <q-icon name="search" size="20px" />
        </template>
        <template #append>
          <kbd class="cmdk__kbd">Esc</kbd>
        </template>
      </q-input>

      <q-list v-if="resultados.length" class="cmdk__list">
        <q-item
          v-for="(item, index) in resultados"
          :key="item.routeName"
          v-close-popup
          clickable
          :active="index === activeIndex"
          active-class="cmdk__item--active"
          @click="ir(item)"
          @mouseenter="activeIndex = index"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" size="19px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.label }}</q-item-label>
            <q-item-label v-if="item.groupLabel" caption>{{ item.groupLabel }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div v-else class="cmdk__empty">
        <q-icon name="search_off" size="22px" />
        <span>Sin resultados para "{{ query }}"</span>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.cmdk {
  width: 520px;
  max-width: 92vw;
  border-radius: var(--radius-md);
  overflow: hidden;

  &__input {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-soft);
    font-size: 15px;
  }

  &__kbd {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-secondary);
    background: var(--bg-muted);
    border-radius: 6px;
    padding: 2px 6px;
  }

  &__list {
    max-height: 360px;
    overflow-y: auto;
    padding: 6px;
  }

  &__item--active {
    background: var(--tone-info-bg);
    color: var(--q-primary);
  }

  &__empty {
    padding: 32px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13.5px;
  }
}
</style>
