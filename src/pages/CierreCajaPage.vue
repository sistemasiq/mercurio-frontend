<template>
  <q-page class="rs-page">
    <div class="rs-page-wrap">
      <!-- ══ Header ══════════════════════════════════════════════════════ -->
      <div class="rs-page-header">
        <div class="rs-header-meta">
          <span class="rs-meta-item">
            <q-icon name="person" size="20px" color="primary" class="q-mr-xs" />
            <span class="rs-meta-text"
              >Cajero: <strong>{{ cajeroNombreMostrar }}</strong></span
            >
          </span>
          <span class="rs-meta-item">
            <q-icon name="point_of_sale" size="20px" color="primary" class="q-mr-xs" />
            <span class="rs-meta-text"
              >Terminal: <strong>{{ terminalNombreMostrar }}</strong></span
            >
          </span>
        </div>
      </div>

      <!-- ══ Sin turno activo / Apertura de caja ═════════════════════════ -->
      <div v-if="turno.sinTurno" class="rs-apertura-section">
        <AperturaCajaCard @apertura-exitosa="turno.cargarTurnoActivo(authStore.currentBranchId)" />
      </div>

      <!-- ══ Cargando ════════════════════════════════════════════════════ -->
      <div v-else-if="turno.cargando && !turno.turnoId" class="rs-loading">
        <q-spinner-dots color="primary" size="48px" />
      </div>

      <!-- ══ Layout principal ══════════════════════════════════════════ -->
      <div v-else class="rs-layout">
        <!-- Columna izquierda -->
        <div class="rs-col-main">
          <!-- FASE OPERANDO — Hub de Gestión de Caja Activa -->
          <template v-if="turno.estaOperando">
            <div v-if="vistaOperando === 'hub'" class="rs-hub-wrap">
              <div class="rs-hub-header">
                <h1 class="rs-hub-title">Gestión de Caja Activa</h1>
                <p class="rs-hub-sub">
                  Selecciona la operación que deseas realizar en el turno actual.
                </p>
              </div>
              <div class="rs-hub-actions">
                <button type="button" class="rs-hub-card" @click="vistaOperando = 'ingreso'">
                  <div class="rs-hub-icon rs-hub-icon--ingreso">
                    <q-icon name="add_card" size="32px" />
                  </div>
                  <h2 class="rs-hub-card-title">Registrar Ingreso de Efectivo</h2>
                  <p class="rs-hub-card-sub">Agregar dinero físico a la caja actual.</p>
                </button>
                <button type="button" class="rs-hub-card" @click="vistaOperando = 'retiro'">
                  <div class="rs-hub-icon rs-hub-icon--retiro">
                    <q-icon name="payments" size="32px" />
                  </div>
                  <h2 class="rs-hub-card-title">Registrar Retiro Parcial</h2>
                  <p class="rs-hub-card-sub">Extraer fondos para operaciones específicas.</p>
                </button>
                <button
                  type="button"
                  class="rs-hub-card"
                  :disabled="turno.cargando"
                  @click="turno.iniciarConteo()"
                >
                  <div class="rs-hub-icon rs-hub-icon--cierre">
                    <q-icon name="receipt_long" size="32px" />
                  </div>
                  <h2 class="rs-hub-card-title">Cierre de Caja</h2>
                  <p class="rs-hub-card-sub">Finalizar tu turno y hacer el corte.</p>
                </button>
              </div>
            </div>

            <IngresoEfectivoCard
              v-else-if="vistaOperando === 'ingreso'"
              @volver="vistaOperando = 'hub'"
              @ingreso-exitoso="vistaOperando = 'hub'"
            />

            <RetiroParcialCard
              v-else
              @volver="vistaOperando = 'hub'"
              @retiro-exitoso="vistaOperando = 'hub'"
            />
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

                  <div class="rs-submit-row row q-gutter-md justify-between items-center q-mt-md">
                    <q-btn
                      outline
                      no-caps
                      class="rs-btn-salir"
                      label="Salir"
                      icon="logout"
                      :loading="turno.cargando"
                      :disable="turno.esperandoRevision"
                      @click="cancelarConteoYSalir"
                    />
                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      class="rs-btn-enviar"
                      label="Enviar conteo"
                      icon-right="send"
                      :loading="turno.cargando"
                      :disable="!puedeEnviarConteo"
                      @click="turno.enviarConteo()"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- FASE BALANCE_REVELADO: manejada por completo por AutorizacionCierreModal.vue
               (balance, observaciones, doble PIN y confirmación). No se renderiza nada aquí
               para evitar duplicar esa UI. -->

          <!-- FASE CERRADO -->
          <template v-if="turno.estaCerrado">
            <div class="rs-panel rs-cerrado-panel">
              <q-icon name="task_alt" size="32px" color="positive" class="q-mb-xs" />
              <div class="rs-operando-title">Cierre confirmado</div>
              <div class="rs-operando-sub q-mb-lg">El turno ha sido cerrado correctamente.</div>
              <div class="row q-gutter-md justify-center">
                <q-btn
                  v-if="pdfUrl"
                  unelevated
                  no-caps
                  color="primary"
                  label="Descargar comprobante PDF"
                  icon="download"
                  @click="descargarPdf"
                />
                <q-btn
                  unelevated
                  no-caps
                  color="positive"
                  label="Abrir Nuevo Turno (Apertura de Caja)"
                  icon="add_circle"
                  @click="turno.reiniciarCicloTurno()"
                />
              </div>
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
      :visible="turno.esperandoRevision && !turno.mostrarDialogAdmin"
      :permitir-cancelar="true"
      @cancelar="turno.cancelarConteo()"
    />

    <!-- Etapa 1: Login del Administrador (Conteo Ciego) -->
    <AutenticacionAdminForm />

    <!-- Etapa 2: Modal de Autorización de Cierre (Stitch Standalone Modal) -->
    <AutorizacionCierreModal />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { turnoCajaService } from '@/services/turnoCajaService'

