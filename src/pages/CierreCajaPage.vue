<template>
  <q-page class="rs-page">
    <div class="rs-page-wrap">
      <!-- ══ Header ══════════════════════════════════════════════════════ -->
      <div class="rs-page-header">
        <div class="rs-header-meta">
          <span class="rs-meta-item">
            <span class="material-symbols-outlined rs-meta-icon">person</span>
            <span class="rs-meta-text"
              >Cajero: <strong>{{ turno.cajeroNombre || '—' }}</strong></span
            >
          </span>
          <span class="rs-meta-item">
            <span class="material-symbols-outlined rs-meta-icon">point_of_sale</span>
            <span class="rs-meta-text"
              >Terminal: <strong>{{ turno.terminal || '—' }}</strong></span
            >
          </span>
        </div>
        <span class="rs-estado-pill" :class="pilColor">
          <span class="rs-pill-dot" />
          {{ estadoLabel }}
        </span>
      </div>

      <!-- ══ Sin turno activo ════════════════════════════════════════════ -->
      <div v-if="turno.error && !turno.turnoId" class="rs-empty-state">
        <q-icon name="point_of_sale" size="56px" color="grey-4" />
        <div class="rs-empty-title">Sin turno activo</div>
        <div class="rs-empty-body">{{ turno.error }}</div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Reintentar"
          @click="turno.cargarTurnoActivo()"
        />

        <!-- Modo Test — solo DEV -->
        <div v-if="isDev" class="rs-mock-banner">
          <span class="rs-mock-label">
            <span class="material-symbols-outlined" style="font-size: 14px">science</span>
            Modo Test — sin backend
          </span>
          <q-btn
            outline
            no-caps
            color="orange"
            icon="play_circle"
            label="Simular Turno Activo (Modo Test)"
            class="q-mt-xs"
            @click="simularTurno"
          />
          <span class="rs-mock-hint">
            Inyecta un turno mock en estado EN_CONTEO con fondo $2,000,<br />
            retiros $1,500 y 3 métodos de pago. No llama al backend.
          </span>
        </div>
      </div>

      <!-- ══ Cargando ════════════════════════════════════════════════════ -->
      <div v-else-if="turno.cargando && !turno.turnoId" class="rs-loading">
        <q-spinner-dots color="primary" size="48px" />
      </div>

      <!-- ══ Layout principal ══════════════════════════════════════════ -->
      <div v-else class="rs-layout">
        <!-- Columna izquierda -->
        <div class="rs-col-main">
          <!-- FASE OPERANDO -->
          <template v-if="turno.estaOperando">
            <div class="rs-panel rs-operando-panel">
              <span class="material-symbols-outlined rs-operando-icon">point_of_sale</span>
              <div class="rs-operando-title">Turno activo</div>
              <div class="rs-operando-sub">
                Cajero: <strong>{{ turno.cajeroNombre }}</strong>
              </div>
              <q-btn
                unelevated
                no-caps
                size="lg"
                color="primary"
                label="Iniciar conteo de caja"
                icon="calculate"
                :loading="turno.cargando"
                @click="turno.iniciarConteo()"
              />
            </div>
          </template>

          <!-- FASES EN_CONTEO / ESPERANDO_REVISION -->
          <template v-if="turno.enConteo || turno.esperandoRevision">
            <div class="rs-form-stack">
              <!-- Card contenedor Declaración de Valores -->
              <div class="rs-panel">
                <div class="rs-panel-header">
                  <div>
                    <h2 class="rs-panel-title">Declaración de Valores</h2>
                    <p class="rs-panel-sub">
                      Ingresa el conteo físico de tu caja antes de finalizar el turno.
                    </p>
                  </div>
                </div>
                <div class="rs-panel-body">
                  <EfectivoDesgloseForm v-model="turno.desgloseEfectivo" />
                  <MetodoPagoMontoForm v-model="turno.metodosPago" />
                  <TotalDeclaradoCard
                    v-model="turno.totalContadoDeclarado"
                    :total-calculado="totalCalculado"
                  />

                  <q-banner v-if="turno.error" rounded class="bg-negative text-white q-mt-sm">
                    <template #avatar><q-icon name="error" /></template>
                    {{ turno.error }}
                  </q-banner>

                  <div class="rs-submit-row">
                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      class="rs-btn-enviar"
                      label="Enviar conteo"
                      icon-right="send"
                      :loading="turno.cargando"
                      :disable="turno.esperandoRevision"
                      @click="turno.enviarConteo()"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- FASE BALANCE_REVELADO -->
          <template v-if="turno.balanceRevelado">
            <div class="rs-form-stack">
              <EfectivoDesgloseForm v-model="turno.desgloseEfectivo" readonly />
              <MetodoPagoMontoForm v-model="turno.metodosPago" readonly />
              <BalanceRevisionPanel
                :balance-por-metodo="turno.balancePorMetodo"
                :total-declarado="turno.totalDeclarado"
                :total-esperado="turno.totalEsperado"
                :diferencia-neta="turno.diferenciaNeta"
              />
              <ObservacionesConfirmacionCard
                ref="obsCardRef"
                v-model="observaciones"
                :hay-diferencias="turno.hayDiferencias"
              />

              <!-- Banner admin -->
              <div class="rs-admin-ok-banner">
                <span class="material-symbols-outlined rs-admin-ok-icon">verified_user</span>
                Revisado por <strong class="rs-admin-ok-name">{{ turno.adminNombre }}</strong>
                <span class="rs-spacer" />
                <button type="button" class="rs-revocar-btn" @click="turno.cancelarConteo()">
                  Revocar y reiniciar
                </button>
              </div>

              <q-banner v-if="turno.error" rounded class="bg-negative text-white">
                <template #avatar><q-icon name="error" /></template>
                {{ turno.error }}
              </q-banner>

              <div class="rs-submit-row">
                <q-btn
                  unelevated
                  no-caps
                  color="positive"
                  class="rs-btn-enviar"
                  label="Confirmar cierre definitivo"
                  icon-right="check_circle"
                  :loading="turno.cargando"
                  @click="confirmarCierre"
                />
              </div>
            </div>
          </template>

          <!-- FASE CERRADO -->
          <template v-if="turno.estaCerrado">
            <div class="rs-panel rs-cerrado-panel">
              <span class="material-symbols-outlined rs-cerrado-icon">task_alt</span>
              <div class="rs-operando-title">Cierre confirmado</div>
              <div class="rs-operando-sub">El turno ha sido cerrado correctamente.</div>
              <q-btn
                v-if="pdfUrl"
                unelevated
                no-caps
                color="primary"
                label="Descargar comprobante PDF"
                icon="download"
                @click="descargarPdf"
              />
            </div>
          </template>
        </div>

        <!-- Columna derecha -->
        <div v-if="!turno.estaCerrado" class="rs-col-aside">
          <ResumenConteoCard
            :fondo-inicial="turno.fondoInicial"
            :retiros-pagos="turno.totalRetiros"
          />
        </div>
      </div>
    </div>

    <!-- Overlay de bloqueo -->
    <ConteoBloqueadoOverlay
      :visible="turno.esperandoRevision"
      :permitir-cancelar="true"
      @cancelar="turno.cancelarConteo()"
    />

    <!-- Modal admin -->
    <AutenticacionAdminForm />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { turnoCajaService } from '@/services/turnoCajaService'

