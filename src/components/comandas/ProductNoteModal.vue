<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 320px; border-radius: 12px">
      <q-card-section>
        <div class="text-h6 text-weight-bold">Notas especiales</div>
        <div class="text-grey-6 text-caption">{{ item?.producto.nombre }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="localNotas"
          outlined
          autofocus
          placeholder="Ej: Sin cebolla, extra salsa..."
          type="textarea"
          rows="3"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
        <q-btn
          unelevated
          no-caps
          label="Guardar"
          color="primary"
          style="border-radius: 8px; font-weight: 600"
          @click="guardar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ItemTicket } from './TicketItem.vue'

const props = defineProps<{
  modelValue: boolean
  item: ItemTicket | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guardar', item: ItemTicket, notas: string): void
}>()

const localNotas = ref('')

watch(
  () => props.item,
  (newItem) => {
    if (newItem) localNotas.value = newItem.notas
  },
)

const guardar = () => {
  if (props.item) {
    emit('guardar', props.item, localNotas.value)
  }
  emit('update:modelValue', false)
}
</script>
