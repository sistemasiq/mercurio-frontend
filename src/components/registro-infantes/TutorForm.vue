<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'
import { ref, onBeforeUnmount } from 'vue'

const store = useRegistrationStore()

const RELATIONSHIP_OPTIONS = [
  'Padre / Madre',
  'Abuelo / Abuela',
  'Tío / Tía',
  'Tutor Legal',
  'Otro',
]

const TIME_OPTIONS = ['1 hr', '2 hr', '3 hr']

const showInePreview = ref(false)
const showArrivalPreview = ref(false)

const cameraActive = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
let streamInstance: MediaStream | null = null
let currentPhotoTarget: 'ine' | 'arrival' | null = null

async function startCamera(target: 'ine' | 'arrival') {
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
    const base64Image = canvas.toDataURL('image/jpeg')

    if (currentPhotoTarget === 'ine') {
      store.tutor.inePhoto = base64Image
    } else {
      store.tutor.arrivalPhoto = base64Image
    }
  }

  stopCamera()
}

function retakeIne() {
  store.tutor.inePhoto = null
  startCamera('ine')
}

function retakeArrival() {
  store.tutor.arrivalPhoto = null
  startCamera('arrival')
}

// Limpieza de recursos por seguridad si se cierra el componente inesperadamente
onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <q-card flat bordered class="registration-card q-mb-md">
    <q-card-section>
      <div class="section-title row items-center q-mb-md">
        <q-icon name="person_outline" size="22px" color="primary" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-bold">Datos del Tutor</span>
      </div>

      <!-- Full Name -->
      <q-input
        v-model="store.tutor.fullName"
        label="Nombre Completo"
        placeholder="Ej. Juan Pérez García"
        outlined
        dense
        class="q-mb-md"
        lazy-rules
        :rules="[
          (val) => !!val || 'El nombre completo es obligatorio',
          (val) =>
            val.trim().split(/\s+/).length >= 2 || 'Por favor, introduce nombre y primer apellido',
          (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val) || 'El nombre solo puede contener letras',
        ]"
      />

      <!-- Relationship + Phone -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6">
          <q-select
            v-model="store.tutor.relationship"
            :options="RELATIONSHIP_OPTIONS"
            label="Parentesco"
            outlined
            dense
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
            :rules="[
              (val) => !!val || 'El teléfono es obligatorio',
              (val) => val.length === 10 || 'El teléfono debe tener exactamente 10 dígitos',
            ]"
          />
        </div>
      </div>

      <!-- Photo Captures -->
      <div class="row q-col-gutter-md q-mb-md">
        <!-- INE Photo -->
        <div class="col-12 col-sm-6">
          <div
            v-if="!store.tutor.inePhoto"
            class="photo-capture-box cursor-pointer"
            @click="startCamera('ine')"
          >
            <q-icon name="photo_camera" size="28px" color="primary" />
            <span class="text-caption text-primary q-mt-xs">Tomar Foto de INE</span>
          </div>

          <div v-else class="photo-preview-box">
            <img :src="store.tutor.inePhoto" class="photo-thumb" @click="showInePreview = true" />
            <div class="row q-col-gutter-xs q-mt-xs">
              <div class="col-6">
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
              <div class="col-6">
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

        <!-- Arrival Photo -->
        <div class="col-12 col-sm-6">
          <div
            v-if="!store.tutor.arrivalPhoto"
            class="photo-capture-box cursor-pointer"
            @click="startCamera('arrival')"
          >
            <q-icon name="add_a_photo" size="28px" color="primary" />
            <span class="text-caption text-primary q-mt-xs">Tomar Foto de Llegada</span>
          </div>

          <div v-else class="photo-preview-box">
            <img
              :src="store.tutor.arrivalPhoto"
              class="photo-thumb"
              @click="showArrivalPreview = true"
            />
            <div class="row q-col-gutter-xs q-mt-xs">
              <div class="col-6">
                <q-btn
                  flat
                  dense
                  size="md"
                  icon="zoom_in"
                  label="Ver foto"
                  color="primary"
                  class="full-width"
                  @click="showArrivalPreview = true"
                />
              </div>
              <div class="col-6">
                <q-btn
                  flat
                  dense
                  size="md"
                  icon="camera_alt"
                  label="Tomar de nuevo"
                  color="grey-7"
                  class="full-width"
                  @click="retakeArrival"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estimated Time -->
      <q-select
        v-model="store.tutor.estimatedTime"
        :options="TIME_OPTIONS"
        label="Tiempo Estimado"
        outlined
        dense
      />
    </q-card-section>
  </q-card>

  <!-- Interactive Camera Modal Dialog -->
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

  <!-- INE Preview Dialog -->
  <q-dialog v-model="showInePreview">
    <q-card style="max-width: 600px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Foto INE</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section>
        <img :src="store.tutor.inePhoto ?? ''" style="width: 100%; border-radius: 8px" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Arrival Preview Dialog -->
  <q-dialog v-model="showArrivalPreview">
    <q-card style="max-width: 600px; width: 100%">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Foto de Llegada</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      <q-card-section>
        <img :src="store.tutor.arrivalPhoto ?? ''" style="width: 100%; border-radius: 8px" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.registration-card {
  border-radius: 12px;
}

.photo-capture-box {
  border: 2px dashed #1976d2;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 90px;
  background: #f3f8ff;
  transition: background 0.2s;
}

.photo-capture-box:hover {
  background: #e3f0ff;
}

.photo-preview-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  background: #fafafa;
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