import EfectivoDesgloseForm from '@/components/cierre-caja/EfectivoDesgloseForm.vue'
import MetodoPagoMontoForm from '@/components/cierre-caja/MetodoPagoMontoForm.vue'
import TotalDeclaradoCard from '@/components/cierre-caja/TotalDeclaradoCard.vue'
import BalanceRevisionPanel from '@/components/cierre-caja/BalanceRevisionPanel.vue'
import ObservacionesConfirmacionCard from '@/components/cierre-caja/ObservacionesConfirmacionCard.vue'
import ResumenConteoCard from '@/components/cierre-caja/ResumenConteoCard.vue'
import ConteoBloqueadoOverlay from '@/components/cierre-caja/ConteoBloqueadoOverlay.vue'
import AutenticacionAdminForm from '@/components/cierre-caja/AutenticacionAdminForm.vue'

const $q = useQuasar()
const turno = useTurnoCajaStore()
const isDev = import.meta.env.DEV

const observaciones = ref('')
const obsCardRef = ref<InstanceType<typeof ObservacionesConfirmacionCard> | null>(null)
const pdfUrl = ref<string | null>(null)

// ── Computed ──────────────────────────────────────────────────────────────

const totalCalculado = computed(() => {
  const totalMetodos = turno.metodosPago.reduce((acc, m) => acc + (m.monto ?? 0), 0)
  return turno.desgloseEfectivo.total + totalMetodos
})

const estadoLabel = computed(() => {
  const labels: Record<string, string> = {
    OPERANDO: 'Operando',
    EN_CONTEO: 'En conteo',
    ESPERANDO_REVISION: 'Esperando revisión',
    BALANCE_REVELADO: 'Balance revelado',
    CERRADO: 'Cerrado',
  }
  return labels[turno.estado] ?? turno.estado
})

// Clase del pill según el estado (coincide con las clases rs-estado-pill--)
const pilColor = computed(() => {
  const map: Record<string, string> = {
    OPERANDO: 'rs-estado-pill--operando',
    EN_CONTEO: 'rs-estado-pill--en-conteo',
    ESPERANDO_REVISION: 'rs-estado-pill--esperando',
    BALANCE_REVELADO: 'rs-estado-pill--balance',
    CERRADO: 'rs-estado-pill--cerrado',
  }
  return map[turno.estado] ?? ''
})

// ── Acciones ──────────────────────────────────────────────────────────────

async function confirmarCierre() {
  if (!obsCardRef.value?.validar()) {
    $q.notify({
      type: 'warning',
      message: 'Las observaciones son obligatorias cuando hay diferencias en el balance.',
    })
    return
  }
  const url = await turno.confirmarCierre(observaciones.value)
  if (url) pdfUrl.value = url
  if (turno.estaCerrado) {
    $q.notify({ type: 'positive', message: 'Cierre de caja confirmado correctamente.' })
  }
}

