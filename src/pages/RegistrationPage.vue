<template>
  <q-page class="registro">
    <div class="registro__main">
      <ol class="reg-steps">
        <li
          v-for="(paso, idx) in PASOS"
          :key="paso.key"
          class="reg-steps__item"
          :class="{
            'reg-steps__item--on': idx === pasoIdx,
            'reg-steps__item--done': idx < pasoIdx || store.step === 'complete',
          }"
        >
          <span class="reg-steps__num">
            <q-icon v-if="idx < pasoIdx || store.step === 'complete'" name="check" size="16px" />
            <template v-else>{{ idx + 1 }}</template>
          </span>
          {{ paso.label }}
        </li>
      </ol>

      <PrintVoucher v-if="store.step === 'complete'" @nuevo="router.back()" />

      <template v-else>
        <div v-if="store.step === 'form'" class="reg-modes" role="radiogroup">
          <button
            v-for="m in MODOS"
            :key="m.value"
            type="button"
            role="radio"
            class="reg-mode"
            :class="{ 'reg-mode--on': store.modo === m.value }"
            :aria-checked="store.modo === m.value"
            @click="store.cambiarModo(m.value)"
          >
            <q-icon :name="m.icon" size="22px" />
            <span class="reg-mode__text">
              <span class="reg-mode__label">{{ m.label }}</span>
              <span class="reg-mode__sub">{{ m.sub }}</span>
            </span>
          </button>
        </div>

        <template v-if="store.step === 'form' && store.modo === 'evento'">
          <div v-if="store.isLoadingEvento" class="reg-note">
            <q-spinner color="primary" size="18px" />Buscando el evento próximo…
          </div>
          <div v-else-if="store.eventoNoEncontrado" class="reg-note reg-note--warn">
            <q-icon name="event_busy" size="19px" />
            No hay ningún evento próximo pagado para esta sucursal. Verifica la reservación o usa
            "Registro normal".
          </div>
          <template v-else-if="store.eventoSeleccionado">
            <div class="reg-note">
              <q-icon name="celebration" size="19px" />
              <span>
                <strong>{{ nombreEvento(store.eventoSeleccionado) }}</strong> ·
                {{ formatHora12(store.eventoSeleccionado.hora_inicio) }} –
                {{ formatHora12(store.eventoSeleccionado.hora_fin) }} · Evento pagado: puedes
                registrar hasta {{ store.cupoEventoRestante }} niño(s) más sin cobro.
              </span>
            </div>
          </template>
        </template>

        <TutorForm />
        <ChildrenSection v-if="store.step === 'form'" />
        <RfidSection v-if="store.step === 'rfid'" />
      </template>
    </div>

    <aside v-if="store.step !== 'complete'" class="registro__aside">
      <OrderSummary />
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { useRouter } from 'vue-router'
import TutorForm from '@/components/registro-infantes/TutorForm.vue'
import ChildrenSection from '@/components/registro-infantes/ChildrenSection.vue'
import OrderSummary from '@/components/registro-infantes/OrderSummary.vue'
import RfidSection from '@/components/registro-infantes/RfidSection.vue'
import PrintVoucher from '@/components/registro-infantes/PrintVoucher.vue'
import type { EventoDelDia } from '@/types/reservaciones'

const store = useRegistrationStore()

const PASOS = [
  { key: 'form', label: 'Datos' },
  { key: 'rfid', label: 'Pulseras' },
  { key: 'complete', label: 'Listo' },
] as const
const pasoIdx = computed(() => PASOS.findIndex((p) => p.key === store.step))

const MODOS = [
  { value: 'normal', label: 'Registro normal', sub: 'Tiempo de juego por hora', icon: 'schedule' },
  {
    value: 'evento',
    label: 'Evento / Fiesta',
    sub: 'Invitado de una reservación de hoy',
    icon: 'celebration',
  },
] as const
const router = useRouter()

onMounted(() => {
  // La validación de turno (y la espera de su carga async) ya la hace el
  // guard de ruta (`requiresTurno`, ver router/guards.ts) antes de entrar
  // aquí: para cuando este onMounted corre, `turno.estaOperando` ya refleja
  // el estado real del backend.
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

<style scoped lang="scss">
.registro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  min-height: calc(100vh - var(--header-height));

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }

  &__main {
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  &__aside {
    background: #fff;
    border-left: 1px solid var(--border-color);
    position: sticky;
    top: var(--header-height);
    height: calc(100vh - var(--header-height));
    overflow-y: auto;

    @media (max-width: 1000px) {
      position: static;
      height: auto;
      border-left: 0;
      border-top: 1px solid var(--border-color);
    }
  }
}

.reg-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12px;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);

    & + &::before {
      content: '';
      width: 48px;
      height: 2px;
      border-radius: 1px;
      background: var(--border-input);
      margin-right: 2px;
    }

    &--on {
      color: var(--text-strong);
      font-weight: 700;

      .reg-steps__num {
        background: var(--q-primary);
        border-color: var(--q-primary);
        color: #fff;
      }
    }

    &--done {
      color: var(--text-strong);

      &::before {
        background: var(--tone-ok-dot) !important;
      }

      .reg-steps__num {
        background: var(--tone-ok-dot);
        border-color: var(--tone-ok-dot);
        color: #fff;
      }
    }
  }

  &__num {
    width: 30px;
    height: 30px;
    border-radius: 15px;
    border: 1.5px solid var(--border-input);
    background: #fff;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.reg-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.reg-mode {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fff;
  font: inherit;
  text-align: left;
  color: var(--text-secondary);
  cursor: pointer;

  &--on {
    border: 2px solid var(--q-primary);
    background: var(--tone-info-bg);
    color: var(--q-primary);

    .reg-mode__label {
      color: var(--q-primary);
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 14.5px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__sub {
    font-size: 12.5px;
    color: var(--text-secondary);
  }
}

.reg-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--tone-info-bg);
  color: var(--tone-info-fg);
  font-size: 13.5px;
  font-weight: 600;

  &--warn {
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
  }
}
</style>
