<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ActiveChild } from '@/stores/accessControl'
import { useAccessControlStore } from '@/stores/accessControl'
import { useTurnoCajaStore } from '@/stores/turnoCaja'
import { fetchFotoIneUrl, fetchFotosLlegadaUrls } from '@/api/onboardingClient'

const MAX_TUTOR_NAME_LENGTH = 28
const MAX_CHILD_NAME_LENGTH = 18
const TRUNCATED_LENGTH_TUTOR = 25
const TRUNCATED_LENGTH_CHILD = 15

const props = defineProps<{ child: ActiveChild }>()
const store = useAccessControlStore()
const turno = useTurnoCajaStore()
const router = useRouter()

const showDetails = ref(false)

function openDetails() {
  showDetails.value = true
}

function closeDetails() {
  showDetails.value = false
}

const statusConfig = computed(() => {
  switch (props.child.status) {
    case 'activo':
      return {
        label: 'ACTIVO',
        barColor: 'bg-green-6',
        borderColor: 'border-activo',
        headerBg: 'bg-green-1',
        textColor: 'text-green-9',
      }
    case 'por_expirar':
      return {
        label: 'POR EXPIRAR',
        barColor: 'bg-orange-6',
        borderColor: 'border-expirar',
        headerBg: 'bg-orange-1',
        textColor: 'text-orange-9',
      }
    case 'excedido':
      return {
        label: 'EXCEDIDO',
        barColor: 'bg-red-6',
        borderColor: 'border-excedido',
        headerBg: 'bg-red-1',
        textColor: 'text-red-9',
      }
    default:
      return {
        label: 'DESCONOCIDO',
        barColor: 'bg-grey-6',
        borderColor: 'border-grey',
        headerBg: 'bg-grey-1',
        textColor: 'text-grey-9',
      }
  }
})

function handleCheckout() {
  if (!turno.estaOperando) {
    router.push('/pos/cierre')
    return
  }
  store.setCheckoutChild(props.child)
  router.push({ name: 'estancias-checkout' })
}

function formatTelefono(telefono: string) {
  const digits = telefono.replace(/\D/g, '')

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return telefono
}

function truncateName(nombre: string, maxLength: number, truncatedLength: number): string {
  if (nombre.length <= maxLength) return nombre
  return nombre.slice(0, truncatedLength) + '...'
}

const fotoIneUrl = ref<string | null>(null)
const fotosLlegadaUrls = ref<string[]>([])

const showFotosDialog = ref(false)
const fotoIneError = ref(false)
const fotoLlegadaError = ref(false)

function revokeFotoUrls() {
  if (fotoIneUrl.value) URL.revokeObjectURL(fotoIneUrl.value)
  fotosLlegadaUrls.value.forEach((url) => URL.revokeObjectURL(url))
  fotoIneUrl.value = null
  fotosLlegadaUrls.value = []
}

async function openFotosDialog() {
  showFotosDialog.value = true
  fotoIneError.value = false
  fotoLlegadaError.value = false

  try {
    fotoIneUrl.value = await fetchFotoIneUrl(props.child.registroId)
  } catch {
    fotoIneError.value = true
  }

  try {
    fotosLlegadaUrls.value = await fetchFotosLlegadaUrls(props.child.registroId)
  } catch {
    fotoLlegadaError.value = true
  }
}

function closeFotosDialog() {
  showFotosDialog.value = false
}
</script>

