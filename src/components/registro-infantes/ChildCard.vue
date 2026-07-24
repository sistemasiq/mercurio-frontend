<script setup lang="ts">
import { computed } from 'vue'
import { useRegistrationStore } from '@/stores/registration'
import { allowOnlyLettersKeydown, allowOnlyNumbersKeydown } from '@/utils/validators'

const props = defineProps<{ index: number }>()

const store = useRegistrationStore()

const child = computed(() => store.children[props.index])

const canSave = computed(() => child.value.name.trim() !== '' && child.value.age !== null)

function save() {
  if (child.value && !child.value.rfidBracelet) {
    child.value.rfidBracelet = ''
  }
  store.saveChild(props.index)
}

function edit() {
  store.editChild(props.index)
}

function remove() {
  store.removeChild(props.index)
}

function limitAgeInput(value: number | string | null) {
  if (value === null || value === '') return

  const stringValue = value.toString()

  if (stringValue.length > 2) {
    child.value.age = parseInt(stringValue.slice(0, 2))
  }
}
</script>

<template>
  <div class="child-card q-pa-md q-mb-sm">
    <!-- Saved view -->
    <template v-if="child.saved">
      <div class="row items-center">
        <q-icon name="check_circle" color="positive" size="20px" class="q-mr-sm" />
        <div class="col">
          <div class="text-weight-bold">{{ child.name }}</div>
          <div class="text-caption text-grey-7">
            {{ child.age }} años · {{ child.notes || 'Sin notas' }}
          </div>
        </div>
        <q-btn flat round dense icon="edit" color="primary" size="sm" @click="edit" />
        <q-btn
          v-if="store.children.length > 1"
          flat
          round
          dense
          icon="delete_outline"
          color="negative"
          size="sm"
          class="q-ml-xs"
          @click="remove"
        />
      </div>
    </template>

    <!-- Edit view -->
    <template v-else>
      <div class="row items-center q-mb-sm">
        <span class="text-subtitle2 text-weight-bold">Niño #{{ index + 1 }}</span>
        <q-space />
        <q-btn
          v-if="store.children.length > 1"
          flat
          round
          dense
          icon="delete_outline"
          color="negative"
          size="sm"
          @click="remove"
        />
      </div>

      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-12 col-sm-7">
          <q-input
            v-model="store.children[index].name"
            label="Nombre del Niño"
            placeholder="Nombre completo"
            outlined
            dense
            lazy-rules
            :rules="[
              (val) => !!val || 'El nombre completo es obligatorio',
              (val) =>
                val.trim().split(/\s+/).length >= 2 ||
                'Por favor, introduce nombre y primer apellido',
            ]"
            @keydown="allowOnlyLettersKeydown"
          />
        </div>
        <div class="col-12 col-sm-5">
          <q-input
            v-model.number="store.children[index].age"
            label="Edad"
            type="number"
            min="1"
            max="99"
            suffix="Años"
            outlined
            dense
            class="custom-age-input"
            lazy-rules
            :rules="[
              (val) => (val !== null && val !== '') || 'La edad es obligatoria',
              (val) => (val >= 1 && val <= 99) || 'La edad debe ser entre 1 y 99 años',
            ]"
            @keydown="allowOnlyNumbersKeydown"
            @paste.prevent
            @update:model-value="limitAgeInput"
          >
          </q-input>
        </div>
      </div>

      <q-input
        v-model="store.children[index].notes"
        label="Notas / Alergias"
        placeholder="Ej. alérgico al maní"
        outlined
        dense
        class="q-mb-sm"
      />

      <q-btn
        unelevated
        color="primary"
        label="Guardar niño"
        icon="save"
        :disable="!canSave"
        dense
        class="full-width q-mt-xs"
        @click="save"
      />
    </template>
  </div>
</template>

<style scoped>
.child-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  background: #fff;
}

.rfid-disabled :deep(.q-field__control) {
  background: #f5f5f5;
}
</style>
