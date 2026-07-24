<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="motivo-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">{{ titulo }}</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <p class="text-grey-7 text-caption q-mb-md">{{ subtitulo }}</p>

        <q-select
          v-model="motivoSeleccionado"
          :options="MOTIVOS_OPTIONS"
          label="Motivo de cancelación"
          outlined
          emit-value
          map-options
          class="q-mb-md"
        />

        <q-input
          v-if="motivoSeleccionado === 'Otro'"
          v-model="motivoLibre"
          label="Especifica el motivo"
          type="textarea"
          autogrow
          outlined
          :rules="[(val: string) => !!val?.trim() || 'El motivo es obligatorio']"
          class="motivo-libre-input"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn v-close-popup flat label="Cancelar" color="grey-7" @click="onCancel" />
        <q-btn
          unelevated
          :label="botonLabel"
          color="negative"
          :disable="!motivoFinal"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const MOTIVOS_OPTIONS = [
  'Cliente se arrepintió',
  'Error en captura de productos',
  'Problema con el pago',
  'Producto agotado',
  'Otro',
]

defineProps<{
  titulo?: string
  subtitulo?: string
  botonLabel?: string
}>()

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const motivoSeleccionado = ref('')
const motivoLibre = ref('')

const motivoFinal = computed(() => {
  if (motivoSeleccionado.value === 'Otro') {
    return motivoLibre.value.trim() || null
  }
  return motivoSeleccionado.value || null
})

function onConfirm() {
  if (motivoFinal.value) {
    onDialogOK(motivoFinal.value)
  }
}

function onCancel() {
  onDialogCancel()
}
</script>

<style scoped>
.motivo-card {
  min-width: 420px;
  border-radius: 16px;
}
.motivo-libre-input :deep(textarea) {
  min-height: 80px;
}
</style>
