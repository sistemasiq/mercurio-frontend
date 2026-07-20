<template>
  <article class="kds-card" :class="cardClass">
    <div class="kds-card-header" :class="headerClass">
      <div>
        <span class="kds-status-label" :class="statusLabelClass">
          {{ estadoLabel(comanda.estado_actual) }}
        </span>
        <h3 class="kds-ticket-number">#{{ comanda.ticket_numero ?? comanda.id }}</h3>
      </div>
      <div class="kds-time-container">
        <div class="kds-time" :class="esEnProceso ? 'text-alerta' : 'text-normal'">
          <q-icon name="schedule" size="28px" />
          <span>{{ tiempoDesde(comanda.fecha_hora) }}</span>
        </div>
        <span class="kds-order-type">{{ tipoEntrega }}</span>
      </div>
    </div>

    <div class="kds-card-body">
      <div v-for="item in detallesConsumibles" :key="item.id" class="kds-item">
        <div class="kds-qty">{{ item.cantidad }}</div>
        <div class="kds-item-details">
          <p class="kds-item-name">{{ item.producto_nombre ?? '—' }}</p>
          <p class="kds-item-price">
            ${{ Number(item.precio_unitario * item.cantidad).toFixed(2) }}
          </p>
          <ul v-if="item.productos_combo?.length" class="kds-combo-lista">
            <li v-for="comboItem in item.productos_combo" :key="comboItem.producto_id">
              {{ comboItem.cantidad }}x {{ comboItem.nombre }}
            </li>
          </ul>
          <p v-if="item.notas_especiales" class="kds-item-warning">
            <q-icon name="warning" size="18px" />
            {{ item.notas_especiales }}
          </p>
        </div>
      </div>
    </div>

    <div class="kds-card-footer">
      <button
        v-if="esPendiente"
        class="kds-btn btn-pendiente"
        @click="emit('cambiar-estado', comanda.id, 'E')"
      >
        <q-icon name="play_arrow" size="24px" /> Comenzar Preparación
      </button>
      <button
        v-else-if="esEnProceso"
        class="kds-btn btn-accion"
        @click="emit('cambiar-estado', comanda.id, 'L')"
      >
        <q-icon name="check_circle" size="24px" /> Listo para Entregar
      </button>
      <button
        v-else-if="esListo"
        class="kds-btn btn-entregar"
        @click="emit('cambiar-estado', comanda.id, 'T')"
      >
        <q-icon name="done_all" size="24px" /> Entregar Pedido
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Comanda, EstadoActualComanda } from '@/types/comanda'
import type { TipoProducto } from '@/types/producto'

const TIPOS_NO_CONSUMIBLES: TipoProducto[] = ['S', 'E']

const props = defineProps<{ comanda: Comanda }>()
const emit = defineEmits<{
  (e: 'cambiar-estado', comandaId: string, nuevoEstado: EstadoActualComanda): void
}>()

const estadoLabel = (estado: EstadoActualComanda): string => {
  const labels: Record<EstadoActualComanda, string> = {
    P: 'PENDIENTE',
    E: 'EN PREPARACIÓN',
    L: 'LISTO PARA ENTREGA',
    T: 'ENTREGADO',
  }
  return labels[estado] ?? estado
}

// Si la fecha no está disponible o la orden acaba de entrar, muestra '--'
// para no generar presión visual prematura.
const tiempoDesde = (fechaISO: string | null | undefined): string => {
  if (!fechaISO) return '--'
  const diff = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000)
  if (diff < 1) return '--'
  return diff === 1 ? '1 min' : `${diff} min`
}

const detallesConsumibles = computed(() =>
  (props.comanda.detalles ?? []).filter(
    (d) => !d.producto_tipo || !TIPOS_NO_CONSUMIBLES.includes(d.producto_tipo as TipoProducto),
  ),
)

const esPendiente = computed(() => props.comanda.estado_actual === 'P')
const esEnProceso = computed(() => props.comanda.estado_actual === 'E')
const esListo = computed(() => props.comanda.estado_actual === 'L')

const cardClass = computed(() => ({
  'card-proceso': esEnProceso.value,
  'card-pendiente': esPendiente.value,
  'card-listo': esListo.value,
}))

const headerClass = computed(() => ({
  'header-bg-proceso': esEnProceso.value,
  'header-bg-pendiente': esPendiente.value,
  'header-bg-listo': esListo.value,
}))

const statusLabelClass = computed(() => ({
  'text-proceso': esEnProceso.value,
  'text-pendiente': esPendiente.value,
  'text-listo': esListo.value,
}))

const tipoEntrega = computed(() => props.comanda.mesa ?? 'MOSTRADOR')
</script>

<style lang="scss" scoped>
.kds-card {
  background-color: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
.card-proceso {
  border-left: 12px solid #fd8b00;
}
.card-pendiente {
  border-left: 12px solid #c1c6d7;
  opacity: 0.9;
}
.card-listo {
  border-left: 12px solid #006a35;
}

.kds-card-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e1e3e4;
}
.header-bg-proceso {
  background-color: rgba(255, 220, 195, 0.3);
}
.header-bg-pendiente {
  background-color: #f3f4f5;
}
.header-bg-listo {
  background-color: rgba(107, 254, 156, 0.15);
}

.kds-status-label {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}
.text-proceso {
  color: #904d00;
}
.text-pendiente {
  color: #414754;
}
.text-listo {
  color: #006a35;
}

.kds-ticket-number {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 32px;
  font-weight: 700;
  margin: 4px 0 0 0;
}

.kds-time-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.kds-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 600;
}
.text-alerta {
  color: #ba1a1a;
}
.text-normal {
  color: #191c1d;
}

.kds-order-type {
  font-size: 14px;
  font-weight: 500;
  color: #414754;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kds-card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}
.kds-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  align-items: flex-start;
}
.kds-qty {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #e1e3e4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
}
.kds-item-details {
  flex: 1;
}
.kds-item-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.kds-item-price {
  font-size: 14px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.kds-combo-lista {
  list-style: none;
  margin: 6px 0 0 0;
  padding: 0 0 0 12px;
  border-left: 2px solid #e1e3e4;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kds-combo-lista li {
  font-size: 15px;
  color: #414754;
  font-weight: 500;
}
.kds-item-warning {
  font-size: 16px;
  color: #ba1a1a;
  background-color: rgba(255, 218, 214, 0.5);
  padding: 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0 0;
}

.kds-card-footer {
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #e1e3e4;
  margin-top: auto;
}
.kds-btn {
  width: 100%;
  min-height: 64px;
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}
.btn-accion {
  background-color: #0059bb;
  color: #fff;
}
.btn-accion:hover {
  background-color: #0070ea;
}
.btn-pendiente {
  background-color: #edeeef;
  color: #191c1d;
  border: 2px solid #c1c6d7;
}
.btn-pendiente:hover {
  background-color: #e1e3e4;
}
.btn-entregar {
  background-color: #006a35;
  color: #fff;
}
.btn-entregar:hover {
  background-color: #008645;
}
</style>
