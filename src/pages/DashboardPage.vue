<template>
  <q-page class="page-content">
    <!-- Stats Row -->
    <div class="row q-gutter-md q-mb-md">
      <div class="col">
        <div class="stat-card">
          <div>
            <div class="stat-card__label">Eventos Próximos</div>
            <div class="stat-card__value">{{ store.loading ? '—' : eventosPróximos }}</div>
          </div>
          <div class="stat-card__icon stat-card__icon--blue">
            <q-icon name="event" />
          </div>
        </div>
      </div>
      <div class="col">
        <div class="stat-card">
          <div>
            <div class="stat-card__label">Eventos Confirmados</div>
            <div class="stat-card__value text-positive">{{ store.loading ? '—' : eventosConfirmados }}</div>
          </div>
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="check_circle_outline" />
          </div>
        </div>
      </div>
      <div class="col">
        <div class="stat-card">
          <div>
            <div class="stat-card__label">Ingresos del Mes</div>
            <div class="stat-card__value">{{ store.loading ? '—' : ingresosDelMes }}</div>
          </div>
          <div class="stat-card__icon stat-card__icon--orange">
            <q-icon name="trending_up" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Row -->
    <div class="row q-gutter-md">
      <!-- Events Table -->
      <div class="col-12 col-md-8">
        <div class="panel-card">
          <div class="panel-card__header">
            <h3>
              <q-icon name="list_alt" size="18px" color="primary" class="q-mr-xs" />
              Eventos Próximos por Liquidar
            </h3>
            <q-btn
              flat
              dense
              no-caps
              label="Exportar PDF"
              icon="picture_as_pdf"
              color="grey-7"
              style="font-size: 0.8rem;"
            />
          </div>

          <q-table
            :rows="upcomingEvents"
            :columns="columns"
            row-key="id"
            flat
            class="fec-table"
            :loading="store.loading"
            hide-pagination
            :rows-per-page-options="[0]"
            no-data-label="No hay eventos próximos"
          >
            <template #body-cell-nombre="props">
              <q-td :props="props">
                <span class="event-name">{{ props.row.nombre }}</span>
              </q-td>
            </template>
            <template #body-cell-pendiente="props">
              <q-td :props="props">
                <span :class="props.row.pendienteNum === 0 ? 'amount-paid' : 'amount-pending'">
                  {{ props.row.pendiente }}
                </span>
              </q-td>
            </template>
          </q-table>
        </div>
      </div>

      <!-- Right Column -->
      <div class="col">
        <!-- Mini Calendar -->
        <div class="panel-card q-mb-md">
          <div class="panel-card__header">
            <h3>Calendario</h3>
          </div>
          <div class="mini-calendar">
            <div class="mini-calendar__header">
              <q-btn flat dense round icon="chevron_left" size="sm" color="grey-7" @click="prevMonth" />
              <span class="month-label">{{ monthLabel }}</span>
              <q-btn flat dense round icon="chevron_right" size="sm" color="grey-7" @click="nextMonth" />
            </div>

            <div class="mini-calendar__grid">
              <div v-for="(dow, di) in daysOfWeek" :key="di" class="mini-calendar__dow">{{ dow }}</div>
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="mini-calendar__day"
                :class="{
                  'mini-calendar__day--today': day.isToday,
                  'mini-calendar__day--pending': day.isPending,
                  'mini-calendar__day--confirmed': day.isConfirmed,
                  'mini-calendar__day--other-month': day.isOtherMonth,
                }"
              >
                {{ day.day }}
              </div>
            </div>

            <div class="mini-calendar__legend">
              <div>
                <span class="legend-dot legend-dot--pending"></span>
                Pendiente de Pago
              </div>
              <div>
                <span class="legend-dot legend-dot--confirmed"></span>
                Confirmado
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events This Month -->
        <div class="panel-card">
          <div class="panel-card__header">
            <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.8px;">
              Próximos Eventos Este Mes
            </h3>
          </div>
          <div v-if="store.loading" class="q-pa-sm text-grey">Cargando...</div>
          <div v-else-if="upcomingThisMonth.length === 0" class="q-pa-sm text-grey">Sin eventos este mes</div>
          <div v-else>
            <div
              v-for="event in upcomingThisMonth"
              :key="event.id"
              class="event-item"
            >
              <div class="event-item__left">
                <div class="event-item__name">{{ event.nombre }}</div>
                <div class="event-item__time">
                  <q-icon name="access_time" size="12px" />
                  {{ event.horario }}
                </div>
              </div>
              <div class="event-item__badge">{{ event.mesCorto }} {{ event.dia }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import type { QTableColumn } from 'quasar'
import { useReservacionesStore } from '@/stores/reservaciones'

const store = useReservacionesStore()
onMounted(() => store.cargar())

// Fecha actual normalizada a medianoche (hora local)
const today = new Date()
today.setHours(0, 0, 0, 0)

// Estado del calendario (mes visible, navegable)
const calendarCursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const calendarYear = computed(() => calendarCursor.value.getFullYear())
const calendarMonth = computed(() => calendarCursor.value.getMonth())
const monthLabel = computed(() =>
  calendarCursor.value.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
)

function prevMonth() {
  calendarCursor.value = new Date(calendarYear.value, calendarMonth.value - 1, 1)
}
function nextMonth() {
  calendarCursor.value = new Date(calendarYear.value, calendarMonth.value + 1, 1)
}

// Parsea "YYYY-MM-DD" como fecha local para evitar desfase de zona horaria
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatCurrency(value: string | null | undefined): string {
  const num = parseFloat(value ?? '0')
  if (isNaN(num)) return '$0.00'
  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function nombreEvento(r: (typeof store.reservaciones)[0]): string {
  return r.nombre_festejado || `${r.nombre_cliente}${r.apellidos_cliente ? ' ' + r.apellidos_cliente : ''}`.trim()
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const eventosPróximos = computed(() =>
  store.reservaciones.filter(r => parseLocalDate(r.fecha_evento) >= today && r.estado !== 'cancelada').length
)

const eventosConfirmados = computed(() =>
  store.reservaciones.filter(r => r.estado === 'confirmada').length
)

const ingresosDelMes = computed(() => {
  const y = today.getFullYear()
  const m = today.getMonth()
  const total = store.reservaciones
    .filter(r => {
      const d = parseLocalDate(r.fecha_evento)
      return d.getFullYear() === y && d.getMonth() === m
    })
    .reduce((sum, r) => sum + parseFloat(r.anticipo || '0'), 0)
  if (total >= 1000) return `$${(total / 1000).toFixed(1)}k`
  return formatCurrency(String(total))
})

// ── Tabla de eventos próximos ─────────────────────────────────────────────────

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE DEL EVENTO', field: 'nombre', align: 'left' },
  { name: 'fecha', label: 'FECHA', field: 'fecha', align: 'left' },
  { name: 'monto', label: 'MONTO TOTAL', field: 'monto', align: 'left' },
  { name: 'contacto', label: 'NÚMERO DE CONTACTO', field: 'contacto', align: 'left' },
  { name: 'pendiente', label: 'PENDIENTE', field: 'pendiente', align: 'left' },
]

const upcomingEvents = computed(() =>
  store.reservaciones
    .filter(r => parseLocalDate(r.fecha_evento) >= today && r.estado !== 'cancelada')
    .sort((a, b) => parseLocalDate(a.fecha_evento).getTime() - parseLocalDate(b.fecha_evento).getTime())
    .slice(0, 10)
    .map(r => ({
      id: r.id,
      nombre: nombreEvento(r),
      fecha: parseLocalDate(r.fecha_evento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      monto: formatCurrency(r.precio_total),
      contacto: r.telefono_cliente,
      pendiente: formatCurrency(r.saldo_pendiente),
      pendienteNum: parseFloat(r.saldo_pendiente || '0'),
    }))
)

// ── Calendario mini ───────────────────────────────────────────────────────────

interface CalendarDay {
  day: number
  isToday: boolean
  isPending: boolean
  isConfirmed: boolean
  isOtherMonth: boolean
}

const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const calendarDays = computed((): CalendarDay[] => {
  const y = calendarYear.value
  const m = calendarMonth.value
  const firstWeekday = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrevMonth = new Date(y, m, 0).getDate()

  const pendingDays = new Set<number>()
  const confirmedDays = new Set<number>()
  store.reservaciones.forEach(r => {
    const d = parseLocalDate(r.fecha_evento)
    if (d.getFullYear() === y && d.getMonth() === m) {
      const day = d.getDate()
      if (parseFloat(r.saldo_pendiente || '0') > 0) {
        pendingDays.add(day)
      } else {
        confirmedDays.add(day)
      }
    }
  })

  const days: CalendarDay[] = []

  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, isToday: false, isPending: false, isConfirmed: false, isOtherMonth: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(y, m, d)
    days.push({
      day: d,
      isToday: thisDate.getTime() === today.getTime(),
      isPending: pendingDays.has(d),
      isConfirmed: confirmedDays.has(d),
      isOtherMonth: false,
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, isToday: false, isPending: false, isConfirmed: false, isOtherMonth: true })
  }

  return days
})

// ── Próximos eventos este mes ─────────────────────────────────────────────────

const upcomingThisMonth = computed(() => {
  const y = today.getFullYear()
  const m = today.getMonth()
  return store.reservaciones
    .filter(r => {
      const d = parseLocalDate(r.fecha_evento)
      return d.getFullYear() === y && d.getMonth() === m && d >= today && r.estado !== 'cancelada'
    })
    .sort((a, b) => parseLocalDate(a.fecha_evento).getTime() - parseLocalDate(b.fecha_evento).getTime())
    .map(r => {
      const d = parseLocalDate(r.fecha_evento)
      return {
        id: r.id,
        nombre: nombreEvento(r),
        horario: `${r.hora_inicio.slice(0, 5)} – ${r.hora_fin.slice(0, 5)}`,
        mesCorto: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''),
        dia: d.getDate(),
      }
    })
})
</script>
