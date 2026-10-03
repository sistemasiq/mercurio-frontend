<template>
  <q-page class="page-content cal">
    <header class="cal__head">
      <h1 class="cal__title">{{ periodTitle }}</h1>
      <q-btn
        outline
        round
        dense
        icon="chevron_left"
        class="cal__nav"
        aria-label="Periodo anterior"
        @click="irAnterior"
      />
      <q-btn outline label="Hoy" class="cal__today" @click="irAHoy" />
      <q-btn
        outline
        round
        dense
        icon="chevron_right"
        class="cal__nav"
        aria-label="Periodo siguiente"
        @click="irSiguiente"
      />
      <q-btn-toggle
        v-model="vista"
        class="cal__vista"
        no-caps
        dense
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
          { label: 'Mes', value: 'mes' },
          { label: 'Semana', value: 'semana' },
          { label: 'Día', value: 'dia' },
        ]"
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

    <div v-if="vista === 'mes'" class="cal__body">
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

    <div v-else-if="vista === 'semana'" class="cal__body cal__body--horario">
      <section class="week">
        <div v-if="store.loading" class="week__loading">
          <q-spinner size="36px" color="primary" />
        </div>
        <template v-else>
          <div class="week__header">
            <span class="week__hour-label"></span>
            <span
              v-for="dia in semanaDias"
              :key="dia"
              class="week__day-label"
              :class="{ 'week__day-label--today': dia === isoDate(today) }"
            >
              {{ diaCorto(dia) }}
            </span>
          </div>
          <div class="week__grid">
            <template v-for="hora in horasOperacion" :key="hora">
              <span class="week__hour">{{ hora }}</span>
              <div
                v-for="dia in semanaDias"
                :key="`${dia}-${hora}`"
                class="week__cell"
                :class="{ 'week__cell--today': dia === isoDate(today) }"
              >
                <router-link
                  v-for="ev in eventosEnHora(dia, hora)"
                  :key="ev.id"
                  :to="{ name: 'eventos-reservaciones-cierre', params: { id: ev.id } }"
                  class="week__event"
                  :class="{ 'week__event--due': ev.pendiente }"
                >
                  {{ ev.hora_inicio.slice(0, 5) }} {{ ev.corto }}
                </router-link>
              </div>
            </template>
          </div>
        </template>
      </section>
    </div>

    <div v-else class="cal__body cal__body--horario">
      <section class="day-timeline">
        <div v-if="store.loading" class="week__loading">
          <q-spinner size="36px" color="primary" />
        </div>
        <template v-else>
          <div v-for="hora in horasOperacion" :key="hora" class="day-timeline__row">
            <span class="day-timeline__hour">{{ hora }}</span>
            <div class="day-timeline__slot">
              <router-link
                v-for="ev in eventosEnHora(selectedDate ?? isoDate(today), hora)"
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
            </div>
          </div>
        </template>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { usePaquetesStore } from '@/stores/paquetes'
import { branchService } from '@/services/branchService'
import { estadoLabelReservacion } from '@/utils/estadoReservacion'

const store = useReservacionesStore()
const authStore = useAuthStore()
const paquetesStore = usePaquetesStore()
const turno = useTurnoCajaStore()
const router = useRouter()

// ── Vista: Mes / Semana / Día (C2) ───────────────────────────────────────────

type Vista = 'mes' | 'semana' | 'dia'
const vista = ref<Vista>('mes')

// Horario de operación de la sucursal (B9), para los bloques por hora de las
// vistas Semana y Día.
const sucursalHorario = ref<{ horaApertura: string; horaCierre: string } | null>(null)

async function cargarHorarioSucursal() {
  if (!authStore.currentBranchId) {
    sucursalHorario.value = null
    return
  }
  try {
    const branch = await branchService.getBranch(authStore.currentBranchId)
    sucursalHorario.value = { horaApertura: branch.horaApertura, horaCierre: branch.horaCierre }
  } catch {
    sucursalHorario.value = null
  }
}

onMounted(() => {
  if (!authStore.currentBranchId) return
  selectedDate.value = isoDate(today)
  if (!paquetesStore.paquetes.length) paquetesStore.cargar(authStore.currentBranchId)
  void cargarHorarioSucursal()
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

const parseIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? today.getFullYear(), (m ?? 1) - 1, d ?? 1)
}

const addDays = (iso: string, delta: number): string => {
  const d = parseIso(iso)
  d.setDate(d.getDate() + delta)
  return isoDate(d)
}

