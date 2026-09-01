<template>
  <div class="ticket-item" :class="{ 'ticket-item--hijo': esHijoCombo }">
    <div class="ticket-item__top">
      <div class="ticket-item__info">
        <h4 class="ticket-item__nombre">{{ item.producto.nombre }}</h4>
        <p v-if="esHijoCombo" class="ticket-item__incluido">
          <q-icon name="check_circle" size="12px" class="q-mr-xs" />Incluido en combo
        </p>
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
  id_combo_padre?: string
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

<style>
.ticket-item {
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  margin-bottom: 8px;
}
.ticket-item--hijo {
  border-left: 3px solid #025fe0;
  background: rgba(2, 95, 224, 0.03);
  box-shadow: none;
}
.ticket-item__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  box-sizing: border-box;
}
.ticket-item__info {
  flex: 1;
  min-width: 0;
}
.ticket-item__nombre {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ticket-item__precio {
  font-size: 14px;
  font-weight: 700;
  color: #025fe0;
  margin: 0;
}
.ticket-item__incluido {
  font-size: 11px;
  font-weight: 600;
  color: #025fe0;
  margin: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
}
.ticket-item__qty {
  display: flex;
  align-items: center;
  gap: 2px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px 4px;
  flex-shrink: 0;
}
.ticket-item__qty-val {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  min-width: 20px;
  text-align: center;
}
.ticket-item__notas {
  margin-top: 6px;
  padding: 5px 8px;
  background-color: rgba(2, 95, 224, 0.05);
  border: 1px solid rgba(2, 95, 224, 0.15);
  border-radius: 6px;
  font-size: 11px;
  font-style: italic;
  color: #475569;
}
</style>
