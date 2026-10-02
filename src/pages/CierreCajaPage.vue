<template>
  <q-page class="page-content cierre">
    <PageHeader
      :title="turno.sinTurno ? 'Apertura de caja' : 'Cierre de caja'"
      :subtitle="turno.sinTurno ? 'Abre un turno para empezar a vender.' : subtitulo"
    >
      <template v-if="turno.estaOperando || turno.enConteo" #actions>
        <q-btn
          outline
          icon="savings"
          label="Retiro parcial"
          :disable="!turno.estaOperando"
          @click="dialogRetiro = true"
        />
      </template>
    </PageHeader>

    <!-- Sin turno activo: apertura -->
    <AperturaCajaCard
      v-if="turno.sinTurno"
      @apertura-exitosa="turno.cargarTurnoActivo(authStore.currentBranchId)"
    />

    <div v-else-if="turno.cargando && !turno.turnoId" class="cierre__loading">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <template v-else>
      <!-- Turno operando: resumen y arranque del cierre -->
      <section v-if="turno.estaOperando" class="cierre-active">
        <div class="cierre-active__info">
          <span class="cierre-active__badge"><span class="cierre-active__dot" />Caja abierta</span>
          <h2 class="cierre-active__title">Turno en operación</h2>
          <p class="cierre-active__text">
            Cuando termines tu turno, inicia el cierre para capturar el conteo de la caja. El conteo
            es ciego: el total esperado se muestra hasta enviarlo.
          </p>
          <q-btn
            unelevated
            color="primary"
            icon="point_of_sale"
            label="Iniciar cierre de caja"
            class="cierre-active__cta"
            :loading="turno.cargando"
            @click="turno.iniciarConteo()"
          />
        </div>
        <dl class="cierre-active__stats">
          <div>
            <dt>Fondo inicial</dt>
            <dd>{{ formatMXN(turno.fondoInicial) }}</dd>
          </div>
          <div>
            <dt>Retiros parciales</dt>
            <dd>{{ formatMXN(turno.totalRetiros) }}</dd>
          </div>
          <div v-if="horaApertura">
            <dt>Apertura</dt>
            <dd>{{ horaApertura }}</dd>
          </div>
        </dl>
      </section>

      <!-- Stepper del cierre -->
      <ol v-if="!turno.estaOperando" class="cierre-steps">
        <li
          v-for="(paso, idx) in pasos"
          :key="paso"
          class="cierre-steps__item"
          :class="{
            'cierre-steps__item--on': idx === pasoActual,
            'cierre-steps__item--done': idx < pasoActual,
          }"
        >
          <span class="cierre-steps__num">
            <q-icon v-if="idx < pasoActual" name="check" size="16px" />
            <template v-else>{{ idx + 1 }}</template>
          </span>
          <span class="cierre-steps__label">{{ paso }}</span>
        </li>
      </ol>

      <!-- Conteo -->
      <div v-if="turno.enConteo || turno.esperandoRevision" class="cierre-grid">
        <EfectivoDesgloseForm v-model="turno.desgloseEfectivo" />
        <MetodoPagoMontoForm v-model="turno.metodosPago" />
        <aside class="cierre-total">
          <TotalDeclaradoCard
            v-model="turno.totalContadoDeclarado"
            :total-calculado="totalCalculado"
          />
          <dl class="cierre-total__rows">
            <div v-for="fila in desgloseDeclarado" :key="fila.label">
              <dt>{{ fila.label }}</dt>
              <dd>{{ formatMXN(fila.valor) }}</dd>
            </div>
          </dl>
          <div v-if="turno.error" class="cierre-total__error">
            <q-icon name="error" size="18px" />{{ turno.error }}
          </div>
          <div class="cierre-total__actions">
            <q-btn
              unelevated
              class="cierre-total__send"
              label="Enviar conteo"
              :loading="turno.cargando"
              :disable="!puedeEnviarConteo"
              @click="turno.enviarConteo()"
            />
            <span class="cierre-total__note">Requiere autorización de un administrador</span>
            <button
              type="button"
              class="cierre-total__cancel"
              :disabled="turno.esperandoRevision || turno.cargando"
              @click="cancelarConteoYSalir"
            >
              <q-icon name="undo" size="16px" />Cancelar conteo
            </button>
          </div>
        </aside>
      </div>

      <!-- FASE BALANCE_REVELADO: manejada por completo por AutorizacionCierreModal.vue -->

      <!-- Cerrado -->
      <section v-if="turno.estaCerrado" class="cierre-done">
        <span class="cierre-done__icon"><q-icon name="task_alt" size="30px" /></span>
        <h2 class="cierre-done__title">Cierre confirmado</h2>
        <p class="cierre-done__text">El turno ha sido cerrado correctamente.</p>
        <div class="cierre-done__actions">
          <q-btn
            unelevated
            color="primary"
            icon="lock_open"
            label="Abrir nuevo turno"
            @click="turno.reiniciarCicloTurno()"
          />
        </div>
      </section>
    </template>

    <RetiroParcialCard v-model="dialogRetiro" />

    <BaseDialog
      v-model="dialogCancelarConteo"
      title="Cancelar conteo de caja"
      subtitle="Se perderán las cantidades capturadas"
      icon="undo"
      tone="amber"
      :width="460"
      secondary-label="Continuar en conteo"
      primary-label="Sí, cancelar y salir"
      danger
      @confirm="confirmarCancelarConteo"
    >
      El turno regresa al estado activo y podrás seguir vendiendo. Tendrás que capturar el conteo de
      nuevo.
    </BaseDialog>

    <ConteoBloqueadoOverlay
      :visible="
        (turno.esperandoRevision || turno.balanceRevelado) &&
        !turno.mostrarDialogAdmin &&
        !turno.mostrarDialogAutorizacion
      "
      :permitir-cancelar="turno.esperandoRevision"
      :cajero="cajeroNombreMostrar"
      @cancelar="turno.cancelarConteo()"
      @autenticar="turno.mostrarDialogAdmin = true"
    />

    <AutenticacionAdminForm />
    <AutorizacionCierreModal />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'

