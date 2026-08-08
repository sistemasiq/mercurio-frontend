<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="max-width: 1400px; margin: 0 auto">
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <div>
          <div class="text-h5 text-weight-bold" style="color: var(--text-primary)">Calendario</div>
          <div class="text-body2" style="color: var(--text-secondary)">
            Vista mensual de eventos y reservaciones.
          </div>
        </div>
        <q-space />
        <q-btn
          flat
          no-caps
          label="Hoy"
          color="primary"
          class="q-mr-sm"
          style="border-radius: 8px; font-weight: 600"
          @click="irAHoy"
        />
        <q-btn flat dense round icon="chevron_left" color="grey-7" @click="prevMonth" />
        <span
          class="q-mx-sm"
          style="
            font-size: 1rem;
            font-weight: 700;
            color: var(--text-primary);
            min-width: 160px;
            text-align: center;
            text-transform: capitalize;
          "
        >
          {{ monthLabel }}
        </span>
        <q-btn flat dense round icon="chevron_right" color="grey-7" @click="nextMonth" />
      </div>

      <!-- Stats del mes visible -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6 col-sm-3">
          <div class="cal-stat-card">
            <div class="cal-stat-card__icon cal-stat-card__icon--blue">
              <q-icon name="event" />
            </div>
            <div>
              <div class="cal-stat-card__label">Eventos del mes</div>
              <div class="cal-stat-card__value">{{ store.loading ? '—' : statEventosMes }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="cal-stat-card">
            <div class="cal-stat-card__icon cal-stat-card__icon--green">
              <q-icon name="check_circle_outline" />
            </div>
            <div>
              <div class="cal-stat-card__label">Confirmados</div>
              <div class="cal-stat-card__value">{{ store.loading ? '—' : statConfirmados }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="cal-stat-card">
            <div class="cal-stat-card__icon cal-stat-card__icon--orange">
              <q-icon name="pending_actions" />
            </div>
            <div>
              <div class="cal-stat-card__label">Pendientes</div>
              <div class="cal-stat-card__value">{{ store.loading ? '—' : statPendientes }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-sm-3">
          <div class="cal-stat-card">
            <div class="cal-stat-card__icon cal-stat-card__icon--purple">
              <q-icon name="trending_up" />
            </div>
            <div>
              <div class="cal-stat-card__label">Ingresos del mes</div>
              <div class="cal-stat-card__value">{{ store.loading ? '—' : statIngresos }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <!-- ── Calendario ───────────────────────────────────────── -->
        <div class="col-12 col-md-8 col-lg-9">
          <div class="panel-card" style="overflow: hidden">
            <!-- Días de la semana -->
            <div class="cal-dow-row">
              <div v-for="dow in daysOfWeek" :key="dow" class="cal-dow">{{ dow }}</div>
            </div>

            <!-- Grid de días -->
            <div v-if="store.loading" class="q-pa-xl text-center text-grey">
              <q-spinner size="36px" color="primary" />
            </div>
            <div v-else class="cal-grid">
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="cal-cell"
                :class="{
                  'cal-cell--other-month': day.isOtherMonth,
                  'cal-cell--today': day.isToday,
                  'cal-cell--selected': selectedDate === day.isoDate && !day.isOtherMonth,
                }"
                @click="seleccionar(day)"
              >
                <div class="cal-cell__number">{{ day.day }}</div>

                <!-- Chips de eventos -->
                <div
                  v-for="ev in day.events.slice(0, 2)"
                  :key="ev.id"
                  class="cal-chip"
                  :class="`cal-chip--${ev.estado}`"
                >
                  <span class="cal-chip__text">{{ ev.nombre }}</span>
                </div>
                <div v-if="day.events.length > 2" class="cal-chip cal-chip--more">
                  +{{ day.events.length - 2 }} más
                </div>
              </div>
            </div>

            <!-- Leyenda -->
            <div class="cal-legend">
              <div v-for="item in leyenda" :key="item.value" class="cal-legend__item">
                <span class="cal-legend__dot" :class="`cal-chip--${item.value}`"></span>
                {{ item.label }}
              </div>
            </div>
          </div>
        </div>

        <!-- ── Panel lateral ───────────────────────────────────── -->
        <div class="col-12 col-md-4 col-lg-3">
          <!-- Detalle del día seleccionado -->
          <div class="panel-card q-mb-md">
            <div class="panel-card__header">
              <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.8px">
                <q-icon name="event" size="16px" color="primary" class="q-mr-xs" />
                {{ selectedDateLabel }}
              </h3>
            </div>

            <div v-if="!selectedDate" class="q-pa-md text-caption text-grey text-center q-py-lg">
              Selecciona un día para ver sus eventos
            </div>
            <div
              v-else-if="eventosDelDia.length === 0"
              class="q-pa-md text-caption text-grey text-center q-py-lg"
            >
              Sin eventos este día
            </div>
            <div v-else>
              <div v-for="ev in eventosDelDia" :key="ev.id" class="ev-item">
                <div class="ev-item__dot" :class="`ev-dot--${ev.estado}`"></div>
                <div class="ev-item__body">
                  <div class="ev-item__nombre">{{ ev.nombre }}</div>
                  <div class="ev-item__hora">
                    <q-icon name="schedule" size="12px" />
                    {{ ev.hora_inicio.slice(0, 5) }} – {{ ev.hora_fin.slice(0, 5) }}
                  </div>
                  <div class="ev-item__personas">
                    <q-icon name="people" size="12px" />
                    {{ ev.numero_personas }} personas
                  </div>
                  <q-badge
                    :color="estadoColor(ev.estado)"
                    :label="estadoLabel(ev.estado)"
                    style="font-size: 0.65rem; margin-top: 4px; border-radius: 20px"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Próximos eventos -->
          <div class="panel-card">
            <div class="panel-card__header">
              <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.8px">
                <q-icon name="upcoming" size="16px" color="primary" class="q-mr-xs" />
                Próximos eventos
              </h3>
            </div>
            <div v-if="proximos.length === 0" class="q-pa-md text-caption text-grey text-center">
              Sin eventos próximos
            </div>
            <div v-else>
              <div v-for="ev in proximos" :key="ev.id" class="ev-item">
                <div class="ev-item__date-badge">
                  <div class="ev-date-day">{{ ev.dia }}</div>
                  <div class="ev-date-mes">{{ ev.mes }}</div>
                </div>
                <div class="ev-item__body">
                  <div class="ev-item__nombre">{{ ev.nombre }}</div>
                  <div class="ev-item__hora">
                    <q-icon name="schedule" size="12px" />
                    {{ ev.hora_inicio.slice(0, 5) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAuthStore } from '@/stores/auth'
import { ESTADOS_RESERVACION, estadoColorReservacion, estadoLabelReservacion } from '@/utils/estadoReservacion'

const store = useReservacionesStore()
const authStore = useAuthStore()
onMounted(() => {
  if (!store.reservaciones.length) store.cargar(authStore.currentBranchId ?? undefined)
})

// ── Navegación ────────────────────────────────────────────────────────────────

const today = new Date()
today.setHours(0, 0, 0, 0)

const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref<string | null>(null)

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
      nombre:
        r.nombre_festejado ||
        `${r.nombre_cliente}${r.apellidos_cliente ? ' ' + r.apellidos_cliente : ''}`.trim(),
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

const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const calendarDays = computed((): CalDay[] => {
  const y = curYear.value
  const m = curMonth.value
  const firstWeekday = new Date(y, m, 1).getDay()
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

const proximos = computed(() => {
  const hoy = isoDate(today)
  return store.reservaciones
    .filter((r) => r.activo && r.fecha_evento >= hoy && r.estado !== 'cancelada')
    .sort((a, b) => a.fecha_evento.localeCompare(b.fecha_evento))
    .slice(0, 6)
    .map((r) => {
      const [y, m, d] = r.fecha_evento.split('-').map(Number)
      const fecha = new Date(y, m - 1, d)
      return {
        id: r.id,
        nombre: r.nombre_festejado || `${r.nombre_cliente}`.trim(),
        hora_inicio: r.hora_inicio,
        dia: fecha.getDate(),
        mes: fecha.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''),
      }
    })
})

// ── Stats del mes visible ─────────────────────────────────────────────────────

const reservacionesMes = computed(() =>
  store.reservaciones.filter((r) => {
    const [y, m] = r.fecha_evento.split('-').map(Number)
    return y === curYear.value && m - 1 === curMonth.value && r.activo
  }),
)

const statEventosMes = computed(() => reservacionesMes.value.length)
const statConfirmados = computed(
  () =>
    reservacionesMes.value.filter((r) => r.estado === 'confirmada' || r.estado === 'completada')
      .length,
)
const statPendientes = computed(
  () => reservacionesMes.value.filter((r) => r.estado === 'pendiente').length,
)

const statIngresos = computed(() => {
  const total = reservacionesMes.value.reduce((sum, r) => sum + parseFloat(r.anticipo || '0'), 0)
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`
  if (total >= 1000) return `$${(total / 1000).toFixed(1)}k`
  return `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
})

// ── Helpers de estado ─────────────────────────────────────────────────────────

const leyenda = ESTADOS_RESERVACION
const estadoColor = estadoColorReservacion
const estadoLabel = estadoLabelReservacion
</script>

<style scoped lang="scss">
// ── Tarjetas de stats ─────────────────────────────────────────────────────────

.cal-stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &__icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;

    &--blue {
      background: rgba($primary, 0.1);
      color: $primary;
    }
    &--green {
      background: rgba($positive, 0.12);
      color: $positive;
    }
    &--orange {
      background: rgba($warning, 0.18);
      color: $warning;
    }
    &--purple {
      background: rgba($secondary, 0.1);
      color: $secondary;
    }
  }

  &__label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__value {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
  }
}

// ── Grid del calendario ───────────────────────────────────────────────────────

.cal-dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border-color);
}

.cal-dow {
  padding: 10px 0;
  text-align: center;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(96px, auto);
}

.cal-cell {
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 6px;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 96px;

  &:nth-child(7n) {
    border-right: none;
  }

  &:hover:not(.cal-cell--other-month) {
    background: #f0f4ff;
  }

  &--other-month {
    background: #fafafa;
    cursor: default;
    .cal-cell__number {
      color: #c0cfe0;
    }
  }

  &--today .cal-cell__number {
    background: var(--q-primary);
    color: #fff;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--selected {
    background: #eef2ff !important;
    outline: 2px solid var(--q-primary);
    outline-offset: -2px;
  }
}

.cal-cell__number {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ── Chips de evento ───────────────────────────────────────────────────────────

.cal-chip {
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 0.68rem;
  font-weight: 600;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;

  &__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--pendiente {
    background: rgba($warning, 0.18);
    color: $warning;
  }
  &--confirmada {
    background: rgba($primary, 0.1);
    color: $primary;
  }
  &--en_curso {
    background: rgba($secondary, 0.1);
    color: $secondary;
  }
  &--completada {
    background: rgba($positive, 0.12);
    color: $positive;
  }
  &--cancelada {
    background: #f5f5f5;
    color: #757575;
  }
  &--more {
    background: transparent;
    color: #90a4ae;
    font-style: italic;
  }
}

// ── Leyenda ───────────────────────────────────────────────────────────────────

.cal-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }

  &__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
}

// ── Panel lateral – evento item ───────────────────────────────────────────────

.ev-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.ev-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.ev-dot--pendiente {
  background: $warning;
}
.ev-dot--confirmada {
  background: $primary;
}
.ev-dot--en_curso {
  background: $secondary;
}
.ev-dot--completada {
  background: $positive;
}
.ev-dot--cancelada {
  background: #9e9e9e;
}

.ev-item__body {
  flex: 1;
  min-width: 0;
}

.ev-item__nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-item__hora,
.ev-item__personas {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

// ── Próximos – date badge ─────────────────────────────────────────────────────

.ev-item__date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 38px;
  min-width: 38px;
  height: 38px;
  background: #eef2ff;
  border-radius: 8px;
  color: var(--q-primary);
}

.ev-date-day {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
}

.ev-date-mes {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 1;
}
</style>
