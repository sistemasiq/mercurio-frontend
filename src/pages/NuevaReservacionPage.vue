<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="width: 100%; max-width: 1800px; margin: 0 auto;">
      <!-- Page Title -->
      <div class="q-mb-xl text-left q-px-sm">
        <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0 0 8px;">
          Nueva Reservación
        </h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin: 0;">
          Configura los detalles del evento y confirma la disponibilidad.
        </p>
      </div>

      <div class="row q-col-gutter-xl">
        <!-- LEFT COLUMN -->
        <div class="col-12 col-md-8 col-lg-9">
          <q-stepper v-model="step" ref="stepper" color="primary" animated flat class="bg-transparent" style="padding: 0;">
            <!-- STEP 1: Evento y Cliente -->
            <q-step :name="1" title="Datos del Evento" icon="event" :done="step > 1">

          <!-- Datos del Cliente -->
          <div class="form-section">
            <div class="form-section__title">
              <q-icon name="person_outline" color="primary" />
              Datos del Cliente
            </div>

            <div class="row q-gutter-md">
              <div class="col">
                <div class="field-label">NOMBRE COMPLETO</div>
                <q-input
                  v-model="form.nombre"
                  dense
                  outlined
                  placeholder="Ej. Juan Perez"
                />
              </div>
              <div class="col">
                <div class="field-label">TELÉFONO</div>
                <q-input
                  v-model="form.telefono"
                  dense
                  outlined
                  placeholder="+52 000 000 0000"
                />
              </div>
            </div>

            <div class="q-mt-md">
              <div class="field-label">CORREO ELECTRÓNICO</div>
              <q-input
                v-model="form.email"
                dense
                outlined
                placeholder="cliente@ejemplo.com"
                type="email"
              />
            </div>

            <div class="row q-gutter-md q-mt-sm">
              <div class="col-4">
                <div class="field-label">NÚMERO DE NIÑOS</div>
                <q-input
                  v-model.number="form.ninos"
                  dense
                  outlined
                  type="number"
                  min="1"
                />
              </div>
              <div class="col">
                <div class="field-label">TIPO DE EVENTO</div>
                <q-select
                  v-model="form.tipoEvento"
                  dense
                  outlined
                  :options="tiposEvento"
                  emit-value
                  map-options
                />
              </div>
            </div>
          </div>

          <!-- Fecha y Horario -->
          <div class="form-section">
            <div class="form-section__title">
              <q-icon name="event" color="primary" />
              Fecha y Horario
            </div>

            <div class="row q-col-gutter-lg">
              <!-- Booking Calendar - Much wider -->
              <div class="col-12 col-md-7">
                <div class="booking-calendar">
                  <div class="booking-calendar__header">
                    <q-btn flat dense round icon="chevron_left" size="sm" color="grey-7" @click="prevMonth" />
                    <span class="month-title">{{ currentMonthLabel }}</span>
                    <q-btn flat dense round icon="chevron_right" size="sm" color="grey-7" @click="nextMonth" />
                  </div>

                  <div class="booking-calendar__grid">
                    <div v-for="(dow, di) in daysOfWeek" :key="di" class="booking-calendar__dow">{{ dow }}</div>
                    <div
                      v-for="(day, idx) in bookingCalendarDays"
                      :key="idx"
                      class="booking-calendar__day"
                      :class="{
                        'booking-calendar__day--selected': day.day === form.selectedDay && !day.isOtherMonth,
                        'booking-calendar__day--today': day.isToday,
                        'booking-calendar__day--booked': day.isBooked,
                        'booking-calendar__day--other-month': day.isOtherMonth,
                        'booking-calendar__day--disabled': day.isOtherMonth || day.day === '',
                      }"
                      @click="handleDayClick(day)"
                    >
                      {{ day.day }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date & Time Info -->
              <div class="col-12 col-md-5 column q-gutter-md">
                <div>
                  <div class="field-label">FECHA SELECCIONADA</div>
                  <div class="selected-date-display">
                    <q-icon name="event" size="16px" />
                    {{ selectedDateLabel }}
                  </div>
                </div>

                <div>
                  <div class="field-label">HORARIO DEL EVENTO</div>
                  <div class="row q-gutter-sm">
                    <div class="col">
                      <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">HORA DE INICIO</div>
                      <q-input v-model="form.horaInicio" dense outlined type="time" />
                    </div>
                    <div class="col">
                      <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px;">HORA DE FIN</div>
                      <q-input v-model="form.horaFin" dense outlined type="time" />
                    </div>
                  </div>
                </div>

                <div>
                  <div class="field-label">HORA SELECCIONADA</div>
                  <div class="time-slot-display">
                    <q-icon name="access_time" size="16px" />
                    {{ timeSlotLabel }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <q-stepper-navigation class="q-mt-lg">
            <q-btn @click="step = 2" color="primary" label="Continuar a Paquetes" class="q-px-md" unelevated style="border-radius: 8px; font-weight: 600;" no-caps />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP 2: Paquetes y Extras -->
        <q-step :name="2" title="Paquetes y Extras" icon="celebration" :done="step > 2">

          <!-- Selección de Paquetes -->
          <div class="form-section">
            <div class="form-section__title" style="justify-content: space-between;">
              <span>
                <q-icon name="celebration" color="primary" />
                Selección de Paquetes
              </span>
              <div>
                <q-btn flat dense round icon="chevron_left" size="sm" color="grey-7" />
                <q-btn flat dense round icon="chevron_right" size="sm" color="grey-7" />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div
                v-for="pkg in packages"
                :key="pkg.id"
                class="col package-card"
                :class="{ 'package-card--selected': form.selectedPackage === pkg.id }"
                @click="selectPackage(pkg)"
              >
                <div v-if="pkg.recommended" class="package-card__badge">Recomendado</div>
                <div class="package-card__name">{{ pkg.name }}</div>
                <div class="package-card__capacity">Hasta {{ pkg.capacity }} niños</div>
                <div class="package-card__price">{{ pkg.price }}</div>
                <ul class="package-card__features">
                  <li v-for="feat in pkg.features" :key="feat">
                    <q-icon name="check_circle" />
                    {{ feat }}
                  </li>
                </ul>
                <q-btn
                  unelevated
                  :color="form.selectedPackage === pkg.id ? 'primary' : 'white'"
                  :text-color="form.selectedPackage === pkg.id ? 'white' : 'primary'"
                  :outline="form.selectedPackage !== pkg.id"
                  :label="form.selectedPackage === pkg.id ? 'Seleccionado' : 'Seleccionar'"
                  class="full-width"
                  style="border-radius: 8px; font-weight: 700;"
                  no-caps
                />
              </div>
            </div>
          </div>

          <!-- Servicios Externos -->
          <div class="form-section">
            <div class="form-section__title" style="justify-content: space-between;">
              <span>
                <q-icon name="auto_awesome" color="primary" />
                Servicios Externos (payasos, dj, etc)
              </span>
              <div>
                <q-btn flat no-caps dense icon="filter_list" label="filtros" color="grey-7" size="sm" />
                <q-btn flat dense round icon="chevron_left" size="sm" color="grey-7" />
                <q-btn flat dense round icon="chevron_right" size="sm" color="grey-7" />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div
                v-for="svc in externalServices"
                :key="svc.id"
                class="col service-card"
                :class="{ 'service-card--selected': svc.selected }"
              >
                <div class="service-card__img">
                  <span>img</span>
                </div>
                <div class="service-card__body">
                  <div class="service-card__name">{{ svc.name }}</div>
                  <div class="service-card__desc">{{ svc.desc }}</div>
                  <div class="service-card__price">{{ svc.price }}</div>
                  <q-btn
                    :unelevated="svc.selected"
                    :flat="!svc.selected"
                    no-caps
                    :label="svc.selected ? 'Agregado' : 'Seleccionar'"
                    :color="svc.selected ? 'primary' : 'primary'"
                    :text-color="svc.selected ? 'white' : 'primary'"
                    class="full-width q-mt-sm"
                    :style="svc.selected ? 'border-radius: 8px; font-weight: 700;' : 'border: 1px solid #1a237e; border-radius: 8px; font-weight: 600;'"
                    @click="toggleService(svc)"
                  />
                </div>
              </div>
            </div>
          </div>

          <q-stepper-navigation class="q-mt-lg flex items-center">
            <q-btn @click="step = 3" color="primary" label="Continuar a Resumen" class="q-px-md" unelevated style="border-radius: 8px; font-weight: 600;" no-caps />
            <q-btn flat @click="step = 1" color="primary" label="Atrás" class="q-ml-sm" no-caps />
          </q-stepper-navigation>
        </q-step>

        <!-- STEP 3: Confirmación -->
        <q-step :name="3" title="Resumen" icon="check_circle">
          <div class="text-h6 q-mb-md" style="font-weight: 800; color: var(--text-primary);">Revisa y confirma tu reservación</div>
          <p class="text-body2 text-grey-8 q-mb-lg">Verifica el desglose de pago a la derecha y confirma los términos para completar.</p>

          <!-- Terms -->
          <div class="q-pa-md bg-white rounded-borders shadow-1 q-mb-lg" style="border: 1px solid var(--border-color);">
            <q-checkbox
              v-model="form.termsAccepted"
              dense
              class="q-mb-sm"
              style="font-size: 0.85rem; color: var(--text-secondary); align-items: flex-start;"
            >
              <span style="font-size: 0.85rem; line-height: 1.4; color: #546e7a;">
                He revisado los datos del cliente y la disponibilidad de
                fecha con el reglamento de cancelación vigente.
              </span>
            </q-checkbox>
          </div>

          <q-stepper-navigation class="q-mt-lg flex items-center">
            <q-btn
              unelevated
              :color="form.termsAccepted ? 'positive' : 'grey-4'"
              :text-color="form.termsAccepted ? 'white' : 'grey-6'"
              label="Confirmar Reservación"
              icon="check_circle_outline"
              style="border-radius: 8px; font-weight: 700;"
              class="q-px-lg"
              :class="{ 'btn-confirm-ready': form.termsAccepted }"
              no-caps
              :disable="!form.termsAccepted"
            />
            <q-btn flat @click="step = 2" color="primary" label="Atrás" class="q-ml-sm" no-caps />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </div>

    <!-- RIGHT COLUMN — Payment Breakdown -->
        <div class="col-12 col-md-4 col-lg-3">
          <div class="payment-card sticky-payment">
            <div class="payment-card__title">
              <q-icon name="receipt_long" color="primary" />
              Desglose de Pago
            </div>

            <div class="payment-card__row">
              <span>Paquete {{ selectedPackageName }}</span>
              <span class="amount">{{ packagePrice }}</span>
            </div>
            <div class="payment-card__row">
              <span>Servicios Adicionales</span>
              <span class="amount">{{ extraServicesTotal }}</span>
            </div>
            <div class="payment-card__row">
              <span>IVA (16%)</span>
              <span class="amount">{{ ivaAmount }}</span>
            </div>
            <div class="payment-card__row payment-card__row--total">
              <span>Total</span>
              <span class="total-amount">{{ totalAmount }}</span>
            </div>

            <!-- Advance -->
            <div class="payment-card__advance">
              <div class="advance-label">Anticipo Requerido (30%)</div>
              <div class="advance-amount">{{ advanceAmount }}</div>
              <q-linear-progress
                :value="0.3"
                color="primary"
                track-color="blue-1"
                rounded
                style="height: 8px; margin-top: 8px;"
              />
              <div class="advance-note">El resto ({{ remainingAmount }}) se liquida el día del evento</div>
            </div>

            <!-- Payment Method -->
            <div class="field-label q-mt-md q-mb-sm">MÉTODO DE PAGO</div>
            <q-btn
              unelevated
              color="primary"
              label="Pagar"
              icon="payment"
              class="full-width q-mb-md"
              style="border-radius: 10px; font-weight: 700; height: 44px;"
              no-caps
            />

            <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-bottom: 16px;">
              Esperando primer abono...
            </div>

            <!-- Help -->
            <div
              style="
                margin-top: 16px;
                background: #f0f4ff;
                border-radius: 10px;
                padding: 12px;
                font-size: 0.78rem;
                color: #546e7a;
                display: flex;
                align-items: flex-start;
                gap: 8px;
              "
            >
              <q-icon name="support_agent" color="primary" size="20px" style="flex-shrink: 0;" />
              <div>
                <strong>¿Necesitas ayuda?</strong><br />
                Contacta a soporte técnico en Ext. 405
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/**
 * PAGINA: NUEVA RESERVACION
 * 
 * PROPOSITO:
 * Formulario de multi-pasos (stepper) para crear una nueva reservacion.
 * Los usuarios registran clientes y sus eventos paso a paso.
 * 
 * FLUJO DE PASOS:
 * 1. DATOS DEL EVENTO - Datos del cliente, fecha y horario
 * 2. PAQUETES Y EXTRAS - Seleccionar paquete y servicios adicionales
 * 3. RESUMEN - Revisar desglose de pago y confirmar
 * 
 * CARACTERISTICAS PRINCIPALES:
 * - Calendario interactivo para seleccionar fecha
 * - Seleccion de paquetes predefinidos
 * - Servicios externos adicionales (DJ, payasos, etc)
 * - Calculo automatico de desglose de pago
 * - Resumen con anticipo requerido (30%)
 * - Visualizacion de fechas disponibles
 * 
 * FLUJO DE DATOS:
 * Usuario ingresa datos → Selecciona paquete → Agrega servicios → Confirma → Se registra evento
 */

import { ref, computed } from 'vue'

interface Package {
  id: number
  name: string
  capacity: number
  price: string
  priceNum: number
  features: string[]
  recommended?: boolean
}

interface ExternalService {
  id: number
  name: string
  desc: string
  price: string
  priceNum: number
  selected: boolean
}

interface BookingCalendarDay {
  day: number | ''
  isToday: boolean
  isBooked: boolean
  isOtherMonth: boolean
}

// Estado del formulario (datos ingresados por el usuario)
const step = ref(1)

const form = ref({
  nombre: '',
  telefono: '',
  email: '',
  ninos: 20,
  tipoEvento: 'Cumpleaños Infantil',
  selectedDay: 5,
  horaInicio: '15:00',
  horaFin: '18:00',
  selectedPackage: 1,
  termsAccepted: false,
})

// ── Options ──────────────────────────────────────────────────────────────────
const tiposEvento = [
  'Cumpleaños Infantil',
  'Graduación',
  'Boda Civil',
  'Pool Party',
  'XV Años',
  'Corporativo',
]

const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

// ── Calendar ─────────────────────────────────────────────────────────────────
const currentMonth = ref(9) // October (0-based)
const currentYear = ref(2026)

const currentMonthLabel = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${months[currentMonth.value]} ${currentYear.value}`
})

const bookedDays = [3, 7, 10, 15, 21, 22]

const bookingCalendarDays = computed((): BookingCalendarDay[] => {
  const days: BookingCalendarDay[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  // Leading empty slots
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', isToday: false, isBooked: false, isOtherMonth: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      isToday: d === 2 && currentMonth.value === 9,
      isBooked: bookedDays.includes(d),
      isOtherMonth: false,
    })
  }

  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const selectDay = (day: number) => {
  form.value.selectedDay = day
}

const handleDayClick = (day: BookingCalendarDay) => {
  if (!day.isOtherMonth && day.day !== '') {
    selectDay(day.day as number)
  }
}

const selectedDateLabel = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${form.value.selectedDay} de ${months[currentMonth.value]}, ${currentYear.value}`
})