import AperturaCajaCard from '@/components/cierre-caja/AperturaCajaCard.vue'
import EfectivoDesgloseForm from '@/components/cierre-caja/EfectivoDesgloseForm.vue'
import MetodoPagoMontoForm from '@/components/cierre-caja/MetodoPagoMontoForm.vue'
import TotalDeclaradoCard from '@/components/cierre-caja/TotalDeclaradoCard.vue'
import ConteoBloqueadoOverlay from '@/components/cierre-caja/ConteoBloqueadoOverlay.vue'
import AutenticacionAdminForm from '@/components/cierre-caja/AutenticacionAdminForm.vue'
import AutorizacionCierreModal from '@/components/cierre-caja/AutorizacionCierreModal.vue'
import RetiroParcialCard from '@/components/cierre-caja/RetiroParcialCard.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { formatMXN } from '@/utils/formatoMoneda'

import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const turno = useTurnoCajaStore()
const authStore = useAuthStore()

// ── Computed ──────────────────────────────────────────────────────────────

const cajeroNombreMostrar = computed(() => {
  return turno.cajeroNombre || authStore.user?.name || authStore.user?.email || '—'
})

const horaApertura = computed(() =>
  turno.fechaApertura
    ? new Date(turno.fechaApertura).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null,
)

const subtitulo = computed(() =>
  [
    turno.terminal || null,
    cajeroNombreMostrar.value,
    horaApertura.value ? `turno abierto desde ${horaApertura.value}` : null,
  ]
    .filter(Boolean)
    .join(' · '),
)

// Pasos del cierre según el estado del turno (máquina de estados del store).
const pasos = ['Conteo', 'Autorización', 'Resultado', 'Comprobante']
const pasoActual = computed(() => {
  if (turno.estaCerrado) return 3
  if (turno.balanceRevelado) return 2
  if (turno.esperandoRevision) return 1
  return 0
})

// Desglose del panel "Total declarado": lo que el cajero lleva capturado.
const desgloseDeclarado = computed(() => [
  { label: 'Efectivo', valor: turno.desgloseEfectivo.total },
  ...turno.metodosPago.map((m) => ({ label: m.metodo, valor: m.monto ?? 0 })),
  { label: 'Fondo inicial', valor: turno.fondoInicial },
  { label: 'Retiros parciales', valor: turno.totalRetiros },
])

const totalCalculado = computed(() => {
  const totalMetodos = turno.metodosPago.reduce((acc, m) => acc + (m.monto ?? 0), 0)
  return turno.desgloseEfectivo.total + totalMetodos
})

