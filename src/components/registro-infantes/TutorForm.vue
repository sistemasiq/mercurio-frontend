<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'
import { allowOnlyLettersKeydown } from '@/utils/validators'
import { DB_LIMITS } from '@/utils/constants'
import { ref, computed, onBeforeUnmount } from 'vue'

const store = useRegistrationStore()

const RELATIONSHIP_OPTIONS = [
  'Padre / Madre',
  'Abuelo / Abuela',
  'Tío / Tía',
  'Tutor Legal',
  'Otro',
]

const TIME_OPTIONS = ['1 hr', '2 hr', '3 hr', '4 hr', '5 hr']

const showSegundoTutor = ref(false)
const showInePreview = ref(false)
const showArrivalPreview = ref(false)
const inePreviewUrl = ref<string>()
const arrivalPreviewUrls = ref<string[]>([])

// Índice de navegación de la pila de fotos de llegada
const currentArrivalIndex = ref(0)

const cameraActive = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
let streamInstance: MediaStream | null = null
let currentPhotoTarget: 'ine' | 'arrival' | null = null

const currentArrivalOriginalIndex = computed(() => {
  const total = store.tutor.arrivalPhotos.length
  if (total === 0) return -1
  return total - 1 - currentArrivalIndex.value
})

const currentArrivalPhotoUrl = computed(() => {
  const idx = currentArrivalOriginalIndex.value
  return idx >= 0 ? arrivalPreviewUrls.value[idx] : undefined
})

async function startCamera(target: 'ine' | 'arrival') {
  if (store.isLocked) return

  currentPhotoTarget = target
  cameraActive.value = true

  setTimeout(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: target === 'ine' ? 'environment' : 'user' },
        audio: false,
      })
      streamInstance = stream
      if (videoRef.value) {
        videoRef.value.srcObject = stream
      }
    } catch (err) {
      console.error('Error al acceder a la cámara web:', err)
      cameraActive.value = false
    }
  }, 100)
}

function stopCamera() {
  if (streamInstance) {
    streamInstance.getTracks().forEach((track) => track.stop())
    streamInstance = null
  }
  cameraActive.value = false
}

