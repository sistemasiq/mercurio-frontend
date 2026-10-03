<template>
  <aside class="ticket-panel" aria-label="Pedido actual">
    <header class="ticket-panel__head">
      <h2 class="ticket-panel__title">Pedido actual</h2>
      <button type="button" class="ticket-panel__cancel" @click="$emit('cancelar')">
        Cancelar
      </button>
    </header>

    <div class="ticket-panel__client">
      <q-input
        v-model="nombreClienteLocal"
        placeholder="Nombre para la orden"
        outlined
        dense
        maxlength="150"
        aria-label="Nombre para identificar el pedido al entregarlo"
        @update:model-value="actualizarNombreCliente"
      >
        <template #prepend>
          <q-icon name="person" size="20px" />
        </template>
        <template #append>
          <q-icon
            v-if="nombreClienteLocal"
            name="close"
            size="18px"
            class="cursor-pointer"
            role="button"
            aria-label="Borrar nombre"
            @click="limpiarNombre"
          />
        </template>
      </q-input>
      <q-input
        v-model="mesaLocal"
        placeholder="Mesa (opcional)"
        outlined
        dense
        maxlength="20"
        aria-label="Mesa del pedido"
        @update:model-value="actualizarMesa"
      >
        <template #prepend>
          <q-icon name="table_restaurant" size="20px" />
        </template>
        <template #append>
          <q-icon
            v-if="mesaLocal"
            name="close"
            size="18px"
            class="cursor-pointer"
            role="button"
            aria-label="Borrar mesa"
            @click="limpiarMesa"
          />
        </template>
      </q-input>
    </div>

    <div class="ticket-panel__items">
      <div v-if="!itemsAgrupados.length" class="ticket-panel__empty">
        <q-icon name="touch_app" size="26px" />
        <span>Toca un producto para agregarlo al pedido.</span>
      </div>
      <template v-for="el in itemsAgrupados" :key="el.key">
        <div v-if="el.tipo === 'combo'" class="combo-group">
          <div class="combo-group__head">
            <div class="combo-group__info">
              <span class="combo-group__nombre">{{ el.nombre }}</span>
              <button
                v-if="el.parent.cantidad > 1"
                type="button"
                class="combo-group__split"
                @click="$emit('split-combo', el.parent)"
              >
                <q-icon name="call_split" size="15px" />Dividir para personalizar
              </button>
            </div>
            <div class="qty-stepper">
              <button
                type="button"
                aria-label="Quitar uno"
                @click="$emit('cambiar-cantidad', el.parent, -1)"
              >
                <q-icon name="remove" size="16px" />
              </button>
              <span>{{ el.parent.cantidad }}</span>
              <button
                type="button"
                aria-label="Agregar uno"
                @click="$emit('cambiar-cantidad', el.parent, 1)"
              >
                <q-icon name="add" size="16px" />
              </button>
            </div>
            <span class="combo-group__precio">${{ precioLinea(el.parent).toFixed(2) }}</span>
          </div>
          <TicketItem
            v-for="hijo in el.items"
            :key="hijo.id"
            :item="hijo"
            @editar-notas="(it) => $emit('editar-notas', it)"
          />
        </div>
        <TicketItem
          v-else
          :key="el.item.id"
          :item="el.item"
          @cambiar-cantidad="(it, delta) => $emit('cambiar-cantidad', it, delta)"
          @editar-notas="(it) => $emit('editar-notas', it)"
        />
      </template>
    </div>

    <footer class="ticket-panel__foot">
      <div class="ticket-panel__total">
        <span>Total</span>
        <span class="ticket-panel__total-value">${{ total.toFixed(2) }}</span>
      </div>
      <q-btn
        unelevated
        color="primary"
        class="ticket-panel__pay"
        :loading="enviando"
        :disable="!itemsAgrupados.length"
        :label="`Cobrar $${total.toFixed(2)}`"
        @click="$emit('pagar')"
      />
    </footer>
  </aside>
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
  mesa?: string
}>()

const emit = defineEmits<{
  (e: 'cancelar'): void
  (e: 'cambiar-cantidad', item: ItemTicket, delta: number): void
  (e: 'editar-notas', item: ItemTicket): void
  (e: 'split-combo', item: ItemTicket): void
  (e: 'pagar'): void
  (e: 'actualizar-nombre', nombre: string): void
  (e: 'actualizar-mesa', mesa: string): void
}>()

const nombreClienteLocal = ref(props.nombreCliente)
const mesaLocal = ref(props.mesa ?? '')

function actualizarNombreCliente(val: string | number | null) {
  const strVal = val ?? ''
  nombreClienteLocal.value = String(strVal)
  emit('actualizar-nombre', String(strVal))
}

function limpiarNombre() {
  nombreClienteLocal.value = ''
  emit('actualizar-nombre', '')
}

function actualizarMesa(val: string | number | null) {
  const strVal = val ?? ''
  mesaLocal.value = String(strVal)
  emit('actualizar-mesa', String(strVal))
}

function limpiarMesa() {
  mesaLocal.value = ''
  emit('actualizar-mesa', '')
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

<style lang="scss">
.ticket-panel {
  width: 380px;
  min-width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border-left: 1px solid var(--border-color);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 12px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__cancel {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--tone-bad-dot);
    cursor: pointer;
  }

  &__client {
    padding: 0 20px 16px;
    border-bottom: 1px solid var(--border-soft);

    .q-field__control {
      height: 42px;
      min-height: 42px;
    }

    .q-field__marginal {
      height: 42px;
      color: var(--text-secondary);
    }
  }

  &__items {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  &__empty {
    height: 100%;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px;
    text-align: center;
    font-size: 13.5px;
    color: var(--text-secondary);
  }

  &__foot {
    padding: 16px 20px 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__total-value {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__pay {
    min-height: 52px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 800;
  }
}

.combo-group {
  border-bottom: 1px solid #f1f3f7;
  padding-bottom: 6px;

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 20px 6px;
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
    color: var(--text-primary);
  }

  &__split {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--q-primary);
    cursor: pointer;
  }

  &__precio {
    min-width: 72px;
    text-align: right;
    padding-top: 6px;
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }
}
</style>