// El backend exige total_declarado > 0 (ver turnoCaja.ts enviarConteo); se refleja aquí
// para no dejar presionar "Enviar conteo" hasta que el cajero haya declarado un total válido.
// También se bloquea mientras hay una petición en curso (turno.cargando): Quasar no
// deshabilita un q-btn solo por "loading", así que sin esto un doble clic alcanza a
// mandar dos POST /conteo y el segundo choca con el conteo que el primero ya congeló.
const puedeEnviarConteo = computed(
  () => !turno.esperandoRevision && !turno.cargando && (turno.totalContadoDeclarado ?? 0) > 0,
)

// ── Acciones ──────────────────────────────────────────────────────────────

const dialogCancelarConteo = ref(false)

function cancelarConteoYSalir() {
  dialogCancelarConteo.value = true
}

async function confirmarCancelarConteo() {
  dialogCancelarConteo.value = false
  await turno.cancelarConteo()
  $q.notify({
    type: 'info',
    icon: 'undo',
    message: 'El conteo ha sido cancelado. El turno regresa al estado activo.',
  })
}

onMounted(() => {
  turno.cargarTurnoActivo(authStore.currentBranchId)
})

// AdministradorSistema no tiene sucursal propia (opera con la del selector global
// en el header). Sin este watcher, cambiar de sucursal sin recargar la página dejaba
// visible la apertura activa de la sucursal anterior — la pantalla nunca volvía a
// consultar /turnos-caja/activo con el nuevo contexto.
watch(
  () => authStore.currentBranchId,
  (sucursalId) => {
    turno.cargarTurnoActivo(sucursalId)
  },
)

const dialogRetiro = ref(false)
</script>

<style scoped lang="scss">
.cierre {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__loading {
    display: flex;
    justify-content: center;
    padding: 64px 0;
  }
}

.cierre-active {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
    font-size: 12px;
    font-weight: 800;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: var(--tone-ok-dot);
  }

  &__title {
    margin: 0;
    font-size: 20px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    margin: 0;
    max-width: 520px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-secondary);
  }

  &__cta {
    margin-top: 6px;
    min-height: 44px;
  }

  &__stats {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
    border-radius: 12px;
    background: var(--bg-subtle);

    div {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
    }

    dt {
      color: var(--text-secondary);
    }

    dd {
      margin: 0;
      font-weight: 800;
      color: var(--text-strong);
      font-variant-numeric: tabular-nums;
    }
  }
}

.cierre-steps {
  list-style: none;
  margin: 0;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  gap: 16px;

  &__item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-secondary);

    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-input);
      margin-left: 12px;
    }

    &:last-child::after {
      display: none;
    }

    &--on {
      color: var(--text-strong);
      font-weight: 700;

      .cierre-steps__num {
        background: var(--q-primary);
        color: #fff;
      }
    }

    &--done .cierre-steps__num {
      background: var(--tone-ok-bg);
      color: var(--tone-ok-fg);
    }
  }

  &__num {
    width: 26px;
    height: 26px;
    border-radius: 13px;
    flex-shrink: 0;
    background: var(--bg-muted);
    color: var(--text-secondary);
    font-size: 12.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 700px) {
    &__label {
      display: none;
    }
  }
}

.cierre-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: stretch;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

    .cierre-total {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.cierre-total {
  background: var(--text-strong);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__rows {
    margin: 0;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    flex-direction: column;
    gap: 10px;

    div {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
    }

    dt {
      color: #c9d0f2;
    }

    dd {
      margin: 0;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  &__error {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(220, 38, 38, 0.2);
    color: #fecaca;
    font-size: 13px;
    font-weight: 600;
  }

  &__actions {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  &__send {
    width: 100%;
    min-height: 52px;
    border-radius: 12px;
    background: #fff;
    color: var(--text-strong);
    font-size: 15px;
    font-weight: 800;
  }

  &__note {
    font-size: 12px;
    color: #aeb8e8;
  }

  &__cancel {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #c9d0f2;
    cursor: pointer;

    &:hover:not(:disabled) {
      color: #fff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.cierre-done {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;

  &__icon {
    width: 60px;
    height: 60px;
    border-radius: 30px;
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
  }

  &__actions {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
}
</style>
