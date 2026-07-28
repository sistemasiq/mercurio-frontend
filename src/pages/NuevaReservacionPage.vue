<template>
  <q-page class="page-content q-pa-md q-pa-lg-xl">
    <div style="width: 100%; max-width: 1800px; margin: 0 auto">
      <!-- Page Title -->
      <div class="q-mb-xl text-left q-px-sm">
        <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0 0 8px">
          Nueva Reservación
        </h1>
        <p style="font-size: 1.1rem; color: var(--text-secondary); margin: 0">
          Configura los detalles del evento y confirma la disponibilidad.
        </p>
      </div>

      <div class="row q-col-gutter-xl">
        <!-- LEFT COLUMN -->
        <div class="col-12 col-md-8 col-lg-9">
          <q-stepper
            ref="stepper"
            v-model="step"
            color="primary"
            flat
            class="bg-transparent"
            style="padding: 0"
          >
            <!-- ── STEP 1: Datos del Evento ──────────────────────────────── -->
            <q-step :name="1" title="Datos del Evento" icon="event" :done="step > 1">
              <div class="form-section">
                <div class="form-section__title">
                  <q-icon name="person_outline" color="primary" />
                  Datos del Cliente
                </div>

                <div class="row q-gutter-md">
                  <div class="col">
                    <div class="field-label">NOMBRE COMPLETO</div>
                    <q-input v-model="form.nombre" dense outlined placeholder="Ej. Juan Perez" />
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
                    <q-input v-model.number="form.ninos" dense outlined type="number" min="1" />
                  </div>
                  <div class="col">
                    <div class="field-label">TIPO DE EVENTO</div>
                    <q-select
                      v-model="form.tipoEvento"
                      dense
                      outlined
                      :options="tiposEventoOptions"
                      :loading="tiposEventoStore.loading"
                      emit-value
                      map-options
                      placeholder="Selecciona un tipo"
                    />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section__title">
                  <q-icon name="event" color="primary" />
                  Fecha y Horario
                </div>

                <div class="row q-col-gutter-lg">
                  <div class="col-12 col-md-7">
                    <div class="booking-calendar">
                      <div class="booking-calendar__header">
                        <q-btn
                          flat
                          dense
                          round
                          icon="chevron_left"
                          size="sm"
                          color="grey-7"
                          @click="prevMonth"
                        />
                        <span class="month-title">{{ currentMonthLabel }}</span>
                        <q-btn
                          flat
                          dense
                          round
                          icon="chevron_right"
                          size="sm"
                          color="grey-7"
                          @click="nextMonth"
                        />
                      </div>
                      <div class="booking-calendar__grid">
                        <div
                          v-for="(dow, di) in daysOfWeek"
                          :key="di"
                          class="booking-calendar__dow"
                        >
                          {{ dow }}
                        </div>
                        <div
                          v-for="(day, idx) in bookingCalendarDays"
                          :key="idx"
                          class="booking-calendar__day"
                          :class="{
                            'booking-calendar__day--selected':
                              day.day === form.selectedDay && !day.isOtherMonth,
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
                          <div
                            style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px"
                          >
                            HORA DE INICIO
                          </div>
                          <q-input v-model="form.horaInicio" dense outlined type="time" />
                        </div>
                        <div class="col">
                          <div
                            style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px"
                          >
                            HORA DE FIN
                          </div>
                          <q-input v-model="form.horaFin" dense outlined type="time" />
                        </div>
                      </div>
                      <div
                        v-if="form.horaInicio && form.horaFin && !horarioValido"
                        class="text-negative q-mt-xs"
                        style="font-size: 0.75rem"
                      >
                        La hora de fin debe ser mayor a la hora de inicio.
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
                <q-btn
                  color="primary"
                  label="Continuar a Paquetes"
                  class="q-px-md"
                  unelevated
                  style="border-radius: 8px; font-weight: 600"
                  no-caps
                  :disable="!paso1Valido"
                  @click="step = 2"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- ── STEP 2: Paquetes y Extras ─────────────────────────────── -->
            <q-step :name="2" title="Paquetes y Extras" icon="celebration" :done="step > 2">
              <div class="form-section">
                <div class="form-section__title">
                  <q-icon name="celebration" color="primary" />
                  Selección de Paquetes
                </div>

                <div v-if="paquetesStore.loading" class="q-pa-md text-grey">
                  Cargando paquetes...
                </div>
                <div v-else-if="!paquetesStore.activos.length" class="q-pa-md text-grey">
                  No hay paquetes disponibles
                </div>
                <div v-else class="row q-gutter-md">
                  <div
                    v-for="pkg in paquetesStore.activos"
                    :key="pkg.id"
                    class="col package-card"
                    :class="{ 'package-card--selected': form.selectedPackage === pkg.id }"
                    @click="selectPackage(pkg.id)"
                  >
                    <div
                      v-if="paquetesStore.activos.indexOf(pkg) === 0"
                      class="package-card__badge"
                    >
                      Recomendado
                    </div>
                    <div class="package-card__name">{{ pkg.nombre }}</div>
                    <div class="package-card__capacity">
                      Hasta {{ pkg.personas_incluidas }} personas
                    </div>
                    <div class="package-card__price">{{ fmt(parseFloat(pkg.precio_base)) }}</div>
                    <ul class="package-card__features">
                      <li v-if="pkg.descripcion">
                        <q-icon name="check_circle" />{{ pkg.descripcion }}
                      </li>
                      <li>
                        <q-icon name="check_circle" />{{ pkg.duracion_minutos }} min. de duración
                      </li>
                      <li v-if="parseFloat(pkg.precio_persona_extra) > 0">
                        <q-icon name="check_circle" />+{{
                          fmt(parseFloat(pkg.precio_persona_extra))
                        }}
                        por persona extra
                      </li>
                    </ul>
                    <q-btn
                      unelevated
                      :color="form.selectedPackage === pkg.id ? 'primary' : 'white'"
                      :text-color="form.selectedPackage === pkg.id ? 'white' : 'primary'"
                      :outline="form.selectedPackage !== pkg.id"
                      :label="form.selectedPackage === pkg.id ? 'Seleccionado' : 'Seleccionar'"
                      class="full-width"
                      style="border-radius: 8px; font-weight: 700"
                      no-caps
                    />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section__title">
                  <q-icon name="auto_awesome" color="primary" />
                  Servicios Externos (extras)
                </div>

                <div v-if="extrasStore.loading" class="q-pa-md text-grey">Cargando extras...</div>
                <div v-else-if="!extrasStore.activos.length" class="q-pa-md text-grey">
                  No hay extras disponibles
                </div>
                <div v-else class="row q-gutter-md">
                  <div
                    v-for="svc in extrasStore.activos"
                    :key="svc.id"
                    class="col service-card"
                    :class="{ 'service-card--selected': selectedExtraIds.includes(svc.id) }"
                  >
                    <div class="service-card__img">
                      <q-icon name="auto_awesome" size="24px" color="grey-5" />
                    </div>
                    <div class="service-card__body">
                      <div class="service-card__name">{{ svc.nombre }}</div>
                      <div class="service-card__desc">{{ svc.descripcion }}</div>
                      <div class="service-card__price">{{ fmt(parseFloat(svc.precio)) }}</div>
                      <q-btn
                        :unelevated="selectedExtraIds.includes(svc.id)"
                        :flat="!selectedExtraIds.includes(svc.id)"
                        no-caps
                        :label="selectedExtraIds.includes(svc.id) ? 'Agregado' : 'Seleccionar'"
                        color="primary"
                        :text-color="selectedExtraIds.includes(svc.id) ? 'white' : 'primary'"
                        class="full-width q-mt-sm"
                        :style="
                          selectedExtraIds.includes(svc.id)
                            ? 'border-radius: 8px; font-weight: 700;'
                            : 'border: 1px solid #025FE0; border-radius: 8px; font-weight: 600;'
                        "
                        @click="toggleService(svc.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <q-stepper-navigation class="q-mt-lg flex items-center">
                <q-btn
                  color="primary"
                  label="Continuar a Pago"
                  class="q-px-md"
                  unelevated
                  style="border-radius: 8px; font-weight: 600"
                  no-caps
                  @click="step = 3"
                />
                <q-btn
                  flat
                  color="primary"
                  label="Atrás"
                  class="q-ml-sm"
                  no-caps
                  @click="step = 1"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- ── STEP 3: Anticipo ───────────────────────────────────────── -->
            <q-step :name="3" title="Anticipo" icon="payments" :done="step > 3">
              <div class="text-h6 q-mb-md" style="font-weight: 800; color: var(--text-primary)">
                Registra el anticipo
              </div>
              <p class="text-body2 text-grey-8 q-mb-lg">
                Es necesario registrar el anticipo para poder confirmar la reservación.
              </p>

              <!-- Banner de éxito -->
              <div
                v-if="pagoRegistrado"
                class="q-pa-md q-mb-lg rounded-borders"
                style="
                  background: #e8f5e9;
                  border: 1px solid #a5d6a7;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                "
              >
                <q-icon name="check_circle" color="positive" size="28px" />
                <div>
                  <div style="font-weight: 700; color: #2e7d32">
                    Anticipo registrado correctamente
                  </div>
                  <div style="font-size: 0.85rem; color: #388e3c">
                    {{ fmt(montoPagado) }} — {{ metodosPagoResumen }}
                  </div>
                </div>
              </div>

              <!-- Formulario de pago (oculto tras registrar) -->
              <template v-if="!pagoRegistrado">
                <div
                  class="q-pa-md bg-white rounded-borders shadow-1 q-mb-lg"
                  style="border: 1px solid var(--border-color)"
                >
                  <div class="row justify-between q-mb-xs">
                    <span class="text-grey-7">Total de la reservación</span>
                    <span style="font-weight: 700">{{ totalAmount }}</span>
                  </div>
                  <div class="row justify-between">
                    <span class="text-grey-7">Anticipo requerido (30%)</span>
                    <span style="font-weight: 700; color: var(--q-primary)">{{
                      advanceAmount
                    }}</span>
                  </div>
                </div>

                <div class="q-mb-lg">
                  <div class="field-label">MONTO DEL ANTICIPO</div>
                  <q-input
                    v-model.number="anticipoIngresado"
                    dense
                    outlined
                    type="number"
                    prefix="$"
                    :hint="`Mínimo sugerido: ${advanceAmount}`"
                  />
                </div>

                <q-btn
                  unelevated
                  color="primary"
                  label="Pagar Anticipo"
                  icon="payments"
                  style="border-radius: 8px; font-weight: 700; height: 44px"
                  class="q-px-lg"
                  no-caps
                  :disable="anticipoIngresado <= 0"
                  @click="abrirModalPago"
                />
              </template>

              <q-stepper-navigation class="q-mt-lg flex items-center">
                <q-btn
                  color="primary"
                  label="Continuar a Confirmación"
                  class="q-px-md"
                  unelevated
                  style="border-radius: 8px; font-weight: 600"
                  no-caps
                  :disable="!pagoRegistrado"
                  @click="step = 4"
                />
                <q-btn
                  flat
                  color="primary"
                  label="Atrás"
                  class="q-ml-sm"
                  no-caps
                  @click="step = 2"
                />
              </q-stepper-navigation>
            </q-step>

            <!-- ── STEP 4: Confirmación ───────────────────────────────────── -->
            <q-step :name="4" title="Confirmación" icon="check_circle">
              <div class="text-h6 q-mb-md" style="font-weight: 800; color: var(--text-primary)">
                Resumen de la Reservación
              </div>
              <p class="text-body2 text-grey-8 q-mb-lg">
                Verifica todos los datos antes de confirmar.
              </p>

              <!-- Bloque: Cliente -->
              <div
                class="q-pa-md bg-white rounded-borders shadow-1 q-mb-md"
                style="border: 1px solid var(--border-color)"
              >
                <div class="resumen-section-title">Cliente</div>
                <div class="resumen-row">
                  <span>Nombre</span><span>{{ form.nombre || '—' }}</span>
                </div>
                <div class="resumen-row">
                  <span>Teléfono</span><span>{{ form.telefono || '—' }}</span>
                </div>
                <div class="resumen-row">
                  <span>Email</span><span>{{ form.email || '—' }}</span>
                </div>
              </div>

              <!-- Bloque: Evento -->
              <div
                class="q-pa-md bg-white rounded-borders shadow-1 q-mb-md"
                style="border: 1px solid var(--border-color)"
              >
                <div class="resumen-section-title">Evento</div>
                <div class="resumen-row">
                  <span>Tipo</span><span>{{ tipoEventoNombre }}</span>
                </div>
                <div class="resumen-row">
                  <span>Fecha</span><span>{{ selectedDateLabel }}</span>
                </div>
                <div class="resumen-row">
                  <span>Horario</span><span>{{ timeSlotLabel }}</span>
                </div>
                <div class="resumen-row">
                  <span>Personas</span><span>{{ form.ninos }}</span>
                </div>
              </div>

              <!-- Bloque: Paquete y Extras -->
              <div
                class="q-pa-md bg-white rounded-borders shadow-1 q-mb-md"
                style="border: 1px solid var(--border-color)"
              >
                <div class="resumen-section-title">Paquete y Extras</div>
                <div class="resumen-row">
                  <span>Paquete</span><span>{{ selectedPackageName || '—' }}</span>
                </div>
                <div class="resumen-row">
                  <span>Precio base</span><span>{{ packagePrice }}</span>
                </div>
                <template v-if="extrasSeleccionados.length">
                  <div v-for="e in extrasSeleccionados" :key="e.id" class="resumen-row">
                    <span>{{ e.nombre }}</span
                    ><span>{{ fmt(parseFloat(e.precio)) }}</span>
                  </div>
                </template>
                <div v-else class="resumen-row">
                  <span class="text-grey-6">Extras</span><span class="text-grey-6">Ninguno</span>
                </div>
              </div>

              <!-- Bloque: Pago -->
              <div
                class="q-pa-md bg-white rounded-borders shadow-1 q-mb-lg"
                style="border: 1px solid var(--border-color)"
              >
                <div class="resumen-section-title">Pago</div>
                <div class="resumen-row">
                  <span>Total</span><span style="font-weight: 700">{{ totalAmount }}</span>
                </div>
                <div class="resumen-row">
                  <span>Anticipo pagado</span>
                  <span style="color: #2e7d32; font-weight: 600">{{ fmt(montoPagado) }}</span>
                </div>
                <div class="resumen-row">
                  <span>Método</span><span>{{ metodosPagoResumen }}</span>
                </div>
                <div class="resumen-row">
                  <span>Saldo pendiente</span>
                  <span style="font-weight: 700">{{ fmt(totalNum - montoPagado) }}</span>
                </div>
              </div>

              <!-- Términos -->
              <div
                class="q-pa-md bg-white rounded-borders shadow-1 q-mb-lg"
                style="border: 1px solid var(--border-color)"
              >
                <q-checkbox v-model="form.termsAccepted" dense style="align-items: flex-start">
                  <span style="font-size: 0.85rem; line-height: 1.4; color: #546e7a">
                    He revisado los datos del cliente y la disponibilidad de fecha con el reglamento
                    de cancelación vigente.
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
                  style="border-radius: 8px; font-weight: 700"
                  class="q-px-lg"
                  no-caps
                  :disable="!form.termsAccepted"
                  :loading="confirmando"
                  @click="confirmarReservacion"
                />
                <q-btn
                  flat
                  color="primary"
                  label="Atrás"
                  class="q-ml-sm"
                  no-caps
                  @click="step = 3"
                />
              </q-stepper-navigation>
            </q-step>
          </q-stepper>
        </div>

        <!-- RIGHT COLUMN — Desglose de Pago -->
        <div class="col-12 col-md-4 col-lg-3">
          <div class="payment-card sticky-payment">
            <div class="payment-card__title">
              <q-icon name="receipt_long" color="primary" />
              Desglose de Pago
            </div>

            <div v-if="paquetesStore.loading" class="q-pa-sm text-grey text-center text-caption">
              <q-spinner size="16px" class="q-mr-xs" />Cargando paquetes...
            </div>
            <template v-else>
              <div class="payment-card__row">
                <span>Paquete {{ selectedPackageName || '—' }}</span>
                <span class="amount">{{ selectedPkg ? packagePrice : '—' }}</span>
              </div>
              <div class="payment-card__row">
                <span>Servicios Adicionales</span>
                <span class="amount">{{ extraServicesNum > 0 ? extraServicesTotal : '—' }}</span>
              </div>
              <div class="payment-card__row payment-card__row--total">
                <span>Total</span>
                <span class="total-amount">{{ selectedPkg ? totalAmount : '—' }}</span>
              </div>

              <!-- Anticipo y saldo tras registrar pago -->
              <template v-if="pagoRegistrado">
                <div class="payment-card__row" style="color: #2e7d32; margin-top: 4px">
                  <span>Anticipo pagado</span>
                  <span style="font-weight: 700">- {{ fmt(montoPagado) }}</span>
                </div>
                <div
                  class="payment-card__row"
                  style="border-top: 2px solid #e2e8f0; margin-top: 4px; padding-top: 8px"
                >
                  <span style="font-weight: 700; color: var(--text-primary)">Saldo pendiente</span>
                  <span style="font-weight: 800; font-size: 1rem; color: var(--q-primary)">{{
                    fmt(totalNum - montoPagado)
                  }}</span>
                </div>
              </template>

              <!-- Anticipo sugerido antes de pagar -->
              <template v-else>
                <div class="payment-card__advance">
                  <div class="advance-label">Anticipo Requerido (30%)</div>
                  <div class="advance-amount">{{ selectedPkg ? advanceAmount : '—' }}</div>
                  <q-linear-progress
                    :value="0.3"
                    color="primary"
                    track-color="blue-1"
                    rounded
                    style="height: 8px; margin-top: 8px"
                  />
                  <div class="advance-note">
                    El resto ({{ selectedPkg ? remainingAmount : '—' }}) se liquida el día del
                    evento
                  </div>
                </div>
              </template>
            </template>

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
              <q-icon name="support_agent" color="primary" size="20px" style="flex-shrink: 0" />
              <div>
                <strong>¿Necesitas ayuda?</strong><br />
                Contacta a soporte técnico en Ext. 405
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE PAGO MULTIMODAL PARA EL ANTICIPO -->
    <PaymentModal
      v-model="modalPagoAbierto"
      :total-to-pay="anticipoIngresado"
      :metodos-pago="metodosPagoStore.activos"
      @pago-exitoso="onPagoExitoso"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePaquetesStore } from '@/stores/paquetes'