<template>
  <div class="card-slot">
    <transition name="swap" mode="out-in">
      <!-- CARA FRONTAL -->
      <q-card
        v-if="!showDetails"
        key="front"
        flat
        bordered
        class="kds-card"
        :class="statusConfig?.borderColor"
      >
        <div class="status-bar" :class="statusConfig?.barColor"></div>

        <div
          class="q-pa-md q-pl-xl"
          :class="statusConfig?.headerBg"
          style="border-bottom: 1px solid #f1f1f1; position: relative"
        >
          <div style="padding-right: 30px">
            <span
              class="text-caption text-weight-bold block text-uppercase tracking-wider"
              :class="statusConfig?.textColor"
              style="font-size: 11px"
            >
              {{ statusConfig?.label }}
            </span>
            <div class="text-h6 text-weight-bolder text-dark q-mt-xs" style="line-height: 1.2">
              {{ truncateName(child.nino, MAX_CHILD_NAME_LENGTH, TRUNCATED_LENGTH_CHILD) }}
            </div>
            <div class="row items-center text-caption text-grey-7 q-mt-xs">
              <q-icon name="person_outline" size="14px" class="q-mr-xs" />
              {{ truncateName(child.tutor, MAX_TUTOR_NAME_LENGTH, TRUNCATED_LENGTH_TUTOR) }}
            </div>
            <div class="row items-center text-caption text-grey-7 q-mt-xs">
              <span>{{ child.parentesco }}</span>

              <q-icon name="phone" size="14px" class="q-ml-md q-mr-xs" />

              <span>{{ formatTelefono(child.telefono) }}</span>
            </div>
          </div>

          <div style="position: absolute; top: 12px; right: 12px">
            <q-btn
              flat
              round
              dense
              icon="info"
              size="sm"
              :color="statusConfig?.textColor.replace('text-', '')"
              @click="openDetails"
            />
          </div>
        </div>

        <div class="column q-pa-lg q-pl-xl bg-white card-body">
          <div>
            <div class="row q-col-gutter-lg q-mb-md">
              <div class="col-6">
                <div class="info-label">PULSERA</div>
                <div class="row items-center info-value">
                  <q-icon name="badge" size="14px" class="q-mr-xs text-grey-6" />
                  {{ child.pulsera }}
                </div>
              </div>

              <div class="col-6">
                <div class="info-label">TIEMPO</div>
                <div class="info-value" :class="statusConfig?.textColor">
                  {{ store.formatMinutosLabel(child) }}
                </div>
              </div>
            </div>

            <q-linear-progress
              :value="child.progressPercent / 100"
              :color="statusConfig?.barColor.replace('bg-', '')"
              track-color="grey-3"
              size="8px"
              rounded
            />
          </div>

          <q-btn
            unelevated
            color="primary"
            label="Checkout"
            no-caps
            class="q-mt-lg full-width"
            @click="handleCheckout"
          />
        </div>
      </q-card>

      <!-- DETALLES -->
      <q-card v-else key="back" flat bordered class="kds-card" :class="statusConfig?.borderColor">
        <div class="status-bar" :class="statusConfig?.barColor"></div>

        <div
          class="q-pa-md q-pl-xl"
          :class="statusConfig?.headerBg"
          style="border-bottom: 1px solid #f1f1f1; position: relative"
        >
          <div class="text-subtitle2 text-weight-bold text-dark" style="padding-right: 30px">
            Detalles
          </div>
          <div style="position: absolute; top: 12px; right: 12px">
            <q-btn flat round dense icon="close" size="sm" color="grey-8" @click="closeDetails" />
          </div>
        </div>

        <div class="column q-pa-lg q-pl-xl bg-white card-body">
          <div class="info-label q-mb-xs">SEGUNDO TUTOR</div>
          <div v-if="child.nombreSegundoTutor" class="text-body2 text-dark q-mb-md">
            {{
              truncateName(child.nombreSegundoTutor, MAX_TUTOR_NAME_LENGTH, TRUNCATED_LENGTH_TUTOR)
            }}
          </div>
          <div v-else class="text-body2 text-dark q-mb-md">Sin segundo tutor</div>

          <div class="info-label q-mb-xs">NOTAS</div>
          <div v-if="child.notas" class="notas-box q-mb-md">
            <span class="text-body2 text-dark">{{ child.notas }}</span>
          </div>
          <div v-else class="text-caption text-grey-5 q-mb-md">Sin notas registradas.</div>
          <q-separator class="q-mb-md" />
          <div class="info-label q-mb-sm">FOTOS DEL REGISTRO</div>
          <q-btn
            outline
            color="primary"
            icon="photo_library"
            label="Ver fotos"
            no-caps
            dense
            class="full-width"
            @click="openFotosDialog"
          />
        </div>
      </q-card>
    </transition>

    <!-- Dialog de fotos a pantalla completa -->
    <q-dialog
      v-model="showFotosDialog"
      maximized
      transition-show="fade"
      transition-hide="fade"
      @hide="revokeFotoUrls"
    >
      <q-card class="fotos-dialog-card">
        <q-btn
          flat
          round
          dense
          icon="close"
          size="lg"
          color="white"
          class="fotos-close-btn"
          @click="closeFotosDialog"
        />

        <!-- Dialog de fotos a pantalla completa en una sola columna grande -->
        <q-dialog
          v-model="showFotosDialog"
          maximized
          transition-show="fade"
          transition-hide="fade"
          @hide="revokeFotoUrls"
        >
          <q-card class="fotos-dialog-card">
            <q-btn
              flat
              round
              dense
              icon="close"
              size="lg"
              color="white"
              class="fotos-close-btn"
              @click="closeFotosDialog"
            />

            <div class="fotos-dialog-content">
              <div class="text-h4 text-weight-bold text-white text-center q-mb-xl">
                {{ truncateName(child.nino, MAX_CHILD_NAME_LENGTH, TRUNCATED_LENGTH_CHILD) }}
              </div>

              <!-- SECCIÓN INE -->
              <div class="foto-block q-mb-xl">
                <div class="text-h6 text-weight-bold text-white text-center q-mb-md">
                  INE / Identificación
                </div>
                <div v-if="fotoIneError" class="fotos-dialog-img-error">
                  <q-icon name="broken_image" size="64px" color="grey-5" />
                  <div class="text-body1 text-grey-5 q-mt-sm">No disponible</div>
                </div>
                <div v-else-if="!fotoIneUrl" class="fotos-dialog-img-error">
                  <q-spinner color="white" size="56px" />
                </div>
                <div v-else class="fotos-dialog-img-wrap">
                  <img :src="fotoIneUrl" class="fotos-dialog-img" @error="fotoIneError = true" />
                </div>
              </div>

              <!-- SECCIÓN FOTOS DE LLEGADA -->
              <div class="foto-block">
                <div class="text-h6 text-weight-bold text-white text-center q-mb-md">
                  Fotos de Llegada
                </div>
                <div v-if="fotoLlegadaError" class="fotos-dialog-img-error">
                  <q-icon name="broken_image" size="64px" color="grey-5" />
                  <div class="text-body1 text-grey-5 q-mt-sm">No disponible</div>
                </div>
                <div v-else-if="!fotosLlegadaUrls.length" class="fotos-dialog-img-error">
                  <q-spinner color="white" size="56px" />
                </div>
                <div v-else class="column q-gutter-y-xl">
                  <div
                    v-for="(url, index) in fotosLlegadaUrls"
                    :key="index"
                    class="fotos-dialog-img-wrap"
                  >
                    <img :src="url" class="fotos-dialog-img" />
                  </div>
                </div>
              </div>
            </div>
          </q-card>
        </q-dialog>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.card-slot {
  width: 120%;
  height: 360px;
  position: relative;
}

.kds-card {
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.border-activo {
  border-left: 6px solid #21ba45;
}

.border-expirar {
  border-left: 6px solid #fd8b00;
}

.border-excedido {
  border-left: 6px solid #e0353a;
}

.status-bar {
  width: 6px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #9e9e9e;
  text-transform: uppercase;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #424242;
}

.notas-box {
  background: #fff8ed;
  border: 1px solid #ffe4b5;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
}

.foto-thumb-wrap {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  height: 90px;
}

.foto-thumb {
  width: 100%;
  height: 90px;
  object-fit: cover;
}

.foto-thumb-error {
  height: 90px;
  border-radius: 8px;
  border: 1px dashed #e0e0e0;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transición */
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.swap-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.fotos-dialog-card {
  background: rgba(18, 18, 18, 0.98);
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 80px 20px 60px 20px;
}

.fotos-close-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
}

.fotos-dialog-content {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

.foto-section {
  width: 100%;
}

.fotos-dialog-img-wrap {
  width: 100%;
  min-height: 550px;
  max-height: 80vh;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fotos-dialog-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.fotos-dialog-img-error {
  width: 100%;
  height: 550px;
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
