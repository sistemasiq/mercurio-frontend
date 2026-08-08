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
      <template v-for="el in itemsAgrupados" :key="el.key">
        <!-- Bloque combo -->
        <div v-if="el.tipo === 'combo'" class="combo-group">
          <div class="combo-group__header">
            <div class="combo-group__header-left">
              <q-icon name="restaurant" size="14px" />
              <span class="combo-group__nombre">{{ el.nombre }}</span>
              <q-btn
                v-if="el.parent.cantidad > 1"
                flat
                dense
                no-caps
                size="sm"
                color="primary"
                icon="content_cut"
                class="combo-group__split-btn"
                @click="$emit('split-combo', el.parent)"
              >
                <q-tooltip>Dividir para personalizar</q-tooltip>
              </q-btn>
            </div>
            <div class="combo-group__header-right">
              <span class="combo-group__precio">${{ precioLinea(el.parent).toFixed(2) }}</span>
              <div class="combo-group__qty">
                <q-btn
                  flat
                  dense
                  icon="remove"
                  size="xs"
                  color="grey-7"
                  @click="$emit('cambiar-cantidad', el.parent, -1)"
                />
                <span class="combo-group__qty-val">{{ el.parent.cantidad }}</span>
                <q-btn
                  flat
                  dense
                  icon="add"
                  size="xs"
                  color="grey-7"
                  @click="$emit('cambiar-cantidad', el.parent, 1)"
                />
              </div>
            </div>
          </div>
          <div class="combo-group__items">
            <TicketItem
              v-for="hijo in el.items"
              :key="hijo.id"
              :item="hijo"
              @editar-notas="(it) => $emit('editar-notas', it)"
            />
          </div>
        </div>
        <!-- Item suelto -->
        <TicketItem
          v-else
          :key="el.item.id"
          :item="el.item"
          @cambiar-cantidad="(it, delta) => $emit('cambiar-cantidad', it, delta)"
          @editar-notas="(it) => $emit('editar-notas', it)"
        />
      </template>
    </div>

    <div class="ticket-panel__footer">
      <div class="ticket-panel__total">
        <span class="ticket-panel__total-label">Total</span>
        <span class="ticket-panel__total-valor">${{ total.toFixed(2) }}</span>
      </div>
      <q-btn
        color="positive"
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

interface GrupoCombo {
  tipo: 'combo'
  key: string
  nombre: string
  parent: ItemTicket
  items: ItemTicket[]
}

interface ItemSueltos {
  tipo: 'item'
  key: string
  item: ItemTicket
}

type ElementoRender = GrupoCombo | ItemSueltos

const props = defineProps<{
  items: ItemTicket[]
  enviando: boolean
}>()

defineEmits<{
  (e: 'cancelar'): void
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
  (e: 'split-combo', item: ItemTicket): void
  (e: 'pagar'): void
}>()

const itemsAgrupados = computed<ElementoRender[]>(() => {
  const items = props.items

  // Agrupar hijos por instancia de padre (padreTicketId)
  const childGroups = new Map<string, ItemTicket[]>()
  for (const item of items) {
    if (item.es_hijo_combo && item.padreTicketId) {
      const arr = childGroups.get(item.padreTicketId)
      if (arr) arr.push(item)
      else childGroups.set(item.padreTicketId, [item])
    }
  }

  const resultado: ElementoRender[] = []

  for (const item of items) {
    if (item.es_hijo_combo) continue

    if (item.producto.es_combo && childGroups.has(item.id)) {
      resultado.push({
        tipo: 'combo',
        key: `combo-${item.id}`,
        nombre: item.producto.nombre,
        parent: item,
        items: childGroups.get(item.id)!,
      })
    } else {
      resultado.push({ tipo: 'item', key: item.id, item })
    }
  }

  return resultado
})

function precioLinea(item: ItemTicket): number {
  return Number(item.subtotal ?? item.producto.precio_unitario * item.cantidad)
}

const total = computed(() =>
  props.items
    .filter((item) => !item.es_hijo_combo)
    .reduce((suma, item) => suma + precioLinea(item), 0),
)
</script>

<style scoped>
.ticket-panel {
  width: 340px;
  min-width: 340px;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ticket-panel__header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.ticket-panel__titulo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.ticket-panel__sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 3px 0 0 0;
}

.ticket-panel__items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.ticket-panel__footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
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
  color: var(--text-primary);
}

.ticket-panel__total-valor {
  font-size: 24px;
  font-weight: 800;
  color: var(--q-primary, #025fe0);
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.combo-group {
  border: 1px solid rgba(2, 95, 224, 0.25);
  border-left: 4px solid #025fe0;
  border-radius: 10px;
  background: var(--bg-main);
  overflow: clip;
}

.combo-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(2, 95, 224, 0.08);
  color: #025fe0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.combo-group__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.combo-group__nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.combo-group__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.combo-group__precio {
  font-size: 12px;
  font-weight: 800;
  color: #025fe0;
}

.combo-group__split-btn {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(2, 95, 224, 0.3);
  background: rgba(2, 95, 224, 0.12);
}

.combo-group__qty {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  border-radius: 6px;
  padding: 1px 4px;
  flex-shrink: 0;
}

.combo-group__qty-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 16px;
  text-align: center;
}

.combo-group__items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}

.combo-group__items .ticket-item {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: none;
}
</style>
