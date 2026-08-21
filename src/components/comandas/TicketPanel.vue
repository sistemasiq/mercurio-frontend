<template>
  <div class="ticket-panel">
    <div class="ticket-panel__header">
      <div>
        <h2 class="ticket-panel__titulo">Pedido Actual</h2>
        <p class="ticket-panel__sub">Mostrador • Para llevar</p>
      </div>
      <q-btn
        icon="close"
        round
        unelevated
        class="close-styled-btn"
        aria-label="Cerrar pedido"
        @click="$emit('cancelar')"
      />
    </div>

    <div class="ticket-panel__cliente">
      <q-input
        v-model="nombreClienteLocal"
        placeholder="Nombre para la orden"
        dense
        outlined
        class="q-mt-sm q-mb-md"
        counter
        maxlength="150"
        @update:model-value="actualizarNombreCliente"
      >
        <template #prepend>
          <q-icon name="person_outline" color="primary" />
        </template>
        <template #append>
          <q-icon
            v-if="nombreClienteLocal"
            name="check_circle"
            color="positive"
            class="cursor-pointer"
            @click="limpiarNombre"
          />
        </template>
      </q-input>
      <div class="text-caption text-grey-7 q-mt-xs">
        Nombre para identificar el pedido al entregarlo
      </div>
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
import { computed, ref } from 'vue'
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
  nombreCliente: string
}>()

const emit = defineEmits<{
  (e: 'cancelar'): void
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
  (e: 'split-combo', item: ItemTicket): void
  (e: 'pagar'): void
  (e: 'actualizar-nombre', nombre: string): void
}>()

const nombreClienteLocal = ref(props.nombreCliente)

function actualizarNombreCliente(val: string | number | null) {
  const strVal = val ?? ''
  nombreClienteLocal.value = String(strVal)
  emit('actualizar-nombre', String(strVal))
}

function limpiarNombre() {
  nombreClienteLocal.value = ''
  emit('actualizar-nombre', '')
}

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

<style>
.ticket-panel {
  width: 340px;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.04);
}

.ticket-panel__header {
  padding: 18px 18px 14px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-panel__titulo {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.ticket-panel__sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 4px 0 0 0;
}

.ticket-panel__items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 14px 20px;
  box-sizing: border-box;
  background: #f8fafc;
}

.ticket-panel .hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.ticket-panel .hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.ticket-panel__footer {
  padding: 14px 18px 16px;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.ticket-panel__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ticket-panel__total-label {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.ticket-panel__total-valor {
  font-size: 22px;
  font-weight: 800;
  color: #025fe0;
}

.ticket-panel .close-styled-btn {
  background: transparent;
  color: #025fe0;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}
.ticket-panel .close-styled-btn:hover {
  background: #025fe0;
  color: #ffffff;
}

.ticket-panel__cliente {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.ticket-panel__cliente .q-input {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.ticket-panel__cliente .q-field__prepend {
  color: #025fe0 !important;
}

.ticket-panel__cliente .q-field__append {
  color: #059669 !important;
}

.ticket-panel__cliente .q-field__counter {
  color: #64748b !important;
}

.ticket-panel__cliente .q-field__counter::before {
  content: '';
}

.ticket-panel__cliente .q-field__counter::after {
  content: ' / 150';
}

.ticket-panel .combo-group {
  border: 1px solid rgba(2, 95, 224, 0.2);
  border-left: 4px solid #025fe0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 8px;
}

.ticket-panel .combo-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(2, 95, 224, 0.06);
  color: #025fe0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ticket-panel .combo-group__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.ticket-panel .combo-group__nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-panel .combo-group__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ticket-panel .combo-group__precio {
  font-size: 13px;
  font-weight: 800;
  color: #025fe0;
}

.ticket-panel .combo-group__split-btn {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 6px;
}

.ticket-panel .combo-group__qty {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1px 4px;
  flex-shrink: 0;
}

.ticket-panel .combo-group__qty-val {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  min-width: 18px;
  text-align: center;
}

.ticket-panel .combo-group__items {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 8px 8px;
  background: #f8fafc;
}
.ticket-panel .combo-group__items .ticket-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: none;
  border-radius: 8px;
  box-shadow: none;
  margin-bottom: 0;
}
</style>
