<template>
  <div class="ticket-item">
    <div class="ticket-item__top">
      <div class="ticket-item__info">
        <h4 class="ticket-item__nombre">{{ item.producto.nombre }}</h4>
        <p class="ticket-item__precio">
          ${{ (item.producto.precio_unitario * item.cantidad).toFixed(2) }}
        </p>
      </div>
      <div class="ticket-item__qty">
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
      <q-icon name="edit_note" class="q-mr-xs" /> Agregar notas especiales
    </q-btn>
    <div v-else class="ticket-item__notas cursor-pointer" @click="$emit('editar-notas', item)">
      "{{ item.notas }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Producto } from '@/types/producto'

export interface ItemTicket {
  producto: Producto
  cantidad: number
  notas: string
}

defineProps<{ item: ItemTicket }>()
defineEmits<{
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
}>()
</script>

<style scoped>
.ticket-item {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #f1f5f9;
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
  color: #1e293b;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-item__precio {
  font-size: 14px;
  font-weight: 700;
  color: var(--q-primary, #1976d2);
  margin: 0;
}

.ticket-item__qty {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #f1f5f9;
  border-radius: 8px;
  padding: 2px 4px;
  flex-shrink: 0;
}

.ticket-item__qty-val {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  min-width: 18px;
  text-align: center;
}

.ticket-item__notas {
  margin-top: 8px;
  padding: 6px 8px;
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 6px;
  font-size: 12px;
  font-style: italic;
  color: #c2410c;
}
</style>
