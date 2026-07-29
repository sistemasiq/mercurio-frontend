<template>
  <q-dialog
    v-model="turno.mostrarDialogAutorizacion"
    persistent
    maximized
    class="rs-dialog-backdrop"
  >
    <div class="rs-audit-modal">
      <!-- ── Header del Modal ── -->
      <div class="rs-modal-header">
        <div>
          <h2 class="rs-modal-title">
            Autorización de Cierre
            <span class="rs-modal-code"
              >#CRT-{{ turno.turnoId ? turno.turnoId.slice(-6).toUpperCase() : '1042' }}</span
            >
          </h2>
          <p class="rs-modal-sub">
            Cajero: <strong>{{ turno.cajeroNombre || 'Diana Ayala' }}</strong> • Terminal:
            <strong>{{ turno.terminal || 'CAJA 01' }}</strong> • Sucursal:
            <strong>{{ turno.sucursalNombre || 'Centro' }}</strong>
          </p>
        </div>
      </div>

      <!-- ── Body del Modal (2 columnas) ── -->
      <div class="rs-modal-body">
        <div class="rs-grid-columns">
          <!-- Columna Izquierda: Desglose del Sistema y Declaración del Cajero -->
          <div class="rs-col-left">
            <!-- Desglose del Sistema -->
            <div class="rs-card-box">
              <h3 class="rs-box-title">Desglose del Sistema</h3>
              <div class="rs-detail-list">
                <div v-if="(turno.fondoInicial || 0) > 0" class="rs-detail-row">
                  <span class="rs-detail-label">Fondo Inicial</span>
                  <span class="rs-detail-val"
                    >${{
                      (turno.fondoInicial || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })
                    }}</span
                  >
                </div>
                <div v-if="(turno.totalVentas || 0) > 0" class="rs-detail-row">
                  <span class="rs-detail-label">Ventas Efectivo</span>
                  <span class="rs-detail-val"
                    >${{
                      (turno.totalVentas || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                    }}</span
                  >
                </div>
                <!-- Solo se muestra la fila de retiros si hubo retiros > 0 -->
                <div v-if="(turno.totalRetiros || 0) > 0" class="rs-detail-row text-negative">
                  <span class="rs-detail-label flex items-center">
                    <q-icon name="remove_circle" size="16px" class="q-mr-xs" /> Retiros Parciales
                  </span>
                  <span class="rs-detail-val"
                    >-${{
                      (turno.totalRetiros || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })
                    }}</span
                  >
                </div>
                <!-- Filas de métodos de pago dinámicos adicionales (solo si monto > 0) -->
                <template v-for="m in metodosConMonto" :key="m.metodo">
                  <div class="rs-detail-row">
                    <span class="rs-detail-label text-capitalize">{{ m.label || m.metodo }}</span>
                    <span class="rs-detail-val"
                      >${{
                        (m.declarado || m.esperado || 0).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })
                      }}</span
                    >
                  </div>
                </template>

                <div class="rs-detail-row rs-detail-total">
                  <span class="rs-total-label">Total Esperado en Caja</span>
                  <span class="rs-total-val"
                    >${{
                      totalEsperadoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })
                    }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Declaración del Cajero -->
            <div class="rs-card-box rs-card-box--cashier">
              <h3 class="rs-box-title">Declaración del Cajero</h3>
              <div class="rs-detail-list">
                <div class="rs-detail-row">
                  <span class="rs-detail-label">Efectivo Contado</span>
                  <span class="rs-detail-val rs-val-bold"
                    >${{
                      totalDeclaradoContado.toLocaleString('es-MX', { minimumFractionDigits: 2 })
                    }}</span
                  >
                </div>

                <div class="rs-detail-row rs-detail-diff">
                  <span class="rs-diff-label">Diferencia Neta</span>
                  <span :class="diffClass" class="rs-diff-val">
                    {{ signoDiferencia }}${{
                      Math.abs(diferenciaCalculada).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </span>
                </div>

                <!-- Tag de estado de diferencia -->
                <div v-if="diferenciaCalculada < 0" class="rs-diff-badge rs-diff-badge--negative">
                  <q-icon name="warning" size="16px" class="q-mr-xs" />
                  Faltante reportado. Requiere autorización para proceder con el depósito.
                </div>
                <div
                  v-else-if="diferenciaCalculada > 0"
                  class="rs-diff-badge rs-diff-badge--positive"
                >
                  <q-icon name="arrow_upward" size="16px" class="q-mr-xs" />
                  Sobrante reportado. Requiere autorización para proceder con el depósito.
                </div>
                <div v-else class="rs-diff-badge rs-diff-badge--exact">
                  <q-icon name="check_circle" size="16px" class="q-mr-xs" />
                  Cuadre perfecto de caja sin discrepancias.
                </div>
              </div>
            </div>

            <!-- Observaciones de Cierre -->
            <div class="rs-card-box">
              <label class="rs-box-title block mb-2">
                Observaciones de Cierre
                <span v-if="diferenciaCalculada !== 0" class="rs-required-tag">Requerido</span>
              </label>
              <textarea
                v-model="observacionesModal"
                rows="3"
                class="rs-textarea"
                :class="{
                  'rs-textarea--invalid': diferenciaCalculada !== 0 && !observacionesValidas,
                }"
                placeholder="Ingrese comentarios, discrepancias o notas adicionales sobre el turno..."
              />
              <div
                class="text-right text-caption mt-1"
                :class="
                  diferenciaCalculada !== 0 && !observacionesValidas
                    ? 'text-negative'
                    : 'text-grey-6'
                "
              >
                {{ observacionesModal.trim().length }} / 15 caracteres mín.
              </div>
            </div>
          </div>

          <!-- Columna Derecha: PINs de Confirmación (Consulta Real en BD) -->
          <div class="rs-col-right space-y-4">
            <!-- Bloque PIN Cajero -->
            <div class="rs-card-box">
              <h3 class="rs-box-title">PIN del Cajero</h3>
              <p class="rs-box-sub">
                Tu PIN es tu declaración de conformidad y responsabilidad sobre este corte de caja.
              </p>
              <div class="q-mb-sm">
                <input
                  v-model="pinCajero"
                  type="password"
                  maxlength="4"
                  class="rs-pin-input"
                  placeholder="####"
                  :disabled="pinCajeroConfirmado || cargandoPinCajero"
                  @keyup.enter="confirmarPinCajero"
                />
              </div>
              <button
                type="button"
                class="rs-btn-confirm-pin"
                :class="{ 'rs-btn-confirm-pin--active': pinCajeroConfirmado }"
                :disabled="pinCajero.length !== 4 || pinCajeroConfirmado || cargandoPinCajero"
                @click="confirmarPinCajero"
              >
                <q-spinner-dots v-if="cargandoPinCajero" size="16px" class="q-mr-xs" />
                <q-icon
                  v-else-if="pinCajeroConfirmado"
                  name="check_circle"
                  size="16px"
                  class="q-mr-xs"
                />
                {{
                  pinCajeroConfirmado ? '✓ PIN del Cajero Verificado (BD)' : 'Confirmar PIN Cajero'
                }}
              </button>
              <div class="text-xs text-grey-7 text-center border-top-line pt-2">
                Cajero: <strong>{{ turno.cajeroNombre || 'Diana Ayala' }}</strong>
              </div>
            </div>

            <!-- Bloque PIN Administrador de Sucursal -->
            <div class="rs-card-box">
              <h3 class="rs-box-title">PIN del Administrador de Sucursal</h3>
              <p class="rs-box-sub">
                Tu PIN como Administrador de Sucursal autoriza este cierre y genera el documento
                oficial de auditoría.
              </p>
              <div class="q-mb-sm">
                <input
                  v-model="pinAdmin"
                  type="password"
                  maxlength="4"
                  class="rs-pin-input"
                  placeholder="####"
                  :disabled="pinAdminConfirmado || cargandoPinAdmin"
                  @keyup.enter="confirmarPinAdmin"
                />
              </div>
              <button
                type="button"
                class="rs-btn-confirm-pin"
                :class="{ 'rs-btn-confirm-pin--active': pinAdminConfirmado }"
                :disabled="pinAdmin.length !== 4 || pinAdminConfirmado || cargandoPinAdmin"
                @click="confirmarPinAdmin"
              >
                <q-spinner-dots v-if="cargandoPinAdmin" size="16px" class="q-mr-xs" />
                <q-icon
                  v-else-if="pinAdminConfirmado"
                  name="check_circle"
                  size="16px"
                  class="q-mr-xs"
                />
                {{
                  pinAdminConfirmado
                    ? '✓ PIN del Administrador Verificado (BD)'
                    : 'Confirmar PIN Administrador'
                }}
              </button>
              <div class="text-xs text-grey-7 text-center border-top-line pt-2">
                Administrador de Sucursal:
                <strong>{{ turno.adminNombre || 'Administrador General' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Footer del Modal: Dos botones hermanitos juntos a la derecha ── -->
      <div class="rs-modal-footer row justify-end q-gutter-md">
        <q-btn
          unelevated
          no-caps
          color="negative"
          class="rs-btn-extraordinario"
          label="Cierre Extraordinario"
          icon="warning"
          :loading="cargandoProceso"
          :disable="!pinAdminConfirmado || !observacionesValidas"
          @click="ejecutarCierreExtraordinario"
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          class="rs-btn-autorizar"
          label="Autorizar Cierre"
          icon-right="lock"
          :loading="cargandoProceso"
          :disable="!pinCajeroConfirmado || !pinAdminConfirmado || !observacionesValidas"
          @click="ejecutarAutorizacionCierre"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { turnoCajaService } from '@/services/turnoCajaService'

const $q = useQuasar()
const router = useRouter()
const turno = useTurnoCajaStore()

const observacionesModal = ref('')
const pinCajero = ref('')
const pinAdmin = ref('')
const pinCajeroConfirmado = ref(false)
const pinAdminConfirmado = ref(false)
const cargandoPinCajero = ref(false)
const cargandoPinAdmin = ref(false)
const cargandoProceso = ref(false)

const totalEsperadoCalculado = computed(() => {
  return (
    turno.totalEsperado ||
    (turno.fondoInicial || 0) + (turno.totalVentas || 0) - (turno.totalRetiros || 0)
  )
})

const totalDeclaradoContado = computed(() => {
  return turno.totalDeclarado || turno.totalContadoDeclarado || turno.desgloseEfectivo.total || 0
})

const diferenciaCalculada = computed(() => {
  return turno.diferenciaNeta !== 0
    ? turno.diferenciaNeta
    : totalDeclaradoContado.value - totalEsperadoCalculado.value
})

// RN-VAL-005: observaciones obligatorias (mín. 15 caracteres) solo si hay diferencia.
const observacionesValidas = computed(() => {
  if (diferenciaCalculada.value === 0) return true
  return observacionesModal.value.trim().length >= 15
})

const signoDiferencia = computed(() => {
  if (diferenciaCalculada.value > 0) return '+'
  if (diferenciaCalculada.value < 0) return '-'
  return ''
})

const diffClass = computed(() => {
  if (diferenciaCalculada.value < 0) return 'text-negative font-bold'
  if (diferenciaCalculada.value > 0) return 'text-primary font-bold'
  return 'text-positive font-bold'
})

const metodosConMonto = computed(() => {
  return turno.balancePorMetodo.filter((m) => (m.declarado || 0) > 0 || (m.esperado || 0) > 0)
})

async function confirmarPinCajero() {
  if (pinCajero.value.length !== 4 || !turno.turnoId) return
  cargandoPinCajero.value = true
  try {
    const ok = await turnoCajaService.validarPinCajero(turno.turnoId, pinCajero.value)
    if (ok) {
      pinCajeroConfirmado.value = true
      $q.notify({
        type: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'PIN del Cajero verificado correctamente en la base de datos.',
      })
    }
  } catch (err) {
    pinCajeroConfirmado.value = false
    pinCajero.value = ''
    $q.notify({
      type: 'negative',
      position: 'top',
      icon: 'error',
      message: (err as Error).message || 'El PIN del Cajero es incorrecto.',
    })
  } finally {
    cargandoPinCajero.value = false
  }
}

async function confirmarPinAdmin() {
  if (pinAdmin.value.length !== 4 || !turno.turnoId) return
  cargandoPinAdmin.value = true
  try {
    const adminEmail =
      turno.adminEmail || turno.credencialesAdmin.email || turno.adminNombre || 'admin'
    const ok = await turnoCajaService.validarPinAdmin(turno.turnoId, adminEmail, pinAdmin.value)
    if (ok) {
      pinAdminConfirmado.value = true
      $q.notify({
        type: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'PIN del Administrador de Sucursal verificado en la base de datos.',
      })
    }
  } catch (err) {
    pinAdminConfirmado.value = false
    pinAdmin.value = ''
    $q.notify({
      type: 'negative',
      position: 'top',
      icon: 'error',
      message: (err as Error).message || 'El PIN del Administrador es incorrecto.',
    })
  } finally {
    cargandoPinAdmin.value = false
  }
}

async function finalizarYDescargarPDF(esExtraordinario = false) {
  cargandoProceso.value = true
  try {
    const obsText = observacionesModal.value.trim()

    await turno.confirmarCierre(obsText, esExtraordinario)
    turno.mostrarDialogAutorizacion = false

    // Intentar descarga automática de PDF del arqueo
    if (turno.turnoId) {
      try {
        await turnoCajaService.descargarPdfArqueo(
          turno.turnoId,
          `arqueo_${turno.turnoId.slice(-8)}.pdf`,
        )
      } catch (err) {
        console.warn('No se pudo descargar el PDF automáticamente:', err)
      }
    }

    $q.notify({
      type: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: esExtraordinario
        ? 'Cierre extraordinario registrado con éxito en la base de datos. Redirigiendo a apertura de caja...'
        : 'Cierre de caja autorizado correctamente. Se ha descargado el comprobante PDF.',
    })

    // Tras confirmar (normal o extraordinario), se limpia el turno y se regresa
    // a la pantalla de apertura de caja para iniciar el siguiente turno.
    turno.reiniciarCicloTurno()
    router.push({ name: 'pos-cierre' })
  } catch (err) {
    $q.notify({
      type: 'negative',
      position: 'top',
      message: (err as Error).message || 'Error al procesar el cierre de caja en la base de datos',
    })
  } finally {
    cargandoProceso.value = false
  }
}

async function ejecutarAutorizacionCierre() {
  const obsText = observacionesModal.value.trim()

  // Validar mínimo 15 caracteres en observaciones si hay diferencia neta
  if (diferenciaCalculada.value !== 0 && obsText.length < 15) {
    $q.notify({
      type: 'warning',
      position: 'top',
      icon: 'warning',
      message:
        'Las observaciones son obligatorias (mínimo 15 caracteres) cuando existe una diferencia en el balance.',
    })
    return
  }

  // Validar si el usuario escribió algo corto (< 15 chars)
  if (obsText.length > 0 && obsText.length < 15) {
    $q.notify({
      type: 'warning',
      position: 'top',
      icon: 'warning',
      message: 'Las observaciones deben contener al menos 15 caracteres.',
    })
    return
  }

  if (!pinCajeroConfirmado.value || !pinAdminConfirmado.value) {
    $q.notify({
      type: 'warning',
      position: 'top',
      icon: 'warning',
      message:
        'Es obligatorio que tanto el Cajero como el Administrador confirmen sus PINs contra la BD.',
    })
    return
  }

  await finalizarYDescargarPDF(false)
}

async function ejecutarCierreExtraordinario() {
  if (!pinAdminConfirmado.value) {
    $q.notify({
      type: 'warning',
      position: 'top',
      icon: 'warning',
      message:
        'El Cierre Extraordinario requiere la confirmación del PIN del Administrador en la BD.',
    })
    return
  }

  $q.dialog({
    title: 'Cierre Extraordinario',
    message:
      '¿Confirmas realizar un cierre extraordinario sin la presencia/PIN del cajero? El Administrador asume la responsabilidad.',
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Sí, Ejecutar Cierre Extraordinario',
    },
  }).onOk(async () => {
    await finalizarYDescargarPDF(true)
  })
}
</script>

<style scoped>
.rs-dialog-backdrop {
  background: rgba(11, 28, 48, 0.65);
  backdrop-filter: blur(6px);
}

.rs-audit-modal {
  background: #ffffff;
  border-radius: 16px;
  max-width: 900px;
  width: 90vw;
  margin: 32px auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 64px);
  overflow: hidden;
  border: 1px solid #c6c5d4;
}

.rs-modal-header {
  padding: 24px 32px;
  background: #f8f9ff;
  border-bottom: 1px solid #dce9ff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rs-modal-title {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0b1c30;
  margin: 0;
}

.rs-modal-code {
  color: #454652;
  font-size: 15px;
  font-weight: 500;
  margin-left: 8px;
}

.rs-modal-sub {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.rs-modal-body {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
  background: #f8f9ff;
}

.rs-grid-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .rs-grid-columns {
    grid-template-columns: 1fr;
  }
}

.rs-card-box {
  background: #ffffff;
  border: 1px solid #dce9ff;
  border-radius: 12px;
  padding: 20px;
}

.rs-card-box--cashier {
  border-left: 4px solid #b7131a;
}

.rs-box-title {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #454652;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.rs-box-sub {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

.rs-pin-input {
  width: 100%;
  height: 48px;
  text-align: center;
  font-size: 24px;
  letter-spacing: 0.8em;
  border: 1px solid #c6c5d4;
  border-radius: 8px;
  background: #ffffff;
  outline: none;
}
.rs-pin-input:focus {
  border-color: #000666;
}

.rs-btn-confirm-pin {
  width: 100%;
  background: #000666;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-bottom: 12px;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rs-btn-confirm-pin:hover:not(:disabled) {
  opacity: 0.9;
}
.rs-btn-confirm-pin:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.7;
}
.rs-btn-confirm-pin--active {
  background: #2e7d32 !important;
  color: #ffffff !important;
}

.border-top-line {
  border-top: 1px solid #f1f5f9;
}

.rs-detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rs-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #0b1c30;
}

.rs-detail-label {
  color: #475569;
}

.rs-detail-val {
  font-weight: 600;
}

.rs-detail-total {
  padding-top: 12px;
  margin-top: 4px;
  border-top: 1px dashed #cbd5e1;
}

.rs-total-label {
  font-weight: 700;
  color: #0b1c30;
}

.rs-total-val {
  font-size: 18px;
  font-weight: 700;
  color: #0b1c30;
}

.rs-detail-diff {
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.rs-diff-val {
  font-size: 18px;
}

.rs-diff-badge {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 12px;
  display: flex;
  align-items: center;
}

.rs-diff-badge--negative {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.rs-diff-badge--positive {
  background: #eff6ff;
  color: #025fe0;
  border: 1px solid #bfdbfe;
}

.rs-diff-badge--exact {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.rs-required-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rs-textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #0b1c30;
  outline: none;
}
.rs-textarea--invalid {
  border-color: #dc2626;
}
.rs-textarea:focus {
  border-color: #025fe0;
}

.rs-modal-footer {
  padding: 20px 32px;
  background: #ffffff;
  border-top: 1px solid #dce9ff;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.rs-btn-extraordinario {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 8px;
}

.rs-btn-autorizar {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 8px;
  background: #000666;
}
</style>
