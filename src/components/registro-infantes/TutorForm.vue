<script setup lang="ts">
import { useRegistrationStore } from '@/stores/registration'
import { ref } from 'vue'

const store = useRegistrationStore()

const RELATIONSHIP_OPTIONS = [
  'Padre / Madre',
  'Abuelo / Abuela',
  'Tío / Tía',
  'Tutor Legal',
  'Otro',
]

const TIME_OPTIONS = ['1 hr', '2 hr', '3 hr']

const ineInputRef = ref<HTMLInputElement | null>(null)
const showInePreview = ref(false)

const arrivalInputRef = ref<HTMLInputElement | null>(null)
const showArrivalPreview = ref(false)

function triggerIneCapture() {
  ineInputRef.value?.click()
}

function onIneFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    store.tutor.inePhoto = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function triggerArrivalCapture() {
  arrivalInputRef.value?.click()
}

function onArrivalFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    store.tutor.arrivalPhoto = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function retakeIne() {
  store.tutor.inePhoto = null
  if (ineInputRef.value) ineInputRef.value.value = ''
}

function retakeArrival() {
  store.tutor.arrivalPhoto = null
  if (arrivalInputRef.value) arrivalInputRef.value.value = ''
}
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
          />
        </div>
      </div>

      <!-- Photo Captures -->
      <div class="row q-col-gutter-md q-mb-md">
        <!-- INE Photo -->
        <div class="col-12 col-sm-6">
          <input
            ref="ineInputRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden-input"
            @change="onIneFileChange"
          />

          <div
            v-if="!store.tutor.inePhoto"
            class="photo-capture-box cursor-pointer"
            @click="triggerIneCapture"
          >
            <q-icon name="badge" size="28px" color="primary" />
            <span class="text-caption text-primary q-mt-xs">Capturar INE (Foto)</span>
          </div>

          <div v-else class="photo-preview-box">
            <img :src="store.tutor.inePhoto" class="photo-thumb" @click="showInePreview = true" />
            <div class="row q-col-gutter-xs q-mt-xs">
              <div class="col-6">
                <q-btn
                  flat
                  dense
                  size="sm"
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
                  size="sm"
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
          <input
            ref="arrivalInputRef"
            type="file"
            accept="image/*"
            capture="user"
            class="hidden-input"
            @change="onArrivalFileChange"
          />

          <div
            v-if="!store.tutor.arrivalPhoto"
            class="photo-capture-box cursor-pointer"
            @click="triggerArrivalCapture"
          >
            <q-icon name="photo_camera" size="28px" color="primary" />
            <span class="text-caption text-primary q-mt-xs">Foto de Llegada (Tutor y Niños)</span>
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
                  size="sm"
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
                  size="sm"
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

.hidden-input {
  display: none;
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
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}
</style>