const diaCorto = (iso: string): string => {
  const label = parseIso(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ── Navegación Semana / Día ──────────────────────────────────────────────────

const irAnterior = () => {
  if (vista.value === 'mes') {
    prevMonth()
    return
  }
  const delta = vista.value === 'semana' ? -7 : -1
  selectedDate.value = addDays(selectedDate.value ?? isoDate(today), delta)
}
const irSiguiente = () => {
  if (vista.value === 'mes') {
    nextMonth()
    return
  }
  const delta = vista.value === 'semana' ? 7 : 1
  selectedDate.value = addDays(selectedDate.value ?? isoDate(today), delta)
}

// Semana de lunes a domingo que contiene `selectedDate`.
const semanaDias = computed((): string[] => {
  const base = selectedDate.value ?? isoDate(today)
  const d = parseIso(base)
  const dow = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(d)
    dia.setDate(dia.getDate() + i)
    return isoDate(dia)
  })
})

// Bloques por hora según el horario de operación de la sucursal (B9).
const horasOperacion = computed((): string[] => {
  const [hIni] = (sucursalHorario.value?.horaApertura.slice(0, 5) ?? '09:00').split(':')
  const [hFin] = (sucursalHorario.value?.horaCierre.slice(0, 5) ?? '21:00').split(':')
  const inicio = Number(hIni)
  const fin = Number(hFin)
  const horas: string[] = []
  for (let h = inicio; h < fin; h++) horas.push(`${String(h).padStart(2, '0')}:00`)
  return horas.length ? horas : ['09:00']
})

const periodTitle = computed(() => {
  if (vista.value === 'mes') return monthTitle.value
  if (vista.value === 'dia') return selectedTitulo.value
  const dias = semanaDias.value
  const inicio = parseIso(dias[0] ?? isoDate(today))
  const fin = parseIso(dias[6] ?? isoDate(today))
  const mismosMes = inicio.getMonth() === fin.getMonth()
  const fmtDia = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric' })
  const fmtMes = (d: Date) => d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const rango = mismosMes
    ? `${fmtDia(inicio)} – ${fmtDia(fin)} de ${fmtMes(fin)}`
    : `${fmtDia(inicio)} de ${fmtMes(inicio)} – ${fmtDia(fin)} de ${fmtMes(fin)}`
  return rango.charAt(0).toUpperCase() + rango.slice(1)
})

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

// Eventos de `fecha` cuya hora_inicio cae dentro del bloque de `hora`
// (HH:00), para las vistas Semana y Día.
function eventosEnHora(fecha: string, hora: string): EvResumen[] {
  const hh = hora.slice(0, 2)
  return eventos.value
    .filter((e) => e.fecha_evento === fecha && e.hora_inicio.slice(0, 2) === hh)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
}

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

// Rango de fechas (desde/hasta) que necesita la vista activa, para no traer
// todo el histórico de la sucursal (B3: GET /reservaciones?desde&hasta).
const rangoFetch = computed((): { desde: string; hasta: string } => {
  const hoyIso = isoDate(today)
  if (vista.value === 'dia') {
    const d = selectedDate.value ?? hoyIso
    return { desde: d, hasta: d }
  }
  if (vista.value === 'semana') {
    const dias = semanaDias.value
    return { desde: dias[0] ?? hoyIso, hasta: dias[dias.length - 1] ?? hoyIso }
  }
  const dias = calendarDays.value
  return { desde: dias[0]?.isoDate ?? hoyIso, hasta: dias[dias.length - 1]?.isoDate ?? hoyIso }
})

watch(
  () => [authStore.currentBranchId, rangoFetch.value.desde, rangoFetch.value.hasta] as const,
  ([branchId, desde, hasta]) => {
    if (!branchId) return
    store.cargar(branchId, desde, hasta)
  },
  { immediate: true },
)

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

.cal__vista {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.cal__body--horario {
  display: block;
}

.week,
.day-timeline {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.week__loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.week__header {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(0, 1fr));
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-soft);
}

.week__hour-label {
  padding: 10px;
}

.week__day-label {
  padding: 10px 6px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  color: var(--text-secondary);

  &--today {
    color: var(--q-primary);
  }
}

.week__grid {
  display: grid;
  grid-template-columns: 64px repeat(7, minmax(0, 1fr));
}

.week__hour {
  padding: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  border-right: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

.week__cell {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border-right: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);

  &--today {
    background: #f2f6fe;
  }
}

.week__event {
  display: block;
  padding: 3px 6px;
  border-radius: 5px;
  background: #eaf1fd;
  color: var(--tone-info-fg);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--due {
    background: #fdeef3;
    color: var(--tone-pink-fg);
  }
}

.day-timeline__row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  border-bottom: 1px solid var(--border-soft);
}

.day-timeline__hour {
  padding: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  border-right: 1px solid var(--border-soft);
}

.day-timeline__slot {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 48px;
}
</style>
