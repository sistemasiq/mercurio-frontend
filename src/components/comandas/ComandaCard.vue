<template>
  <article class="kds-card" :class="{ 'kds-card--late': retrasada }">
    <header
      class="kds-card__head"
      role="button"
      tabindex="0"
      aria-label="Ver detalle de la comanda"
      @click="onVerDetalle"
      @keydown.enter.prevent="onVerDetalle"
      @keydown.space.prevent="onVerDetalle"
    >
      <span class="kds-card__folio">#{{ comanda.ticket_numero ?? comanda.id }}</span>
      <span class="kds-card__dest">{{ tipoEntrega }}</span>
      <span class="kds-card__time" :class="{ 'kds-card__time--late': retrasada }">
        {{ etiquetaTiempo }}
      </span>
    </header>

    <div
      class="kds-card__body"
      role="button"
      tabindex="0"
      aria-label="Ver detalle de la comanda"
      @click="onVerDetalle"
      @keydown.enter.prevent="onVerDetalle"
      @keydown.space.prevent="onVerDetalle"
    >
      <template v-for="el in ticketsAgrupados" :key="el.key">
        <div v-if="el.tipo === 'combo'" class="kds-combo">
          <span class="kds-combo__name">{{ el.nombre }}</span>
          <div v-for="hijo in el.items" :key="hijo.id" class="kds-item kds-item--child">
            <span class="kds-item__line">
              <b class="kds-item__qty">{{ hijo.cantidad }}×</b> {{ hijo.nombre }}
            </span>
            <span v-if="hijo.notas_especiales" class="kds-item__note">
              {{ hijo.notas_especiales }}
            </span>
          </div>
        </div>
        <div v-else class="kds-item">
          <span class="kds-item__line">
            <b class="kds-item__qty">{{ el.item.cantidad }}×</b> {{ el.item.nombre }}
          </span>
          <span v-if="el.item.notas_especiales" class="kds-item__note">
            {{ el.item.notas_especiales }}
          </span>
        </div>
      </template>
    </div>

    <footer class="kds-card__foot" @click.stop>
      <button
        v-if="esPendiente"
        type="button"
        class="kds-btn kds-btn--start"
        @click="emit('cambiar-estado', comanda.id, 'E')"
      >
        Iniciar
      </button>
      <button
        v-else-if="esEnProceso"
        type="button"
        class="kds-btn kds-btn--ready"
        @click="emit('cambiar-estado', comanda.id, 'L')"
      >
        Marcar lista
      </button>
      <button
        v-else-if="esListo"
        type="button"
        class="kds-btn kds-btn--deliver"
        :disabled="isDelivering"
        @click="onEntregar"
      >
        Entregada
      </button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Comanda, DetalleComanda, EstadoActualComanda } from '@/types/comanda'

const { comanda } = defineProps<{ comanda: Comanda }>()
const emit = defineEmits<{
  (e: 'cambiar-estado', comandaId: string, nuevoEstado: EstadoActualComanda): void
  (e: 'ver-detalle', comanda: Comanda): void
}>()

const isDelivering = ref(false)

const onVerDetalle = () => {
  emit('ver-detalle', comanda)
}

const onEntregar = () => {
  isDelivering.value = true
  emit('cambiar-estado', comanda.id, 'T')
}

interface ComboGroup {
  tipo: 'combo'
  key: string
  nombre: string
  items: DetalleComanda[]
}

interface Suelto {
  tipo: 'suelto'
  key: string
  item: DetalleComanda
}

type ElementoRender = ComboGroup | Suelto

const ticketsAgrupados = computed<ElementoRender[]>(() => {
  const detalles = comanda.detalles ?? []

  const comboGroups = new Map<string, DetalleComanda[]>()
  for (const d of detalles) {
    // Un ítem solo se agrupa como parte de un combo cuando la orden lo trajo
    // así (es_hijo_de + nombre_combo_padre). Los productos vendidos sueltos
    // jamás deben heredar la etiqueta de un paquete. Cada unidad de combo se
    // agrupa por id_combo_padre para separar combos múltiples en tarjetas
    // independientes; sin instancia (datos legacy) se fusionan por nombre.
    if (d.nombre_combo_padre && d.es_hijo_de) {
      const key = d.id_combo_padre ?? d.nombre_combo_padre
      const arr = comboGroups.get(key)
      if (arr) arr.push(d)
      else comboGroups.set(key, [d])
    }
  }

  const resultado: ElementoRender[] = []
  const emittedCombos = new Set<string>()

  for (const detalle of detalles) {
    if (detalle.nombre_combo_padre && detalle.es_hijo_de) {
      const key = detalle.id_combo_padre ?? detalle.nombre_combo_padre
      if (!emittedCombos.has(key)) {
        emittedCombos.add(key)
        resultado.push({
          tipo: 'combo',
          key: `combo-${key}`,
          nombre: detalle.nombre_combo_padre,
          items: comboGroups.get(key)!,
        })
      }
    } else {
      resultado.push({ tipo: 'suelto', key: `suelto-${detalle.id}`, item: detalle })
    }
  }

  return resultado
})

const esPendiente = computed(() => comanda.estado_actual === 'P')
const esEnProceso = computed(() => comanda.estado_actual === 'E')
const esListo = computed(() => comanda.estado_actual === 'L')

const tipoEntrega = computed(() =>
  comanda.mesa ? `Mesa ${comanda.mesa}` : (comanda.nombre_cliente ?? 'Mostrador'),
)

// Minutos desde que entró la orden (o desde que quedó lista).
const UMBRAL_RETRASO_MIN = 10
const minutos = computed(() => {
  const ref = esListo.value ? (comanda.updated_at ?? comanda.fecha_hora) : comanda.fecha_hora
  if (!ref) return null
  return Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / 60000))
})
const retrasada = computed(
  () => !esListo.value && minutos.value !== null && minutos.value >= UMBRAL_RETRASO_MIN,
)
const etiquetaTiempo = computed(() => {
  if (minutos.value === null) return '--'
  return esListo.value ? `lista ${minutos.value} min` : `${minutos.value} min`
})
</script>

<style scoped lang="scss">
.kds-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  &--late {
    border-color: #f5c2c2;
  }

  &__head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--border-soft);
    cursor: pointer;
  }

  &__folio {
    font-size: 17px;
    font-weight: 800;
    color: var(--text-strong);
    font-variant-numeric: tabular-nums;
  }

  &__dest {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--bg-muted);
    font-size: 12px;
    font-weight: 800;
    color: var(--text-body);
    white-space: nowrap;

    &--late {
      background: var(--tone-bad-bg);
      color: var(--tone-bad-fg);
    }
  }

  &__body {
    padding: 12px 16px 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
  }

  &__foot {
    padding: 8px 16px 16px;
  }
}

.kds-combo {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__name {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
}

.kds-item {
  display: flex;
  flex-direction: column;

  &--child {
    padding-left: 10px;
  }

  &__line {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__qty {
    color: var(--q-primary);
    font-weight: 800;
  }

  &__note {
    font-size: 12.5px;
    font-weight: 700;
    color: #c2410c;
  }
}

.kds-btn {
  width: 100%;
  height: 40px;
  border: 0;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;

  &--start {
    background: var(--q-primary);
    color: #fff;
  }

  &--ready {
    background: var(--q-positive);
    color: #fff;
  }

  &--deliver {
    background: var(--tone-info-bg);
    color: var(--q-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }
}
</style>
