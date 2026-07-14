<template>
  <q-page class="page-bg q-pa-md q-pa-lg-lg">
    <!-- Sin sucursal activa -->
    <q-banner
      v-if="!authStore.currentBranchId"
      dense
      rounded
      class="bg-orange-1 text-orange-9 q-mb-md"
      style="border-radius: 10px; max-width: 1100px; margin: 0 auto 16px"
    >
      <template #avatar><q-icon name="info" color="orange-9" /></template>
      No hay una sucursal activa en la sesión. Activa una sucursal para continuar.
    </q-banner>

    <div class="rp-layout">
      <!-- ── Panel izquierdo ─────────────────────────────────────────────────── -->
      <div class="rp-left">
        <div class="rp-card">
          <!-- Encabezado -->
          <div class="rp-card__header">
            <div class="rp-title">Registro de Nueva Pulsera – Escaneo</div>
            <div class="rp-desc">
              Conecte su escáner de código de barras para el registro masivo en el inventario
              central.
            </div>
          </div>

          <!-- Campos globales de lote -->
          <div class="rp-global-fields">
            <div class="rp-field-group">
              <div class="field-label">Número de Lote</div>
              <q-input
                v-model="store.numeroDeLote"
                outlined
                dense
                placeholder="ej. LOT-2023-04"
                :disable="!authStore.currentBranchId"
                @blur="enfocarEscaneo"
              />
            </div>
            <div
              v-if="!store.formularioHabilitado && authStore.currentBranchId"
              class="rp-hint-lote"
            >
              Ingrese un número de lote para habilitar el registro de pulseras.
            </div>
          </div>

          <!-- Sección "Registrar Pulsera" -->
          <div class="rp-section">
            <div class="rp-section__title">Registrar Pulsera</div>
            <div class="rp-section__desc">
              Escanee el código de barras de la pulsera con el lector HID. El campo capturará
              automáticamente la entrada del escáner.
            </div>
          </div>

          <!-- Campo de escaneo -->
          <div class="rp-scan-block">
            <div class="field-label field-label--primary">
              <q-icon name="barcode_reader" size="14px" class="q-mr-xs" />
              ID de Pulsera (Esperando Escaneo)
            </div>
            <div class="rp-scan-input-wrapper">
              <q-input
                ref="scanInputRef"
                v-model="inputEscaneo"
                outlined
                dense
                placeholder="Escanee el código ahora..."
                maxlength="10"
                :disable="!store.formularioHabilitado || store.enviando"
                @keydown.enter.prevent="handleScanEnter"
              >
                <template #append>
                  <span v-if="store.formularioHabilitado" class="rp-listening-badge">
                    <span class="rp-listening-dot" />
                    LISTENING
                  </span>
                </template>
              </q-input>
            </div>
            <div class="rp-scan-hint">
              El sistema detecta automáticamente la entrada de escáneres HID.
            </div>
          </div>

          <!-- Escaneos recientes -->
          <div v-if="store.escaneos.length > 0" class="rp-recent">
            <div class="rp-recent__header">
              <q-icon name="history" size="16px" class="q-mr-xs" />
              Escaneos Recientes (Esta Sesión)
            </div>
            <q-separator class="q-my-sm" />
            <div class="rp-recent__list">
              <div
                v-for="(item, i) in store.escaneos"
                :key="i"
                class="rp-scan-item"
                :class="{ 'rp-scan-item--error': item.estado === 'error' }"
              >
                <q-icon
                  :name="
                    item.estado === 'success'
                      ? 'check_circle'
                      : item.estado === 'error'
                        ? 'cancel'
                        : 'schedule'
                  "
                  :color="
                    item.estado === 'success'
                      ? 'positive'
                      : item.estado === 'error'
                        ? 'negative'
                        : 'grey-5'
                  "
                  size="20px"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="red"
                  size="m"
                  @click="pedirConfirmacionEliminar(item.codigo, i)"
                />
                <span class="rp-scan-item__code">{{ item.codigo }}</span>
                <span v-if="item.mensaje" class="rp-scan-item__msg">{{ item.mensaje }}</span>
                <q-badge
                  :color="
                    item.estado === 'success'
                      ? 'positive'
                      : item.estado === 'error'
                        ? 'negative'
                        : 'grey-5'
                  "
                  :label="
                    item.estado === 'success'
                      ? 'SUCCESS'
                      : item.estado === 'error'
                        ? 'ERROR'
                        : 'PENDIENTE'
                  "
                  class="rp-scan-badge"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Panel derecho ───────────────────────────────────────────────────── -->
      <div class="rp-right">
        <!-- Card azul: Apunta y Escanea -->
        <div class="rp-card-blue">
          <div class="rp-card-blue__icon-wrap">
            <q-icon name="barcode_reader" size="56px" color="white" class="rp-card-blue__barcode" />
            <div class="rp-card-blue__icon-badge">
              <q-icon name="qr_code_scanner" size="28px" color="white" />
            </div>
          </div>
          <div class="rp-card-blue__title">Apunta y Escanea</div>
          <div class="rp-card-blue__desc">
            Simplemente apunta el laser al código de la pulsera y apriete el gatillo para registrar
            al instante.
          </div>
        </div>

        <!-- Card tips: Consejos de Registro -->
        <div class="rp-card-tips">
          <div class="rp-tips__header">
            <q-icon name="lightbulb_outline" size="20px" color="primary" />
            <span>Consejos de Registro</span>
          </div>

          <div class="rp-tips__list">
            <div class="rp-tip">
              <span class="rp-tip__num">1</span>
              <span>
                Compruebe que la impresión sea clara. Si falla, introduzca el número manualmente.
              </span>
            </div>
            <div class="rp-tip">
              <span class="rp-tip__num">2</span>
              <span>
                Un pitido suave confirmará que el escaneo ha sido capturado correctamente.
              </span>
            </div>
            <div class="rp-tip">
              <span class="rp-tip__num">3</span>
              <span>
                Use "Finalizar Registro" para generar un reporte de actualización del inventario.
              </span>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Botones Finalizar y Cancelar -->
          <div class="rp-tips__actions">
            <q-btn
              unelevated
              no-caps
              color="orange"
              label="Finalizar Registro"
              :disable="
                !store.formularioHabilitado || store.totalPendientes === 0 || store.enviando
              "
              :loading="store.enviando"
              style="border-radius: 8px; font-weight: 600; flex: 1"
              @click="mostrarModalFinalizar = true"
            />
            <q-btn
              flat
              no-caps
              color="grey-7"
              label="Cancelar"
              style="border-radius: 8px; font-weight: 600"
              @click="mostrarModalCancelar = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal Eliminar Escaneo ───────────────────────────────────────────── -->
    <q-dialog v-model="mostrarModalEliminar" backdrop-filter="blur(3px) brightness(0.6)">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-icon name="delete_outline" color="negative" size="28px" />
            <span class="text-h6 text-weight-bold">Eliminar registro</span>
          </div>
          <div class="text-body2 text-grey-8">
            ¿Quieres eliminar el registro de la pulsera
            <strong>{{ codigoAEliminar }}</strong
            >?
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn v-close-popup flat no-caps label="Cancelar" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Sí, eliminar"
            style="border-radius: 8px; font-weight: 600"
            @click="confirmarEliminar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Modal Finalizar Registro ──────────────────────────────────────────── -->
    <q-dialog v-model="mostrarModalFinalizar" backdrop-filter="blur(3px) brightness(0.6)">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-icon name="check_circle" color="positive" size="28px" />
            <span class="text-h6 text-weight-bold">Finalizar Registro</span>
          </div>
          <div class="text-body2 text-grey-8">
            Se enviarán
            <strong>{{ store.totalPendientes }} pulsera(s)</strong>
            <span v-if="store.numeroDeLote">
              del lote <strong>{{ store.numeroDeLote }}</strong></span
            >
            al sistema. ¿Deseas finalizar la sesión de registro?
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn v-close-popup flat no-caps label="Volver" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="positive"
            label="Sí, finalizar"
            style="border-radius: 8px; font-weight: 600"
            @click="confirmarFinalizar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ── Modal Cancelar ────────────────────────────────────────────────────── -->
    <q-dialog v-model="mostrarModalCancelar" backdrop-filter="blur(3px) brightness(0.6)">
      <q-card style="min-width: 360px; border-radius: 12px">
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-icon name="warning" color="warning" size="28px" />
            <span class="text-h6 text-weight-bold">Cancelar Sesión</span>
          </div>
          <div class="text-body2 text-grey-8">
            <span v-if="store.escaneos.length > 0">
              Las <strong>{{ store.escaneos.length }} pulsera(s)</strong> escaneadas aún no han sido
              guardadas y se perderán.
            </span>
            <span v-else>No se ha escaneado ninguna pulsera en esta sesión.</span>
            ¿Deseas continuar?
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-sm">
          <q-btn v-close-popup flat no-caps label="Volver" color="grey-7" />
          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Sí, salir"
            style="border-radius: 8px; font-weight: 600"
            @click="confirmarCancelar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, type QInput } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useRegistroPulserasStore } from '@/stores/registroPulseras'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const store = useRegistroPulserasStore()

