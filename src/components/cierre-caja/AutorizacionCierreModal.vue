<template>
  <q-dialog v-model="turno.mostrarDialogAutorizacion" persistent>
    <q-card class="arqueo">
      <header class="arqueo__head">
        <span class="arqueo__icon"><q-icon name="fact_check" size="22px" /></span>
        <div class="arqueo__titles">
          <span class="arqueo__title">Resultado del arqueo</span>
          <span class="arqueo__subtitle">
            {{ turno.cajeroNombre }} · {{ turno.terminal }} · {{ turno.sucursalNombre }}
          </span>
        </div>
      </header>

      <div class="arqueo__body">
        <div class="arqueo__col">
          <div class="arqueo-table">
            <div class="arqueo-table__head"><span>Método</span><span>Diferencia</span></div>
            <div
              v-for="fila in turno.balancePorMetodo"
              :key="fila.metodo"
              class="arqueo-table__row"
            >
              <div class="arqueo-table__info">
                <span class="arqueo-table__name">{{ fila.label }}</span>
                <span class="arqueo-table__meta">
                  Esperado {{ fmt(fila.esperado) }} · Declarado {{ fmt(fila.declarado) }}
                </span>
              </div>
              <span class="arqueo-table__diff" :class="claseDiferencia(fila.diferencia)">
                {{ signo(fila.diferencia) }}{{ fmt(fila.diferencia) }}
              </span>
            </div>
          </div>

          <dl class="arqueo-totals">
            <div>
              <dt>Fondo inicial</dt>
              <dd>{{ fmt(turno.fondoInicial || 0) }}</dd>
            </div>
            <div v-if="(turno.totalRetiros || 0) > 0">
              <dt>Retiros parciales</dt>
              <dd>−{{ fmt(turno.totalRetiros) }}</dd>
            </div>
            <div>
              <dt>Total esperado</dt>
              <dd>{{ fmt(turno.totalEsperado) }}</dd>
            </div>
            <div>
              <dt>Total declarado</dt>
              <dd>{{ fmt(turno.totalDeclarado) }}</dd>
            </div>
            <div class="arqueo-totals__net">
              <dt>Diferencia neta</dt>
              <dd :class="claseDiferencia(turno.diferenciaNeta)">
                {{ signo(turno.diferenciaNeta) }}{{ fmt(turno.diferenciaNeta) }}
              </dd>
            </div>
          </dl>

          <div
            class="arqueo-callout"
            :class="
              turno.diferenciaNeta < 0
                ? 'arqueo-callout--bad'
                : turno.diferenciaNeta > 0
                  ? 'arqueo-callout--info'
                  : 'arqueo-callout--ok'
            "
          >
            <q-icon :name="turno.diferenciaNeta === 0 ? 'check_circle' : 'warning'" size="19px" />
            <span v-if="turno.diferenciaNeta < 0">Faltante reportado. Requiere autorización.</span>
            <span v-else-if="turno.diferenciaNeta > 0"
              >Sobrante reportado. Requiere autorización.</span
            >
            <span v-else>Cuadre perfecto, sin discrepancias.</span>
          </div>

          <label class="arqueo__field">
            <span class="field-label">Observaciones de cierre</span>
            <q-input
              v-model="observacionesModal"
              outlined
              type="textarea"
              rows="2"
              placeholder="Opcional"
            />
          </label>
        </div>

        <div class="arqueo__col arqueo__col--pins">
          <div class="pin-box" :class="{ 'pin-box--ok': pinCajeroConfirmado }">
            <span class="pin-box__title">PIN del cajero</span>
            <span class="pin-box__text">
              {{ turno.cajeroNombre || 'Cajero' }} declara su conformidad con el corte.
            </span>
            <div class="pin-box__row">
              <q-input
                v-model="pinCajero"
                type="password"
                maxlength="4"
                outlined
                dense
                placeholder="••••"
                aria-label="PIN del cajero"
                input-class="pin-box__input"
                :disable="pinCajeroConfirmado || cargandoPinCajero"
                @keyup.enter="confirmarPinCajero"
              />
              <q-btn
                :unelevated="!pinCajeroConfirmado"
                :flat="pinCajeroConfirmado"
                :color="pinCajeroConfirmado ? 'positive' : 'primary'"
                :icon="pinCajeroConfirmado ? 'check_circle' : undefined"
                :label="pinCajeroConfirmado ? 'Verificado' : 'Verificar'"
                :loading="cargandoPinCajero"
                :disable="pinCajero.length !== 4 || pinCajeroConfirmado"
                @click="confirmarPinCajero"
              />
            </div>
          </div>

          <div class="pin-box" :class="{ 'pin-box--ok': pinAdminConfirmado }">
            <span class="pin-box__title">PIN del administrador de sucursal</span>
            <span class="pin-box__text">
              {{ turno.adminNombre || 'El administrador' }} autoriza el cierre y genera el
              comprobante.
            </span>
            <div class="pin-box__row">
              <q-input
                v-model="pinAdmin"
                type="password"
                maxlength="4"
                outlined
                dense
                placeholder="••••"
                aria-label="PIN del administrador"
                input-class="pin-box__input"
                :disable="pinAdminConfirmado || cargandoPinAdmin"
                @keyup.enter="confirmarPinAdmin"
              />
              <q-btn
                :unelevated="!pinAdminConfirmado"
                :flat="pinAdminConfirmado"
                :color="pinAdminConfirmado ? 'positive' : 'primary'"
                :icon="pinAdminConfirmado ? 'check_circle' : undefined"
                :label="pinAdminConfirmado ? 'Verificado' : 'Verificar'"
                :loading="cargandoPinAdmin"
                :disable="pinAdmin.length !== 4 || pinAdminConfirmado"
                @click="confirmarPinAdmin"
              />
            </div>
          </div>
        </div>
      </div>

      <footer class="arqueo__foot">
        <q-btn
          outline
          color="negative"
          icon="warning"
          label="Cierre extraordinario"
          :loading="cargandoProceso"
          :disable="!pinAdminConfirmado"
          @click="ejecutarCierreExtraordinario"
        />
        <q-btn
          unelevated
          color="primary"
          label="Autorizar cierre y descargar PDF"
          class="arqueo__confirm"
          :loading="cargandoProceso"
          :disable="!pinCajeroConfirmado || !pinAdminConfirmado"
          @click="ejecutarAutorizacionCierre"
        />
      </footer>
    </q-card>
  </q-dialog>

  <BaseDialog
    v-model="dialogExtraordinario"
    title="Cierre extraordinario"
    subtitle="El cajero no está presente para cerrar su turno"
    icon="warning"
    tone="red"
    :width="500"
    persistent
    danger
    primary-label="Sí, ejecutar cierre extraordinario"
    :loading="cargandoProceso"
    @confirm="confirmarExtraordinario"
  >
    El administrador cerrará el turno con el conteo capturado. Quedará registrado como cierre
    extraordinario en el historial de arqueos.
    <label class="arqueo__field">
      <span class="field-label">Motivo</span>
      <q-input
        v-model="observacionesModal"
        outlined
        type="textarea"
        rows="2"
        placeholder="Motivo del cierre extraordinario"
      />
    </label>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import BaseDialog from '@/components/ui/BaseDialog.vue'
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