import AperturaCajaCard from '@/components/cierre-caja/AperturaCajaCard.vue'
import EfectivoDesgloseForm from '@/components/cierre-caja/EfectivoDesgloseForm.vue'
import MetodoPagoMontoForm from '@/components/cierre-caja/MetodoPagoMontoForm.vue'
import TotalDeclaradoCard from '@/components/cierre-caja/TotalDeclaradoCard.vue'
import ResumenConteoCard from '@/components/cierre-caja/ResumenConteoCard.vue'
import ConteoBloqueadoOverlay from '@/components/cierre-caja/ConteoBloqueadoOverlay.vue'
import AutenticacionAdminForm from '@/components/cierre-caja/AutenticacionAdminForm.vue'
import AutorizacionCierreModal from '@/components/cierre-caja/AutorizacionCierreModal.vue'
import RetiroParcialCard from '@/components/cierre-caja/RetiroParcialCard.vue'
import IngresoEfectivoCard from '@/components/cierre-caja/IngresoEfectivoCard.vue'

import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const turno = useTurnoCajaStore()
const authStore = useAuthStore()

const pdfUrl = ref<string | null>(null)

// ── Computed ──────────────────────────────────────────────────────────────

const cajeroNombreMostrar = computed(() => {
  return turno.cajeroNombre || authStore.user?.name || authStore.user?.email || '—'
})

const terminalNombreMostrar = computed(() => {
  return turno.terminal || 'Sin caja activa'
})

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

async function cancelarConteoYSalir() {
  $q.dialog({
    title: 'Cancelar conteo de caja',
    message:
      '¿Estás seguro de cancelar el conteo actual? Toda la información capturada se restablecerá a cero.',
    cancel: {
      flat: true,
      label: 'Continuar en conteo',
    },
    ok: {
      color: 'negative',
      label: 'Sí, cancelar y salir',
    },
    persistent: true,
  }).onOk(async () => {
    await turno.cancelarConteo()
    $q.notify({
      type: 'info',
      icon: 'cancel',
      message: 'El conteo ha sido cancelado. El turno regresa al estado activo.',
    })
  })
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

// Sub-vista del hub de la fase OPERANDO: 'hub' (elegir operación), 'retiro' o
// 'ingreso' (formularios).
const vistaOperando = ref<'hub' | 'retiro' | 'ingreso'>('hub')
watch(
  () => turno.turnoId,
  () => {
    vistaOperando.value = 'hub'
  },
)
</script>

<style scoped>
/* ── Página ─────────────────────────────────────────────────────────── */
.rs-page {
  background: var(--bg-main);
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
.rs-meta-text {
  font-size: 14px;
  color: var(--text-secondary);
}
.rs-meta-text strong {
  color: var(--text-primary);
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}
.rs-panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-main);
}
.rs-panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #025fe0;
  margin: 0;
}
.rs-panel-sub {
  font-size: 14px;
  color: var(--text-secondary);
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

/* ── Hub de Gestión de Caja Activa (fase OPERANDO) ────────────────────── */
.rs-hub-wrap {
  padding: 32px 0 8px;
}
.rs-hub-header {
  text-align: center;
  margin-bottom: 40px;
}
.rs-hub-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.rs-hub-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
.rs-hub-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 640px;
  margin: 0 auto;
}
@media (min-width: 700px) {
  .rs-hub-actions {
    grid-template-columns: 1fr 1fr;
  }
}
.rs-hub-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}
.rs-hub-card:hover:not(:disabled) {
  border-color: #025fe0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  background: var(--bg-main);
}
.rs-hub-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rs-hub-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.2s ease;
}
.rs-hub-card:hover .rs-hub-icon {
  transform: scale(1.1);
}
.rs-hub-icon--retiro {
  background: rgba(2, 95, 224, 0.1);
  color: #025fe0;
}
.rs-hub-icon--ingreso {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}
.rs-hub-icon--cierre {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}
.rs-hub-card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.rs-hub-card-sub {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* ── Cerrado ────────────────────────────────────────────────────────── */
.rs-cerrado-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  text-align: center;
}
.rs-operando-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}
.rs-operando-sub {
  font-size: 14px;
  color: var(--text-secondary);
}

/* ── Submit row ─────────────────────────────────────────────────────── */
.rs-submit-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.rs-btn-enviar {
  font-weight: 700;
  font-size: 13px;
  padding: 10px 28px;
  border-radius: 8px;
}

.rs-btn-salir {
  font-weight: 700;
  font-size: 13px;
  padding: 10px 28px;
  border-radius: 8px;
  color: #dc2626;
  border: 1.5px solid rgba(220, 38, 38, 0.4) !important;
  background: rgba(220, 38, 38, 0.06);
  transition: all 0.2s ease;
}
.rs-btn-salir:hover {
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.7) !important;
}
</style>