async function descargarPdf() {
  if (!turno.turnoId) return
  try {
    await turnoCajaService.descargarPdfArqueo(
      turno.turnoId,
      `arqueo_${turno.turnoId.slice(-8)}.pdf`,
    )
  } catch (err) {
    $q.notify({ type: 'negative', message: (err as Error).message })
  }
}

/* v8 ignore next 12 */
async function simularTurno() {
  if (!isDev) return
  await (
    turno as ReturnType<typeof useTurnoCajaStore> & {
      inyectarTurnoMock?: () => Promise<void>
    }
  ).inyectarTurnoMock?.()
  $q.notify({
    type: 'info',
    icon: 'science',
    message: 'Turno mock inyectado — estado EN_CONTEO.',
    caption: 'Ninguna llamada al backend fue realizada.',
    timeout: 4000,
  })
}

onMounted(() => {
  turno.cargarTurnoActivo()
})
</script>

<style scoped>
/* ── Página ─────────────────────────────────────────────────────────── */
.rs-page {
  background: #f8f9ff;
}
.rs-page-wrap {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.rs-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
}
.rs-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.rs-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.rs-meta-icon {
  font-size: 18px;
  color: #767683;
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-meta-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
}
.rs-meta-text strong {
  color: #0b1c30;
}

/* ── Estado pill ────────────────────────────────────────────────────── */
.rs-estado-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.rs-pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.rs-estado-pill--operando {
  background: #e0f2f1;
  color: #00695c;
}
.rs-estado-pill--operando .rs-pill-dot {
  background: #00897b;
}
.rs-estado-pill--en-conteo {
  background: #e3f2fd;
  color: #1565c0;
}
.rs-estado-pill--en-conteo .rs-pill-dot {
  background: #1e88e5;
  animation: pulse 1.4s ease-in-out infinite;
}
.rs-estado-pill--esperando {
  background: #fff3e0;
  color: #e65100;
}
.rs-estado-pill--esperando .rs-pill-dot {
  background: #fb8c00;
}
.rs-estado-pill--balance {
  background: #f3e5f5;
  color: #6a1b9a;
}
.rs-estado-pill--balance .rs-pill-dot {
  background: #8e24aa;
}
.rs-estado-pill--cerrado {
  background: #e8f5e9;
  color: #1b5e20;
}
.rs-estado-pill--cerrado .rs-pill-dot {
  background: #43a047;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ── Empty / loading ────────────────────────────────────────────────── */
.rs-empty-state {
  max-width: 460px;
  margin: 64px auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.rs-empty-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #454652;
}
.rs-empty-body {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #767683;
}
.rs-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

/* ── Layout 8/4 ─────────────────────────────────────────────────────── */
.rs-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 1024px) {
  .rs-layout {
    grid-template-columns: 1fr 340px;
  }
}
.rs-col-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.rs-col-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Panel card ─────────────────────────────────────────────────────── */
.rs-panel {
  background: #ffffff;
  border: 1px solid #c6c5d4;
  border-radius: 16px;
  overflow: hidden;
}
.rs-panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5eeff;
  background: #f8f9ff;
}
.rs-panel-title {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1a237e;
  margin: 0;
}
.rs-panel-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
  margin: 4px 0 0;
}
.rs-panel-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Form stack (sin card envolvente) ───────────────────────────────── */
.rs-form-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Operando / cerrado ─────────────────────────────────────────────── */
.rs-operando-panel,
.rs-cerrado-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  text-align: center;
}
.rs-operando-icon {
  font-size: 56px;
  color: #1a237e;
  font-variation-settings:
    'FILL' 0,
    'wght' 300,
    'GRAD' 0,
    'opsz' 48;
}
.rs-cerrado-icon {
  font-size: 56px;
  color: #2e7d32;
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 48;
}
.rs-operando-title {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #0b1c30;
}
.rs-operando-sub {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #454652;
}

/* ── Submit row ─────────────────────────────────────────────────────── */
.rs-submit-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e5eeff;
}
.rs-btn-enviar {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 28px;
  border-radius: 8px;
}

/* ── Admin ok banner ────────────────────────────────────────────────── */
.rs-admin-ok-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #1b5e20;
}
.rs-admin-ok-icon {
  font-size: 20px;
  flex-shrink: 0;
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
.rs-admin-ok-name {
  margin-left: 4px;
}
.rs-spacer {
  flex: 1;
}
.rs-revocar-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1b5e20;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 2px 4px;
  transition: opacity 0.15s;
}
.rs-revocar-btn:hover {
  opacity: 0.7;
}

/* ── Mock banner (DEV) ──────────────────────────────────────────────── */
.rs-mock-banner {
  border: 1px dashed #f59300;
  border-radius: 10px;
  padding: 14px 18px;
  background: rgba(245, 147, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.rs-mock-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #f59300;
}
.rs-mock-hint {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #454652;
  line-height: 1.5;
  text-align: center;
}
</style>