// El backend (RevisionAdminResponse) ya entrega el total esperado/declarado y la
// diferencia real de EFECTIVO — no hace falta recalcularlos ni usar valores de respaldo.

function claseDiferencia(diferencia: number): string {
  if (diferencia < 0) return 'arqueo--bad'
  if (diferencia > 0) return 'arqueo--info'
  return 'arqueo--ok'
}

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

    const resultado = await turno.confirmarCierre(obsText, esExtraordinario)
    if (!resultado.ok) {
      // El backend rechazó el cierre: el turno sigue abierto, así que se conserva el
      // diálogo y no se reinicia el ciclo ni se redirige.
      $q.notify({ type: 'negative', position: 'top', icon: 'error', message: resultado.error })
      return
    }
    turno.mostrarDialogAutorizacion = false

    // Intentar descarga automática del PDF con el id del arqueo (no el del turno).
    const descargarComprobante = () =>
      turnoCajaService.descargarPdfArqueo(
        resultado.arqueoId,
        `arqueo_${resultado.arqueoId.slice(-8)}.pdf`,
      )
    let descargado = true
    try {
      await descargarComprobante()
    } catch (err) {
      descargado = false
      $q.notify({
        type: 'warning',
        position: 'top',
        icon: 'warning',
        timeout: 0,
        message: `No se pudo descargar el comprobante automáticamente: ${(err as Error).message}`,
        actions: [
          {
            label: 'Descargar comprobante',
            color: 'white',
            handler: () => {
              descargarComprobante().catch((e: Error) =>
                $q.notify({ type: 'negative', position: 'top', message: e.message }),
              )
            },
          },
          { label: 'Cerrar', color: 'white' },
        ],
      })
    }

    $q.notify({
      type: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: esExtraordinario
        ? 'Cierre extraordinario registrado con éxito en la base de datos. Redirigiendo a apertura de caja...'
        : descargado
          ? 'Cierre de caja autorizado correctamente. Se ha descargado el comprobante PDF.'
          : 'Cierre de caja autorizado correctamente.',
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

const dialogExtraordinario = ref(false)

async function confirmarExtraordinario() {
  dialogExtraordinario.value = false
  await finalizarYDescargarPDF(true)
}

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const signo = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '')

async function ejecutarAutorizacionCierre() {
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

  dialogExtraordinario.value = true
}
</script>

<style scoped lang="scss">
.arqueo {
  width: 860px;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--border-soft);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--tone-warn-bg);
    color: var(--tone-warn-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 20px;
    padding: 20px 24px;

    @media (max-width: 760px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    margin-top: 4px;
  }

  &__foot {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-soft);
    background: var(--bg-subtle);

    :deep(.q-btn) {
      min-height: 44px;
    }
  }

  &__confirm {
    font-weight: 800;
  }
}

