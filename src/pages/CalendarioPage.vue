<template>
  <q-page class="page-content cal">
    <header class="cal__head">
      <h1 class="cal__title">{{ monthTitle }}</h1>
      <q-btn
        outline
        round
        dense
        icon="chevron_left"
        class="cal__nav"
        aria-label="Mes anterior"
        @click="prevMonth"
      />
      <q-btn outline label="Hoy" class="cal__today" @click="irAHoy" />
      <q-btn
        outline
        round
        dense
        icon="chevron_right"
        class="cal__nav"
        aria-label="Mes siguiente"
        @click="nextMonth"
      />
      <q-btn
        unelevated
        color="primary"
        icon="add"
        label="Nueva Reservación"
        class="cal__new"
        @click="irANuevaReservacion"
      />
    </header>

    <div v-if="!authStore.currentBranchId" class="list-page__note list-page__note--warn">
      <q-icon name="info" size="19px" />No hay una sucursal activa en la sesión.
    </div>

    <div class="cal__body">
      <section class="month">
        <div class="month__dows">
          <span v-for="dow in daysOfWeek" :key="dow">{{ dow }}</span>
        </div>
        <div v-if="store.loading" class="month__loading">
          <q-spinner size="36px" color="primary" />
        </div>
        <div v-else class="month__grid">
          <button
            v-for="(day, idx) in calendarDays"
            :key="idx"
            type="button"
            class="month__cell"
            :class="{
              'month__cell--other': day.isOtherMonth,
              'month__cell--today': day.isToday,
              'month__cell--selected': selectedDate === day.isoDate && !day.isOtherMonth,
            }"
            :disabled="day.isOtherMonth"
            @click="seleccionar(day)"
          >
            <span class="month__num">{{ day.day }}</span>
            <span
              v-for="ev in day.events.slice(0, 3)"
              :key="ev.id"
              class="month__chip"
              :class="{ 'month__chip--due': ev.pendiente || ev.estado === 'pendiente' }"
            >
              {{ ev.hora_inicio.slice(0, 5) }} {{ ev.corto }}
            </span>
            <span v-if="day.events.length > 3" class="month__more">
              +{{ day.events.length - 3 }} más
            </span>
          </button>
        </div>
      </section>

      <aside class="day-panel">
        <h2 class="day-panel__title">{{ selectedTitulo }}</h2>
        <span class="day-panel__meta">
          {{ eventosDelDia.length }} {{ eventosDelDia.length === 1 ? 'evento' : 'eventos' }}
        </span>
        <p v-if="!eventosDelDia.length" class="day-panel__empty">Sin eventos este día.</p>
        <router-link
          v-for="ev in eventosDelDia"
          :key="ev.id"
          :to="{ name: 'eventos-reservaciones-cierre', params: { id: ev.id } }"
          class="day-ev"
          :class="{ 'day-ev--due': ev.pendiente }"
        >
          <span class="day-ev__time"
            >{{ ev.hora_inicio.slice(0, 5) }} – {{ ev.hora_fin.slice(0, 5) }}</span
          >
          <span class="day-ev__name">{{ ev.nombre }}</span>
          <span class="day-ev__meta">
            <template v-if="ev.paquete">{{ ev.paquete }} · </template
            >{{ ev.numero_personas }} invitados
          </span>
          <span class="day-ev__status">
            {{ ev.pendiente ? 'Depósito pendiente' : estadoLabel(ev.estado) }}
          </span>
        </router-link>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { usePaquetesStore } from '@/stores/paquetes'
import { estadoLabelReservacion } from '@/utils/estadoReservacion'

const store = useReservacionesStore()
const authStore = useAuthStore()
const paquetesStore = usePaquetesStore()
const turno = useTurnoCajaStore()
const router = useRouter()
onMounted(() => {
  if (!authStore.currentBranchId) return
  selectedDate.value = isoDate(today)
  store.cargar(authStore.currentBranchId)
  if (!paquetesStore.paquetes.length) paquetesStore.cargar(authStore.currentBranchId)
})

function irANuevaReservacion() {
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  router.push({ name: 'eventos-reservaciones-crear' })
}

// ── Navegación ────────────────────────────────────────────────────────────────

const today = new Date()
today.setHours(0, 0, 0, 0)

const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref<string | null>(null)
// Por defecto el panel lateral muestra hoy.

const curYear = computed(() => cursor.value.getFullYear())
const curMonth = computed(() => cursor.value.getMonth())

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
)

const prevMonth = () => {
  cursor.value = new Date(curYear.value, curMonth.value - 1, 1)
}
const nextMonth = () => {
  cursor.value = new Date(curYear.value, curMonth.value + 1, 1)
}
const irAHoy = () => {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDate.value = isoDate(today)
}

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── Reservaciones mapeadas ────────────────────────────────────────────────────

interface EvResumen {
  id: string
  nombre: string
  corto: string
  paquete: string
  pendiente: boolean
  estado: string
  hora_inicio: string
  hora_fin: string
  numero_personas: number
  fecha_evento: string
}