const inputEscaneo = ref('')
const scanInputRef = ref<QInput | null>(null)
const mostrarModalFinalizar = ref(false)
const mostrarModalCancelar = ref(false)
const mostrarModalEliminar = ref(false)
const codigoAEliminar = ref('')
const indiceAEliminar = ref(-1)

async function enfocarEscaneo() {
  if (store.formularioHabilitado) {
    await nextTick()
    scanInputRef.value?.focus()
  }
}

async function handleScanEnter() {
  const codigo = inputEscaneo.value.trim()
  if (!codigo) return
  inputEscaneo.value = ''
  store.registrarPulsera(codigo)
  await nextTick()
  scanInputRef.value?.focus()
}

function pedirConfirmacionEliminar(codigo: string, index: number) {
  codigoAEliminar.value = codigo
  indiceAEliminar.value = index
  mostrarModalEliminar.value = true
}

function confirmarEliminar() {
  store.eliminarEscaneo(indiceAEliminar.value)
  mostrarModalEliminar.value = false
}

async function confirmarFinalizar() {
  if (!authStore.currentBranchId) return
  mostrarModalFinalizar.value = false
  await store.enviarRegistros(authStore.currentBranchId)
  if (store.totalErrores > 0) {
    $q.notify({
      type: 'warning',
      message: `Registro finalizado: ${store.totalRegistradas} pulsera(s) guardadas, ${store.totalErrores} con error.`,
      position: 'top-right',
    })
  } else {
    $q.notify({
      type: 'positive',
      message: `Registro finalizado: ${store.totalRegistradas} pulsera(s) guardadas correctamente.`,
      position: 'top-right',
    })
  }
  store.limpiarSesion()
  router.push({ name: 'estancias-pulseras' })
}

