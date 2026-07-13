<template>
  <div class="ticket-panel">
    <div class="ticket-panel__header">
      <div>
        <h2 class="ticket-panel__titulo">Pedido Actual</h2>
        <p class="ticket-panel__sub">Mostrador • Para llevar</p>
      </div>
      <q-btn icon="more_vert" flat round size="sm" color="grey-7">
        <q-menu>
          <q-list style="min-width: 150px">
            <q-item v-close-popup clickable @click="$emit('cancelar')">
              <q-item-section class="text-red">Cancelar Orden</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <div class="ticket-panel__items hide-scrollbar">
      <TicketItem
        v-for="(item, index) in items"
        :key="index"
        :item="item"
        @cambiar-cantidad="(it, delta) => $emit('cambiar-cantidad', it, delta)"
        @editar-notas="(it) => $emit('editar-notas', it)"
      />
    </div>

    <div class="ticket-panel__footer">
      <div class="ticket-panel__total">
        <span class="ticket-panel__total-label">Total</span>
        <span class="ticket-panel__total-valor">${{ total.toFixed(2) }}</span>
      </div>
      <q-btn
        color="green-8"
        class="full-width text-weight-bold"
        size="lg"
        unelevated
        no-caps
        style="border-radius: 12px"
        :loading="enviando"
        @click="$emit('pagar')"
      >
        Cobrar <q-icon name="send" size="sm" class="q-ml-sm" />
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TicketItem, { type ItemTicket } from './TicketItem.vue'

const props = defineProps<{
  items: ItemTicket[]
  enviando: boolean
}>()

defineEmits<{
  (e: 'cancelar'): void
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
  (e: 'pagar'): void
}>()

const total = computed(() =>
  props.items.reduce(
    (suma, item) => suma + Number(item.subtotal ?? item.producto.precio_unitario * item.cantidad),
    0,
  ),
)
</script>

<style scoped>
.ticket-panel {
  width: 340px;
  min-width: 340px;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ticket-panel__header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ticket-panel__titulo {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.ticket-panel__sub {
  font-size: 13px;
  color: #94a3b8;
  margin: 3px 0 0 0;
}

.ticket-panel__items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ticket-panel__footer {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}

.ticket-panel__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.ticket-panel__total-label {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.ticket-panel__total-valor {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: var(--q-primary, #1976d2);
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