import { useExtrasStore } from '@/stores/extras'
import { useTiposEventoStore } from '@/stores/tipos_evento'
import { useReservacionesStore } from '@/stores/reservaciones'
import { useMetodosPagoStore } from '@/stores/metodos_pago'
import { useAuthStore } from '@/stores/auth'
import { usePagosReservacionesStore } from '@/stores/pagos_reservacion'
import { useReservacionExtrasStore } from '@/stores/reservacion_extras'
import PaymentModal from '@/components/shared/payments/PaymentModal.vue'
import type { AppliedPayment } from '@/types/payments'
import { CATEGORIAS_METODO_PAGO } from '@/types/metodos_pago'

const router = useRouter()
const $q = useQuasar()
const paquetesStore = usePaquetesStore()
const extrasStore = useExtrasStore()
const tiposEventoStore = useTiposEventoStore()
const resStore = useReservacionesStore()
const metodosPagoStore = useMetodosPagoStore()
const authStore = useAuthStore()
const pagosStore = usePagosReservacionesStore()
const reservacionExtrasStore = useReservacionExtrasStore()

onMounted(() => {
  paquetesStore.cargar(authStore.currentBranchId ?? undefined)
  extrasStore.cargar(authStore.currentBranchId ?? undefined)
  tiposEventoStore.cargar()
  metodosPagoStore.cargar()
  if (!resStore.reservaciones.length) resStore.cargar(authStore.currentBranchId ?? undefined)
})

