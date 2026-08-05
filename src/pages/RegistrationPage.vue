<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { useRouter } from 'vue-router'
import TutorForm from '@/components/registro-infantes/TutorForm.vue'
import ChildrenSection from '@/components/registro-infantes/ChildrenSection.vue'
import OrderSummary from '@/components/registro-infantes/OrderSummary.vue'
import RfidSection from '@/components/registro-infantes/RfidSection.vue'
import PrintVoucher from '@/components/registro-infantes/PrintVoucher.vue'
import type { EventoDelDia } from '@/types/reservaciones'

const store = useRegistrationStore()
const turno = useTurnoCajaStore()
const router = useRouter()

onMounted(() => {
  // Se valida al entrar, no hasta el final del registro: si no hay turno
  // abierto no tiene sentido dejar llenar todo el formulario del tutor/niño
  // para enterarse hasta el final. Redirige de inmediato, sin bloquear con un panel.
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  store.loadProductos()
})

onUnmounted(() => {
  store.reset()
})

function nombreEvento(evento: EventoDelDia): string {
  const cliente = [evento.nombre_cliente, evento.apellidos_cliente].filter(Boolean).join(' ')
  return cliente
}

function formatHora12(horaStr: string): string {
  if (!horaStr) return ''

  const [horaPart, minPart] = horaStr.split(':')
  let horas = parseInt(horaPart, 10)
  const minutos = minPart || '00'

  if (isNaN(horas)) return horaStr

  const periodo = horas >= 12 ? 'p.m.' : 'a.m.'
  horas = horas % 12
  horas = horas ? horas : 12

  const horasFormatted = String(horas).padStart(2, '0')

  return `${horasFormatted}:${minutos} ${periodo}`
}
</script>

<template>
  <q-page class="registration-page q-pa-lg">
    <div class="row items-center q-mb-lg">
      <div class="page-icon-wrap q-mr-md">
        <q-icon name="how_to_reg" size="26px" color="primary" />
      </div>
      <div>
        <div class="text-h5 text-weight-bold">Registro de Entrada</div>
        <div class="text-caption text-grey-6">
          Ingreso de nuevos visitantes y vinculación de pulseras.
        </div>
      </div>

      <q-space />
      <div class="row q-gutter-sm items-center">
        <q-chip
          :color="store.step === 'form' ? 'primary' : 'grey-3'"
          :text-color="store.step === 'form' ? 'white' : 'grey-7'"
          icon="edit_note"
          label="1. Datos"
          dense
        />
        <q-icon name="chevron_right" color="grey-4" />
        <q-chip
          :color="
            store.step === 'rfid' ? 'primary' : store.step === 'complete' ? 'positive' : 'grey-3'
          "
          :text-color="['rfid', 'complete'].includes(store.step) ? 'white' : 'grey-7'"
          icon="nfc"
          label="2. Pulseras"
          dense
        />
        <q-icon name="chevron_right" color="grey-4" />
        <q-chip
          :color="store.step === 'complete' ? 'positive' : 'grey-3'"
          :text-color="store.step === 'complete' ? 'white' : 'grey-7'"
          icon="check_circle"
          label="3. Listo"
          dense
        />
      </div>
    </div>

    <div v-if="store.step === 'complete'" class="q-mb-lg">
      <PrintVoucher />
      <div class="text-center q-mt-md">
        <q-btn flat color="primary" icon="add" label="Volver" @click="router.back()" />
      </div>
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div class="col-12 col-md-8">
        <!-- Selector de modo: el flujo natural es "Registro normal"; solo -->
        <!-- cambia si el cajero elige explícitamente "Evento / Fiesta". -->
        <q-card v-if="store.step === 'form'" flat bordered class="registration-card q-mb-md">
          <q-card-section>
            <q-btn-toggle
              :model-value="store.modo"
              spread
              no-caps
              toggle-color="primary"
              color="grey-2"
              text-color="grey-8"
              :options="[
                { label: 'Registro normal', value: 'normal', icon: 'schedule' },
                { label: 'Evento / Fiesta', value: 'evento', icon: 'celebration' },
              ]"
              @update:model-value="store.cambiarModo($event)"
            />

            <template v-if="store.modo === 'evento'">
              <div v-if="store.isLoadingEvento" class="row items-center q-gutter-sm q-mt-md">
                <q-spinner color="primary" size="20px" />
                <span class="text-caption text-grey-7">Buscando el evento próximo…</span>
              </div>

              <q-banner
                v-else-if="store.eventoNoEncontrado"
                dense
                rounded
                class="bg-orange-1 text-orange-9 q-mt-md"
                style="font-size: 13px"
              >
                <template #avatar>
                  <q-icon name="event_busy" color="orange-9" size="18px" />
                </template>
                No hay ningún evento próximo pagado para esta sucursal. Verifica la reservación o
                usa "Registro normal".
              </q-banner>

              <template v-else-if="store.eventoSeleccionado">
                <q-banner
                  dense
                  rounded
                  class="bg-blue-1 text-blue-9 q-mt-md"
                  style="font-size: 13px"
                >
                  <template #avatar>
                    <q-icon name="celebration" color="blue-8" size="18px" />
                  </template>
                  <strong>{{ nombreEvento(store.eventoSeleccionado) }}</strong> ·
                  {{ formatHora12(store.eventoSeleccionado.hora_inicio) }} -
                  {{ formatHora12(store.eventoSeleccionado.hora_fin) }}
                </q-banner>

                <q-banner
                  dense
                  rounded
                  class="bg-negative text-white q-mt-sm"
                  style="font-size: 13px"
                >
                  Evento pagado — puedes registrar hasta
                  {{ store.cupoEventoRestante }}
                  niño(s) más. No se pedirá pago en este registro.
                </q-banner>
              </template>
            </template>
          </q-card-section>
        </q-card>

        <TutorForm />
        <ChildrenSection v-if="store.step === 'form'" />
        <RfidSection v-if="store.step === 'rfid'" />
      </div>

      <div class="col-12 col-md-4">
        <OrderSummary />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.registration-page {
  background: #f7f8fc;
  min-height: 100vh;
}

.page-icon-wrap {
  background: #e8f0fe;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