.arqueo--bad {
  color: var(--tone-bad-fg) !important;
}
.arqueo--info {
  color: var(--tone-info-fg) !important;
}
.arqueo--ok {
  color: var(--tone-ok-fg) !important;
}

.arqueo-table {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;

  &__head {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--bg-subtle);
    border-bottom: 1px solid var(--border-soft);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid #f1f3f7;

    &:last-child {
      border-bottom: 0;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: capitalize;
  }

  &__meta {
    font-size: 12px;
    color: var(--text-secondary);
  }

  &__diff {
    font-size: 13.5px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
}

.arqueo-totals {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f6f8fc;
  display: flex;
  flex-direction: column;
  gap: 8px;

  div {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13.5px;
    color: #475569;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  &__net {
    font-size: 20px !important;
    font-weight: 800;
    color: var(--text-strong) !important;
  }
}

.arqueo-callout {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;

  &--bad {
    background: var(--tone-bad-bg);
    color: var(--tone-bad-fg);
  }
  &--info {
    background: var(--tone-info-bg);
    color: var(--tone-info-fg);
  }
  &--ok {
    background: var(--tone-ok-bg);
    color: var(--tone-ok-fg);
  }
}

.pin-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;

  &--ok {
    border-color: #b9e2b2;
    background: #f5fbf4;
  }

  &__title {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-strong);
  }

  &__text {
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--text-secondary);
  }

  &__row {
    display: flex;
    gap: 8px;

    .q-input {
      flex: 1;
    }
  }

  :deep(.pin-box__input) {
    letter-spacing: 0.4em;
    font-weight: 800;
    text-align: center;
  }
}
</style>