const eventos = computed((): EvResumen[] =>
  store.reservaciones
    .filter((r) => r.activo)
    .map((r) => ({
      id: r.id,
      nombre: `${r.apellidos_cliente ? `Fam. ${r.apellidos_cliente}` : r.nombre_cliente}${
        r.nombre_festejado
          ? ` · ${r.nombre_festejado}${r.edad_festejado ? ` (${r.edad_festejado})` : ''}`
          : ''
      }`,
      corto: r.apellidos_cliente?.split(' ')[0] || r.nombre_cliente.split(' ')[0] || '',
      paquete: paquetesStore.paquetes.find((p) => p.id === r.paquete_id)?.nombre ?? '',
      pendiente: parseFloat(r.saldo_pendiente || '0') > 0,
      estado: r.estado,
      hora_inicio: r.hora_inicio,
      hora_fin: r.hora_fin,
      numero_personas: r.numero_personas,
      fecha_evento: r.fecha_evento,
    })),
)

// ── Días del calendario ───────────────────────────────────────────────────────

interface CalDay {
  day: number | ''
  isoDate: string
  isToday: boolean
  isOtherMonth: boolean
  events: EvResumen[]
}

const daysOfWeek = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const calendarDays = computed((): CalDay[] => {
  const y = curYear.value
  const m = curMonth.value
  // Semana de lunes a domingo, como en el diseño.
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrev = new Date(y, m, 0).getDate()

  const byDate = new Map<string, EvResumen[]>()
  for (const ev of eventos.value) {
    const list = byDate.get(ev.fecha_evento) ?? []
    list.push(ev)
    byDate.set(ev.fecha_evento, list)
  }

  const days: CalDay[] = []

  // Días del mes anterior
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const prevMonth = m === 0 ? 11 : m - 1
    const prevYear = m === 0 ? y - 1 : y
    days.push({
      day: d,
      isoDate: isoDate(new Date(prevYear, prevMonth, d)),
      isToday: false,
      isOtherMonth: true,
      events: [],
    })
  }

  // Días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d)
    const iso = isoDate(date)
    days.push({
      day: d,
      isoDate: iso,
      isToday: date.getTime() === today.getTime(),
      isOtherMonth: false,
      events: (byDate.get(iso) ?? []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    })
  }

  // Completar hasta 42 celdas
  const next = 42 - days.length
  for (let d = 1; d <= next; d++) {
    const nextMonth = m === 11 ? 0 : m + 1
    const nextYear = m === 11 ? y + 1 : y
    days.push({
      day: d,
      isoDate: isoDate(new Date(nextYear, nextMonth, d)),
      isToday: false,
      isOtherMonth: true,
      events: [],
    })
  }

  return days
})

const seleccionar = (day: CalDay) => {
  if (!day.isOtherMonth) selectedDate.value = day.isoDate
}

// ── Panel lateral ─────────────────────────────────────────────────────────────

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return 'Ningún día seleccionado'
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const eventosDelDia = computed(() =>
  selectedDate.value
    ? eventos.value
        .filter((e) => e.fecha_evento === selectedDate.value)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    : [],
)

const estadoLabel = estadoLabelReservacion

const selectedTitulo = computed(() => {
  const t = selectedDateLabel.value
  return t.charAt(0).toUpperCase() + t.slice(1)
})

const monthTitle = computed(() => {
  const t = monthLabel.value.replace(' de ', ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
})
</script>

<style scoped lang="scss">
.cal {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__title {
    flex: 1;
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }

  &__nav {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  &__today,
  &__new {
    min-height: 40px;
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 18px;
    align-items: stretch;

    @media (max-width: 1100px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

.month {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;

  &__dows {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-soft);

    span {
      padding: 10px 12px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--text-secondary);
    }
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 64px 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  &__cell {
    min-height: 118px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 8px;
    border: 0;
    border-right: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
    background: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:nth-child(7n) {
      border-right: 0;
    }

    &:hover:not(:disabled) {
      background: var(--bg-subtle);
    }

    &--other {
      background: #fafbfd;
      cursor: default;

      .month__num {
        color: var(--text-muted);
      }
    }

    &--selected,
    &--selected:hover:not(:disabled) {
      background: #f2f6fe;
    }

    &--today .month__num {
      background: var(--q-primary);
      color: #fff;
    }
  }

  &__num {
    align-self: flex-start;
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    border-radius: 13px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-strong);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__chip {
    padding: 2px 6px;
    border-radius: 5px;
    background: #eaf1fd;
    color: var(--tone-info-fg);
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--due {
      background: #fdeef3;
      color: var(--tone-pink-fg);
    }
  }

  &__more {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-secondary);
  }
}

.day-panel {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__title {
    margin: 0;
    font-size: 16px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__meta {
    margin-top: -6px;
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__empty {
    margin: 8px 0 0;
    font-size: 13px;
    color: var(--text-secondary);
  }
}

.day-ev {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-left: 3px solid var(--q-primary);
  border-radius: 10px;
  background: #eaf1fd;
  text-decoration: none;

  &--due {
    border-left-color: var(--q-secondary);
    background: #fdeef3;

    .day-ev__status {
      color: var(--tone-warn-fg);
    }
  }

  &__time {
    font-size: 12.5px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__name {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__meta {
    font-size: 12.5px;
    color: var(--text-secondary);
  }

  &__status {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--tone-ok-fg);
  }
}
</style>