function capturePhoto() {
  if (!videoRef.value || !currentPhotoTarget) return

  const video = videoRef.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const file = new File([blob], `photo_${currentPhotoTarget}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })

        const previewUrl = URL.createObjectURL(blob)

        if (currentPhotoTarget === 'ine') {
          store.tutor.inePhoto = file
          if (inePreviewUrl.value) URL.revokeObjectURL(inePreviewUrl.value)
          inePreviewUrl.value = previewUrl
        } else {
          store.tutor.arrivalPhotos.push(file)
          arrivalPreviewUrls.value.push(previewUrl)
          currentArrivalIndex.value = 0
        }

        stopCamera()
      },
      'image/jpeg',
      0.95,
    )
  }
}

function retakeIne() {
  if (store.isLocked) return
  store.tutor.inePhoto = null
  if (inePreviewUrl.value) URL.revokeObjectURL(inePreviewUrl.value)
  inePreviewUrl.value = undefined
  startCamera('ine')
}

function removeCurrentArrivalPhoto() {
  if (store.isLocked) return
  const idx = currentArrivalOriginalIndex.value
  if (idx < 0) return

  store.tutor.arrivalPhotos.splice(idx, 1)
  if (arrivalPreviewUrls.value[idx]) {
    URL.revokeObjectURL(arrivalPreviewUrls.value[idx])
  }
  arrivalPreviewUrls.value.splice(idx, 1)

  const newLength = store.tutor.arrivalPhotos.length
  if (currentArrivalIndex.value > newLength - 1) {
    currentArrivalIndex.value = Math.max(0, newLength - 1)
  }
}

onBeforeUnmount(() => {
  stopCamera()
  if (inePreviewUrl.value) URL.revokeObjectURL(inePreviewUrl.value)
  arrivalPreviewUrls.value.forEach((url) => URL.revokeObjectURL(url))
})
</script>

<template>
  <q-card flat bordered class="registration-card q-mb-md">
    <q-card-section>
      <div class="section-title row items-center q-mb-md">
        <q-icon name="person_outline" size="22px" color="primary" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Datos del Tutor</span>
      </div>

      <!-- Nombre Completo -->
      <q-input
        v-model="store.tutor.fullName"
        label="Nombre Completo"
        placeholder="Ej. Juan Pérez García"
        outlined
        dense
        class="q-mb-md"
        lazy-rules
        :readonly="store.isLocked"
        :maxlength="DB_LIMITS.GUARDIAN.NAME_MAX_LENGTH"
        :rules="[
          (val) => !!val || 'El nombre completo es obligatorio',
          (val) =>
            val.trim().split(/\s+/).length >= 2 || 'Por favor, introduce nombre y primer apellido',
        ]"
        @keydown="allowOnlyLettersKeydown"
      />

      <!-- Parentesco y Teléfono -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-select
            v-model="store.tutor.relationship"
            :options="RELATIONSHIP_OPTIONS"
            label="Parentesco"
            outlined
            dense
            :readonly="store.isLocked"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model="store.tutor.phone"
            label="Teléfono"
            placeholder="10 dígitos"
            outlined
            dense
            mask="##########"
            lazy-rules
            :readonly="store.isLocked"
            :rules="[
              (val) => !!val || 'El teléfono es obligatorio',
              (val) => val.length === 10 || 'El teléfono debe tener exactamente 10 dígitos',
            ]"
          />
        </div>
      </div>

      <!-- Captura de Fotografías -->
      <div class="row q-col-gutter-md q-mb-md">
        <!-- Foto INE -->
        <div class="col-12 col-sm-6">
          <div class="text-caption text-grey-7 q-mb-xs">Foto INE</div>

          <div
            v-if="!store.tutor.inePhoto"
            class="photo-capture-box"
            :class="{ 'cursor-pointer': !store.isLocked, 'photo-capture-disabled': store.isLocked }"
            @click="!store.isLocked && startCamera('ine')"
          >
            <q-icon
              name="photo_camera"
              size="28px"
              :color="store.isLocked ? 'grey-5' : 'primary'"
            />
            <span
              class="text-caption q-mt-xs"
              :class="store.isLocked ? 'text-grey-6' : 'text-primary'"
            >
              {{ store.isLocked ? 'Sin foto capturada' : 'Tomar Foto de INE' }}
            </span>
          </div>

          <div v-else class="photo-preview-box">
            <img :src="inePreviewUrl" class="photo-thumb" @click="showInePreview = true" />
            <div class="row q-col-gutter-xs q-mt-xs">
              <div :class="store.isLocked ? 'col-12' : 'col-6'">
                <q-btn
                  flat
                  dense
                  size="md"
                  icon="zoom_in"
                  label="Ver foto"
                  color="primary"
                  class="full-width"
                  @click="showInePreview = true"
                />
              </div>
              <div v-if="!store.isLocked" class="col-6">
                <q-btn
                  flat
                  dense
                  size="md"
                  icon="camera_alt"
                  label="Tomar de nuevo"
                  color="grey-7"
                  class="full-width"
                  @click="retakeIne"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Fotos de Llegada -->
        <div class="col-12 col-sm-6">
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-caption text-grey-7">Fotos Llegada</span>

            <div
              v-if="store.tutor.arrivalPhotos.length > 0"
              class="row items-center text-caption text-grey-7"
            >
              <q-btn
                flat
                dense
                round
                icon="chevron_left"
                size="xs"
                :disable="currentArrivalIndex === 0"
                @click="currentArrivalIndex--"
              />
              <span class="q-px-xs">
                {{ currentArrivalIndex + 1 }} / {{ store.tutor.arrivalPhotos.length }}
              </span>
              <q-btn
                flat
                dense
                round
                icon="chevron_right"
                size="xs"
                :disable="currentArrivalIndex === store.tutor.arrivalPhotos.length - 1"
                @click="currentArrivalIndex++"
              />
            </div>
          </div>

          <!-- Sin fotos aún -->
          <div
            v-if="store.tutor.arrivalPhotos.length === 0"
            class="photo-capture-box"
            :class="{ 'cursor-pointer': !store.isLocked, 'photo-capture-disabled': store.isLocked }"
            @click="!store.isLocked && startCamera('arrival')"
          >
            <q-icon name="add_a_photo" size="28px" :color="store.isLocked ? 'grey-5' : 'primary'" />
            <span
              class="text-caption q-mt-xs"
              :class="store.isLocked ? 'text-grey-6' : 'text-primary'"
            >
              {{ store.isLocked ? 'Sin foto capturada' : 'Agregar Foto de Llegada' }}
            </span>
          </div>

          <!-- Visor de fotos -->
          <div v-else class="photo-preview-box">
            <img
              :src="currentArrivalPhotoUrl"
              class="photo-thumb"
              @click="showArrivalPreview = true"
            />
            <div class="row q-col-gutter-xs q-mt-xs">
              <div :class="store.isLocked ? 'col-12' : 'col-4'">
                <q-btn
                  flat
                  dense
                  size="md"
                  icon="zoom_in"
                  label="Ver"
                  color="primary"
                  class="full-width"
                  @click="showArrivalPreview = true"
                />
              </div>
              <template v-if="!store.isLocked">
                <div class="col-4">
                  <q-btn
                    flat
                    dense
                    size="md"
                    icon="add_a_photo"
                    label="Agregar"
                    color="grey-7"
                    class="full-width"
                    @click="startCamera('arrival')"
                  />
                </div>
                <div class="col-4">
                  <q-btn
                    flat
                    dense
                    size="md"
                    icon="delete"
                    label="Borrar"
                    color="negative"
                    class="full-width"
                    @click="removeCurrentArrivalPhoto"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Tiempo Estimado -->
      <q-select
        :model-value="store.isEventoMode ? store.horasEvento : store.tutor.estimatedTime"
        :options="TIME_OPTIONS"
        label="Tiempo Estimado"
        outlined
        dense
        :readonly="store.isLocked"
        @update:model-value="store.tutor.estimatedTime = $event"
      />

      <q-separator class="q-my-md" />

      <!-- Segundo Tutor -->
      <div class="row items-center justify-between q-mb-sm">
        <span
          class="text-caption text-weight-bold text-grey-7 text-uppercase"
          style="letter-spacing: 0.06em"
        >
          Segundo Tutor (opcional)
        </span>
        <template v-if="!store.isLocked">
          <q-btn
            v-if="!showSegundoTutor"
            flat
            dense
            size="sm"
            icon="person_add"
            label="Agregar segundo tutor"
            color="primary"
            @click="showSegundoTutor = true"
          />
          <q-btn
            v-else
            flat
            dense
            size="sm"
            icon="close"
            label="Quitar"
            color="grey-7"
            @click="((showSegundoTutor = false), (store.tutor.secondaryGuardian = null))"
          />
        </template>
      </div>

      <q-input
        v-if="showSegundoTutor || (store.isLocked && store.tutor.secondaryGuardian)"
        v-model="store.tutor.secondaryGuardian"
        label="Nombre del segundo tutor"
        placeholder="Ej. María García"
        outlined
        dense
        lazy-rules
        :readonly="store.isLocked"
        :maxlength="DB_LIMITS.GUARDIAN.NAME_MAX_LENGTH"
        :rules="[
          (val) => !!val || 'El nombre es obligatorio',
          (val) => val.trim().split(/\s+/).length >= 2 || 'Introduce nombre y apellido',
        ]"
        @keydown="allowOnlyLettersKeydown"
      />
    </q-card-section>
  </q-card>

  <!-- Diálogo de la Cámara -->
  <q-dialog v-model="cameraActive" persistent>
    <q-card style="max-width: 500px; width: 100%; border-radius: 12px">
      <q-card-section class="row items-center q-pb-xs">
        <div class="text-subtitle1 text-weight-bold">
          {{
            currentPhotoTarget === 'ine'
              ? 'Capturar Fotografía de INE'
              : 'Capturar Fotografía de Llegada'
          }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="stopCamera" />
      </q-card-section>

      <q-card-section class="q-pa-md text-center">
        <div class="camera-stream-wrapper">
          <video ref="videoRef" autoplay playsinline class="video-stream"></video>
        </div>
        <q-btn
          color="primary"
          icon="camera"
          label="Capturar Foto"
          class="q-mt-md full-width"
          size="md"
          rounded
          @click="capturePhoto"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Vista previa de INE -->
  <q-dialog v-model="showInePreview">
    <q-card style="max-width: 600px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Foto INE</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section>
        <img :src="inePreviewUrl" style="width: 100%; border-radius: 8px" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Vista previa de Llegada -->
  <q-dialog v-model="showArrivalPreview">
    <q-card style="max-width: 600px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          Foto de Llegada {{ currentArrivalIndex + 1 }} de {{ store.tutor.arrivalPhotos.length }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section>
        <img :src="currentArrivalPhotoUrl" style="width: 100%; border-radius: 8px" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.registration-card {
  border-radius: 12px;
}

.photo-capture-box {
  border: 2px dashed #025fe0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  background: rgba(2, 95, 224, 0.06);
  transition: background 0.2s;
}

.photo-capture-box:hover:not(.photo-capture-disabled) {
  background: rgba(2, 95, 224, 0.12);
}

.photo-capture-disabled {
  border-color: #bdbdbd;
  background: #f5f5f5;
  cursor: default;
}

.photo-preview-box {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-main);
}

.photo-thumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.camera-stream-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-stream {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