const timeSlotLabel = computed(() => {
  const toTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`
  }
  return `${toTime12(form.value.horaInicio)} – ${toTime12(form.value.horaFin)}`
})

// ── Packages ─────────────────────────────────────────────────────────────────
const packages: Package[] = [
  {
    id: 1,
    name: 'Básico Plus',
    capacity: 20,
    price: '$3,500',
    priceNum: 3500,
    recommended: true,
    features: ['20 Mini Burgers + Papas', 'Refresco ilimitado'],
  },
  {
    id: 2,
    name: 'Estándar',
    capacity: 30,
    price: '$4,800',
    priceNum: 4800,
    features: ['30 Mini Burgers + Papas', 'Refresco ilimitado', 'Hot dogs incluidos'],
  },
  {
    id: 3,
    name: 'Premium',
    capacity: 50,
    price: '$7,200',
    priceNum: 7200,
    features: ['50 Mini Burgers + Papas', 'Refresco ilimitado', 'Refresco ilimitado'],
  },
]

// Selecciona un paquete de comida/servicio
const selectPackage = (pkg: Package) => {
  form.value.selectedPackage = pkg.id
}

// ────────────────────────────────────────────────────────────────
// SERVICIOS EXTERNOS: Opciones adicionales (DJ, payasos, etc)
// ────────────────────────────────────────────────────────────────
const externalServices = ref<ExternalService[]>([
  { id: 1, name: 'Show Infantil',    desc: 'Animacion por 2 horas',  price: '$1,800', priceNum: 1800, selected: false },
  { id: 2, name: 'DJ Profesional',  desc: 'Iluminacion y audio',    price: '$2,500', priceNum: 2500, selected: false },
  { id: 3, name: 'Mesa de Dulces',  desc: 'Personalizado Premium',  price: '$3,200', priceNum: 3200, selected: false },
])

// Alterna la seleccion de un servicio externo
const toggleService = (svc: ExternalService) => {
  svc.selected = !svc.selected
}

// ────────────────────────────────────────────────────────────────
// CALCULOS DE PAGO: Desglose automatico de precios
// ────────────────────────────────────────────────────────────────
const selectedPkg = computed(() => packages.find(p => p.id === form.value.selectedPackage) ?? packages[0])
const selectedPackageName = computed(() => selectedPkg.value?.name ?? '')
const packagePriceNum = computed(() => selectedPkg.value?.priceNum ?? 0)

// Suma los precios de servicios externos seleccionados
const extraServicesNum = computed(() =>
  externalServices.value.filter(s => s.selected).reduce((sum, s) => sum + s.priceNum, 0)
)

// Subtotal (paquete + servicios sin IVA)
const subtotal = computed(() => packagePriceNum.value + extraServicesNum.value)

// Calcula IVA (16%) redondeado
const ivaNum = computed(() => Math.round(subtotal.value * 0.16))

// Total incluyendo IVA
const totalNum = computed(() => subtotal.value + ivaNum.value)

// Anticipo requerido (30% del total) redondeado
const advanceNum = computed(() => Math.round(totalNum.value * 0.3))

// Monto restante a pagar el dia del evento
const remainingNum = computed(() => totalNum.value - advanceNum.value)

// Formatea un numero como moneda mexicana
const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

// Precios formateados como strings para mostrar en la UI
const packagePrice    = computed(() => fmt(packagePriceNum.value))
const extraServicesTotal = computed(() => fmt(extraServicesNum.value))
const ivaAmount       = computed(() => fmt(ivaNum.value))
const totalAmount     = computed(() => fmt(totalNum.value))
const advanceAmount   = computed(() => fmt(advanceNum.value))
const remainingAmount = computed(() => fmt(remainingNum.value))
</script>

<style scoped>
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.sticky-payment {
  position: sticky;
  top: 24px;
}
</style>
