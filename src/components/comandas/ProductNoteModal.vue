<template>
  <BaseDialog
    :model-value="modelValue"
    title="Notas especiales"
    :subtitle="item?.producto.nombre"
    icon="edit_note"
    :width="460"
    @update:model-value="$emit('update:modelValue', $event)"
    @confirm="guardar"
  >
    <q-input
      v-model="localNotas"
      outlined
      autofocus
      placeholder="Ej: Sin cebolla, extra salsa…"
      type="textarea"
      rows="3"
    />
    <div class="note-suggest">
      <span class="field-label">Sugerencias</span>
      <div class="note-suggest__chips">
        <button
          v-for="s in SUGERENCIAS"
          :key="s"
          type="button"
          class="note-suggest__chip"
          :class="{ 'note-suggest__chip--on': tieneSugerencia(s) }"
          @click="alternarSugerencia(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import type { ItemTicket } from './TicketItem.vue'

const props = defineProps<{
  modelValue: boolean
  item: ItemTicket | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', item: ItemTicket, notas: string): void
}>()

const SUGERENCIAS = ['Sin cebolla', 'Sin catsup', 'Extra queso', 'Para llevar']

const localNotas = ref('')

watch(
  () => props.item,
  (newItem) => {
    if (newItem) localNotas.value = newItem.notas
  },
)

function partes(): string[] {
  return localNotas.value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

function tieneSugerencia(s: string): boolean {
  return partes().some((p) => p.toLowerCase() === s.toLowerCase())
}

function alternarSugerencia(s: string): void {
  const actuales = partes()
  localNotas.value = tieneSugerencia(s)
    ? actuales.filter((p) => p.toLowerCase() !== s.toLowerCase()).join(', ')
    : [...actuales, s].join(', ')
}

const guardar = () => {
  if (props.item) {
    emit('guardar', props.item, localNotas.value)
  }
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
.note-suggest {
  display: flex;
  flex-direction: column;

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip {
    height: 34px;
    padding: 0 12px;
    border-radius: 9px;
    border: 1px solid var(--border-input);
    background: #fff;
    color: var(--text-body);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &--on {
      background: var(--tone-info-bg);
      border-color: var(--q-primary);
      color: var(--q-primary);
    }
  }
}
</style>