interface BookingCalendarDay {
  day: number | ''
  isToday: boolean
  isBooked: boolean
  isOtherMonth: boolean
}

const step = ref(1)

const form = ref({
  nombre: '',
  telefono: '',
  email: '',
  ninos: 20,
  tipoEvento: null as string | null,
  selectedDay: null as number | null,
  horaInicio: '15:00',
  horaFin: '18:00',
  selectedPackage: null as string | null,
  termsAccepted: false,
})

// ── Tipos de evento ───────────────────────────────────────────────────────────

const tiposEventoOptions = computed(() =>
  tiposEventoStore.activos.map((t) => ({ label: t.nombre, value: t.id })),
)

const tipoEventoNombre = computed(
  () => tiposEventoStore.activos.find((t) => t.id === form.value.tipoEvento)?.nombre ?? '—',
)

// ── Validación paso 1 ────────────────────────────────────────────────────────

const horarioValido = computed(
  () =>
    !!form.value.horaInicio && !!form.value.horaFin && form.value.horaFin > form.value.horaInicio,
)

const paso1Valido = computed(
  () =>
    form.value.nombre.trim().length > 0 &&
    form.value.telefono.trim().length > 0 &&
    !!form.value.tipoEvento &&
    form.value.selectedDay !== null &&
    horarioValido.value,
)

