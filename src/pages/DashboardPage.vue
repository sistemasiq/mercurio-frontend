<template>
  <q-page class="page-content">
    <!-- Stats Row -->
    <div class="row q-gutter-md q-mb-md">
      <div class="col">
        <div class="stat-card">
          <div>
            <div class="stat-card__label">Eventos Próximos</div>
            <div class="stat-card__value">24</div>
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
            <div class="stat-card__value text-positive">156</div>
          </div>
          <div class="stat-card__icon stat-card__icon--green">
            <q-icon name="check_circle_outline" />
          </div>
        </div>
      </div>
      <div class="col">
        <div class="stat-card">
          <div>
            <div class="stat-card__label">Ingresos Recientes</div>
            <div class="stat-card__value">$4.2k</div>
            <div class="stat-card__badge">▲ +8%</div>
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
            hide-pagination
            :rows-per-page-options="[0]"
          >
            <template #body-cell-nombre="props">
              <q-td :props="props">
                <span class="event-name">{{ props.row.nombre }}</span>
              </q-td>
            </template>
            <template #body-cell-pendiente="props">
              <q-td :props="props">
                <span :class="props.row.pendiente === '$0.00' ? 'amount-paid' : 'amount-pending'">
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
              <q-btn flat dense round icon="chevron_left" size="sm" color="grey-7" />
              <span class="month-label">Octubre 2026</span>
              <q-btn flat dense round icon="chevron_right" size="sm" color="grey-7" />
            </div>

            <div class="mini-calendar__grid">
              <div v-for="(dow, di) in daysOfWeek" :key="di" class="mini-calendar__dow">{{ dow }}</div>
              <div
                v-for="day in calendarDays"
                :key="`${day.month}-${day.day}`"
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
          <div>
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
              <div class="event-item__badge">Oct {{ event.dia }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </q-page>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar'

interface Evento {
  id: number
  nombre: string
  fecha: string
  monto: string
  contacto: string
  pendiente: string
}

interface EventoMes {
  id: number
  nombre: string
  horario: string
  dia: number
}

interface CalendarDay {
  day: number | ''
  month: number
  isToday: boolean
  isPending: boolean
  isConfirmed: boolean
  isOtherMonth: boolean
}

const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const columns: QTableColumn[] = [
  { name: 'nombre', label: 'NOMBRE DEL EVENTO', field: 'nombre', align: 'left' },
  { name: 'fecha', label: 'FECHA', field: 'fecha', align: 'left' },
  { name: 'monto', label: 'MONTO TOTAL', field: 'monto', align: 'left' },
  { name: 'contacto', label: 'NÚMERO DE CONTACTO', field: 'contacto', align: 'left' },
  { name: 'pendiente', label: 'PENDIENTE', field: 'pendiente', align: 'left' },
]

const upcomingEvents: Evento[] = [
  { id: 1, nombre: 'Graduación Preescolar', fecha: '12 Oct 2026', monto: '$2,500.00', contacto: '55 1234-5678', pendiente: '$1,250.00' },
  { id: 2, nombre: 'Cumpleaños Sofía',      fecha: '15 Oct 2026', monto: '$1,800.00', contacto: '55 8765-4321', pendiente: '$1,300.00' },
  { id: 3, nombre: 'Pool Party - Mateo',    fecha: '10 Oct 2026', monto: '$3,200.00', contacto: '55 1122-3344', pendiente: '$0.00' },
  { id: 4, nombre: 'Boda Civil - Ruiz',     fecha: '20 Oct 2026', monto: '$5,000.00', contacto: '55 9988-7766', pendiente: '$0.00' },
]

// Construye la grilla del calendario para octubre 2026
// Se generan 42 celdas (6 semanas x 7 dias)
const calendarDays: CalendarDay[] = []
const startOffset = 4 // Octubre 2026 comienza en jueves (indice 4)
const prevDays = [28, 29, 30]
prevDays.forEach(d => calendarDays.push({ day: d, month: 9, isToday: false, isPending: false, isConfirmed: false, isOtherMonth: true }))

// Agrega los dias de octubre (1-31)
for (let d = 1; d <= 31; d++) {
  calendarDays.push({
    day: d,
    month: 10,
    isToday: d === 2,
    isPending: [4, 12].includes(d),
    isConfirmed: [10, 11, 12].includes(d),
    isOtherMonth: false,
  })
}

// Completa las celdas restantes con dias de noviembre
const remaining = 42 - calendarDays.length
for (let d = 1; d <= remaining; d++) {
  calendarDays.push({ day: d, month: 11, isToday: false, isPending: false, isConfirmed: false, isOtherMonth: true })
}

// Eventos proximos del mes actual para mostrar en el listado
const upcomingThisMonth: EventoMes[] = [
  { id: 1, nombre: 'Pool Party - Mateo',    horario: '14:00 – 18:00', dia: 10 },
  { id: 2, nombre: 'Graduación Preescolar', horario: '19:00 – 23:00', dia: 12 },
  { id: 3, nombre: 'Boda Civil - Ruiz',     horario: '12:00 – 17:00', dia: 20 },
]
</script>