function confirmarCancelar() {
  mostrarModalCancelar.value = false
  store.limpiarSesion()
  router.push({ name: 'estancias-pulseras' })
}

onUnmounted(() => {
  store.limpiarSesion()
})
</script>

<style scoped lang="scss">
.rp-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}

.rp-left {
  min-width: 0;
}

.rp-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ── Card principal ─────────────────────────────────────────────────────────── */
.rp-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 28px;
}

.rp-card__header {
  margin-bottom: 24px;
}

.rp-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  margin-bottom: 8px;
}

.rp-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Campos globales ────────────────────────────────────────────────────────── */
.rp-global-fields {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.rp-hint-lote {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 10px;
  font-style: italic;
}

/* ── Sección Registrar Pulsera ──────────────────────────────────────────────── */
.rp-section {
  margin-bottom: 20px;
}

.rp-section__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.rp-section__desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Área de escaneo ────────────────────────────────────────────────────────── */
.rp-scan-block {
  margin-bottom: 20px;
}

.rp-scan-input-wrapper {
  margin-top: 6px;
}

.rp-listening-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1e40af;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.rp-listening-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #93c5fd;
  animation: pulse-dot 1.4s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.rp-scan-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 6px;
  font-style: italic;
}

/* ── Escaneos recientes ─────────────────────────────────────────────────────── */
.rp-recent {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 4px;
}

.rp-recent__header {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.rp-recent__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.rp-scan-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
}

.rp-scan-item--error {
  background: #fff5f5;
  border-color: #fed7d7;
}

.rp-scan-item__code {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  flex: 1;
}

.rp-scan-item__msg {
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex: 1;
}

.rp-scan-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 20px;
}

/* ── Field labels ───────────────────────────────────────────────────────────── */
.field-label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.field-label--primary {
  color: #2563eb;
}

.rp-field-group {
  display: flex;
  flex-direction: column;
}

/* ── Card azul ──────────────────────────────────────────────────────────────── */
.rp-card-blue {
  background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
  border-radius: 16px;
  padding: 32px 28px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  min-height: 220px;
  justify-content: center;
}

.rp-card-blue__icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  width: 90px;
  height: 90px;
}

.rp-card-blue__barcode {
  opacity: 0.9;
}

.rp-card-blue__icon-badge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: #f97316;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rp-card-blue__title {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.2;
}

.rp-card-blue__desc {
  font-size: 0.875rem;
  opacity: 0.85;
  line-height: 1.5;
  max-width: 260px;
}

/* ── Card tips ──────────────────────────────────────────────────────────────── */
.rp-card-tips {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 20px;
}

.rp-tips__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.rp-tips__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rp-tip {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.rp-tip__num {
  min-width: 26px;
  height: 26px;
  background: #e2e8f0;
  color: #475569;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rp-tips__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