// ── Calendario ────────────────────────────────────────────────────────────────

const today = new Date()
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const currentMonthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value, 1).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  }),
)

const bookedDays = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  return resStore.reservaciones
    .filter((r) => {
      const d = new Date(r.fecha_evento + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })
    .map((r) => new Date(r.fecha_evento + 'T00:00:00').getDate())
})

const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const bookingCalendarDays = computed((): BookingCalendarDay[] => {
  const days: BookingCalendarDay[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', isToday: false, isBooked: false, isOtherMonth: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      isToday:
        d === today.getDate() &&
        currentMonth.value === today.getMonth() &&
        currentYear.value === today.getFullYear(),
      isBooked: bookedDays.value.includes(d),
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

const handleDayClick = (day: BookingCalendarDay) => {
  if (!day.isOtherMonth && day.day !== '') form.value.selectedDay = day.day as number
}

const selectedDateLabel = computed(() => {
  if (!form.value.selectedDay) return 'Sin seleccionar'
  return new Date(currentYear.value, currentMonth.value, form.value.selectedDay).toLocaleDateString(
    'es-MX',
    { day: 'numeric', month: 'long', year: 'numeric' },
  )
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

// ── Paquetes ──────────────────────────────────────────────────────────────────

watchEffect(() => {
  if (paquetesStore.activos.length && !form.value.selectedPackage) {
    form.value.selectedPackage = paquetesStore.activos[0].id
  }
})

const selectPackage = (id: string) => {
  form.value.selectedPackage = id
}

// ── Extras ────────────────────────────────────────────────────────────────────

const selectedExtraIds = ref<string[]>([])

const toggleService = (id: string) => {
  const idx = selectedExtraIds.value.indexOf(id)
  if (idx === -1) selectedExtraIds.value.push(id)
  else selectedExtraIds.value.splice(idx, 1)
}

const extrasSeleccionados = computed(() =>
  extrasStore.activos.filter((e) => selectedExtraIds.value.includes(e.id)),
)

// ── Métodos de pago ───────────────────────────────────────────────────────────

const pagoRegistrado = ref(false)
const montoPagado = ref(0)
const pagosAplicados = ref<AppliedPayment[]>([])
const anticipoIngresado = ref(0)
const modalPagoAbierto = ref(false)

const esTarjeta = (method: string) => {
  const n = method.trim().toLowerCase()
  return (
    n.includes('tarjeta') ||
    n.includes('crédito') ||
    n.includes('débito') ||
    n.includes('credito') ||
    n.includes('debito')
  )
}

const metodosPagoResumen = computed(() => {
  const nombres = pagosAplicados.value.map((p) =>
    esTarjeta(p.method) && p.cardType
      ? `Tarjeta ${p.cardType === 'DEBITO' ? 'Débito' : 'Crédito'}`
      : p.method,
  )
  return nombres.length ? [...new Set(nombres)].join(', ') : '—'
})

const mapearMetodoPago = (categoriaSeleccionada: string): string => {
  const categoria = CATEGORIAS_METODO_PAGO.find((c) => c.valor === categoriaSeleccionada)
  const metodo = metodosPagoStore.activos.find((m) => m.tipo === categoria?.tipo)
  if (!metodo) {
    throw new Error(
      `No hay un método de pago activo de tipo "${categoriaSeleccionada}" configurado para esta sucursal.`,
    )
  }
  return metodo.id
}

// Pre-rellena el anticipo al llegar al step 3
watch(step, (s) => {
  if (s === 3 && !pagoRegistrado.value) anticipoIngresado.value = advanceNum.value
})

const abrirModalPago = () => {
  modalPagoAbierto.value = true
}

const onPagoExitoso = (pagos: AppliedPayment[]) => {
  pagosAplicados.value = pagos
  montoPagado.value = pagos.reduce((suma, p) => suma + p.amount, 0)
  pagoRegistrado.value = true
}

// ── Cálculos de pago ──────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const selectedPkg = computed(() =>
  paquetesStore.activos.find((p) => p.id === form.value.selectedPackage),
)
const selectedPackageName = computed(() => selectedPkg.value?.nombre ?? '')
const packagePriceNum = computed(() => parseFloat(selectedPkg.value?.precio_base ?? '0'))

const extraServicesNum = computed(() =>
  extrasStore.activos
    .filter((e) => selectedExtraIds.value.includes(e.id))
    .reduce((sum, e) => sum + parseFloat(e.precio), 0),
)

const subtotal = computed(() => packagePriceNum.value + extraServicesNum.value)
const totalNum = computed(() => subtotal.value)
const advanceNum = computed(() => Math.round(totalNum.value * 0.3))
const remainingNum = computed(() => totalNum.value - advanceNum.value)

const packagePrice = computed(() => fmt(packagePriceNum.value))
const extraServicesTotal = computed(() => fmt(extraServicesNum.value))
const totalAmount = computed(() => fmt(totalNum.value))
const advanceAmount = computed(() => fmt(advanceNum.value))
const remainingAmount = computed(() => fmt(remainingNum.value))

// ── Confirmar reservación ─────────────────────────────────────────────────────

const confirmando = ref(false)

const confirmarReservacion = async () => {
  const sucursalId = authStore.currentBranchId
  if (!sucursalId) {
    $q.notify({
      type: 'warning',
      message: 'No hay una sucursal activa en la sesión.',
      position: 'top-right',
    })
    return
  }

  const d = form.value.selectedDay
  const fecha = d
    ? `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    : null

  if (
    !form.value.nombre.trim() ||
    !form.value.telefono.trim() ||
    !fecha ||
    !form.value.tipoEvento ||
    !form.value.selectedPackage
  ) {
    $q.notify({
      type: 'warning',
      message: 'Completa todos los datos requeridos',
      position: 'top-right',
    })
    return
  }

  if (!horarioValido.value) {
    $q.notify({
      type: 'warning',
      message: 'La hora de fin debe ser mayor a la hora de inicio',
      position: 'top-right',
    })
    return
  }

  const telefonoLimpio = form.value.telefono.replace(/\D/g, '').slice(-10)

  confirmando.value = true
  try {
    const nuevaReservacion = await resStore.crearReservacion({
      sucursal_id: sucursalId,
      tipo_evento_id: form.value.tipoEvento!,
      paquete_id: form.value.selectedPackage!,
      nombre_cliente: form.value.nombre,
      email_cliente: form.value.email || null,
      telefono_cliente: telefonoLimpio,
      fecha_evento: fecha,
      hora_inicio: form.value.horaInicio,
      hora_fin: form.value.horaFin,
      numero_personas: form.value.ninos,
      precio_base: String(packagePriceNum.value),
      precio_extras: String(extraServicesNum.value),
      precio_personas_extra: '0',
      descuento: '0',
      precio_total: String(totalNum.value),
      anticipo: String(montoPagado.value),
      estado: 'confirmada',
    })

    for (const extraId of selectedExtraIds.value) {
      const extra = extrasStore.activos.find((e) => e.id === extraId)
      if (!extra) continue
      await reservacionExtrasStore.crearReservacionExtra({
        reservacion_id: nuevaReservacion.id,
        extra_id: extra.id,
        cantidad: 1,
        precio_unitario: extra.precio,
      })
    }

    for (const pago of pagosAplicados.value) {
      await pagosStore.crearPagosReservacion({
        reservacion_id: nuevaReservacion.id,
        metodo_pago_id: mapearMetodoPago(pago.method),
        monto: String(pago.amount),
        notas: pago.cardType
          ? `Anticipo (${pago.cardType} - Folio: ${pago.authCode ?? ''})`
          : 'Anticipo registrado al confirmar reservación',
      })
    }

    $q.notify({
      type: 'positive',
      message: 'Reservación confirmada exitosamente',
      position: 'top-right',
    })
    router.push({ name: 'eventos-reservaciones' })
  } catch (err: unknown) {
    const apiErr = err as { message?: string; statusCode?: number }
    const msg = apiErr?.message || 'Error al guardar la reservación'
    $q.notify({ type: 'negative', message: msg, position: 'top-right', timeout: 6000 })
    console.error('[confirmarReservacion]', err)
  } finally {
    confirmando.value = false
  }
}
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

.resumen-section-title {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--q-primary);
  margin-bottom: 10px;
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
}

.resumen-row:last-child {
  border-bottom: none;
}
</style>
