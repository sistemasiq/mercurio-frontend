<template>
  <div class="ticket-item" :class="{ 'ticket-item--hijo': esHijoCombo }">
    <div class="ticket-item__info">
      <span class="ticket-item__nombre">{{ item.producto.nombre }}</span>
      <button
        type="button"
        class="ticket-item__nota"
        :class="{ 'ticket-item__nota--on': item.notas }"
        @click="$emit('editar-notas', item)"
      >
        {{ item.notas || (esHijoCombo ? 'Incluido en combo · agregar nota' : 'Agregar nota') }}
      </button>
    </div>
    <template v-if="!esHijoCombo">
      <div class="qty-stepper">
        <button type="button" aria-label="Quitar uno" @click="$emit('cambiar-cantidad', item, -1)">
          <q-icon name="remove" size="16px" />
        </button>
        <span>{{ item.cantidad }}</span>
        <button type="button" aria-label="Agregar uno" @click="$emit('cambiar-cantidad', item, 1)">
          <q-icon name="add" size="16px" />
        </button>
      </div>
      <span class="ticket-item__precio">${{ lineTotal.toFixed(2) }}</span>
    </template>
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

<style lang="scss">
.ticket-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f3f7;

  &--hijo {
    padding: 8px 20px 8px 36px;
    border-bottom: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  &__nombre {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--text-primary);
  }

  &--hijo &__nombre {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-body);
  }

  &__nota {
    align-self: flex-start;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 12.5px;
    text-align: left;
    color: var(--text-muted);
    cursor: pointer;

    &:hover {
      color: var(--q-primary);
    }

    &--on {
      color: #c2410c;
    }
  }

  &__precio {
    min-width: 72px;
    text-align: right;
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
    padding-top: 6px;
  }
}

.qty-stepper {
  display: flex;
  align-items: center;
  height: 32px;
  border: 1px solid var(--border-input);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;

  button {
    width: 28px;
    height: 100%;
    border: 0;
    background: #fff;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      background: var(--bg-muted);
      color: var(--text-primary);
    }
  }

  span {
    min-width: 22px;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}
</style>
