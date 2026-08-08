<template>
  <div class="ticket-item" :class="{ 'ticket-item--hijo': esHijoCombo }">
    <div class="ticket-item__top">
      <div class="ticket-item__info">
        <h4 class="ticket-item__nombre">{{ item.producto.nombre }}</h4>
        <p v-if="esHijoCombo" class="ticket-item__incluido">Incluido en el combo</p>
        <p v-else class="ticket-item__precio">${{ lineTotal.toFixed(2) }}</p>
      </div>
      <div v-if="!esHijoCombo" class="ticket-item__qty">
        <q-btn
          flat
          dense
          icon="remove"
          size="xs"
          color="grey-7"
          @click="$emit('cambiar-cantidad', item, -1)"
        />
        <span class="ticket-item__qty-val">{{ item.cantidad }}</span>
        <q-btn
          flat
          dense
          icon="add"
          size="xs"
          color="grey-7"
          @click="$emit('cambiar-cantidad', item, 1)"
        />
      </div>
    </div>

    <q-btn
      v-if="!item.notas"
      flat
      dense
      no-caps
      color="grey-7"
      size="sm"
      class="q-mt-xs"
      @click="$emit('editar-notas', item)"
    >
      <q-icon name="edit_note" class="q-mr-xs" /> Agregar notas
    </q-btn>
    <div v-else class="ticket-item__notas cursor-pointer" @click="$emit('editar-notas', item)">
      "{{ item.notas }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Producto } from '@/types/producto'

export interface ItemTicket {
  id: string
  producto: Producto
  cantidad: number
  notas: string
  subtotal?: number
  es_hijo_de?: string | null
  es_hijo_combo?: boolean
  nombre_combo_padre?: string | null
  cantidad_base?: number
  padreTicketId?: string
}

const props = defineProps<{ item: ItemTicket }>()
defineEmits<{
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
}>()

const esHijoCombo = computed(
  () => Boolean(props.item.es_hijo_de) || props.item.es_hijo_combo === true,
)

const lineTotal = computed(() =>
  Number(props.item.subtotal ?? props.item.producto.precio_unitario * props.item.cantidad),
)
</script>

<style scoped>
.ticket-item {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--bg-main);
}

.ticket-item--hijo {
  border-left: 4px solid #ffc107;
  background: rgba(255, 193, 7, 0.08);
}

.ticket-item__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.ticket-item__info {
  flex: 1;
  min-width: 0;
}

.ticket-item__nombre {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-item__precio {
  font-size: 14px;
  font-weight: 700;
  color: var(--q-primary, #025fe0);
  margin: 0;
}

.ticket-item__incluido {
  font-size: 12px;
  font-weight: 600;
  font-style: italic;
  color: #b45309;
  margin: 0;
}

.ticket-item__qty {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--bg-main);
  border-radius: 8px;
  padding: 2px 4px;
  flex-shrink: 0;
}

.ticket-item__qty-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 18px;
  text-align: center;
}

.ticket-item__notas {
  margin-top: 8px;
  padding: 6px 8px;
  background-color: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.35);
  border-radius: 6px;
  font-size: 12px;
  font-style: italic;
  color: #b45309;
}
.ticket-item__notas--readonly {
  cursor: default;
  opacity: 0.7;
}
</style>
